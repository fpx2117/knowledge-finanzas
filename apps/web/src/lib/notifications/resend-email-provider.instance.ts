import { createResendEmailProvider, createSendEmailDelivery, type EmailProvider } from "@know-finanzas/notifications";
import { createNotificationDeliveryRepository, db } from "@know-finanzas/db";
import { env } from "@know-finanzas/config";

// Email stays fully optional: with EMAIL_NOTIFICATIONS_ENABLED=false (the default — no API key
// required), this is null and every caller treats that as "skip sending, leave the delivery row
// PENDING" rather than throwing. Core finance and every other notification channel are
// unaffected either way (docs/09-notifications-alerts.md domain rule).
const emailProvider: EmailProvider | null = env.EMAIL_NOTIFICATIONS_ENABLED && env.RESEND_API_KEY && env.RESEND_FROM_EMAIL
  ? createResendEmailProvider({ apiKey: env.RESEND_API_KEY, fromEmail: env.RESEND_FROM_EMAIL })
  : null;

export const sendEmailDelivery = emailProvider
  ? createSendEmailDelivery({ provider: emailProvider, deliveries: createNotificationDeliveryRepository(db) })
  : null;
