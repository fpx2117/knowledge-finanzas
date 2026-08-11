import { describe, expect, it, vi } from "vitest";
import { createRetryWebhookEvent } from "@know-finanzas/billing";

function fakeEvents(event: { id: string; status: string; eventType: string; externalResourceId: string | null } | undefined) {
  return {
    findById: vi.fn(async () => event),
    markProcessed: vi.fn(async () => {}),
    markFailed: vi.fn(async () => {}),
  };
}

describe("createRetryWebhookEvent", () => {
  it("returns not_found for an unknown event id", async () => {
    const events = fakeEvents(undefined);
    const retry = createRetryWebhookEvent({ events, provider: {}, synchronizer: {}, handlePaymentFailure: vi.fn() });

    expect(await retry("missing")).toEqual({ outcome: "not_found" });
  });

  it("is a no-op on an already-PROCESSED event (idempotent — never re-applies)", async () => {
    const events = fakeEvents({ id: "e1", status: "PROCESSED", eventType: "subscription_preapproval", externalResourceId: "mp-1" });
    const provider = { getSubscription: vi.fn(), getPayment: vi.fn() };
    const synchronizer = { synchronizeSubscription: vi.fn(), synchronizePayment: vi.fn() };
    const retry = createRetryWebhookEvent({ events, provider, synchronizer, handlePaymentFailure: vi.fn() });

    const result = await retry("e1");

    expect(result).toEqual({ outcome: "not_failed" });
    expect(provider.getSubscription).not.toHaveBeenCalled();
    expect(events.markProcessed).not.toHaveBeenCalled();
  });

  it("replays a FAILED subscription event by re-pulling the provider snapshot and re-synchronizing", async () => {
    const events = fakeEvents({ id: "e1", status: "FAILED", eventType: "subscription_preapproval", externalResourceId: "mp-1" });
    const provider = { getSubscription: vi.fn(async () => ({ providerSubscriptionId: "mp-1", status: "ACTIVE" })), getPayment: vi.fn() };
    const synchronizer = { synchronizeSubscription: vi.fn(async () => ({})), synchronizePayment: vi.fn() };
    const retry = createRetryWebhookEvent({ events, provider, synchronizer, handlePaymentFailure: vi.fn() });

    const result = await retry("e1");

    expect(result).toEqual({ outcome: "processed" });
    expect(provider.getSubscription).toHaveBeenCalledWith("mp-1");
    expect(synchronizer.synchronizeSubscription).toHaveBeenCalledTimes(1);
    expect(events.markProcessed).toHaveBeenCalledWith("e1");
  });

  it("replays a FAILED payment event and calls handlePaymentFailure only when the payment was rejected", async () => {
    const events = fakeEvents({ id: "e1", status: "FAILED", eventType: "payment", externalResourceId: "mp-pay-1" });
    const provider = { getSubscription: vi.fn(), getPayment: vi.fn(async () => ({ status: "REJECTED" })) };
    const synchronizer = { synchronizeSubscription: vi.fn(), synchronizePayment: vi.fn(async () => ({ subscriptionId: "sub-1" })) };
    const handlePaymentFailure = vi.fn();
    const retry = createRetryWebhookEvent({ events, provider, synchronizer, handlePaymentFailure });

    const result = await retry("e1");

    expect(result).toEqual({ outcome: "processed" });
    expect(handlePaymentFailure).toHaveBeenCalledWith("sub-1");
  });

  it("marks the event FAILED again (never processed) when the replay itself errors", async () => {
    const events = fakeEvents({ id: "e1", status: "FAILED", eventType: "subscription_preapproval", externalResourceId: "mp-1" });
    const provider = { getSubscription: vi.fn(async () => { throw new Error("provider down"); }), getPayment: vi.fn() };
    const synchronizer = { synchronizeSubscription: vi.fn(), synchronizePayment: vi.fn() };
    const retry = createRetryWebhookEvent({ events, provider, synchronizer, handlePaymentFailure: vi.fn() });

    const result = await retry("e1");

    expect(result).toMatchObject({ outcome: "failed" });
    expect(events.markProcessed).not.toHaveBeenCalled();
    expect(events.markFailed).toHaveBeenCalled();
  });

  it("returns unrecognized_event_type for an event whose type isn't subscription or payment", async () => {
    const events = fakeEvents({ id: "e1", status: "FAILED", eventType: "some_other_type", externalResourceId: "x" });
    const retry = createRetryWebhookEvent({ events, provider: {}, synchronizer: {}, handlePaymentFailure: vi.fn() });

    expect(await retry("e1")).toEqual({ outcome: "unrecognized_event_type" });
  });
});
