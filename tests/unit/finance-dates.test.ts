import { describe, expect, it } from "vitest";
import {
  dayRangeForTimezone,
  monthRangeForTimezone,
  parseLocalDate,
  todayInTimezone,
} from "@know-finanzas/finance";

describe("financial dates", () => {
  it("validates local dates without server timezone dependence", () => {
    expect(parseLocalDate("2026-02-28")).toBe("2026-02-28");
    expect(() => parseLocalDate("2026-02-30")).toThrow("Invalid local date");
    expect(() => parseLocalDate("02/28/2026")).toThrow("YYYY-MM-DD");
  });

  it("uses the user's timezone for today", () => {
    const instant = new Date("2026-03-01T02:30:00.000Z");

    expect(todayInTimezone(instant, "America/Argentina/Buenos_Aires")).toBe("2026-02-28");
    expect(todayInTimezone(instant, "UTC")).toBe("2026-03-01");
  });

  it("returns a timezone-aware half-open month range", () => {
    const range = monthRangeForTimezone(2026, 2, "America/Argentina/Buenos_Aires");

    expect(range.start.toISOString()).toBe("2026-02-01T03:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-03-01T03:00:00.000Z");
  });

  it("returns a timezone-aware half-open day range", () => {
    const range = dayRangeForTimezone("2026-07-15", "America/Argentina/Buenos_Aires");

    expect(range.start.toISOString()).toBe("2026-07-15T03:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-07-16T03:00:00.000Z");
  });
});
