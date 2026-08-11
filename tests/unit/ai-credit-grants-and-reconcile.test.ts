import { describe, expect, it, vi } from "vitest";
import { createGrantTrialCredits, createGrantProPeriodCredits, createReconcileStaleReservations } from "@know-finanzas/ai";

describe("createGrantTrialCredits", () => {
  it("grants the configured trial total against the user's trial expiry", async () => {
    const grantTrialCredits = vi.fn().mockResolvedValue({ created: true, entry: { id: "entry-1" } });
    const grant = createGrantTrialCredits({ grantTrialCredits } as never, 50);
    const trialEndsAt = new Date("2026-09-01T00:00:00Z");

    await grant({ userId: "user-1", trialEndsAt });

    expect(grantTrialCredits).toHaveBeenCalledWith({ userId: "user-1", amount: 50, expiresAt: trialEndsAt });
  });
});

describe("createGrantProPeriodCredits", () => {
  it("grants the configured per-period total scoped to the billing period id, expiring at period end", async () => {
    const grantPlanCredits = vi.fn().mockResolvedValue({ created: true, entry: { id: "entry-1" } });
    const grant = createGrantProPeriodCredits({ grantPlanCredits } as never, 300);
    const periodEnd = new Date("2026-09-01T00:00:00Z");

    await grant({ userId: "user-1", subscriptionId: "sub-1", billingPeriodId: "period-1", periodStart: new Date("2026-08-01T00:00:00Z"), periodEnd });

    expect(grantPlanCredits).toHaveBeenCalledWith({ userId: "user-1", amount: 300, referenceId: "period-1", periodKey: "period-1", expiresAt: periodEnd });
  });
});

describe("createReconcileStaleReservations", () => {
  it("does nothing when there are no stale reservations", async () => {
    const listStalePending = vi.fn().mockResolvedValue([]);
    const markExpired = vi.fn();
    const reconcile = createReconcileStaleReservations({ listStalePending, markExpired } as never);

    await expect(reconcile()).resolves.toEqual({ expiredCount: 0 });
    expect(markExpired).not.toHaveBeenCalled();
  });

  it("marks every stale PENDING reservation as EXPIRED", async () => {
    const listStalePending = vi.fn().mockResolvedValue([{ id: "res-1" }, { id: "res-2" }]);
    const markExpired = vi.fn().mockResolvedValue([{ id: "res-1" }, { id: "res-2" }]);
    const reconcile = createReconcileStaleReservations({ listStalePending, markExpired } as never);

    await expect(reconcile()).resolves.toEqual({ expiredCount: 2 });
    expect(markExpired).toHaveBeenCalledWith(["res-1", "res-2"]);
  });
});
