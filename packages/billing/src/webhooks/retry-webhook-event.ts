import { isBillingError } from "../errors";
import type { BillingProvider } from "../providers/billing-provider";
import type { createHandlePaymentFailure } from "../subscriptions/handle-payment-failure";
import type { createSubscriptionSynchronizer } from "../subscriptions/synchronize-subscription";

const SUBSCRIPTION_EVENT_TYPES = new Set(["subscription_preapproval", "preapproval"]);
const PAYMENT_EVENT_TYPES = new Set(["subscription_authorized_payment", "payment"]);

export type RetryWebhookEventRepository = {
  findById(id: string): Promise<{ id: string; status: string; eventType: string; externalResourceId: string | null } | undefined>;
  markProcessed(id: string): Promise<unknown>;
  markFailed(id: string, errorCode: string): Promise<unknown>;
};

export type RetryWebhookEventResult =
  | { outcome: "not_found" }
  | { outcome: "not_failed" }
  | { outcome: "unrecognized_event_type" }
  | { outcome: "processed" }
  | { outcome: "failed"; errorCode: string };

// SUPER_ADMIN-only replay of an already-recorded event (Security Requirement). Domain Rule:
// "reconciliation never lets the admin manually pick a target status" — this only ever re-pulls
// the provider's current snapshot and replays it through the same idempotent synchronizer the
// live webhook route uses, exactly as if the original delivery had succeeded. Idempotent twice
// over: (1) replaying an event that isn't currently FAILED is a no-op, so a double click can't
// re-apply anything, and (2) even a successful replay only ever upserts through the synchronizer,
// which never creates a second payment/period/grant for data it has already seen.
export function createRetryWebhookEvent(dependencies: {
  events: RetryWebhookEventRepository;
  provider: Pick<BillingProvider, "getSubscription" | "getPayment">;
  synchronizer: Pick<ReturnType<typeof createSubscriptionSynchronizer>, "synchronizeSubscription" | "synchronizePayment">;
  handlePaymentFailure: ReturnType<typeof createHandlePaymentFailure>;
}) {
  return async function retryWebhookEvent(eventId: string): Promise<RetryWebhookEventResult> {
    const event = await dependencies.events.findById(eventId);
    if (!event) return { outcome: "not_found" };
    if (event.status !== "FAILED") return { outcome: "not_failed" };
    if (!event.externalResourceId) return { outcome: "unrecognized_event_type" };

    const isSubscriptionEvent = SUBSCRIPTION_EVENT_TYPES.has(event.eventType);
    const isPaymentEvent = PAYMENT_EVENT_TYPES.has(event.eventType);
    if (!isSubscriptionEvent && !isPaymentEvent) return { outcome: "unrecognized_event_type" };

    try {
      if (isSubscriptionEvent) {
        const snapshot = await dependencies.provider.getSubscription(event.externalResourceId);
        await dependencies.synchronizer.synchronizeSubscription(snapshot);
      } else {
        const snapshot = await dependencies.provider.getPayment(event.externalResourceId);
        const { subscriptionId } = await dependencies.synchronizer.synchronizePayment(snapshot);
        if (snapshot.status === "REJECTED") await dependencies.handlePaymentFailure(subscriptionId);
      }
      await dependencies.events.markProcessed(eventId);
      return { outcome: "processed" };
    } catch (error) {
      const errorCode = isBillingError(error) ? error.code : "BILLING_RECONCILIATION_FAILED";
      await dependencies.events.markFailed(eventId, errorCode);
      return { outcome: "failed", errorCode };
    }
  };
}
