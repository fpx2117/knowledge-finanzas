import { createHash } from "node:crypto";

import { isBillingError } from "../errors";
import type { BillingProvider } from "../providers/billing-provider";
import type { createHandlePaymentFailure } from "../subscriptions/handle-payment-failure";
import type { createSubscriptionSynchronizer } from "../subscriptions/synchronize-subscription";
import { verifyMercadoPagoSignature } from "./verify-signature";
import type { MercadoPagoWebhookNotification } from "./webhook-notification";

const SUBSCRIPTION_EVENT_TYPES = new Set(["subscription_preapproval", "preapproval"]);
const PAYMENT_EVENT_TYPES = new Set(["subscription_authorized_payment", "payment"]);

export type WebhookEventRepository = {
  recordReceived(input: { provider: "MERCADO_PAGO"; providerEventId: string | null; eventType: string; externalResourceId: string | null; payloadHash: string }): Promise<{ event: { id: string }; created: boolean }>;
  markProcessed(id: string): Promise<unknown>;
  markFailed(id: string, errorCode: string): Promise<unknown>;
  markIgnored(id: string): Promise<unknown>;
};

export type ProcessWebhookResult =
  | { outcome: "invalid_signature" }
  | { outcome: "unrecognized_notification" }
  | { outcome: "duplicate" }
  | { outcome: "ignored"; reason: string }
  | { outcome: "processed" }
  | { outcome: "failed"; errorCode: string; retryable: boolean };

export function createMercadoPagoWebhookProcessor(dependencies: {
  events: WebhookEventRepository;
  provider: Pick<BillingProvider, "getSubscription" | "getPayment">;
  synchronizer: ReturnType<typeof createSubscriptionSynchronizer>;
  handlePaymentFailure: ReturnType<typeof createHandlePaymentFailure>;
  webhookSecret: string;
}) {
  return {
    async process(input: {
      notification: MercadoPagoWebhookNotification;
      rawBody: string;
      xSignatureHeader: string | null;
      xRequestIdHeader: string | null;
    }): Promise<ProcessWebhookResult> {
      const signatureValid = verifyMercadoPagoSignature({
        xSignatureHeader: input.xSignatureHeader,
        xRequestIdHeader: input.xRequestIdHeader,
        dataId: input.notification.dataId,
        secret: dependencies.webhookSecret,
      });
      // Invalid webhook mutates nothing: bail out before any event row is written.
      if (!signatureValid) return { outcome: "invalid_signature" };

      const eventType = SUBSCRIPTION_EVENT_TYPES.has(input.notification.type)
        ? "subscription"
        : PAYMENT_EVENT_TYPES.has(input.notification.type)
          ? "payment"
          : null;

      const payloadHash = createHash("sha256").update(input.rawBody).digest("hex");
      const { event, created } = await dependencies.events.recordReceived({
        provider: "MERCADO_PAGO",
        providerEventId: input.notification.notificationId,
        eventType: input.notification.type,
        externalResourceId: input.notification.dataId,
        payloadHash,
      });

      // Same event repeated has the same final state: a previously recorded delivery is a no-op.
      if (!created) return { outcome: "duplicate" };

      if (!eventType) {
        await dependencies.events.markIgnored(event.id);
        return { outcome: "ignored", reason: "unrecognized_event_type" };
      }

      try {
        if (eventType === "subscription") {
          const snapshot = await dependencies.provider.getSubscription(input.notification.dataId);
          await dependencies.synchronizer.synchronizeSubscription(snapshot);
        } else {
          const snapshot = await dependencies.provider.getPayment(input.notification.dataId);
          const { subscriptionId } = await dependencies.synchronizer.synchronizePayment(snapshot);
          if (snapshot.status === "REJECTED") await dependencies.handlePaymentFailure(subscriptionId);
        }

        await dependencies.events.markProcessed(event.id);
        return { outcome: "processed" };
      } catch (error) {
        const errorCode = isBillingError(error) ? error.code : "BILLING_RECONCILIATION_FAILED";
        await dependencies.events.markFailed(event.id, errorCode);
        // Unknown-resource/validation failures will never succeed on retry; provider or
        // infrastructure errors might, so let the caller decide whether to ask for a retry.
        const retryable = errorCode === "BILLING_PROVIDER_ERROR";
        return { outcome: "failed", errorCode, retryable };
      }
    },
  };
}
