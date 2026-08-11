import { isNotificationError, type NotificationErrorCode } from "../../errors";

const NON_RETRYABLE_CODES: ReadonlySet<NotificationErrorCode> = new Set(["NOTIFICATION_INVALID_RECIPIENT", "WHATSAPP_TEMPLATE_NOT_CONFIGURED"]);

export function isRetryableWhatsAppError(error: unknown): boolean {
  if (!isNotificationError(error)) return true;
  return !NON_RETRYABLE_CODES.has(error.code);
}
