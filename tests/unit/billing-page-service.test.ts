import { describe, expect, it } from "vitest";
import { createBillingPageService } from "../../apps/web/src/features/billing/services/billing-page-service";

const baseDeps = {
  graceDays: 3,
  trialWhatsAppTotal: 3,
  proWhatsAppPerPeriod: 20,
};

// trialStartedAt is always set together with trialEndsAt for a real user — a non-null trialEndsAt
// with no trialStartedAt would be an inconsistent row, so this mirrors that by defaulting
// trialStartedAt from trialEndsAt unless the test explicitly overrides it (e.g. to model a
// brand-new NO_ACCESS user who never started a trial at all).
function fakeUsers(trialEndsAt: Date | null, trialStartedAt: Date | null = trialEndsAt) {
  return { findAccessInputById: async () => ({ trialEndsAt, trialStartedAt }) };
}

function fakeSubscriptions(subscription: unknown | undefined, all: unknown[] = subscription ? [subscription] : []) {
  return {
    findEffectiveForUser: async () => subscription,
    listForUser: async () => all,
  };
}

function fakePlans(plan: unknown | undefined) {
  return { findById: async () => plan };
}

function fakePayments(payments: unknown[] = []) {
  return { listForUser: async () => payments };
}

function fakePromotions(grant: { endsAt: Date } | undefined = undefined) {
  return { findActiveGrantForUser: async () => grant };
}

describe("createBillingPageService", () => {
  it("reports TRIAL state with days remaining and AI usage passed through as-is", async () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const trialEndsAt = new Date("2026-01-15T00:00:00Z");
    const ai = async () => ({ state: "TRIAL" as const, available: 42, total: 50, expiresAt: trialEndsAt });
    const service = createBillingPageService({
      ...baseDeps,
      users: fakeUsers(trialEndsAt),
      subscriptions: fakeSubscriptions(undefined),
      plans: fakePlans(undefined),
      payments: fakePayments(),
      ai,
      now: () => now,
    });

    const view = await service.getBillingPage("user-1");

    expect(view.access).toBe("TRIAL");
    expect(view.trial).toEqual({ daysRemaining: 14, expiresAt: trialEndsAt });
    expect(view.ai).toMatchObject({ state: "TRIAL", available: 42, total: 50 });
    expect(view.whatsappTotal).toBe(3);
  });

  it("reports PRO state with the subscription's plan attached", async () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const currentPeriodEnd = new Date("2026-02-01T00:00:00Z");
    const subscription = { id: "sub-1", status: "ACTIVE" as const, providerSubscriptionId: "mp-1", currentPeriodStart: new Date("2026-01-01T00:00:00Z"), currentPeriodEnd, cancelAtPeriodEnd: false, cancelledAt: null, planId: "plan-1", createdAt: now };
    const plan = { name: "Know Finanzas Pro", price: "7.99", currencyCode: "USD" };
    const service = createBillingPageService({
      ...baseDeps,
      users: fakeUsers(null),
      subscriptions: fakeSubscriptions(subscription),
      plans: fakePlans(plan),
      payments: fakePayments(),
      ai: async () => ({ state: "PRO" as const, available: 300, total: 300, renewsAt: currentPeriodEnd }),
      now: () => now,
    });

    const view = await service.getBillingPage("user-1");

    expect(view.access).toBe("PRO");
    expect(view.trial).toBeNull();
    expect(view.subscription).toMatchObject({ id: "sub-1", plan: { name: "Know Finanzas Pro" } });
    expect(view.whatsappTotal).toBe(20);
  });

  it("reports FREE for a lapsed trial, with the FREE monthly AI allowance and zero WhatsApp", async () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const service = createBillingPageService({
      ...baseDeps,
      users: fakeUsers(new Date("2025-01-01T00:00:00Z")),
      subscriptions: fakeSubscriptions(undefined),
      plans: fakePlans(undefined),
      payments: fakePayments(),
      ai: async () => ({ state: "FREE" as const, available: 15, total: 15, renewsAt: new Date("2026-02-01T00:00:00Z") }),
      now: () => now,
    });

    const view = await service.getBillingPage("user-1");

    expect(view.access).toBe("FREE");
    expect(view.ai).toMatchObject({ state: "FREE", total: 15 });
    expect(view.trial).toBeNull();
    expect(view.whatsappTotal).toBe(0);
  });

  it("falls back to the most recently created subscription when none is currently effective", async () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const older = { id: "sub-old", status: "CANCELLED" as const, providerSubscriptionId: "mp-old", currentPeriodStart: null, currentPeriodEnd: null, cancelAtPeriodEnd: false, cancelledAt: new Date("2025-06-01T00:00:00Z"), planId: "plan-1", createdAt: new Date("2025-01-01T00:00:00Z") };
    const newer = { id: "sub-new", status: "CANCELLED" as const, providerSubscriptionId: "mp-new", currentPeriodStart: null, currentPeriodEnd: null, cancelAtPeriodEnd: false, cancelledAt: new Date("2025-12-01T00:00:00Z"), planId: "plan-1", createdAt: new Date("2025-06-01T00:00:00Z") };
    const service = createBillingPageService({
      ...baseDeps,
      users: fakeUsers(new Date("2025-01-01T00:00:00Z")),
      subscriptions: fakeSubscriptions(undefined, [older, newer]),
      plans: fakePlans({ name: "Know Finanzas Pro", price: "7.99", currencyCode: "USD" }),
      payments: fakePayments(),
      ai: async () => ({ state: "ACCESS_REQUIRED" as const }),
      now: () => now,
    });

    const view = await service.getBillingPage("user-1");

    expect(view.subscription?.id).toBe("sub-new");
  });

  it("sorts payments newest first", async () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const older = { id: "pay-1", status: "APPROVED" as const, grossAmount: "7.99", currencyCode: "USD", paidAt: null, createdAt: new Date("2025-01-01T00:00:00Z") };
    const newer = { id: "pay-2", status: "APPROVED" as const, grossAmount: "7.99", currencyCode: "USD", paidAt: null, createdAt: new Date("2025-06-01T00:00:00Z") };
    const service = createBillingPageService({
      ...baseDeps,
      users: fakeUsers(null),
      subscriptions: fakeSubscriptions(undefined),
      plans: fakePlans(undefined),
      payments: fakePayments([older, newer]),
      ai: async () => ({ state: "ACCESS_REQUIRED" as const }),
      now: () => now,
    });

    const view = await service.getBillingPage("user-1");

    expect(view.payments.map((payment) => payment.id)).toEqual(["pay-2", "pay-1"]);
  });

  it("reports PRO with accessSource=PROMOTION for an active promotional grant with no subscription", async () => {
    const now = new Date("2026-01-15T00:00:00Z");
    const endsAt = new Date("2026-02-01T00:00:00Z");
    const service = createBillingPageService({
      ...baseDeps,
      users: fakeUsers(null),
      subscriptions: fakeSubscriptions(undefined),
      plans: fakePlans(undefined),
      payments: fakePayments(),
      promotions: fakePromotions({ endsAt }),
      ai: async () => ({ state: "ACCESS_REQUIRED" as const }),
      now: () => now,
    });

    const view = await service.getBillingPage("user-1");

    expect(view.access).toBe("PRO");
    expect(view.accessSource).toBe("PROMOTION");
    expect(view.promotion).toEqual({ endsAt });
    expect(view.subscription).toBeNull();
  });

  it("prioritizes an effective paid subscription over an active promotional grant", async () => {
    const now = new Date("2026-01-15T00:00:00Z");
    const subscription = { id: "sub-1", status: "ACTIVE" as const, providerSubscriptionId: "mp-1", currentPeriodStart: now, currentPeriodEnd: new Date("2026-02-15T00:00:00Z"), cancelAtPeriodEnd: false, cancelledAt: null, planId: "plan-1", createdAt: now };
    const service = createBillingPageService({
      ...baseDeps,
      users: fakeUsers(null),
      subscriptions: fakeSubscriptions(subscription),
      plans: fakePlans({ name: "Know Finanzas Pro", price: "7.99", currencyCode: "USD" }),
      payments: fakePayments(),
      promotions: fakePromotions({ endsAt: new Date("2026-03-01T00:00:00Z") }),
      ai: async () => ({ state: "PRO" as const, available: 300, total: 300, renewsAt: subscription.currentPeriodEnd }),
      now: () => now,
    });

    const view = await service.getBillingPage("user-1");

    expect(view.accessSource).toBe("PAID_SUBSCRIPTION");
    expect(view.promotion).toBeNull();
  });

  it("resolves FREE with accessSource NONE for a user who never had a trial or subscription", async () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const service = createBillingPageService({
      ...baseDeps,
      users: fakeUsers(null),
      subscriptions: fakeSubscriptions(undefined),
      plans: fakePlans(undefined),
      payments: fakePayments(),
      ai: async () => ({ state: "FREE" as const, available: 15, total: 15, renewsAt: new Date("2026-02-01T00:00:00Z") }),
      now: () => now,
    });

    const view = await service.getBillingPage("user-1");

    expect(view.access).toBe("FREE");
    expect(view.accessSource).toBe("NONE");
    expect(view.promotion).toBeNull();
  });
});
