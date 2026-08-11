import { describe, expect, it } from "vitest";
import { decideRedemption, type PromotionCodeSnapshot } from "@know-finanzas/promotions";

const now = new Date("2026-06-15T00:00:00Z");

function code(overrides: Partial<PromotionCodeSnapshot> = {}): PromotionCodeSnapshot {
  return {
    id: "code-1",
    normalizedCode: "WELCOME30",
    name: "Welcome",
    description: null,
    status: "ACTIVE",
    accessLevel: "PRO",
    durationValue: 30,
    durationUnit: "DAYS",
    redemptionStartsAt: null,
    redemptionEndsAt: null,
    maxRedemptions: null,
    maxRedemptionsPerUser: 1,
    stackingPolicy: "NOT_STACKABLE",
    aiCreditsPerPeriod: 0,
    whatsappMessagesPerPeriod: 0,
    redemptionCount: 0,
    ...overrides,
  };
}

describe("decideRedemption", () => {
  it("allows redemption of an active, unrestricted code", () => {
    const decision = decideRedemption({ code: code(), userRedemptionCount: 0, hasActiveGrant: false }, now);
    expect(decision.ok).toBe(true);
  });

  it("computes startsAt=now and endsAt=now+durationValue days", () => {
    const decision = decideRedemption({ code: code({ durationValue: 30 }), userRedemptionCount: 0, hasActiveGrant: false }, now);
    if (!decision.ok) throw new Error("expected ok");
    expect(decision.startsAt).toEqual(now);
    expect(decision.endsAt).toEqual(new Date("2026-07-15T00:00:00Z"));
  });

  it.each(["DRAFT", "PAUSED", "EXPIRED", "REVOKED"] as const)("rejects a %s code as PROMOTION_NOT_ACTIVE", (status) => {
    const decision = decideRedemption({ code: code({ status }), userRedemptionCount: 0, hasActiveGrant: false }, now);
    expect(decision).toEqual({ ok: false, reason: "PROMOTION_NOT_ACTIVE" });
  });

  it("rejects redemption before the redemption window opens", () => {
    const decision = decideRedemption({ code: code({ redemptionStartsAt: new Date("2026-07-01T00:00:00Z") }), userRedemptionCount: 0, hasActiveGrant: false }, now);
    expect(decision).toEqual({ ok: false, reason: "PROMOTION_NOT_STARTED" });
  });

  it("rejects redemption after the redemption window closes", () => {
    const decision = decideRedemption({ code: code({ redemptionEndsAt: new Date("2026-06-01T00:00:00Z") }), userRedemptionCount: 0, hasActiveGrant: false }, now);
    expect(decision).toEqual({ ok: false, reason: "PROMOTION_EXPIRED" });
  });

  it("allows redemption exactly at the window boundaries", () => {
    const decision = decideRedemption({ code: code({ redemptionStartsAt: now, redemptionEndsAt: now }), userRedemptionCount: 0, hasActiveGrant: false }, now);
    expect(decision.ok).toBe(true);
  });

  it("rejects redemption once the global limit is reached", () => {
    const decision = decideRedemption({ code: code({ maxRedemptions: 100, redemptionCount: 100 }), userRedemptionCount: 0, hasActiveGrant: false }, now);
    expect(decision).toEqual({ ok: false, reason: "PROMOTION_REDEMPTION_LIMIT_REACHED" });
  });

  it("allows redemption when the global limit is null (unlimited)", () => {
    const decision = decideRedemption({ code: code({ maxRedemptions: null, redemptionCount: 100_000 }), userRedemptionCount: 0, hasActiveGrant: false }, now);
    expect(decision.ok).toBe(true);
  });

  it("rejects a second redemption of the same code by the same user when max-per-user is 1 (PROMOTION_ALREADY_REDEEMED)", () => {
    const decision = decideRedemption({ code: code({ maxRedemptionsPerUser: 1 }), userRedemptionCount: 1, hasActiveGrant: false }, now);
    expect(decision).toEqual({ ok: false, reason: "PROMOTION_ALREADY_REDEEMED" });
  });

  it("reports PROMOTION_USER_LIMIT_REACHED when max-per-user is greater than 1", () => {
    const decision = decideRedemption({ code: code({ maxRedemptionsPerUser: 3 }), userRedemptionCount: 3, hasActiveGrant: false }, now);
    expect(decision).toEqual({ ok: false, reason: "PROMOTION_USER_LIMIT_REACHED" });
  });

  it("rejects redemption when the user already holds an active grant (NOT_STACKABLE)", () => {
    const decision = decideRedemption({ code: code({ stackingPolicy: "NOT_STACKABLE" }), userRedemptionCount: 0, hasActiveGrant: true }, now);
    expect(decision).toEqual({ ok: false, reason: "PROMOTION_ALREADY_ACTIVE" });
  });

  it("evaluates checks in priority order: status before window before limits", () => {
    const decision = decideRedemption({
      code: code({ status: "PAUSED", redemptionEndsAt: new Date("2020-01-01T00:00:00Z"), maxRedemptions: 0, redemptionCount: 0 }),
      userRedemptionCount: 0,
      hasActiveGrant: false,
    }, now);
    expect(decision).toEqual({ ok: false, reason: "PROMOTION_NOT_ACTIVE" });
  });
});
