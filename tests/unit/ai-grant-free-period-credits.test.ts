import { describe, expect, it, vi } from "vitest";
import { createGrantFreePeriodCredits, freePeriodExpiry, freePeriodKey } from "@know-finanzas/ai";

describe("grant free period credits", () => {
  const now = new Date("2026-09-10T12:00:00Z");

  it("keys the grant by calendar month and expires it at the start of next month", () => {
    expect(freePeriodKey(now)).toBe("free:2026-09");
    expect(freePeriodExpiry(now)).toEqual(new Date("2026-10-01T00:00:00Z"));
  });

  it("sweeps the previous month's remainder, then grants the current month's allowance", async () => {
    const repo = {
      expireLapsedFreeCredits: vi.fn().mockResolvedValue({ expired: 9 }),
      grantPlanCredits: vi.fn().mockResolvedValue({ created: true, entry: { id: "e1" } }),
    };
    const grant = createGrantFreePeriodCredits(repo, 15, () => now);

    await grant({ userId: "user-1" });

    expect(repo.expireLapsedFreeCredits).toHaveBeenCalledWith("user-1", now);
    expect(repo.grantPlanCredits).toHaveBeenCalledWith({
      userId: "user-1",
      amount: 15,
      referenceId: "free:2026-09",
      periodKey: "free:2026-09",
      expiresAt: new Date("2026-10-01T00:00:00Z"),
    });
  });

  it("is a no-op when the configured allowance is zero", async () => {
    const repo = { expireLapsedFreeCredits: vi.fn(), grantPlanCredits: vi.fn() };
    const grant = createGrantFreePeriodCredits(repo, 0, () => now);

    await grant({ userId: "user-1" });

    expect(repo.grantPlanCredits).not.toHaveBeenCalled();
  });
});
