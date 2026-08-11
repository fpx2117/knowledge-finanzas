import { sql } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import {
  buildProMonthlyPlanSeed,
  createDetectDuplicatePayments,
  createReconcileRefund,
  createRecordDisputeEvent,
  createRequestRefund,
  type BillingProvider,
} from "@know-finanzas/billing";
import { createBillingDisputeRepository } from "../../packages/db/src/repositories/billing-disputes";
import { createBillingPaymentRepository } from "../../packages/db/src/repositories/billing-payments";
import { createBillingPeriodRepository } from "../../packages/db/src/repositories/billing-periods";
import { createBillingPlanRepository } from "../../packages/db/src/repositories/billing-plans";
import { createBillingRefundRepository } from "../../packages/db/src/repositories/billing-refunds";
import { createBillingSubscriptionRepository } from "../../packages/db/src/repositories/billing-subscriptions";
import { users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

const adminUser = "00000000-0000-0000-0000-000000000801";
const subscriber = "00000000-0000-0000-0000-000000000802";

async function seed() {
  const database = getTestDatabase().db;
  await database.insert(users).values([
    { id: adminUser, name: "Admin", email: "refunds-admin@example.test", timezone: "UTC", baseCurrency: "ARS" },
    { id: subscriber, name: "Subscriber", email: "refunds-subscriber@example.test", timezone: "UTC", baseCurrency: "ARS" },
  ]);
  const plan = await createBillingPlanRepository(database).upsertByCode(buildProMonthlyPlanSeed({ price: "7.99", currencyCode: "USD" }));
  const subscriptions = createBillingSubscriptionRepository(database);
  const subscription = await subscriptions.create({ userId: subscriber, planId: plan.id, provider: "MERCADO_PAGO", providerSubscriptionId: "mp-sub-1", status: "ACTIVE", currentPeriodStart: new Date("2026-01-01T00:00:00Z"), currentPeriodEnd: new Date("2026-02-01T00:00:00Z") });
  const periods = createBillingPeriodRepository(database);
  const { period } = await periods.upsertPeriod({ subscriptionId: subscription.id, startsAt: new Date("2026-01-01T00:00:00Z"), endsAt: new Date("2026-02-01T00:00:00Z"), status: "ACTIVE", providerReference: "mp-sub-1" });
  return { database, subscription, period };
}

describe("billing refunds and disputes (real repositories, fake Mercado Pago provider)", () => {
  it("requests a full refund for an approved payment, calls the provider once, and persists it APPROVED", async () => {
    const { database, subscription, period } = await seed();
    const payments = createBillingPaymentRepository(database);
    const refunds = createBillingRefundRepository(database);
    const payment = await payments.upsertByProviderPaymentId({ userId: subscriber, subscriptionId: subscription.id, billingPeriodId: period.id, providerPaymentId: "mp-pay-1", status: "APPROVED", grossAmount: "7.99", currencyCode: "USD", providerFee: null, netAmount: null, paidAt: new Date("2026-01-01T00:05:00Z") });

    const refundPayment = vi.fn(async () => ({ providerRefundId: "mp-refund-1", status: "APPROVED" as const, amount: "7.99" }));
    const requestRefund = createRequestRefund({ payments, refunds, provider: { refundPayment } });

    const result = await requestRefund({ actor: { userId: adminUser, isAdmin: true }, paymentId: payment!.id, reason: "DUPLICATE_CHARGE", requestIdempotencyKey: "req-1" });

    expect(result).toEqual({ refund: expect.objectContaining({ status: "APPROVED", providerRefundId: "mp-refund-1", amount: "7.990000" }), created: true });
    expect(refundPayment).toHaveBeenCalledTimes(1);
  });

  it("retrying the same idempotency key never issues a second provider refund", async () => {
    const { database, subscription, period } = await seed();
    const payments = createBillingPaymentRepository(database);
    const refunds = createBillingRefundRepository(database);
    const payment = await payments.upsertByProviderPaymentId({ userId: subscriber, subscriptionId: subscription.id, billingPeriodId: period.id, providerPaymentId: "mp-pay-2", status: "APPROVED", grossAmount: "7.99", currencyCode: "USD", providerFee: null, netAmount: null, paidAt: new Date("2026-01-01T00:05:00Z") });

    const refundPayment = vi.fn(async () => ({ providerRefundId: "mp-refund-2", status: "APPROVED" as const, amount: "7.99" }));
    const requestRefund = createRequestRefund({ payments, refunds, provider: { refundPayment } });

    const first = await requestRefund({ actor: { userId: adminUser, isAdmin: true }, paymentId: payment!.id, reason: "DUPLICATE_CHARGE", requestIdempotencyKey: "req-2" });
    const second = await requestRefund({ actor: { userId: adminUser, isAdmin: true }, paymentId: payment!.id, reason: "DUPLICATE_CHARGE", requestIdempotencyKey: "req-2" });

    expect(refundPayment).toHaveBeenCalledTimes(1);
    expect(second.refund.id).toBe(first.refund.id);
  });

  it("a provider failure leaves the refund FAILED, and ReconcileRefund recovers a case where the provider actually succeeded but the local write was never observed", async () => {
    const { database, subscription, period } = await seed();
    const payments = createBillingPaymentRepository(database);
    const refunds = createBillingRefundRepository(database);
    const payment = await payments.upsertByProviderPaymentId({ userId: subscriber, subscriptionId: subscription.id, billingPeriodId: period.id, providerPaymentId: "mp-pay-3", status: "APPROVED", grossAmount: "7.99", currencyCode: "USD", providerFee: null, netAmount: null, paidAt: new Date("2026-01-01T00:05:00Z") });

    const failingProvider = { refundPayment: vi.fn(async () => { throw new Error("provider timeout"); }) };
    const requestRefund = createRequestRefund({ payments, refunds, provider: failingProvider });
    const failed = await requestRefund({ actor: { userId: adminUser, isAdmin: true }, paymentId: payment!.id, reason: "SERVICE_FAILURE", requestIdempotencyKey: "req-3" });
    expect(failed.refund.status).toBe("FAILED");

    // Simulate the provider having actually refunded the payment despite our local failure: the
    // refund stays PENDING in DB (a real request would, after markFailed, no longer be PENDING —
    // this exercises reconciliation directly against a PENDING row as ReconcileRefund would find
    // one left behind by a crash between the provider call and the local write).
    await database.execute(sql`update billing_refunds set status = 'PENDING' where id = ${failed.refund.id}`);

    const provider: Pick<BillingProvider, "getPayment"> = { getPayment: vi.fn(async () => ({ providerPaymentId: "mp-pay-3", externalReference: null, status: "REFUNDED", grossAmount: "7.99", currencyCode: "USD", providerFee: null, netAmount: null, paidAt: new Date() })) };
    const reconcileRefund = createReconcileRefund({ refunds, payments, provider });

    const reconciled = await reconcileRefund();

    expect(reconciled.reconciled).toBe(1);
    const reconciledRefund = await refunds.findById(failed.refund.id);
    expect(reconciledRefund).toMatchObject({ status: "APPROVED" });
  });

  it("DetectDuplicatePayments surfaces two approved payments for the same billing period without auto-refunding", async () => {
    const { database, subscription, period } = await seed();
    const payments = createBillingPaymentRepository(database);
    const paymentA = await payments.upsertByProviderPaymentId({ userId: subscriber, subscriptionId: subscription.id, billingPeriodId: period.id, providerPaymentId: "mp-dup-a", status: "APPROVED", grossAmount: "7.99", currencyCode: "USD", providerFee: null, netAmount: null, paidAt: new Date("2026-01-01T00:05:00Z") });
    const paymentB = await payments.upsertByProviderPaymentId({ userId: subscriber, subscriptionId: subscription.id, billingPeriodId: period.id, providerPaymentId: "mp-dup-b", status: "APPROVED", grossAmount: "7.99", currencyCode: "USD", providerFee: null, netAmount: null, paidAt: new Date("2026-01-01T00:06:00Z") });

    const detectDuplicatePayments = createDetectDuplicatePayments({ payments });
    const cases = await detectDuplicatePayments();

    expect(cases).toContainEqual(expect.objectContaining({ subscriptionId: subscription.id, billingPeriodId: period.id, paymentIds: expect.arrayContaining([paymentA!.id, paymentB!.id]) }));
  });

  it("records a chargeback dispute and is idempotent under redelivery, without touching billing history", async () => {
    const { database, subscription, period } = await seed();
    const payments = createBillingPaymentRepository(database);
    const disputes = createBillingDisputeRepository(database);
    const payment = await payments.upsertByProviderPaymentId({ userId: subscriber, subscriptionId: subscription.id, billingPeriodId: period.id, providerPaymentId: "mp-pay-dispute", status: "APPROVED", grossAmount: "7.99", currencyCode: "USD", providerFee: null, netAmount: null, paidAt: new Date("2026-01-01T00:05:00Z") });

    const recordDisputeEvent = createRecordDisputeEvent({ payments, disputes });
    const opened = await recordDisputeEvent({ providerPaymentId: "mp-pay-dispute", providerDisputeId: "mp-dispute-1", type: "CHARGEBACK", status: "OPEN", amount: "7.99", currencyCode: "USD", openedAt: new Date("2026-01-15T00:00:00Z") });
    expect(opened.created).toBe(true);

    const redelivered = await recordDisputeEvent({ providerPaymentId: "mp-pay-dispute", providerDisputeId: "mp-dispute-1", type: "CHARGEBACK", status: "OPEN", amount: "7.99", currencyCode: "USD", openedAt: new Date("2026-01-15T00:00:00Z") });
    expect(redelivered.created).toBe(false);
    expect(redelivered.dispute.id).toBe(opened.dispute.id);

    const resolved = await recordDisputeEvent({ providerPaymentId: "mp-pay-dispute", providerDisputeId: "mp-dispute-1", type: "CHARGEBACK", status: "LOST", amount: "7.99", currencyCode: "USD", openedAt: new Date("2026-01-15T00:00:00Z") });
    expect(resolved.dispute.status).toBe("LOST");
    expect(resolved.dispute.resolvedAt).not.toBeNull();

    const storedPayment = await payments.findById(payment!.id);
    expect(storedPayment).toMatchObject({ id: payment!.id, status: "APPROVED" });

    const disputesForPayment = await disputes.listForPayment(payment!.id);
    expect(disputesForPayment).toHaveLength(1);
  });
});
