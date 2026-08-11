import { describe, expect, it, vi } from "vitest";
import { createContextBuilder, type ToolRegistry } from "@know-finanzas/ai";

function fakeRegistry(handlers: Record<string, (userId: string) => Promise<unknown>>): ToolRegistry {
  const run = vi.fn(async (name: string, _args: unknown, context: { userId: string }) => {
    const handler = handlers[name];
    if (!handler) throw new Error(`no handler for ${name}`);
    return handler(context.userId);
  });
  return { list: () => Object.keys(handlers).map((name) => ({ name, description: "" })), has: (name) => name in handlers, run };
}

describe("createContextBuilder", () => {
  it("fetches exactly the requested, fixed tool list — no more, no less", async () => {
    const registry = fakeRegistry({
      getLiquidBalances: async () => [{ currencyCode: "ARS", total: "100" }],
      getDebtSummary: async () => [{ currencyCode: "ARS", remaining: "50" }],
      searchTransactions: async () => { throw new Error("should not be called"); },
    });
    const builder = createContextBuilder(registry);

    const context = await builder.buildContext("user-1", ["getLiquidBalances", "getDebtSummary"]);

    expect(Object.keys(context.results).sort()).toEqual(["getDebtSummary", "getLiquidBalances"]);
    expect(context.failures).toEqual([]);
    expect(registry.run).toHaveBeenCalledTimes(2);
  });

  it("discloses a failing tool instead of aborting the whole context or fabricating a result", async () => {
    const registry = fakeRegistry({
      getLiquidBalances: async () => [{ currencyCode: "ARS", total: "100" }],
      getDebtSummary: async () => { throw new Error("db unavailable"); },
    });
    const builder = createContextBuilder(registry);

    const context = await builder.buildContext("user-1", ["getLiquidBalances", "getDebtSummary"]);

    expect(context.results).toEqual({ getLiquidBalances: [{ currencyCode: "ARS", total: "100" }] });
    expect(context.failures).toEqual(["getDebtSummary"]);
  });

  it("always passes the same authenticated userId to every tool call — never cross-user data", async () => {
    const seenUserIds: string[] = [];
    const registry = fakeRegistry({
      getLiquidBalances: async (userId) => { seenUserIds.push(userId); return []; },
      getDebtSummary: async (userId) => { seenUserIds.push(userId); return []; },
    });
    const builder = createContextBuilder(registry);

    await builder.buildContext("user-42", ["getLiquidBalances", "getDebtSummary"]);

    expect(seenUserIds).toEqual(["user-42", "user-42"]);
  });
});
