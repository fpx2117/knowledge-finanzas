import { describe, expect, it } from "vitest";
import { calculateGoalPace, Money } from "@know-finanzas/finance";

const money = (v: string) => Money.fromString(v, "ARS");

const baseInput = {
  currency: "ARS",
  today: "2026-09-15",
  goalStartOn: "2026-06-15",
  allocationCount: 3,
};

describe("calculateGoalPace (spec 07 §20/§21)", () => {
  it("has no pace without a target date", () => {
    const r = calculateGoalPace({ ...baseInput, currentAmount: money("100"), targetAmount: money("1000"), targetDate: null });
    expect(r.status).toBe("NO_TARGET_DATE");
    expect(r.requiredMonthly).toBeNull();
  });

  it("reports GOAL_REACHED with no required amount once current ≥ target", () => {
    const r = calculateGoalPace({ ...baseInput, currentAmount: money("1000"), targetAmount: money("1000"), targetDate: "2026-12-15" });
    expect(r.status).toBe("GOAL_REACHED");
    expect(r.requiredMonthly).toBeNull();
  });

  it("gives a lump sum + deadline when under 30 days are left (§20.5)", () => {
    const r = calculateGoalPace({ ...baseInput, currentAmount: money("740000"), targetAmount: money("1000000"), targetDate: "2026-10-01" });
    expect(r.requiredBeforeDate).toBe("260000.00");
    expect(r.requiredMonthly).toBeNull();
  });

  it("computes a monthly and weekly required rate for a farther date", () => {
    const r = calculateGoalPace({ ...baseInput, currentAmount: money("400000"), targetAmount: money("1000000"), targetDate: "2026-12-15" });
    // ~3 months / ~13 weeks left, 600000 remaining.
    expect(Number(r.requiredMonthly)).toBeGreaterThan(150000);
    expect(Number(r.requiredMonthly)).toBeLessThan(220000);
    expect(Number(r.requiredWeekly)).toBeLessThan(Number(r.requiredMonthly));
  });

  it("judges ON_TRACK vs NEEDS_MORE against elapsed-time baseline (§21.1)", () => {
    // start 2026-06-15, target 2026-12-15 → 183 days total; today 2026-09-15 → 92 days elapsed ≈ 50%.
    const onTrack = calculateGoalPace({ ...baseInput, currentAmount: money("550000"), targetAmount: money("1000000"), targetDate: "2026-12-15" });
    expect(onTrack.status).toBe("ON_TRACK");
    const behind = calculateGoalPace({ ...baseInput, currentAmount: money("200000"), targetAmount: money("1000000"), targetDate: "2026-12-15" });
    expect(behind.status).toBe("NEEDS_MORE");
  });

  it("stays INSUFFICIENT_DATA until there is at least one allocation", () => {
    const r = calculateGoalPace({ ...baseInput, allocationCount: 0, currentAmount: money("0"), targetAmount: money("1000000"), targetDate: "2026-12-15" });
    expect(r.status).toBe("INSUFFICIENT_DATA");
    expect(r.requiredMonthly).not.toBeNull(); // the forward-looking rate is still shown (§20)
  });

  it("reports DATE_PASSED for an overdue unmet goal", () => {
    const r = calculateGoalPace({ ...baseInput, currentAmount: money("400000"), targetAmount: money("1000000"), targetDate: "2026-08-01" });
    expect(r.status).toBe("DATE_PASSED");
  });
});
