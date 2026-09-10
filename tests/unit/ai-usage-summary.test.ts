import { describe, expect, it, vi } from "vitest";
import { createGetAIUsageSummary } from "@know-finanzas/ai";

describe("getAIUsageSummary", () => {
  it("returns ACCESS_REQUIRED for EXPIRED_READ_ONLY without ever conflating it with a numeric balance", async () => {
    const getAvailableBalances = vi.fn();
    const getAIUsageSummary = createGetAIUsageSummary({ getAvailableBalances }, { freeCreditsPerPeriod: 15, trialCreditsTotal: 50, proCreditsPerPeriod: 300 });

    const summary = await getAIUsageSummary({ userId: "user-1", access: "EXPIRED_READ_ONLY", trialEndsAt: null, currentPeriodEnd: null });

    expect(summary).toEqual({ state: "ACCESS_REQUIRED" });
    expect(getAvailableBalances).not.toHaveBeenCalled();
  });

  it("returns FREE state reading the PLAN_ALLOWANCE pool with the monthly total and next-month renewal", async () => {
    const getAvailableBalances = vi.fn().mockResolvedValue({ TRIAL_ALLOWANCE: 0, PLAN_ALLOWANCE: 9, PURCHASED: 0 });
    const now = new Date("2026-09-10T00:00:00Z");
    const getAIUsageSummary = createGetAIUsageSummary({ getAvailableBalances }, { freeCreditsPerPeriod: 15, trialCreditsTotal: 50, proCreditsPerPeriod: 300 }, () => now);

    const summary = await getAIUsageSummary({ userId: "user-1", access: "FREE", trialEndsAt: null, currentPeriodEnd: null });

    expect(summary).toEqual({ state: "FREE", available: 9, total: 15, renewsAt: new Date("2026-10-01T00:00:00Z") });
  });

  it("returns TRIAL state with available/total distinct from PRO's total", async () => {
    const getAvailableBalances = vi.fn().mockResolvedValue({ TRIAL_ALLOWANCE: 31, PLAN_ALLOWANCE: 0, PURCHASED: 0 });
    const getAIUsageSummary = createGetAIUsageSummary({ getAvailableBalances }, { freeCreditsPerPeriod: 15, trialCreditsTotal: 50, proCreditsPerPeriod: 300 });
    const trialEndsAt = new Date("2026-09-01T00:00:00Z");

    const summary = await getAIUsageSummary({ userId: "user-1", access: "TRIAL", trialEndsAt, currentPeriodEnd: null });

    expect(summary).toEqual({ state: "TRIAL", available: 31, total: 50, expiresAt: trialEndsAt });
  });

  it("returns PRO state combining PLAN_ALLOWANCE and PURCHASED into available, even at zero (entitled, exhausted)", async () => {
    const getAvailableBalances = vi.fn().mockResolvedValue({ TRIAL_ALLOWANCE: 0, PLAN_ALLOWANCE: 0, PURCHASED: 0 });
    const getAIUsageSummary = createGetAIUsageSummary({ getAvailableBalances }, { freeCreditsPerPeriod: 15, trialCreditsTotal: 50, proCreditsPerPeriod: 300 });
    const currentPeriodEnd = new Date("2026-09-01T00:00:00Z");

    const summary = await getAIUsageSummary({ userId: "user-1", access: "PRO", trialEndsAt: null, currentPeriodEnd });

    expect(summary).toEqual({ state: "PRO", available: 0, total: 300, renewsAt: currentPeriodEnd });
  });
});
