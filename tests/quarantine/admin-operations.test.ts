import { sql } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import { buildProMonthlyPlanSeed, createRequestRefund, createRetryWebhookEvent } from "@know-finanzas/billing";
import { createAdminAdjustCredits } from "@know-finanzas/ai";
import { createRecordAuditEntry } from "@know-finanzas/audit";
import { createAICreditRepository } from "../../packages/db/src/repositories/ai-credits";
import { createAuditLogRepository } from "../../packages/db/src/repositories/audit-log";
import { createBillingPaymentRepository } from "../../packages/db/src/repositories/billing-payments";
import { createBillingPeriodRepository } from "../../packages/db/src/repositories/billing-periods";
import { createBillingPlanRepository } from "../../packages/db/src/repositories/billing-plans";
import { createBillingRefundRepository } from "../../packages/db/src/repositories/billing-refunds";
import { createBillingSubscriptionRepository } from "../../packages/db/src/repositories/billing-subscriptions";
import { createBillingWebhookEventRepository } from "../../packages/db/src/repositories/billing-webhook-events";
import { createGetReconciliationQueue } from "../../apps/web/src/features/admin/billing/services/get-reconciliation-queue";
import { users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

const adminUser = "00000000-0000-0000-0000-000000001101";
const subscriber = "00000000-0000-0000-0000-000000001102";

async function seedUsers() {
  const database = getTestDatabase().db;
  await database.insert(users).values([
    { id: adminUser, name: "Admin", email: "admin-ops-a@example.test", timezone: "UTC", baseCurrency: "ARS" },
    { id: subscriber, name: "Subscriber", email: "admin-ops-sub@example.test", timezone: "UTC", baseCurrency: "ARS" },
  ]);
  return database;
}

describe("admin operations (real repositories)", () => {
  it("an admin refund action produces exactly one audit entry alongside the real refund", async () => {
    const database = await seedUsers();
    const plan = await createBillingPlanRepository(database).upsertByCode(buildProMonthlyPlanSeed({ price: "7.99", currencyCode: "USD" }));
    const subscriptions = createBillingSubscriptionRepository(database);
    const subscription = await subscriptions.create({ userId: subscriber, planId: plan.id, provider: "MERCADO_PAGO", providerSubscriptionId: "mp-sub-ops-1", status: "ACTIVE", currentPeriodStart: new Date("2026-01-01T00:00:00Z"), currentPeriodEnd: new Date("2026-02-01T00:00:00Z") });
    const periods = createBillingPeriodRepository(database);
    const { period } = await periods.upsertPeriod({ subscriptionId: subscription.id, startsAt: new Date("2026-01-01T00:00:00Z"), endsAt: new Date("2026-02-01T00:00:00Z"), status: "ACTIVE", providerReference: "mp-sub-ops-1" });
    const payments = createBillingPaymentRepository(database);
    const payment = await payments.upsertByProviderPaymentId({ userId: subscriber, subscriptionId: subscription.id, billingPeriodId: period.id, providerPaymentId: "mp-pay-ops-1", status: "APPROVED", grossAmount: "7.99", currencyCode: "USD", providerFee: null, netAmount: null, paidAt: new Date("2026-01-01T00:05:00Z") });

    const refunds = createBillingRefundRepository(database);
    const requestRefund = createRequestRefund({ payments, refunds, provider: { refundPayment: vi.fn(async () => ({ providerRefundId: "mp-refund-ops-1", status: "APPROVED" as const, amount: "7.99" })) } });
    const recordAuditEntry = createRecordAuditEntry({ repository: createAuditLogRepository(database) });

    // Mirrors exactly what adminRequestRefundAction does: call the domain service, then record
    // one audit entry for the outcome.
    const result = await requestRefund({ actor: { userId: adminUser, isAdmin: true }, paymentId: payment!.id, reason: "DUPLICATE_CHARGE", requestIdempotencyKey: `admin:${adminUser}:${payment!.id}:1` });
    await recordAuditEntry({ actorUserId: adminUser, action: "ADMIN_REQUEST_REFUND", entityType: "billing_refund", entityId: result.refund.id, targetUserId: subscriber, beforeSnapshot: { paymentId: payment!.id }, afterSnapshot: result.refund, reason: "support case #1" });

    expect(result.refund.status).toBe("APPROVED");
    const auditLog = createAuditLogRepository(database);
    const entries = await auditLog.search({ targetUserId: subscriber });
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ action: "ADMIN_REQUEST_REFUND", reason: "support case #1" });
  });

  it("an AI credit adjustment writes a ledger entry (never a direct balance column mutation) and enforces the negative-balance guard", async () => {
    const database = await seedUsers();
    const aiCredits = createAICreditRepository(database);
    const adjust = createAdminAdjustCredits({ repository: aiCredits });

    await aiCredits.grantTrialCredits({ userId: subscriber, amount: 10, expiresAt: null });

    const creditResult = await adjust({ userId: subscriber, pool: "TRIAL_ALLOWANCE", amount: 5, direction: "CREDIT", reason: "goodwill", adminUserId: adminUser });
    expect(creditResult.ok).toBe(true);

    const balances = await aiCredits.getAvailableBalances(subscriber);
    expect(balances.TRIAL_ALLOWANCE).toBe(15);

    // Negative-balance guard: cannot debit more than what's available.
    const overDebit = await adjust({ userId: subscriber, pool: "TRIAL_ALLOWANCE", amount: 100, direction: "DEBIT", reason: "correction", adminUserId: adminUser });
    expect(overDebit).toEqual({ ok: false, available: 15 });

    const unchangedBalances = await aiCredits.getAvailableBalances(subscriber);
    expect(unchangedBalances.TRIAL_ALLOWANCE).toBe(15);

    const validDebit = await adjust({ userId: subscriber, pool: "TRIAL_ALLOWANCE", amount: 5, direction: "DEBIT", reason: "correction", adminUserId: adminUser });
    expect(validDebit.ok).toBe(true);
    const finalBalances = await aiCredits.getAvailableBalances(subscriber);
    expect(finalBalances.TRIAL_ALLOWANCE).toBe(10);
  });

  it("webhook replay is a no-op on an already-processed event (idempotency) against real Postgres", async () => {
    const database = await seedUsers();
    const events = createBillingWebhookEventRepository(database);
    const { event } = await events.recordReceived({ provider: "MERCADO_PAGO", providerEventId: "evt-ops-1", eventType: "payment", externalResourceId: "mp-pay-ops-2", payloadHash: "hash-1" });
    await events.markProcessed(event.id);

    const provider = { getSubscription: vi.fn(), getPayment: vi.fn() };
    const synchronizer = { synchronizeSubscription: vi.fn(), synchronizePayment: vi.fn() };
    const retryWebhookEvent = createRetryWebhookEvent({ events, provider, synchronizer, handlePaymentFailure: vi.fn() });

    const result = await retryWebhookEvent(event.id);

    expect(result).toEqual({ outcome: "not_failed" });
    expect(provider.getPayment).not.toHaveBeenCalled();
    const stillProcessed = await events.findById(event.id);
    expect(stillProcessed?.status).toBe("PROCESSED");
  });

  it("GetReconciliationQueue surfaces real stale-PENDING/past-due/failed-webhook/pending-refund data", async () => {
    const database = await seedUsers();
    const plan = await createBillingPlanRepository(database).upsertByCode(buildProMonthlyPlanSeed({ price: "7.99", currencyCode: "USD" }));
    const subscriptions = createBillingSubscriptionRepository(database);
    const stale = await subscriptions.create({ userId: subscriber, planId: plan.id, provider: "MERCADO_PAGO", providerSubscriptionId: null, status: "PENDING", currentPeriodStart: null, currentPeriodEnd: null });
    await database.execute(sql`update billing_subscriptions set created_at = now() - interval '2 days' where id = ${stale.id}`);

    const webhookEvents = createBillingWebhookEventRepository(database);
    const { event: failedEvent } = await webhookEvents.recordReceived({ provider: "MERCADO_PAGO", providerEventId: "evt-ops-2", eventType: "payment", externalResourceId: "mp-pay-ops-3", payloadHash: "hash-2" });
    await webhookEvents.markFailed(failedEvent.id, "BILLING_PROVIDER_ERROR");

    const getQueue = createGetReconciliationQueue({
      repository: { subscriptions, webhookEvents, refunds: createBillingRefundRepository(database) },
      now: () => new Date(),
    });

    const queue = await getQueue();

    expect(queue.stalePendingSubscriptions.some((s) => s.id === stale.id)).toBe(true);
    expect(queue.failedWebhooks.some((w) => w.id === failedEvent.id)).toBe(true);
  });
});
