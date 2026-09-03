import { describe, expect, it } from "vitest";
import { formatDateInTimezone, getTodayInTimezone } from "../../apps/web/src/lib/date";

describe("formatDateInTimezone", () => {
  it("does not shift the calendar day when it's already tomorrow in UTC but still today in a western timezone", () => {
    // 2026-03-15T01:00:00Z is 2026-03-14 22:00 in America/Argentina/Buenos_Aires (UTC-3).
    // A naive `date.toISOString().slice(0, 10)` would incorrectly report "2026-03-15".
    const instant = new Date("2026-03-15T01:00:00.000Z");
    expect(formatDateInTimezone(instant, "America/Argentina/Buenos_Aires")).toBe("2026-03-14");
    expect(instant.toISOString().slice(0, 10)).toBe("2026-03-15");
  });

  it("does not shift the calendar day forward near midnight in an eastern timezone", () => {
    // 2026-03-14T23:30:00Z is 2026-03-15 08:30 in Asia/Tokyo (UTC+9).
    const instant = new Date("2026-03-14T23:30:00.000Z");
    expect(formatDateInTimezone(instant, "Asia/Tokyo")).toBe("2026-03-15");
  });

  it("matches the UTC date when the timezone is UTC itself", () => {
    const instant = new Date("2026-06-01T12:00:00.000Z");
    expect(formatDateInTimezone(instant, "UTC")).toBe("2026-06-01");
  });

  it("never reproduces the historical bug of always subtracting one day (Date.now() - 86400000)", () => {
    const now = new Date();
    const buggyYesterday = new Date(now.getTime() - 86_400_000).toISOString().slice(0, 10);
    const correctToday = formatDateInTimezone(now, "UTC");
    expect(correctToday).not.toBe(buggyYesterday);
  });
});

describe("getTodayInTimezone", () => {
  it("returns a YYYY-MM-DD string", () => {
    expect(getTodayInTimezone("UTC")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("defaults to the environment's local timezone when none is given", () => {
    expect(getTodayInTimezone()).toBe(formatDateInTimezone(new Date()));
  });
});
