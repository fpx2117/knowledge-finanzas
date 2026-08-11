export type {
  NotificationCategory,
  NotificationType,
  NotificationPriority,
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationSubjectType,
  NotificationIntent,
  NotificationRuleEngine,
} from "./domain/types";

export { isWithinQuietHours, nextLocalTimeAtOrAfter } from "./domain/quiet-hours";
export {
  resolveChannelEligibility,
  resolveScheduledFor,
  type PreferenceRow,
  type ChannelEligibilityInput,
  type ChannelEligibilityResult,
} from "./domain/resolve-channel-eligibility";

export { NotificationError, isNotificationError, notificationErrorCodes, type NotificationErrorCode } from "./errors";

export {
  createCreateNotification,
  type CreateNotificationRepository,
  type CreateNotificationDeliveryRepository,
  type CreateNotificationPreferenceRepository,
  type NotificationRecord,
  type DeliveryRecord,
} from "./application/create-notification";
export { createResolveNotificationPreferences, type ResolveNotificationPreferencesRepository } from "./application/resolve-notification-preferences";
export { createMarkNotificationRead, type MarkNotificationReadRepository } from "./application/mark-notification-read";
export { createMarkAllNotificationsRead, type MarkAllNotificationsReadRepository } from "./application/mark-all-notifications-read";
export { createArchiveNotification, type ArchiveNotificationRepository } from "./application/archive-notification";
export { createUpdateNotificationPreference, type UpdateNotificationPreferenceRepository } from "./application/update-notification-preference";
export { createSendEmailDelivery, type SendEmailDeliveryRepository, type SendEmailDeliveryResult } from "./application/send-email-delivery";
export { createSendWhatsAppDelivery, type SendWhatsAppDeliveryRepository, type SendWhatsAppDeliveryResult } from "./application/send-whatsapp-delivery";
export {
  createRetryDelivery,
  type RetryDeliveryRecord,
  type RetryDeliveryRepository,
  type RetryNotificationRecord,
  type SendEmailDeliveryFn,
  type SendWhatsAppDeliveryFn,
} from "./application/retry-delivery";
export { createWhatsappConsentService, type WhatsappConsentRepository } from "./application/whatsapp-consent";

export { isRuleEligibleForAccess } from "./rules/access-gate";
export { isWithinWhatsAppAllowance, type WhatsAppAllowanceState } from "./rules/whatsapp-allowance";
export { buildPromotionStartedIntent, evaluatePromotionExpiry, type PromotionGrantInput } from "./rules/promotion-expiry";
export { buildReferralSignupIntent, buildReferralRewardGrantedIntent } from "./rules/referral-events";

export type { EmailProvider, SendEmailRequest, SendEmailResult } from "./providers/email/provider";
export { createResendClient, type ResendClientConfig, type ResendSendEmailRequest, type ResendSendEmailResponse } from "./providers/email/resend/client";
export { createResendEmailProvider } from "./providers/email/resend/provider";
export { isRetryableEmailError } from "./providers/email/retry-policy";
export { renderEmailTemplate, EMAIL_TEMPLATE_VERSION, type EmailTemplateInput, type RenderedEmail } from "./templates/email/templates";
export { verifyResendWebhookSignature, type ResendWebhookSignatureInput } from "./providers/email/resend/verify-webhook-signature";
export {
  createProcessResendWebhook,
  type ProcessResendWebhookResult,
  type ResendWebhookDeliveryRepository,
  type ResendWebhookNotificationRepository,
  type ResendWebhookEvent,
  type SuppressEmailPreference,
} from "./webhooks/process-resend-webhook";

export type { WhatsAppProvider, SendWhatsAppTemplateRequest, SendWhatsAppTemplateResult } from "./providers/whatsapp/provider";
export { createTwilioClient, type TwilioClientConfig, type TwilioCreateMessageRequest, type TwilioCreateMessageResponse } from "./providers/whatsapp/twilio/client";
export { createTwilioWhatsAppProvider } from "./providers/whatsapp/twilio/provider";
export { isRetryableWhatsAppError } from "./providers/whatsapp/retry-policy";
export { resolveWhatsAppTemplate, WHATSAPP_V1_TYPES, type WhatsAppTemplateConfig, type WhatsAppTemplateVariables } from "./templates/whatsapp/registry";
export { verifyTwilioWebhookSignature, type TwilioWebhookSignatureInput } from "./providers/whatsapp/twilio/verify-webhook-signature";
export {
  createProcessTwilioWebhook,
  type ProcessTwilioWebhookResult,
  type TwilioWebhookDeliveryRepository,
} from "./webhooks/process-twilio-webhook";
