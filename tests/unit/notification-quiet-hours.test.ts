import { describe, expect, it } from "vitest";
import { isWithinQuietHours, nextLocalTimeAtOrAfter } from "@know-finanzas/notifications";

describe("isWithinQuietHours", () => {
  it("is true for a moment inside a same-day window", () => {
    // 2026-01-15T14:30:00Z is 11:30 in America/Argentina/Buenos_Aires (UTC-3)
    const now = new Date("2026-01-15T14:30:00Z");
    expect(isWithinQuietHours(now, "America/Argentina/Buenos_Aires", "09:00", "18:00")).toBe(true);
  });

  it("is false for a moment outside a same-day window", () => {
    const now = new Date("2026-01-15T22:30:00Z"); // 19:30 local
    expect(isWithinQuietHours(now, "America/Argentina/Buenos_Aires", "09:00", "18:00")).toBe(false);
  });

  it("handles a window that wraps midnight", () => {
    const insideLateNight = new Date("2026-01-15T02:00:00Z"); // 23:00 local (previous day wraps)
    const insideEarlyMorning = new Date("2026-01-15T08:30:00Z"); // 05:30 local
    const outside = new Date("2026-01-15T14:00:00Z"); // 11:00 local
    expect(isWithinQuietHours(insideLateNight, "America/Argentina/Buenos_Aires", "22:00", "07:00")).toBe(true);
    expect(isWithinQuietHours(insideEarlyMorning, "America/Argentina/Buenos_Aires", "22:00", "07:00")).toBe(true);
    expect(isWithinQuietHours(outside, "America/Argentina/Buenos_Aires", "22:00", "07:00")).toBe(false);
  });

  it("a zero-width window never blocks", () => {
    const now = new Date("2026-01-15T14:00:00Z");
    expect(isWithinQuietHours(now, "America/Argentina/Buenos_Aires", "10:00", "10:00")).toBe(false);
  });

  it("is timezone-aware: the same instant differs across timezones", () => {
    const now = new Date("2026-01-15T14:30:00Z"); // 11:30 in ARS, 14:30 in UTC
    expect(isWithinQuietHours(now, "America/Argentina/Buenos_Aires", "09:00", "18:00")).toBe(true);
    expect(isWithinQuietHours(now, "UTC", "20:00", "23:00")).toBe(false);
  });
});

describe("nextLocalTimeAtOrAfter", () => {
  it("returns later today when the target time has not passed yet", () => {
    const now = new Date("2026-01-15T14:00:00Z"); // 11:00 local
    const next = nextLocalTimeAtOrAfter(now, "America/Argentina/Buenos_Aires", "18:00");
    expect(next.toISOString()).toBe("2026-01-15T21:00:00.000Z"); // 18:00 local same day
  });

  it("rolls over to tomorrow when the target time already passed today", () => {
    const now = new Date("2026-01-15T22:00:00Z"); // 19:00 local
    const next = nextLocalTimeAtOrAfter(now, "America/Argentina/Buenos_Aires", "07:00");
    expect(next.toISOString()).toBe("2026-01-16T10:00:00.000Z"); // 07:00 local next day
  });

  it("treats an exact match at the target time as already there (rolls to tomorrow)", () => {
    const now = new Date("2026-01-15T21:00:00Z"); // exactly 18:00 local
    const next = nextLocalTimeAtOrAfter(now, "America/Argentina/Buenos_Aires", "18:00");
    expect(next.toISOString()).toBe("2026-01-16T21:00:00.000Z");
  });
});
