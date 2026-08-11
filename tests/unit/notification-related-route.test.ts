import { describe, expect, it } from "vitest";
import { resolveRelatedRoute } from "../../apps/web/src/features/notifications/lib/resolve-related-route";

describe("resolveRelatedRoute", () => {
  it("resolves known internal routes from typed subject references", () => {
    expect(resolveRelatedRoute("DEBT", "debt-1")).toBe("/debts/debt-1");
    expect(resolveRelatedRoute("TRANSACTION", "txn-1")).toBe("/transactions/txn-1");
    expect(resolveRelatedRoute("BUDGET", "budget-1")).toBe("/budgets/budget-1");
    expect(resolveRelatedRoute("SCHEDULED_TRANSACTION", null)).toBe("/planning?tab=scheduled");
    expect(resolveRelatedRoute("SUBSCRIPTION", null)).toBe("/settings/billing");
  });

  it("returns null when there is nothing to navigate to", () => {
    expect(resolveRelatedRoute("NONE", null)).toBeNull();
    expect(resolveRelatedRoute("DEBT", null)).toBeNull();
    expect(resolveRelatedRoute("TRANSACTION", null)).toBeNull();
    expect(resolveRelatedRoute("BUDGET", null)).toBeNull();
  });
});
