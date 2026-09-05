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

  // WP-CALENDAR-LAYERS — an event that lands on the wrong local day near a DST change
  // makes the whole month projection wrong. These pin the behaviour for a zone that
  // actually shifts (accounts can be in any timezone even though the product is es-AR).

  it("buckets an instant to the correct local day across a spring-forward", () => {
    // America/New_York springs forward 2026-03-08 02:00 EST → 03:00 EDT.
    expect(todayInTimezone(new Date("2026-03-08T06:30:00Z"), "America/New_York")).toBe("2026-03-08"); // 01:30 EST
    expect(todayInTimezone(new Date("2026-03-08T07:30:00Z"), "America/New_York")).toBe("2026-03-08"); // 03:30 EDT
    expect(todayInTimezone(new Date("2026-03-08T04:59:00Z"), "America/New_York")).toBe("2026-03-07"); // 23:59 EST prev day
  });

  it("buckets both repeated hours of a fall-back to the same local day", () => {
    // America/New_York falls back 2026-11-01 02:00 EDT → 01:00 EST — 01:30 happens twice.
    expect(todayInTimezone(new Date("2026-11-01T05:30:00Z"), "America/New_York")).toBe("2026-11-01"); // 01:30 EDT
    expect(todayInTimezone(new Date("2026-11-01T06:30:00Z"), "America/New_York")).toBe("2026-11-01"); // 01:30 EST
  });

  it("keeps month/day ranges anchored to local midnight when the UTC offset changes mid-range", () => {
    // The March day range straddles the spring-forward: 05:00Z (EST) → 04:00Z (EDT) is 23h.
    const day = dayRangeForTimezone("2026-03-08", "America/New_York");
    expect(day.start.toISOString()).toBe("2026-03-08T05:00:00.000Z");
    expect(day.end.toISOString()).toBe("2026-03-09T04:00:00.000Z");

    const month = monthRangeForTimezone(2026, 3, "America/New_York");
    expect(month.start.toISOString()).toBe("2026-03-01T05:00:00.000Z"); // EST
    expect(month.end.toISOString()).toBe("2026-04-01T04:00:00.000Z"); // EDT
  });
});
