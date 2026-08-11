import { createHmac } from "node:crypto";
import { eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import {
  buildMercadoPagoSignatureManifest,
  buildProMonthlyPlanSeed,
  createHandlePaymentFailure,
  createMercadoPagoWebhookProcessor,
  createSubscriptionSynchronizer,
  parseWebhookNotification,
  type BillingProvider,
} from "@know-finanzas/billing";
import { createBillingPaymentRepository } from "../../packages/db/src/repositories/billing-payments";
import { createBillingPeriodRepository } from "../../packages/db/src/repositories/billing-periods";
import { createBillingPlanRepository } from "../../packages/db/src/repositories/billing-plans";
import { createBillingSubscriptionRepository } from "../../packages/db/src/repositories/billing-subscriptions";
import { createBillingWebhookEventRepository } from "../../packages/db/src/repositories/billing-webhook-events";
import { billingSubscriptions, users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

const userA = "00000000-0000-0000-0000-000000000001";
const secret = "test-webhook-secret";
const requestId = "req-1";
const ts = "1700000000000";
const periodStart = new Date("2026-01-01T00:00:00Z");
const periodEnd = new Date("2026-02-01T00:00:00Z");

function sign(dataId: string) {
  const manifest = buildMercadoPagoSignatureManifest({ dataId, requestId, ts });
  return createHmac("sha256", secret).update(manifest).digest("hex");
}

function signatureFor(dataId: string) {
  return { xSignatureHeader: `ts=${ts},v1=${sign(dataId)}`, xRequestIdHeader: requestId };
}

async function seedUserPlanAndPendingSubscription() {
  const database = getTestDatabase().db;
  await database.insert(users).values({ id: userA, name: "User A", email: "webhook@example.test", timezone: "UTC", baseCurrency: "ARS" });
  const plan = await createBillingPlanRepository(database).upsertByCode(buildProMonthlyPlanSeed({ price: "7.99", currencyCode: "USD" }));
  const subscription = await createBillingSubscriptionRepository(database).create({
    userId: userA, planId: plan.id, provider: "MERCADO_PAGO", providerSubscriptionId: "mp-sub-1", status: "PENDING", currentPeriodStart: null, currentPeriodEnd: null,
  });
  return { plan, subscription };
}

function stubProvider(subscriptionSnapshot: Awaited<ReturnType<BillingProvider["getSubscription"]>>): BillingProvider {
  return {
    createSubscription: vi.fn(),
    getSubscription: vi.fn().mockResolvedValue(subscriptionSnapshot),
    getPayment: vi.fn(),
  } as unknown as BillingProvider;
}

function stubPaymentProvider(paymentSnapshot: Awaited<ReturnType<BillingProvider["getPayment"]>>): BillingProvider {
  return {
    createSubscription: vi.fn(),
    getSubscription: vi.fn(),
    getPayment: vi.fn().mockResolvedValue(paymentSnapshot),
  } as unknown as BillingProvider;
}

function buildProcessor(database: ReturnType<typeof getTestDatabase>["db"], provider: BillingProvider, ports: { grantProPeriodCredits?: ReturnType<typeof vi.fn>; startProWhatsAppAllowance?: ReturnType<typeof vi.fn> } = {}) {
  return createMercadoPagoWebhookProcessor({
    events: createBillingWebhookEventRepository(database),
    provider,
    synchronizer: createSubscriptionSynchronizer({
      subscriptions: createBillingSubscriptionRepository(database),
      periods: createBillingPeriodRepository(database),
      payments: createBillingPaymentRepository(database),
      grantProPeriodCredits: ports.grantProPeriodCredits,
      startProWhatsAppAllowance: ports.startProWhatsAppAllowance,
    }),
    handlePaymentFailure: createHandlePaymentFailure({ subscriptions: createBillingSubscriptionRepository(database) }),
    webhookSecret: secret,
  });
}

describe("Mercado Pago webhook processing (real repositories)", () => {
  it("leaves all billing state unchanged when the signature is invalid", async () => {
    await seedUserPlanAndPendingSubscription();
    const database = getTestDatabase().db;
    const provider = stubProvider({ providerSubscriptionId: "mp-sub-1", externalReference: null, status: "ACTIVE", currentPeriodStart: periodStart, currentPeriodEnd: periodEnd });
    const processor = buildProcessor(database, provider);

    const notification = parseWebhookNotification({ searchParams: new URLSearchParams(), body: { id: 1, type: "subscription_preapproval", data: { id: "mp-sub-1" } } })!;
    const result = await processor.process({ notification, rawBody: "{}", xSignatureHeader: "ts=1,v1=deadbeef", xRequestIdHeader: requestId });

    expect(result).toEqual({ outcome: "invalid_signature" });
    const [row] = await database.select().from(billingSubscriptions).where(eq(billingSubscriptions.providerSubscriptionId, "mp-sub-1"));
    expect(row.status).toBe("PENDING");
  });

  it("activates the subscription, upserts the billing period once, and grants period credits exactly once", async () => {
    await seedUserPlanAndPendingSubscription();
    const database = getTestDatabase().db;
    const provider = stubProvider({ providerSubscriptionId: "mp-sub-1", externalReference: null, status: "ACTIVE", currentPeriodStart: periodStart, currentPeriodEnd: periodEnd });
    const grantProPeriodCredits = vi.fn().mockResolvedValue(undefined);
    const startProWhatsAppAllowance = vi.fn().mockResolvedValue(undefined);
    const processor = buildProcessor(database, provider, { grantProPeriodCredits, startProWhatsAppAllowance });

    const notification = parseWebhookNotification({ searchParams: new URLSearchParams(), body: { id: 1, type: "subscription_preapproval", data: { id: "mp-sub-1" } } })!;
    const result = await processor.process({ notification, rawBody: "{}", ...signatureFor("mp-sub-1") });

    expect(result).toEqual({ outcome: "processed" });
    const periods = await createBillingPeriodRepository(database).listForSubscription((await createBillingSubscriptionRepository(database).findByProviderSubscriptionId("mp-sub-1"))!.id);
    expect(periods).toHaveLength(1);
    expect(grantProPeriodCredits).toHaveBeenCalledTimes(1);
    expect(startProWhatsAppAllowance).toHaveBeenCalledTimes(1);
  });

  it("does not duplicate the period or the grant when the same webhook notification id is redelivered", async () => {
    await seedUserPlanAndPendingSubscription();
    const database = getTestDatabase().db;
    const provider = stubProvider({ providerSubscriptionId: "mp-sub-1", externalReference: null, status: "ACTIVE", currentPeriodStart: periodStart, currentPeriodEnd: periodEnd });
    const grantProPeriodCredits = vi.fn().mockResolvedValue(undefined);
    const processor = buildProcessor(database, provider, { grantProPeriodCredits });

    const notification = parseWebhookNotification({ searchParams: new URLSearchParams(), body: { id: "same-event", type: "subscription_preapproval", data: { id: "mp-sub-1" } } })!;
    const first = await processor.process({ notification, rawBody: "{}", ...signatureFor("mp-sub-1") });
    const second = await processor.process({ notification, rawBody: "{}", ...signatureFor("mp-sub-1") });

    expect(first.outcome).toBe("processed");
    expect(second.outcome).toBe("duplicate");
    expect(grantProPeriodCredits).toHaveBeenCalledTimes(1);
  });

  it("does not duplicate the grant when two distinct notifications confirm the same renewal period", async () => {
    await seedUserPlanAndPendingSubscription();
    const database = getTestDatabase().db;
    const provider = stubProvider({ providerSubscriptionId: "mp-sub-1", externalReference: null, status: "ACTIVE", currentPeriodStart: periodStart, currentPeriodEnd: periodEnd });
    const grantProPeriodCredits = vi.fn().mockResolvedValue(undefined);
    const processor = buildProcessor(database, provider, { grantProPeriodCredits });

    const first = parseWebhookNotification({ searchParams: new URLSearchParams(), body: { id: "evt-1", type: "subscription_preapproval", data: { id: "mp-sub-1" } } })!;
    const second = parseWebhookNotification({ searchParams: new URLSearchParams(), body: { id: "evt-2", type: "subscription_preapproval", data: { id: "mp-sub-1" } } })!;

    await processor.process({ notification: first, rawBody: "{}", ...signatureFor("mp-sub-1") });
    await processor.process({ notification: second, rawBody: "{}", ...signatureFor("mp-sub-1") });

    const periods = await createBillingPeriodRepository(database).listForSubscription((await createBillingSubscriptionRepository(database).findByProviderSubscriptionId("mp-sub-1"))!.id);
    expect(periods).toHaveLength(1);
    expect(grantProPeriodCredits).toHaveBeenCalledTimes(1);
  });

  it("moves an ACTIVE subscription to PAST_DUE when a renewal payment is rejected", async () => {
    const { subscription } = await seedUserPlanAndPendingSubscription();
    const database = getTestDatabase().db;
    const subscriptions = createBillingSubscriptionRepository(database);
    await subscriptions.attachProviderReference(subscription.id, { providerSubscriptionId: "mp-sub-1", status: "ACTIVE" });

    const provider = stubPaymentProvider({ providerPaymentId: "mp-pay-1", externalReference: subscription.id, status: "REJECTED", grossAmount: "7.99", currencyCode: "USD", providerFee: null, netAmount: null, paidAt: null });
    const processor = buildProcessor(database, provider);

    const notification = parseWebhookNotification({ searchParams: new URLSearchParams(), body: { id: 1, type: "payment", data: { id: "mp-pay-1" } } })!;
    const result = await processor.process({ notification, rawBody: "{}", ...signatureFor("mp-pay-1") });

    expect(result).toEqual({ outcome: "processed" });
    await expect(subscriptions.findById(subscription.id)).resolves.toMatchObject({ status: "PAST_DUE" });
  });

  it("does not move a subscription to PAST_DUE when a renewal payment is approved", async () => {
    const { subscription } = await seedUserPlanAndPendingSubscription();
    const database = getTestDatabase().db;
    const subscriptions = createBillingSubscriptionRepository(database);
    await subscriptions.attachProviderReference(subscription.id, { providerSubscriptionId: "mp-sub-1", status: "ACTIVE" });

    const provider = stubPaymentProvider({ providerPaymentId: "mp-pay-2", externalReference: subscription.id, status: "APPROVED", grossAmount: "7.99", currencyCode: "USD", providerFee: null, netAmount: null, paidAt: new Date("2026-01-01T00:00:00Z") });
    const processor = buildProcessor(database, provider);

    const notification = parseWebhookNotification({ searchParams: new URLSearchParams(), body: { id: 1, type: "payment", data: { id: "mp-pay-2" } } })!;
    const result = await processor.process({ notification, rawBody: "{}", ...signatureFor("mp-pay-2") });

    expect(result).toEqual({ outcome: "processed" });
    await expect(subscriptions.findById(subscription.id)).resolves.toMatchObject({ status: "ACTIVE" });
  });
});
