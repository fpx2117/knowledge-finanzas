import { describe, expect, it } from "vitest";
import { resolveChannelEligibility, resolveScheduledFor } from "@know-finanzas/notifications";

describe("resolveChannelEligibility", () => {
  const base = { category: "FINANCIAL" as const, channel: "EMAIL" as const, notificationType: "BUDGET_EXCEEDED" as const, preferences: [], channelEntitled: true };

  it("is eligible when entitled with no preference rows (defaults to enabled)", () => {
    expect(resolveChannelEligibility(base)).toEqual({ eligible: true });
  });

  it("blocks a FINANCIAL notification when the channel is not entitled", () => {
    expect(resolveChannelEligibility({ ...base, channelEntitled: false })).toEqual({ eligible: false, reason: "NOTIFICATION_CHANNEL_NOT_ENTITLED" });
  });

  it("bypasses entitlement gating for BILLING/SECURITY/ACCOUNT categories", () => {
    for (const category of ["BILLING", "SECURITY", "ACCOUNT"] as const) {
      expect(resolveChannelEligibility({ ...base, category, channelEntitled: false })).toEqual({ eligible: true });
    }
  });

  it("does not bypass entitlement gating for PRODUCT category", () => {
    expect(resolveChannelEligibility({ ...base, category: "PRODUCT", channelEntitled: false })).toEqual({ eligible: false, reason: "NOTIFICATION_CHANNEL_NOT_ENTITLED" });
  });

  it("global channel OFF overrides an enabled per-type preference", () => {
    const preferences = [
      { notificationType: null, channel: "EMAIL" as const, enabled: false },
      { notificationType: "BUDGET_EXCEEDED" as const, channel: "EMAIL" as const, enabled: true },
    ];
    expect(resolveChannelEligibility({ ...base, preferences })).toEqual({ eligible: false, reason: "NOTIFICATION_PREFERENCE_DISABLED" });
  });

  it("a disabled per-type preference blocks even when the global default is enabled", () => {
    const preferences = [
      { notificationType: null, channel: "EMAIL" as const, enabled: true },
      { notificationType: "BUDGET_EXCEEDED" as const, channel: "EMAIL" as const, enabled: false },
    ];
    expect(resolveChannelEligibility({ ...base, preferences })).toEqual({ eligible: false, reason: "NOTIFICATION_PREFERENCE_DISABLED" });
  });

  it("an unrelated type's preference does not affect this notification's channel", () => {
    const preferences = [{ notificationType: "DEBT_OVERDUE" as const, channel: "EMAIL" as const, enabled: false }];
    expect(resolveChannelEligibility({ ...base, preferences })).toEqual({ eligible: true });
  });

  it("requires WhatsApp opt-in regardless of preferences", () => {
    const input = { ...base, channel: "WHATSAPP" as const, whatsappOptedIn: false };
    expect(resolveChannelEligibility(input)).toEqual({ eligible: false, reason: "WHATSAPP_NOT_OPTED_IN" });
    expect(resolveChannelEligibility({ ...input, whatsappOptedIn: true })).toEqual({ eligible: true });
  });
});

describe("resolveScheduledFor", () => {
  it("returns the original time when quiet hours are disabled or unset", () => {
    const at = new Date("2026-01-15T23:00:00Z");
    expect(resolveScheduledFor(at, "UTC", undefined)).toBe(at);
    expect(resolveScheduledFor(at, "UTC", { notificationType: null, channel: "IN_APP", enabled: true, quietHoursEnabled: false })).toBe(at);
  });

  it("delays to the end of quiet hours when the moment falls inside the window", () => {
    const at = new Date("2026-01-15T02:00:00Z"); // 23:00 in America/Argentina/Buenos_Aires
    const scheduled = resolveScheduledFor(at, "America/Argentina/Buenos_Aires", {
      notificationType: null, channel: "IN_APP", enabled: true, quietHoursEnabled: true, quietHoursStart: "22:00", quietHoursEnd: "07:00",
    });
    expect(scheduled.toISOString()).toBe("2026-01-15T10:00:00.000Z"); // 07:00 local
  });

  it("leaves the time untouched when outside quiet hours", () => {
    const at = new Date("2026-01-15T14:00:00Z"); // 11:00 local
    const scheduled = resolveScheduledFor(at, "America/Argentina/Buenos_Aires", {
      notificationType: null, channel: "IN_APP", enabled: true, quietHoursEnabled: true, quietHoursStart: "22:00", quietHoursEnd: "07:00",
    });
    expect(scheduled).toBe(at);
  });
});
