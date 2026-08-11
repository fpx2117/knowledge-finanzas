import { isNotificationError } from "../errors";
import { isRetryableEmailError } from "../providers/email/retry-policy";
import type { EmailProvider } from "../providers/email/provider";
import { renderEmailTemplate } from "../templates/email/templates";
import type { NotificationType } from "../domain/types";

export type SendEmailDeliveryRepository = {
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

export type SendEmailDeliveryResult = { sent: true } | { sent: false; retryable: boolean; errorCode: string };

// Synchronous, no queue (TASK-049/050 narrowed scope — no worker infra exists yet): called right
// after createNotification creates a PENDING email delivery row. A failure here only ever
// updates that one delivery row; it never touches the notification or any financial record.
export function createSendEmailDelivery(dependencies: { provider: EmailProvider; deliveries: SendEmailDeliveryRepository; now?: () => Date }) {
  const now = dependencies.now ?? (() => new Date());

  return async function sendEmailDelivery(input: { deliveryId: string; to: string; type: NotificationType; metadata: unknown; actionUrl: string | null }): Promise<SendEmailDeliveryResult> {
    const rendered = renderEmailTemplate({ type: input.type, metadata: input.metadata as Record<string, unknown> | null, actionUrl: input.actionUrl });

    try {
      const result = await dependencies.provider.sendEmail({ to: input.to, subject: rendered.subject, html: rendered.html, text: rendered.text });
      await dependencies.deliveries.updateStatus(input.deliveryId, { status: "SENT", provider: "RESEND", providerMessageId: result.providerMessageId, sentAt: now(), incrementAttempt: true });
      return { sent: true };
    } catch (error) {
      const errorCode = isNotificationError(error) ? error.code : "NOTIFICATION_PROVIDER_ERROR";
      await dependencies.deliveries.updateStatus(input.deliveryId, { status: "FAILED", lastErrorCode: errorCode, failedAt: now(), incrementAttempt: true });
      return { sent: false, retryable: isRetryableEmailError(error), errorCode };
    }
  };
}
