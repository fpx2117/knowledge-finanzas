import { createNotificationDeliveryRepository, createNotificationPreferenceRepository, createNotificationRepository, createUserRepository, db } from "@know-finanzas/db";
import { createRetryDelivery } from "@know-finanzas/notifications";
import { env } from "@know-finanzas/config";
import { resolveRelatedRoute } from "@/features/notifications/lib/resolve-related-route";
import { sendEmailDelivery } from "@/lib/notifications/resend-email-provider.instance";
import { sendWhatsAppDelivery } from "@/lib/notifications/twilio-whatsapp-provider.instance";

const users = createUserRepository(db);
const preferences = createNotificationPreferenceRepository(db);
const deliveries = createNotificationDeliveryRepository(db);
const notifications = createNotificationRepository(db);

export const retryDelivery = createRetryDelivery({
  repository: { findDeliveryById: deliveries.findById, findNotificationById: notifications.findById },
  resolveEmailRecipient: (userId) => users.findEmailById(userId),
  resolveWhatsAppRecipient: async (userId) => {
    const consent = await preferences.findWhatsappConsentForUser(userId);
    return consent?.optInAt && !consent.optOutAt ? consent.phoneNumber : null;
  },
  resolveActionUrl: (notification) => {
    const route = resolveRelatedRoute(notification.subjectType, notification.subjectId);
    return route ? `${env.BETTER_AUTH_URL}${route}` : null;
  },
  sendEmailDelivery: sendEmailDelivery ?? undefined,
  sendWhatsAppDelivery: sendWhatsAppDelivery ?? undefined,
});
