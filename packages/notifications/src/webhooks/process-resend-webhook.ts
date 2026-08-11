import { verifyResendWebhookSignature } from "../providers/email/resend/verify-webhook-signature";

export type ResendWebhookDeliveryRepository = {
  findByProviderMessageId(providerMessageId: string): Promise<{ id: string; notificationId: string; status: string } | undefined>;
  updateStatus(id: string, input: { status: "DELIVERED" | "FAILED"; lastErrorCode?: string | null; deliveredAt?: Date | null; failedAt?: Date | null }): Promise<unknown>;
};

export type ResendWebhookNotificationRepository = {
  findById(id: string): Promise<{ id: string; userId: string } | undefined>;
};

export type SuppressEmailPreference = (userId: string) => Promise<unknown>;

export type ResendWebhookEvent = { type: string; data: { email_id: string } };

export type ProcessResendWebhookResult = "invalid_signature" | "unrecognized_event" | "delivery_not_found" | "processed";

// All effects here are naturally idempotent (re-setting a delivery's status, re-disabling an
// already-disabled preference), so — unlike the Mercado Pago webhook, which must dedupe against
// double-granting credits — this needs no separate webhook-event ledger to stay safe under
// Resend/Svix redelivery.
export function createProcessResendWebhook(dependencies: {
  deliveries: ResendWebhookDeliveryRepository;
  notifications: ResendWebhookNotificationRepository;
  suppressEmail: SuppressEmailPreference;
  webhookSecret: string;
  now?: () => Date;
}) {
  const now = dependencies.now ?? (() => new Date());

  return async function processResendWebhook(input: {
    event: ResendWebhookEvent;
    rawBody: string;
    svixId: string | null;
    svixTimestamp: string | null;
    svixSignature: string | null;
  }): Promise<ProcessResendWebhookResult> {
    const valid = verifyResendWebhookSignature({
      svixId: input.svixId,
      svixTimestamp: input.svixTimestamp,
      svixSignature: input.svixSignature,
      rawBody: input.rawBody,
      secret: dependencies.webhookSecret,
    });
    if (!valid) return "invalid_signature";

    const delivery = await dependencies.deliveries.findByProviderMessageId(input.event.data.email_id);
    if (!delivery) return "delivery_not_found";

    switch (input.event.type) {
      case "email.delivered":
        await dependencies.deliveries.updateStatus(delivery.id, { status: "DELIVERED", deliveredAt: now() });
        return "processed";

      case "email.bounced":
      case "email.complained": {
        await dependencies.deliveries.updateStatus(delivery.id, {
          status: "FAILED",
          lastErrorCode: input.event.type === "email.bounced" ? "NOTIFICATION_INVALID_RECIPIENT" : "NOTIFICATION_PROVIDER_ERROR",
          failedAt: now(),
        });
        // Hard bounce / spam complaint: permanently stop emailing this address rather than
        // retrying indefinitely (docs/09-notifications-alerts.md acceptance criterion) — reuses
        // the existing global EMAIL preference rather than a separate suppression list.
        const notification = await dependencies.notifications.findById(delivery.notificationId);
        if (notification) await dependencies.suppressEmail(notification.userId);
        return "processed";
      }

      default:
        return "unrecognized_event";
    }
  };
}
