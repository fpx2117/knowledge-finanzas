import { describe, expect, it } from "vitest";
import { buildProMonthlyPlanSeed, createCancelSubscription, createRefreshSubscriptionFromProvider, createReconcileSubscriptions, createSubscriptionSynchronizer, type BillingProvider, type SubscriptionSnapshot } from "@know-finanzas/billing";
import { createBillingPaymentRepository } from "../../packages/db/src/repositories/billing-payments";
import { createBillingPeriodRepository } from "../../packages/db/src/repositories/billing-periods";
import { createBillingPlanRepository } from "../../packages/db/src/repositories/billing-plans";
import { createBillingSubscriptionRepository } from "../../packages/db/src/repositories/billing-subscriptions";
import { users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

const userA = "00000000-0000-0000-0000-000000000201";
const userB = "00000000-0000-0000-0000-000000000202";

async function seedUsersAndPlan() {
  const database = getTestDatabase().db;
  await database.insert(users).values([
    { id: userA, name: "User A", email: "cancel-refresh-a@example.test", timezone: "UTC", baseCurrency: "ARS" },
    { id: userB, name: "User B", email: "cancel-refresh-b@example.test", timezone: "UTC", baseCurrency: "ARS" },
  ]);
  return createBillingPlanRepository(database).upsertByCode(buildProMonthlyPlanSeed({ price: "7.99", currencyCode: "USD" }));
}

function stubProvider(overrides: Partial<BillingProvider> = {}): BillingProvider {
  return {
    supportsCancelAtPeriodEnd: false,
    supportsReactivation: false,
    supportsPartialRefund: false,
    supportsRefundLookup: true,
    async createSubscription() { throw new Error("not implemented in this stub"); },
    async getSubscription() { throw new Error("not implemented in this stub"); },
    async cancelSubscription() { throw new Error("not implemented in this stub"); },
    async getPayment() { throw new Error("not implemented in this stub"); },
    ...overrides,
  };
}

describe("Cancel/refresh/reconcile subscription services (real repositories)", () => {
  it("cancels immediately at the provider and reflects CANCELLED locally", async () => {
    const plan = await seedUsersAndPlan();
    const database = getTestDatabase().db;
    const subscriptions = createBillingSubscriptionRepository(database);
    const local = await subscriptions.create({ userId: userA, planId: plan.id, provider: "MERCADO_PAGO", providerSubscriptionId: null, status: "PENDING", currentPeriodStart: null, currentPeriodEnd: null });
    await subscriptions.attachProviderReference(local.id, { providerSubscriptionId: "mp-cancel-1", status: "ACTIVE" });

    const cancelledSnapshot: SubscriptionSnapshot = { providerSubscriptionId: "mp-cancel-1", externalReference: null, status: "CANCELLED", currentPeriodStart: null, currentPeriodEnd: null };
    const cancel = createCancelSubscription({
      subscriptions: { findByIdForUser: subscriptions.findByIdForUser, cancelWithoutProvider: subscriptions.markFailed, recordCancellationReason: subscriptions.recordCancellationReason },
      provider: stubProvider({ cancelSubscription: async () => cancelledSnapshot }),
      synchronizer: createSubscriptionSynchronizer({ subscriptions, periods: createBillingPeriodRepository(database), payments: createBillingPaymentRepository(database) }),
    });

    const result = await cancel({ userId: userA, subscriptionId: local.id });

    expect(result.subscription).toMatchObject({ status: "CANCELLED" });
    await expect(subscriptions.findByIdForUser(local.id, userA)).resolves.toMatchObject({ status: "CANCELLED" });
  });

  it("does not allow cancelling another user's subscription", async () => {
    const plan = await seedUsersAndPlan();
    const database = getTestDatabase().db;
    const subscriptions = createBillingSubscriptionRepository(database);
    const local = await subscriptions.create({ userId: userA, planId: plan.id, provider: "MERCADO_PAGO", providerSubscriptionId: "mp-owned", status: "ACTIVE", currentPeriodStart: null, currentPeriodEnd: null });

    const cancel = createCancelSubscription({
      subscriptions: { findByIdForUser: subscriptions.findByIdForUser, cancelWithoutProvider: subscriptions.markFailed, recordCancellationReason: subscriptions.recordCancellationReason },
      provider: stubProvider(),
      synchronizer: createSubscriptionSynchronizer({ subscriptions, periods: createBillingPeriodRepository(database), payments: createBillingPaymentRepository(database) }),
    });

    await expect(cancel({ userId: userB, subscriptionId: local.id })).rejects.toMatchObject({ code: "BILLING_SUBSCRIPTION_NOT_FOUND" });
    await expect(subscriptions.findByIdForUser(local.id, userA)).resolves.toMatchObject({ status: "ACTIVE" });
  });

  it("refresh pulls the provider snapshot and creates the period/grant exactly once, matching a webhook delivery", async () => {
    const plan = await seedUsersAndPlan();
    const database = getTestDatabase().db;
    const subscriptions = createBillingSubscriptionRepository(database);
    const local = await subscriptions.create({ userId: userA, planId: plan.id, provider: "MERCADO_PAGO", providerSubscriptionId: null, status: "PENDING", currentPeriodStart: null, currentPeriodEnd: null });
    await subscriptions.attachProviderReference(local.id, { providerSubscriptionId: "mp-refresh-1", status: "PENDING" });

    const periodStart = new Date("2026-01-01T00:00:00Z");
    const periodEnd = new Date("2026-02-01T00:00:00Z");
    const activeSnapshot: SubscriptionSnapshot = { providerSubscriptionId: "mp-refresh-1", externalReference: null, status: "ACTIVE", currentPeriodStart: periodStart, currentPeriodEnd: periodEnd };

    const refresh = createRefreshSubscriptionFromProvider({
      subscriptions,
      provider: stubProvider({ getSubscription: async () => activeSnapshot }),
      synchronizer: createSubscriptionSynchronizer({ subscriptions, periods: createBillingPeriodRepository(database), payments: createBillingPaymentRepository(database) }),
      cooldownMs: 0,
    });

    const result = await refresh({ userId: userA, subscriptionId: local.id });

    expect(result.subscription).toMatchObject({ status: "ACTIVE" });
    expect(result.periodCreated).toBe(true);
    await expect(createBillingPeriodRepository(database).listForSubscription(local.id)).resolves.toHaveLength(1);
  });

  it("rate limits repeated refreshes within the cooldown window", async () => {
    const plan = await seedUsersAndPlan();
    const database = getTestDatabase().db;
    const subscriptions = createBillingSubscriptionRepository(database);
    const local = await subscriptions.create({ userId: userA, planId: plan.id, provider: "MERCADO_PAGO", providerSubscriptionId: "mp-rate-1", status: "ACTIVE", currentPeriodStart: null, currentPeriodEnd: null });

    const refresh = createRefreshSubscriptionFromProvider({
      subscriptions,
      provider: stubProvider({ getSubscription: async () => ({ providerSubscriptionId: "mp-rate-1", externalReference: null, status: "ACTIVE", currentPeriodStart: null, currentPeriodEnd: null }) }),
      synchronizer: createSubscriptionSynchronizer({ subscriptions, periods: createBillingPeriodRepository(database), payments: createBillingPaymentRepository(database) }),
      cooldownMs: 60_000,
    });

    await expect(refresh({ userId: userA, subscriptionId: local.id })).rejects.toMatchObject({ code: "BILLING_REFRESH_RATE_LIMITED" });
  });

  it("reconcile recovers a subscription whose ACTIVE webhook was dropped, without touching an already-terminal one", async () => {
    const plan = await seedUsersAndPlan();
    const database = getTestDatabase().db;
    const subscriptions = createBillingSubscriptionRepository(database);
    const missedWebhook = await subscriptions.create({ userId: userA, planId: plan.id, provider: "MERCADO_PAGO", providerSubscriptionId: null, status: "PENDING", currentPeriodStart: null, currentPeriodEnd: null });
    await subscriptions.attachProviderReference(missedWebhook.id, { providerSubscriptionId: "mp-missed", status: "PENDING" });
    const alreadyCancelled = await subscriptions.create({ userId: userB, planId: plan.id, provider: "MERCADO_PAGO", providerSubscriptionId: "mp-terminal", status: "ACTIVE", currentPeriodStart: null, currentPeriodEnd: null });
    await subscriptions.markFailed(alreadyCancelled.id);

    const getSubscription = async (providerSubscriptionId: string): Promise<SubscriptionSnapshot> => {
      if (providerSubscriptionId === "mp-terminal") throw new Error("should not be called for a terminal subscription");
      return { providerSubscriptionId, externalReference: null, status: "ACTIVE", currentPeriodStart: new Date("2026-01-01T00:00:00Z"), currentPeriodEnd: new Date("2026-02-01T00:00:00Z") };
    };

    const reconcile = createReconcileSubscriptions({
      subscriptions,
      provider: stubProvider({ getSubscription }),
      synchronizer: createSubscriptionSynchronizer({ subscriptions, periods: createBillingPeriodRepository(database), payments: createBillingPaymentRepository(database) }),
    });

    const result = await reconcile();

    expect(result.reconciled).toBeGreaterThanOrEqual(1);
    await expect(subscriptions.findByIdForUser(missedWebhook.id, userA)).resolves.toMatchObject({ status: "ACTIVE" });
  });
});
