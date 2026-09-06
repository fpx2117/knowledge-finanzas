import { describe, expect, it, vi } from "vitest";

import { emitFinancialEvent } from "../../apps/web/src/lib/events/emit-financial-event";

// WP-EVENT-TAGS (spec 14 §19): one shared map decides what each domain event invalidates,
// so actions never list `revalidatePath` calls by hand again. `revalidate` is injected here
// instead of mocking `next/cache` — it's the same pattern the rest of this codebase uses for
// testable side effects, and avoids fighting Next's own module resolution in a unit test.
describe("emitFinancialEvent", () => {
  it("revalidates every path mapped to the event", () => {
    const revalidate = vi.fn();
    emitFinancialEvent({ type: "transaction.voided" }, revalidate);
    const calls = revalidate.mock.calls.map(([path]) => path);
    expect(calls).toEqual(expect.arrayContaining(["/transactions", "/accounts", "/budgets", "/app", "/calendar"]));
  });

  it("also revalidates extra entity-specific paths without duplicating a shared one", () => {
    const revalidate = vi.fn();
    emitFinancialEvent({ type: "account.archived", entityPaths: ["/accounts/acc-1", "/app"] }, revalidate);
    const calls = revalidate.mock.calls.map(([path]) => path);
    expect(calls).toContain("/accounts/acc-1");
    expect(calls.filter((path) => path === "/app")).toHaveLength(1);
  });

  it("transfers never revalidate /budgets (transfers are excluded from consumption)", () => {
    const revalidate = vi.fn();
    emitFinancialEvent({ type: "transfer.created" }, revalidate);
    expect(revalidate.mock.calls.map(([path]) => path)).not.toContain("/budgets");
  });

  it("obligation payments revalidate the ledger, the account, and budgets (§14.1)", () => {
    const revalidate = vi.fn();
    emitFinancialEvent({ type: "obligation.payment_linked" }, revalidate);
    const calls = revalidate.mock.calls.map(([path]) => path);
    expect(calls).toEqual(expect.arrayContaining(["/obligations", "/transactions", "/accounts", "/budgets", "/app"]));
  });

  // Gate G5: the action calls this after the write has committed, so a revalidation failure must
  // never propagate — it would turn a successful financial write into an error response.
  it("swallows a revalidation failure and still tries every other path", () => {
    const revalidate = vi.fn((path: string) => {
      if (path === "/accounts") throw new Error("revalidate unavailable");
    });
    expect(() => emitFinancialEvent({ type: "transaction.created" }, revalidate)).not.toThrow();
    const calls = revalidate.mock.calls.map(([path]) => path);
    expect(calls).toEqual(expect.arrayContaining(["/transactions", "/accounts", "/budgets", "/app", "/calendar"]));
  });
});
