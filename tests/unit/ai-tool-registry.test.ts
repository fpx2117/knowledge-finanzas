import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createToolRegistry, type AnyToolDefinition } from "@know-finanzas/ai";

function fakeTool(overrides: Partial<AnyToolDefinition> = {}): AnyToolDefinition {
  return {
    name: "getLiquidBalances",
    description: "test tool",
    argsSchema: z.object({}),
    resultSchema: z.array(z.object({ currencyCode: z.string(), total: z.string() })),
    execute: vi.fn().mockResolvedValue([{ currencyCode: "ARS", total: "100" }]),
    ...overrides,
  };
}

describe("createToolRegistry", () => {
  it("lists every registered tool by name and description", () => {
    const registry = createToolRegistry([fakeTool(), fakeTool({ name: "getDebtSummary", description: "debt" })]);
    expect(registry.list()).toEqual([
      { name: "getLiquidBalances", description: "test tool" },
      { name: "getDebtSummary", description: "debt" },
    ]);
  });

  it("runs a tool, validating both args and result against their schemas", async () => {
    const execute = vi.fn().mockResolvedValue([{ currencyCode: "ARS", total: "100" }]);
    const registry = createToolRegistry([fakeTool({ execute })]);

    const result = await registry.run("getLiquidBalances", {}, { userId: "user-1" });

    expect(result).toEqual([{ currencyCode: "ARS", total: "100" }]);
    expect(execute).toHaveBeenCalledWith({}, { userId: "user-1" });
  });

  it("throws AI_INVALID_OUTPUT for an unregistered tool name — there is no arbitrary tool capability", async () => {
    const registry = createToolRegistry([fakeTool()]);
    await expect(registry.run("dropAllTables", {}, { userId: "user-1" })).rejects.toMatchObject({ code: "AI_INVALID_OUTPUT" });
  });

  it("rejects a result that does not match the declared schema instead of returning malformed data", async () => {
    const execute = vi.fn().mockResolvedValue([{ currencyCode: "ARS" }]); // missing `total`
    const registry = createToolRegistry([fakeTool({ execute })]);

    await expect(registry.run("getLiquidBalances", {}, { userId: "user-1" })).rejects.toThrow();
  });

  it("never forwards a model-supplied userId — execute only ever receives the authenticated context", async () => {
    const execute = vi.fn().mockResolvedValue([]);
    const registry = createToolRegistry([fakeTool({ execute })]);

    await registry.run("getLiquidBalances", { userId: "attacker-supplied" }, { userId: "real-user" });

    expect(execute).toHaveBeenCalledWith(expect.not.objectContaining({ userId: "attacker-supplied" }), { userId: "real-user" });
  });
});
