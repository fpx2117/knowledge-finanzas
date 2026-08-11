import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { buildMercadoPagoSignatureManifest, createMercadoPagoWebhookProcessor, type MercadoPagoWebhookNotification } from "@know-finanzas/billing";

const secret = "test-webhook-secret";
const requestId = "req-1";
const ts = "1700000000000";

function sign(dataId: string) {
  const manifest = buildMercadoPagoSignatureManifest({ dataId, requestId, ts });
  return createHmac("sha256", secret).update(manifest).digest("hex");
}

function signatureFor(dataId: string) {
  return { xSignatureHeader: `ts=${ts},v1=${sign(dataId)}`, xRequestIdHeader: requestId };
}

function fakeEvents() {
  const records: Array<{ id: string; providerEventId: string | null; payloadHash: string; status: string; errorCode?: string }> = [];
  let counter = 0;
  return {
    records,
    recordReceived: async (input: { providerEventId: string | null; payloadHash: string }) => {
      const existing = input.providerEventId
        ? records.find((item) => item.providerEventId === input.providerEventId)
        : records.find((item) => item.payloadHash === input.payloadHash);
      if (existing) return { event: existing, created: false };
      counter += 1;
      const record = { id: `event-${counter}`, providerEventId: input.providerEventId, payloadHash: input.payloadHash, status: "RECEIVED" };
      records.push(record);
      return { event: record, created: true };
    },
    markProcessed: async (id: string) => { const r = records.find((e) => e.id === id); if (r) r.status = "PROCESSED"; },
    markFailed: async (id: string, errorCode: string) => { const r = records.find((e) => e.id === id); if (r) { r.status = "FAILED"; r.errorCode = errorCode; } },
    markIgnored: async (id: string) => { const r = records.find((e) => e.id === id); if (r) r.status = "IGNORED"; },
  };
}

function notification(type: string, dataId: string, notificationId: string | null = "evt-1"): MercadoPagoWebhookNotification {
  return { type, dataId, notificationId };
}

describe("ProcessMercadoPagoWebhook", () => {
  it("mutates nothing when the signature is invalid", async () => {
    const events = fakeEvents();
    const synchronizeSubscription = vi.fn();
    const processor = createMercadoPagoWebhookProcessor({
      events,
      provider: { getSubscription: vi.fn(), getPayment: vi.fn() },
      synchronizer: { synchronizeSubscription, synchronizePayment: vi.fn() } as never,
      webhookSecret: secret,
    });

    const result = await processor.process({ notification: notification("subscription_preapproval", "sub-1"), rawBody: "{}", xSignatureHeader: "ts=1,v1=deadbeef", xRequestIdHeader: requestId });

    expect(result).toEqual({ outcome: "invalid_signature" });
    expect(events.records).toHaveLength(0);
    expect(synchronizeSubscription).not.toHaveBeenCalled();
  });

  it("processes a valid subscription notification by fetching fresh provider state", async () => {
    const events = fakeEvents();
    const getSubscription = vi.fn().mockResolvedValue({ providerSubscriptionId: "sub-1", externalReference: "local-1", status: "ACTIVE", currentPeriodStart: new Date(), currentPeriodEnd: new Date() });
    const synchronizeSubscription = vi.fn().mockResolvedValue({ subscription: {}, period: null, periodCreated: false });
    const processor = createMercadoPagoWebhookProcessor({
      events,
      provider: { getSubscription, getPayment: vi.fn() },
      synchronizer: { synchronizeSubscription, synchronizePayment: vi.fn() } as never,
      webhookSecret: secret,
    });

    const result = await processor.process({ notification: notification("subscription_preapproval", "sub-1"), rawBody: "{}", ...signatureFor("sub-1") });

    expect(result).toEqual({ outcome: "processed" });
    expect(getSubscription).toHaveBeenCalledWith("sub-1");
    expect(synchronizeSubscription).toHaveBeenCalledTimes(1);
    expect(events.records[0].status).toBe("PROCESSED");
  });

  it("is idempotent: the same event delivered twice only synchronizes once", async () => {
    const events = fakeEvents();
    const getSubscription = vi.fn().mockResolvedValue({ providerSubscriptionId: "sub-1", externalReference: "local-1", status: "ACTIVE", currentPeriodStart: new Date(), currentPeriodEnd: new Date() });
    const synchronizeSubscription = vi.fn().mockResolvedValue({ subscription: {}, period: null, periodCreated: false });
    const processor = createMercadoPagoWebhookProcessor({
      events,
      provider: { getSubscription, getPayment: vi.fn() },
      synchronizer: { synchronizeSubscription, synchronizePayment: vi.fn() } as never,
      webhookSecret: secret,
    });

    const first = await processor.process({ notification: notification("subscription_preapproval", "sub-1", "evt-dup"), rawBody: "{}", ...signatureFor("sub-1") });
    const second = await processor.process({ notification: notification("subscription_preapproval", "sub-1", "evt-dup"), rawBody: "{}", ...signatureFor("sub-1") });

    expect(first.outcome).toBe("processed");
    expect(second.outcome).toBe("duplicate");
    expect(synchronizeSubscription).toHaveBeenCalledTimes(1);
    expect(events.records).toHaveLength(1);
  });

  it("acknowledges but ignores an unrecognized event type", async () => {
    const events = fakeEvents();
    const processor = createMercadoPagoWebhookProcessor({
      events,
      provider: { getSubscription: vi.fn(), getPayment: vi.fn() },
      synchronizer: { synchronizeSubscription: vi.fn(), synchronizePayment: vi.fn() } as never,
      webhookSecret: secret,
    });

    const result = await processor.process({ notification: notification("merchant_order", "order-1"), rawBody: "{}", ...signatureFor("order-1") });

    expect(result).toEqual({ outcome: "ignored", reason: "unrecognized_event_type" });
    expect(events.records[0].status).toBe("IGNORED");
  });

  it("marks the event failed and retryable when the provider fetch itself fails", async () => {
    const events = fakeEvents();
    const { BillingError } = await import("@know-finanzas/billing");
    const getSubscription = vi.fn().mockRejectedValue(new BillingError("BILLING_PROVIDER_ERROR"));
    const processor = createMercadoPagoWebhookProcessor({
      events,
      provider: { getSubscription, getPayment: vi.fn() },
      synchronizer: { synchronizeSubscription: vi.fn(), synchronizePayment: vi.fn() } as never,
      webhookSecret: secret,
    });

    const result = await processor.process({ notification: notification("subscription_preapproval", "sub-1"), rawBody: "{}", ...signatureFor("sub-1") });

    expect(result).toEqual({ outcome: "failed", errorCode: "BILLING_PROVIDER_ERROR", retryable: true });
    expect(events.records[0].status).toBe("FAILED");
  });

  it("marks the event failed but non-retryable when the local subscription cannot be resolved", async () => {
    const events = fakeEvents();
    const { BillingError } = await import("@know-finanzas/billing");
    const synchronizeSubscription = vi.fn().mockRejectedValue(new BillingError("BILLING_SUBSCRIPTION_NOT_FOUND"));
    const processor = createMercadoPagoWebhookProcessor({
      events,
      provider: { getSubscription: vi.fn().mockResolvedValue({ providerSubscriptionId: "sub-1", externalReference: null, status: "ACTIVE", currentPeriodStart: null, currentPeriodEnd: null }), getPayment: vi.fn() },
      synchronizer: { synchronizeSubscription, synchronizePayment: vi.fn() } as never,
      webhookSecret: secret,
    });

    const result = await processor.process({ notification: notification("subscription_preapproval", "sub-1"), rawBody: "{}", ...signatureFor("sub-1") });

    expect(result).toEqual({ outcome: "failed", errorCode: "BILLING_SUBSCRIPTION_NOT_FOUND", retryable: false });
  });

  it("calls handlePaymentFailure when a payment notification resolves to a REJECTED payment", async () => {
    const events = fakeEvents();
    const synchronizePayment = vi.fn().mockResolvedValue({ payment: {}, subscriptionId: "sub-local-1" });
    const handlePaymentFailure = vi.fn().mockResolvedValue({ transitioned: true, subscription: null });
    const processor = createMercadoPagoWebhookProcessor({
      events,
      provider: { getSubscription: vi.fn(), getPayment: vi.fn().mockResolvedValue({ providerPaymentId: "pay-1", externalReference: "sub-local-1", status: "REJECTED", grossAmount: "7.99", currencyCode: "USD", providerFee: null, netAmount: null, paidAt: null }) },
      synchronizer: { synchronizeSubscription: vi.fn(), synchronizePayment } as never,
      handlePaymentFailure,
      webhookSecret: secret,
    });

    const result = await processor.process({ notification: notification("payment", "pay-1"), rawBody: "{}", ...signatureFor("pay-1") });

    expect(result).toEqual({ outcome: "processed" });
    expect(handlePaymentFailure).toHaveBeenCalledWith("sub-local-1");
  });

  it("does not call handlePaymentFailure when a payment notification resolves to an APPROVED payment", async () => {
    const events = fakeEvents();
    const synchronizePayment = vi.fn().mockResolvedValue({ payment: {}, subscriptionId: "sub-local-1" });
    const handlePaymentFailure = vi.fn();
    const processor = createMercadoPagoWebhookProcessor({
      events,
      provider: { getSubscription: vi.fn(), getPayment: vi.fn().mockResolvedValue({ providerPaymentId: "pay-2", externalReference: "sub-local-1", status: "APPROVED", grossAmount: "7.99", currencyCode: "USD", providerFee: null, netAmount: null, paidAt: new Date() }) },
      synchronizer: { synchronizeSubscription: vi.fn(), synchronizePayment } as never,
      handlePaymentFailure,
      webhookSecret: secret,
    });

    const result = await processor.process({ notification: notification("payment", "pay-2"), rawBody: "{}", ...signatureFor("pay-2") });

    expect(result).toEqual({ outcome: "processed" });
    expect(handlePaymentFailure).not.toHaveBeenCalled();
  });
});
