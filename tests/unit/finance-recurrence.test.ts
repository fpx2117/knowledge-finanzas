import { describe, expect, it } from "vitest";
import { generateOccurrenceDates } from "@know-finanzas/finance";

describe("recurrence engine", () => {
  it("generates weekly, biweekly, quarterly and yearly occurrences", () => {
    expect(generateOccurrenceDates({ frequency: "WEEKLY", startDate: "2026-01-01", from: "2026-01-01", through: "2026-01-20" })).toEqual(["2026-01-01", "2026-01-08", "2026-01-15"]);
    expect(generateOccurrenceDates({ frequency: "BIWEEKLY", startDate: "2026-01-01", from: "2026-01-01", through: "2026-02-01" })).toEqual(["2026-01-01", "2026-01-15", "2026-01-29"]);
    expect(generateOccurrenceDates({ frequency: "QUARTERLY", startDate: "2026-01-31", from: "2026-01-01", through: "2026-12-31" })).toEqual(["2026-01-31", "2026-04-30", "2026-07-31", "2026-10-31"]);
    expect(generateOccurrenceDates({ frequency: "YEARLY", startDate: "2028-02-29", from: "2028-01-01", through: "2032-12-31" })).toEqual(["2028-02-29", "2029-02-28", "2030-02-28", "2031-02-28", "2032-02-29"]);
  });
  it("preserves monthly anchor and horizon/end limits", () => {
    expect(generateOccurrenceDates({ frequency: "MONTHLY", startDate: "2026-01-31", from: "2026-01-01", through: "2026-05-31", endDate: "2026-04-30" })).toEqual(["2026-01-31", "2026-02-28", "2026-03-31", "2026-04-30"]);
    expect(generateOccurrenceDates({ frequency: "MONTHLY", startDate: "2026-01-01", from: "2026-03-01", through: "2026-04-30", occurrenceCount: 3 })).toEqual(["2026-03-01"]);
  });
});
