import { verifyTwilioWebhookSignature } from "../providers/whatsapp/twilio/verify-webhook-signature";

export type TwilioWebhookDeliveryRepository = {
  findByProviderMessageId(providerMessageId: string): Promise<{ id: string; status: string } | undefined>;
  updateStatus(id: string, input: { status: "DELIVERED" | "FAILED"; lastErrorCode?: string | null; deliveredAt?: Date | null; failedAt?: Date | null }): Promise<unknown>;
};

export type ProcessTwilioWebhookResult = "invalid_signature" | "unrecognized_status" | "delivery_not_found" | "processed";

// All effects are naturally idempotent (re-setting the same delivery status), so — like the
// Resend webhook — this needs no separate event ledger to stay safe under Twilio retries.
export function createProcessTwilioWebhook(dependencies: {
  deliveries: TwilioWebhookDeliveryRepository;
  authToken: string;
  now?: () => Date;
}) {
  const now = dependencies.now ?? (() => new Date());

  return async function processTwilioWebhook(input: { url: string; params: Record<string, string>; signatureHeader: string | null }): Promise<ProcessTwilioWebhookResult> {
    const valid = verifyTwilioWebhookSignature({ url: input.url, params: input.params, signatureHeader: input.signatureHeader, authToken: dependencies.authToken });
    if (!valid) return "invalid_signature";

    const messageSid = input.params.MessageSid;
    const status = input.params.MessageStatus;
    if (!messageSid || !status) return "unrecognized_status";

    const delivery = await dependencies.deliveries.findByProviderMessageId(messageSid);
    if (!delivery) return "delivery_not_found";

    switch (status) {
      case "delivered":
        await dependencies.deliveries.updateStatus(delivery.id, { status: "DELIVERED", deliveredAt: now() });
        return "processed";

      case "undelivered":
      case "failed":
        await dependencies.deliveries.updateStatus(delivery.id, { status: "FAILED", lastErrorCode: input.params.ErrorCode ?? "WHATSAPP_PROVIDER_ERROR", failedAt: now() });
        return "processed";

      // queued/sending/sent are already reflected locally when the message was first sent —
      // nothing to update.
      default:
        return "unrecognized_status";
    }
  };
}
