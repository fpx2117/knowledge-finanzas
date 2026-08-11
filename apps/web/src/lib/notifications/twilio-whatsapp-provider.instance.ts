import { createSendWhatsAppDelivery, createTwilioWhatsAppProvider, type WhatsAppProvider, type WhatsAppTemplateConfig } from "@know-finanzas/notifications";
import { createNotificationDeliveryRepository, db } from "@know-finanzas/db";
import { env } from "@know-finanzas/config";

const templateConfig: WhatsAppTemplateConfig = {
  DEBT_DUE_SOON: env.TWILIO_TEMPLATE_DEBT_DUE_SOON_SID,
  DEBT_OVERDUE: env.TWILIO_TEMPLATE_DEBT_OVERDUE_SID,
  SCHEDULED_TRANSACTION_DUE: env.TWILIO_TEMPLATE_SCHEDULED_TRANSACTION_DUE_SID,
  CASHFLOW_NEGATIVE: env.TWILIO_TEMPLATE_CASHFLOW_NEGATIVE_SID,
  MONTHLY_FINANCIAL_SUMMARY: env.TWILIO_TEMPLATE_MONTHLY_FINANCIAL_SUMMARY_SID,
};

// WhatsApp stays fully optional: with WHATSAPP_NOTIFICATIONS_ENABLED=false (the default), this
// is null and every caller treats that as "skip sending, leave the delivery row PENDING" — same
// pattern as the Resend email provider.
const whatsAppProvider: WhatsAppProvider | null = env.WHATSAPP_NOTIFICATIONS_ENABLED && env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_WHATSAPP_FROM
  ? createTwilioWhatsAppProvider({ accountSid: env.TWILIO_ACCOUNT_SID, authToken: env.TWILIO_AUTH_TOKEN, fromNumber: env.TWILIO_WHATSAPP_FROM })
  : null;

export const sendWhatsAppDelivery = whatsAppProvider
  ? createSendWhatsAppDelivery({ provider: whatsAppProvider, deliveries: createNotificationDeliveryRepository(db), templateConfig })
  : null;
