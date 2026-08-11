import { isNotificationError, type NotificationErrorCode } from "../../errors";

// NOTIFICATION_INVALID_RECIPIENT means the provider rejected the recipient outright (malformed
// address, unverified domain in sandbox mode) — retrying the exact same request will never
// succeed. Every other provider error (timeouts, 5xx, network failures) is presumed transient.
const NON_RETRYABLE_CODES: ReadonlySet<NotificationErrorCode> = new Set(["NOTIFICATION_INVALID_RECIPIENT"]);

export function isRetryableEmailError(error: unknown): boolean {
  if (!isNotificationError(error)) return true;
  return !NON_RETRYABLE_CODES.has(error.code);
}
