import { describe, expect, it, vi } from "vitest";
import { createCancelSubscription, createRefreshSubscriptionFromProvider, createReconcileSubscriptions, createSubscriptionSynchronizer } from "@know-finanzas/billing";

function fakeSubscriptionsRepo(seed: Array<{ id: string; userId: string; planId: string; status: string; providerSubscriptionId: string | null; updatedAt?: Date }>) {
  const records = seed.map((record) => ({ updatedAt: new Date("2020-01-01T00:00:00Z"), ...record }));
  return {
    records,
    findByIdForUser: async (id: string, userId: string) => records.find((record) => record.id === id && record.userId === userId),
    findById: async (id: string) => records.find((record) => record.id === id),
    findByProviderSubscriptionId: async (providerSubscriptionId: string) => records.find((record) => record.providerSubscriptionId === providerSubscriptionId),
    updateStatusAndPeriod: async (id: string, input: { status: string; providerSubscriptionId: string }) => {
      const record = records.find((item) => item.id === id);
      if (!record) return undefined;
      Object.assign(record, input);
      return record;
    },
    cancelWithoutProvider: async (id: string, reason?: { reasonCode: string | null; reasonComment: string | null }) => {
      const record = records.find((item) => item.id === id);
      if (!record) return undefined;
      record.status = "CANCELLED";
      Object.assign(record, reason ? { cancellationReasonCode: reason.reasonCode, cancellationReasonComment: reason.reasonComment } : {});
      return record;
    },
    recordCancellationReason: async (id: string, reason: { reasonCode: string | null; reasonComment: string | null }) => {
      const record = records.find((item) => item.id === id);
      if (!record) return undefined;
      Object.assign(record, { cancellationReasonCode: reason.reasonCode, cancellationReasonComment: reason.reasonComment });
      return record;
    },
    listReconcilable: async () => records.filter((record) => ["PENDING", "ACTIVE", "PAST_DUE"].includes(record.status)),
  };
}

function fakePeriods() {
  return { upsertPeriod: async () => { throw new Error("not expected"); }, listForSubscription: async () => [] };
}

function fakeSynchronizer(subscriptions: ReturnType<typeof fakeSubscriptionsRepo>) {
  return createSubscriptionSynchronizer({ subscriptions, periods: fakePeriods(), payments: { upsertByProviderPaymentId: async () => undefined } });
}

describe("createCancelSubscription", () => {
  it("cancels immediately at the provider and applies the resulting snapshot locally", async () => {
    const subscriptions = fakeSubscriptionsRepo([{ id: "sub-1", userId: "user-1", planId: "plan-1", status: "ACTIVE", providerSubscriptionId: "mp-1" }]);
    const cancelSubscription = vi.fn().mockResolvedValue({ providerSubscriptionId: "mp-1", externalReference: null, status: "CANCELLED", currentPeriodStart: null, currentPeriodEnd: null });
    const cancel = createCancelSubscription({ subscriptions, provider: { cancelSubscription }, synchronizer: fakeSynchronizer(subscriptions) });

    const result = await cancel({ userId: "user-1", subscriptionId: "sub-1" });

    expect(cancelSubscription).toHaveBeenCalledWith("mp-1");
    expect(result.subscription).toMatchObject({ status: "CANCELLED" });
  });

  it("cancels locally without calling the provider when the subscription never reached it", async () => {
    const subscriptions = fakeSubscriptionsRepo([{ id: "sub-1", userId: "user-1", planId: "plan-1", status: "PENDING", providerSubscriptionId: null }]);
    const cancelSubscription = vi.fn();
    const cancel = createCancelSubscription({ subscriptions, provider: { cancelSubscription }, synchronizer: fakeSynchronizer(subscriptions) });

    const result = await cancel({ userId: "user-1", subscriptionId: "sub-1" });

    expect(cancelSubscription).not.toHaveBeenCalled();
    expect(result.subscription).toMatchObject({ status: "CANCELLED" });
  });

  it("throws BILLING_SUBSCRIPTION_NOT_FOUND when the user does not own the subscription", async () => {
    const subscriptions = fakeSubscriptionsRepo([{ id: "sub-1", userId: "user-owner", planId: "plan-1", status: "ACTIVE", providerSubscriptionId: "mp-1" }]);
    const cancel = createCancelSubscription({ subscriptions, provider: { cancelSubscription: vi.fn() }, synchronizer: fakeSynchronizer(subscriptions) });

    await expect(cancel({ userId: "user-attacker", subscriptionId: "sub-1" })).rejects.toMatchObject({ code: "BILLING_SUBSCRIPTION_NOT_FOUND" });
  });

  it("throws BILLING_SUBSCRIPTION_ALREADY_CANCELLED for an already-cancelled subscription", async () => {
    const subscriptions = fakeSubscriptionsRepo([{ id: "sub-1", userId: "user-1", planId: "plan-1", status: "CANCELLED", providerSubscriptionId: "mp-1" }]);
    const cancel = createCancelSubscription({ subscriptions, provider: { cancelSubscription: vi.fn() }, synchronizer: fakeSynchronizer(subscriptions) });

    await expect(cancel({ userId: "user-1", subscriptionId: "sub-1" })).rejects.toMatchObject({ code: "BILLING_SUBSCRIPTION_ALREADY_CANCELLED" });
  });
});

describe("createRefreshSubscriptionFromProvider", () => {
  it("pulls the provider's current state and applies it locally", async () => {
    const subscriptions = fakeSubscriptionsRepo([{ id: "sub-1", userId: "user-1", planId: "plan-1", status: "PENDING", providerSubscriptionId: "mp-1" }]);
    const getSubscription = vi.fn().mockResolvedValue({ providerSubscriptionId: "mp-1", externalReference: null, status: "ACTIVE", currentPeriodStart: null, currentPeriodEnd: null });
    const refresh = createRefreshSubscriptionFromProvider({ subscriptions, provider: { getSubscription }, synchronizer: fakeSynchronizer(subscriptions) });

    const result = await refresh({ userId: "user-1", subscriptionId: "sub-1" });

    expect(result.subscription).toMatchObject({ status: "ACTIVE" });
  });

  it("throws BILLING_SUBSCRIPTION_NOT_FOUND for another user's subscription", async () => {
    const subscriptions = fakeSubscriptionsRepo([{ id: "sub-1", userId: "user-owner", planId: "plan-1", status: "ACTIVE", providerSubscriptionId: "mp-1" }]);
    const refresh = createRefreshSubscriptionFromProvider({ subscriptions, provider: { getSubscription: vi.fn() }, synchronizer: fakeSynchronizer(subscriptions) });

    await expect(refresh({ userId: "user-attacker", subscriptionId: "sub-1" })).rejects.toMatchObject({ code: "BILLING_SUBSCRIPTION_NOT_FOUND" });
  });

  it("throws BILLING_REFRESH_RATE_LIMITED when refreshed again within the cooldown", async () => {
    const now = new Date("2026-01-01T00:00:10Z");
    const subscriptions = fakeSubscriptionsRepo([{ id: "sub-1", userId: "user-1", planId: "plan-1", status: "ACTIVE", providerSubscriptionId: "mp-1", updatedAt: new Date("2026-01-01T00:00:00Z") }]);
    const refresh = createRefreshSubscriptionFromProvider({ subscriptions, provider: { getSubscription: vi.fn() }, synchronizer: fakeSynchronizer(subscriptions), cooldownMs: 30_000, now: () => now });

    await expect(refresh({ userId: "user-1", subscriptionId: "sub-1" })).rejects.toMatchObject({ code: "BILLING_REFRESH_RATE_LIMITED" });
  });

  it("allows a refresh once the cooldown has elapsed", async () => {
    const now = new Date("2026-01-01T00:01:00Z");
    const subscriptions = fakeSubscriptionsRepo([{ id: "sub-1", userId: "user-1", planId: "plan-1", status: "PENDING", providerSubscriptionId: "mp-1", updatedAt: new Date("2026-01-01T00:00:00Z") }]);
    const getSubscription = vi.fn().mockResolvedValue({ providerSubscriptionId: "mp-1", externalReference: null, status: "ACTIVE", currentPeriodStart: null, currentPeriodEnd: null });
    const refresh = createRefreshSubscriptionFromProvider({ subscriptions, provider: { getSubscription }, synchronizer: fakeSynchronizer(subscriptions), cooldownMs: 30_000, now: () => now });

    await expect(refresh({ userId: "user-1", subscriptionId: "sub-1" })).resolves.toMatchObject({ subscription: { status: "ACTIVE" } });
  });
});

describe("createReconcileSubscriptions", () => {
  it("refreshes every reconcilable subscription and reports counts", async () => {
    const subscriptions = fakeSubscriptionsRepo([
      { id: "sub-1", userId: "user-1", planId: "plan-1", status: "ACTIVE", providerSubscriptionId: "mp-1" },
      { id: "sub-2", userId: "user-2", planId: "plan-1", status: "PAST_DUE", providerSubscriptionId: "mp-2" },
      { id: "sub-3", userId: "user-3", planId: "plan-1", status: "CANCELLED", providerSubscriptionId: "mp-3" },
    ]);
    const getSubscription = vi.fn(async (providerSubscriptionId: string) => ({ providerSubscriptionId, externalReference: null, status: "ACTIVE" as const, currentPeriodStart: null, currentPeriodEnd: null }));
    const reconcile = createReconcileSubscriptions({ subscriptions, provider: { getSubscription }, synchronizer: fakeSynchronizer(subscriptions) });

    const result = await reconcile();

    expect(getSubscription).toHaveBeenCalledTimes(2);
    expect(getSubscription).not.toHaveBeenCalledWith("mp-3");
    expect(result.reconciled).toBe(2);
    expect(result.failed).toBe(0);
  });

  it("isolates one subscription's provider failure without aborting the batch", async () => {
    const subscriptions = fakeSubscriptionsRepo([
      { id: "sub-1", userId: "user-1", planId: "plan-1", status: "ACTIVE", providerSubscriptionId: "mp-1" },
      { id: "sub-2", userId: "user-2", planId: "plan-1", status: "ACTIVE", providerSubscriptionId: "mp-2" },
    ]);
    const getSubscription = vi.fn(async (providerSubscriptionId: string) => {
      if (providerSubscriptionId === "mp-1") throw new Error("provider outage");
      return { providerSubscriptionId, externalReference: null, status: "ACTIVE" as const, currentPeriodStart: null, currentPeriodEnd: null };
    });
    const reconcile = createReconcileSubscriptions({ subscriptions, provider: { getSubscription }, synchronizer: fakeSynchronizer(subscriptions) });

    const result = await reconcile();

    expect(result.reconciled).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.results).toContainEqual({ subscriptionId: "sub-2", ok: true, status: "ACTIVE" });
  });
});
