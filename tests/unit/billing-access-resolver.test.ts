import { describe, expect, it } from "vitest";
import {
  computeTrialEndsAt,
  createEntitlementService,
  hasEntitlement,
  isEffectivePaidSubscription,
  isTrialActive,
  resolveProductAccess,
  resolveProductAccessSource,
} from "@know-finanzas/billing";

const day = 24 * 60 * 60 * 1000;

describe("trial policy", () => {
  it("computes trial end as start plus the configured duration", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    expect(computeTrialEndsAt(start, 14).toISOString()).toBe("2026-01-15T00:00:00.000Z");
  });

  it("treats a trial as active only strictly before its end date", () => {
    const trialEndsAt = new Date("2026-01-15T00:00:00Z");
    expect(isTrialActive(trialEndsAt, new Date("2026-01-14T23:59:59Z"))).toBe(true);
    expect(isTrialActive(trialEndsAt, new Date("2026-01-15T00:00:00Z"))).toBe(false);
    expect(isTrialActive(trialEndsAt, new Date("2026-01-16T00:00:00Z"))).toBe(false);
    expect(isTrialActive(null, new Date())).toBe(false);
  });
});

describe("product access resolver", () => {
  const now = new Date("2026-06-15T12:00:00Z");
  const trialActive = new Date("2026-07-01T00:00:00Z");
  const trialExpired = new Date("2026-06-01T00:00:00Z");

  it("grants PRO for an ACTIVE subscription regardless of trial state", () => {
    const subscription = { status: "ACTIVE" as const, currentPeriodEnd: new Date("2026-07-01T00:00:00Z") };
    expect(resolveProductAccess({ now, trialEndsAt: trialExpired, subscription, graceDays: 0 })).toBe("PRO");
  });

  it("falls back to TRIAL while a subscription is PENDING and the trial is still active", () => {
    const subscription = { status: "PENDING" as const, currentPeriodEnd: null };
    expect(resolveProductAccess({ now, trialEndsAt: trialActive, subscription, graceDays: 0 })).toBe("TRIAL");
  });

  it("falls back to FREE while PENDING once the trial has expired", () => {
    const subscription = { status: "PENDING" as const, currentPeriodEnd: null };
    expect(resolveProductAccess({ now, trialEndsAt: trialExpired, subscription, graceDays: 0 })).toBe("FREE");
  });

  it("keeps PRO for PAST_DUE within the configured grace window", () => {
    const subscription = { status: "PAST_DUE" as const, currentPeriodEnd: new Date(now.getTime() - 2 * day) };
    expect(resolveProductAccess({ now, trialEndsAt: trialExpired, subscription, graceDays: 5 })).toBe("PRO");
  });

  it("drops PAST_DUE to FREE once the grace window has elapsed and the trial is over", () => {
    const subscription = { status: "PAST_DUE" as const, currentPeriodEnd: new Date(now.getTime() - 10 * day) };
    expect(resolveProductAccess({ now, trialEndsAt: trialExpired, subscription, graceDays: 5 })).toBe("FREE");
  });

  it("falls back to TRIAL when PAST_DUE is outside grace but the trial is still active", () => {
    const subscription = { status: "PAST_DUE" as const, currentPeriodEnd: new Date(now.getTime() - 10 * day) };
    expect(resolveProductAccess({ now, trialEndsAt: trialActive, subscription, graceDays: 5 })).toBe("TRIAL");
  });

  it("never grants a grace period to an expiring trial — it lands in FREE", () => {
    const trialEndsAt = new Date(now.getTime() - 1);
    expect(resolveProductAccess({ now, trialEndsAt, subscription: null, graceDays: 30 })).toBe("FREE");
  });

  it("treats PAUSED, CANCELLED and EXPIRED subscriptions as never effective — the user is FREE", () => {
    for (const status of ["PAUSED", "CANCELLED", "EXPIRED"] as const) {
      const subscription = { status, currentPeriodEnd: new Date(now.getTime() + day) };
      expect(resolveProductAccess({ now, trialEndsAt: trialExpired, subscription, graceDays: 30 })).toBe("FREE");
    }
  });

  it("returns FREE with no subscription and no active trial", () => {
    expect(resolveProductAccess({ now, trialEndsAt: null, subscription: null, graceDays: 0 })).toBe("FREE");
  });

  it("returns EXPIRED_READ_ONLY only when the user is explicitly hard-locked", () => {
    expect(resolveProductAccess({ now, trialEndsAt: null, subscription: null, graceDays: 0, hardLocked: true })).toBe("EXPIRED_READ_ONLY");
  });

  it("still resolves PRO/TRIAL over hardLocked — the flag only affects the NONE fallback", () => {
    const subscription = { status: "ACTIVE" as const, currentPeriodEnd: new Date("2026-07-01T00:00:00Z") };
    expect(resolveProductAccess({ now, trialEndsAt: trialExpired, subscription, graceDays: 0, hardLocked: true })).toBe("PRO");
    expect(resolveProductAccess({ now, trialEndsAt: trialActive, subscription: null, graceDays: 0, hardLocked: true })).toBe("TRIAL");
  });

  it("exposes isEffectivePaidSubscription as the underlying paid-access check", () => {
    expect(isEffectivePaidSubscription(null, now, 0)).toBe(false);
    expect(isEffectivePaidSubscription({ status: "ACTIVE", currentPeriodEnd: null }, now, 0)).toBe(true);
  });

  it("callers who never pass activePromotion still resolve source NONE (→ FREE)", () => {
    expect(resolveProductAccess({ now, trialEndsAt: trialExpired, subscription: null, graceDays: 0 })).toBe("FREE");
    expect(resolveProductAccessSource({ now, trialEndsAt: trialExpired, subscription: null, graceDays: 0 })).toBe("NONE");
  });

  it("resolves PRO with source=PROMOTION for an active grant when no paid subscription is effective", () => {
    const activePromotion = { endsAt: new Date("2026-07-01T00:00:00Z") };
    expect(resolveProductAccess({ now, trialEndsAt: trialExpired, subscription: null, graceDays: 0, activePromotion })).toBe("PRO");
    expect(resolveProductAccessSource({ now, trialEndsAt: trialExpired, subscription: null, graceDays: 0, activePromotion })).toBe("PROMOTION");
  });

  it("priority: an effective paid subscription always outranks an active promotion", () => {
    const subscription = { status: "ACTIVE" as const, currentPeriodEnd: new Date("2026-07-01T00:00:00Z") };
    const activePromotion = { endsAt: new Date("2026-08-01T00:00:00Z") };
    expect(resolveProductAccessSource({ now, trialEndsAt: trialExpired, subscription, graceDays: 0, activePromotion })).toBe("PAID_SUBSCRIPTION");
  });

  it("priority: an active promotion outranks an active trial", () => {
    const activePromotion = { endsAt: new Date("2026-07-01T00:00:00Z") };
    expect(resolveProductAccessSource({ now, trialEndsAt: trialActive, subscription: null, graceDays: 0, activePromotion })).toBe("PROMOTION");
  });

  it("falls through to TRIAL/NONE once the promotion has expired", () => {
    const expiredPromotion = { endsAt: new Date("2026-06-01T00:00:00Z") };
    expect(resolveProductAccessSource({ now, trialEndsAt: trialActive, subscription: null, graceDays: 0, activePromotion: expiredPromotion })).toBe("TRIAL");
    expect(resolveProductAccessSource({ now, trialEndsAt: trialExpired, subscription: null, graceDays: 0, activePromotion: expiredPromotion })).toBe("NONE");
  });
});

describe("entitlement boundary", () => {
  it("treats FREE, TRIAL and PRO as entitled, and EXPIRED_READ_ONLY/NO_ACCESS as not", () => {
    expect(hasEntitlement("FREE")).toBe(true);
    expect(hasEntitlement("TRIAL")).toBe(true);
    expect(hasEntitlement("PRO")).toBe(true);
    expect(hasEntitlement("EXPIRED_READ_ONLY")).toBe(false);
    expect(hasEntitlement("NO_ACCESS")).toBe(false);
  });

  it("wires resolveAccess and hasEntitlement through an injected clock", () => {
    const now = new Date("2026-06-15T12:00:00Z");
    const service = createEntitlementService({ graceDays: 3, now: () => now });

    const trialInput = { trialEndsAt: new Date("2026-07-01T00:00:00Z"), subscription: null };
    expect(service.resolveAccess(trialInput)).toBe("TRIAL");
    expect(service.hasEntitlement(trialInput)).toBe(true);

    const lapsedInput = { trialEndsAt: new Date("2026-01-01T00:00:00Z"), subscription: null };
    expect(service.resolveAccess(lapsedInput)).toBe("FREE");
    expect(service.hasEntitlement(lapsedInput)).toBe(true);
  });
});
