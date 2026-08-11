import { describe, expect, it } from "vitest";
import { computePromotionUsagePeriods } from "@know-finanzas/promotions";

describe("computePromotionUsagePeriods", () => {
  it("produces a single period for a promotion of 30 days or less", () => {
    const periods = computePromotionUsagePeriods({ startsAt: new Date("2026-01-01T00:00:00Z"), endsAt: new Date("2026-01-15T00:00:00Z") });
    expect(periods).toEqual([{ sequence: 1, startsAt: new Date("2026-01-01T00:00:00Z"), endsAt: new Date("2026-01-15T00:00:00Z") }]);
  });

  it("chunks a 90-day promotion into three 30-day periods", () => {
    const startsAt = new Date("2026-01-01T00:00:00Z");
    const endsAt = new Date(startsAt.getTime() + 90 * 24 * 60 * 60 * 1000);
    const periods = computePromotionUsagePeriods({ startsAt, endsAt });

    expect(periods).toHaveLength(3);
    expect(periods[0].sequence).toBe(1);
    expect(periods[0].startsAt).toEqual(startsAt);
    expect(periods[2].endsAt).toEqual(endsAt);
    // consecutive periods, no gaps or overlaps
    expect(periods[0].endsAt).toEqual(periods[1].startsAt);
    expect(periods[1].endsAt).toEqual(periods[2].startsAt);
  });

  it("produces a final short period when the duration doesn't divide evenly by 30", () => {
    const startsAt = new Date("2026-01-01T00:00:00Z");
    const endsAt = new Date(startsAt.getTime() + 40 * 24 * 60 * 60 * 1000);
    const periods = computePromotionUsagePeriods({ startsAt, endsAt });

    expect(periods).toHaveLength(2);
    const secondPeriodDays = (periods[1].endsAt.getTime() - periods[1].startsAt.getTime()) / (24 * 60 * 60 * 1000);
    expect(secondPeriodDays).toBe(10);
  });

  it("returns no periods when startsAt equals endsAt", () => {
    const at = new Date("2026-01-01T00:00:00Z");
    expect(computePromotionUsagePeriods({ startsAt: at, endsAt: at })).toEqual([]);
  });
});
