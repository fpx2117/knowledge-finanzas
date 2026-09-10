import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { buildProMonthlyPlanSeed, createExpirePastDueSubscriptions, createHandlePaymentFailure, createSubscriptionSynchronizer, isEffectivePaidSubscription, resolveProductAccess, type SubscriptionSnapshot } from "@know-finanzas/billing";
import { createAccountRepository } from "../../packages/db/src/repositories/accounts";
import { createBillingPaymentRepository } from "../../packages/db/src/repositories/billing-payments";
import { createBillingPeriodRepository } from "../../packages/db/src/repositories/billing-periods";
import { createBillingPlanRepository } from "../../packages/db/src/repositories/billing-plans";
import { createBillingSubscriptionRepository } from "../../packages/db/src/repositories/billing-subscriptions";
import { createTransactionRepository } from "../../packages/db/src/repositories/transactions";
import { accounts, billingSubscriptions, users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

const userA = "00000000-0000-0000-0000-000000000301";
const accountId = "10000000-0000-0000-0000-000000000301";

async function seedUserPlanAndActiveSubscription() {
  const database = getTestDatabase().db;
  await database.insert(users).values({ id: userA, name: "User A", email: "payment-failure@example.test", timezone: "UTC", baseCurrency: "ARS" });
  await database.insert(accounts).values({ id: accountId, userId: userA, name: "Account", type: "BANK", currencyCode: "ARS", openingBalance: "1000", openingDate: "2026-01-01" });
  const plan = await createBillingPlanRepository(database).upsertByCode(buildProMonthlyPlanSeed({ price: "7.99", currencyCode: "USD" }));
  const subscriptions = createBillingSubscriptionRepository(database);
  const periodStart = new Date("2026-01-01T00:00:00Z");
  const periodEnd = new Date("2026-02-01T00:00:00Z");
  const local = await subscriptions.create({ userId: userA, planId: plan.id, provider: "MERCADO_PAGO", providerSubscriptionId: "mp-lifecycle-1", status: "ACTIVE", currentPeriodStart: periodStart, currentPeriodEnd: periodEnd });
  return { local, periodEnd, subscriptions };
}

describe("payment failure -> PAST_DUE -> grace -> EXPIRED lifecycle (real repositories)", () => {
  it("a rejected renewal payment moves ACTIVE to PAST_DUE and access stays PRO within grace", async () => {
    const { local, periodEnd, subscriptions } = await seedUserPlanAndActiveSubscription();
    const handlePaymentFailure = createHandlePaymentFailure({ subscriptions });

    await handlePaymentFailure(local.id);

    const afterFailure = await subscriptions.findById(local.id);
    expect(afterFailure).toMatchObject({ status: "PAST_DUE" });
    expect(resolveProductAccess({ now: new Date(periodEnd.getTime() + 2 * 24 * 60 * 60 * 1000), trialEndsAt: null, subscription: afterFailure!, graceDays: 5 })).toBe("PRO");
  });

  it("recovers to ACTIVE when the retried payment succeeds and the provider confirms it via the subscription webhook", async () => {
    const { local, periodEnd, subscriptions } = await seedUserPlanAndActiveSubscription();
    const database = getTestDatabase().db;
    const handlePaymentFailure = createHandlePaymentFailure({ subscriptions });
    const synchronizer = createSubscriptionSynchronizer({ subscriptions, periods: createBillingPeriodRepository(database), payments: createBillingPaymentRepository(database) });

    await handlePaymentFailure(local.id);
    await expect(subscriptions.findById(local.id)).resolves.toMatchObject({ status: "PAST_DUE" });

    const recoveredSnapshot: SubscriptionSnapshot = { providerSubscriptionId: "mp-lifecycle-1", externalReference: null, status: "ACTIVE", currentPeriodStart: periodEnd, currentPeriodEnd: new Date(periodEnd.getTime() + 30 * 24 * 60 * 60 * 1000) };
    await synchronizer.synchronizeSubscription(recoveredSnapshot);

    await expect(subscriptions.findById(local.id)).resolves.toMatchObject({ status: "ACTIVE" });
  });

  it("expires a PAST_DUE subscription once the grace window elapses, dropping the user to the FREE tier with all data intact", async () => {
    const { local, periodEnd, subscriptions } = await seedUserPlanAndActiveSubscription();
    const handlePaymentFailure = createHandlePaymentFailure({ subscriptions });
    await handlePaymentFailure(local.id);

    const graceDays = 3;
    const afterGrace = new Date(periodEnd.getTime() + (graceDays + 1) * 24 * 60 * 60 * 1000);
    const expirePastDueSubscriptions = createExpirePastDueSubscriptions({ subscriptions, graceDays, now: () => afterGrace });

    const result = await expirePastDueSubscriptions();

    expect(result).toEqual({ expired: 1, results: [{ subscriptionId: local.id, userId: userA, expired: true }] });
    const expired = await subscriptions.findById(local.id);
    expect(expired).toMatchObject({ status: "EXPIRED" });
    // A lapsed subscription with no trial/promotion now resolves to the permanent FREE tier
    // (not EXPIRED_READ_ONLY) — core personal finance stays fully usable.
    expect(resolveProductAccess({ now: afterGrace, trialEndsAt: null, subscription: expired!, graceDays })).toBe("FREE");

    // Financial data (docs/10-6.subscription-cancellation-refunds.md domain rule: cancellation/
    // access loss never deletes or archives financial history) must still be fully readable.
    const database = getTestDatabase().db;
    const transactionsRepository = createTransactionRepository(database);
    const created = await transactionsRepository.create({ userId: userA, accountId, categoryId: null, type: "EXPENSE", amount: "50", currencyCode: "ARS", description: "Still readable", merchant: null, occurredAt: new Date("2026-01-15T12:00:00Z"), postedAt: new Date("2026-01-15T12:00:00Z"), source: "MANUAL", notes: null });
    await expect(transactionsRepository.findByIdForUser(created.id, userA)).resolves.toMatchObject({ id: created.id, status: "POSTED" });
    await expect(createAccountRepository(database).findByIdForUser(accountId, userA)).resolves.toMatchObject({ id: accountId });
  });

  it("the expiration sweep is idempotent and skips subscriptions still within grace", async () => {
    const { local, periodEnd, subscriptions } = await seedUserPlanAndActiveSubscription();
    const handlePaymentFailure = createHandlePaymentFailure({ subscriptions });
    await handlePaymentFailure(local.id);

    const withinGrace = new Date(periodEnd.getTime() + 1 * 24 * 60 * 60 * 1000);
    const expireEarly = createExpirePastDueSubscriptions({ subscriptions, graceDays: 5, now: () => withinGrace });
    const early = await expireEarly();
    expect(early.expired).toBe(0);
    await expect(subscriptions.findById(local.id)).resolves.toMatchObject({ status: "PAST_DUE" });

    const afterGrace = new Date(periodEnd.getTime() + 10 * 24 * 60 * 60 * 1000);
    const expireLate = createExpirePastDueSubscriptions({ subscriptions, graceDays: 5, now: () => afterGrace });
    const first = await expireLate();
    const second = await expireLate();
    expect(first.expired).toBe(1);
    expect(second.expired).toBe(0);
    await expect(subscriptions.findById(local.id)).resolves.toMatchObject({ status: "EXPIRED" });
  });

  it("keeps isEffectivePaidSubscription and the persisted status consistent throughout the lifecycle", async () => {
    const { local, subscriptions } = await seedUserPlanAndActiveSubscription();
    const active = await subscriptions.findById(local.id);
    expect(isEffectivePaidSubscription(active!, new Date("2026-01-15T00:00:00Z"), 5)).toBe(true);

    const database = getTestDatabase().db;
    await database.update(billingSubscriptions).set({ status: "CANCELLED", cancelledAt: new Date() }).where(eq(billingSubscriptions.id, local.id));
    const cancelled = await subscriptions.findById(local.id);
    expect(isEffectivePaidSubscription(cancelled!, new Date("2026-01-15T00:00:00Z"), 5)).toBe(false);
  });
});
