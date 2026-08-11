import { describe, expect, it } from "vitest";
import { DEFAULT_REFERRAL_ATTRIBUTION_WINDOW_HOURS, isWithinAttributionWindow } from "@know-finanzas/referrals";

describe("isWithinAttributionWindow", () => {
  const referredUserCreatedAt = new Date("2026-06-15T00:00:00Z");

  it("allows submission immediately after signup", () => {
    expect(isWithinAttributionWindow({ referredUserCreatedAt, submittedAt: referredUserCreatedAt })).toBe(true);
  });

  it("allows submission exactly at the window boundary", () => {
    const submittedAt = new Date(referredUserCreatedAt.getTime() + DEFAULT_REFERRAL_ATTRIBUTION_WINDOW_HOURS * 60 * 60 * 1000);
    expect(isWithinAttributionWindow({ referredUserCreatedAt, submittedAt })).toBe(true);
  });

  it("rejects submission after the window closes", () => {
    const submittedAt = new Date(referredUserCreatedAt.getTime() + (DEFAULT_REFERRAL_ATTRIBUTION_WINDOW_HOURS * 60 * 60 * 1000) + 1);
    expect(isWithinAttributionWindow({ referredUserCreatedAt, submittedAt })).toBe(false);
  });

  it("rejects submission that predates the referred user's own signup", () => {
    const submittedAt = new Date(referredUserCreatedAt.getTime() - 1);
    expect(isWithinAttributionWindow({ referredUserCreatedAt, submittedAt })).toBe(false);
  });

  it("respects a custom window", () => {
    const submittedAt = new Date(referredUserCreatedAt.getTime() + 2 * 60 * 60 * 1000);
    expect(isWithinAttributionWindow({ referredUserCreatedAt, submittedAt, windowHours: 1 })).toBe(false);
    expect(isWithinAttributionWindow({ referredUserCreatedAt, submittedAt, windowHours: 3 })).toBe(true);
  });
});
