export const notificationErrorCodes = [
  "NOTIFICATION_NOT_FOUND",
  "NOTIFICATION_INVALID_SUBJECT",
  "NOTIFICATION_CHANNEL_DISABLED",
  "NOTIFICATION_PREFERENCE_DISABLED",
  "NOTIFICATION_CHANNEL_NOT_ENTITLED",
  "WHATSAPP_NOT_OPTED_IN",
  "WHATSAPP_INVALID_PHONE",
  "NOTIFICATION_PROVIDER_ERROR",
  "NOTIFICATION_INVALID_RECIPIENT",
  "NOTIFICATION_WEBHOOK_INVALID",
  "WHATSAPP_PROVIDER_ERROR",
  "WHATSAPP_LIMIT_REACHED",
  "WHATSAPP_TEMPLATE_NOT_CONFIGURED",
  "NOTIFICATION_DELIVERY_NOT_RETRYABLE",
] as const;

export type NotificationErrorCode = (typeof notificationErrorCodes)[number];

export class NotificationError extends Error {
  readonly code: NotificationErrorCode;
  readonly field?: string;

  constructor(code: NotificationErrorCode, options: { field?: string; cause?: unknown } = {}) {
    super(code);
    if (options.cause !== undefined) {
      Object.defineProperty(this, "cause", {
        configurable: true,
        value: options.cause,
      });
    }
    this.name = "NotificationError";
    this.code = code;
    this.field = options.field;
  }
}

export function isNotificationError(error: unknown): error is NotificationError {
  return error instanceof NotificationError;
}
