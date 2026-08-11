import { isNotificationError } from "../errors";
import { isRetryableWhatsAppError } from "../providers/whatsapp/retry-policy";
import type { WhatsAppProvider } from "../providers/whatsapp/provider";
import { resolveWhatsAppTemplate, type WhatsAppTemplateConfig } from "../templates/whatsapp/registry";
import type { NotificationType } from "../domain/types";
import { NotificationError } from "../errors";

export type SendWhatsAppDeliveryRepository = {
  updateStatus(id: string, input: {
    status: "SENT" | "FAILED";
    provider?: string | null;
    providerMessageId?: string | null;
    lastErrorCode?: string | null;
    sentAt?: Date | null;
    failedAt?: Date | null;
    incrementAttempt?: boolean;
  }): Promise<unknown>;
};

export type SendWhatsAppDeliveryResult = { sent: true } | { sent: false; retryable: boolean; errorCode: string };

// Synchronous, no queue — same narrowed scope as TASK-049/050 (no worker infra exists yet).
export function createSendWhatsAppDelivery(dependencies: { provider: WhatsAppProvider; deliveries: SendWhatsAppDeliveryRepository; templateConfig: WhatsAppTemplateConfig; now?: () => Date }) {
  const now = dependencies.now ?? (() => new Date());

  return async function sendWhatsAppDelivery(input: { deliveryId: string; to: string; type: NotificationType; metadata: unknown }): Promise<SendWhatsAppDeliveryResult> {
    const resolved = resolveWhatsAppTemplate({ type: input.type, metadata: input.metadata as Record<string, unknown> | null, config: dependencies.templateConfig });

    try {
      if (!resolved) throw new NotificationError("WHATSAPP_TEMPLATE_NOT_CONFIGURED");
      const result = await dependencies.provider.sendTemplateMessage({ to: input.to, contentSid: resolved.contentSid, variables: resolved.variables });
      await dependencies.deliveries.updateStatus(input.deliveryId, { status: "SENT", provider: "TWILIO", providerMessageId: result.providerMessageId, sentAt: now(), incrementAttempt: true });
      return { sent: true };
    } catch (error) {
      const errorCode = isNotificationError(error) ? error.code : "WHATSAPP_PROVIDER_ERROR";
      await dependencies.deliveries.updateStatus(input.deliveryId, { status: "FAILED", lastErrorCode: errorCode, failedAt: now(), incrementAttempt: true });
      return { sent: false, retryable: isRetryableWhatsAppError(error), errorCode };
    }
  };
}
