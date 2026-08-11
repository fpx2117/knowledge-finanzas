import { createNotificationPreferenceRepository, createNotificationRepository, db } from "@know-finanzas/db";
import { createArchiveNotification, createMarkAllNotificationsRead, createMarkNotificationRead, createResolveNotificationPreferences, createUpdateNotificationPreference, createWhatsappConsentService } from "@know-finanzas/notifications";

const notifications = createNotificationRepository(db);
const preferences = createNotificationPreferenceRepository(db);

export const markNotificationRead = createMarkNotificationRead({ notifications });
export const markAllNotificationsRead = createMarkAllNotificationsRead({ notifications });
export const archiveNotification = createArchiveNotification({ notifications });
export const resolveNotificationPreferences = createResolveNotificationPreferences({ preferences });
export const updateNotificationPreference = createUpdateNotificationPreference({ preferences });
export const whatsappConsentService = createWhatsappConsentService({ consent: preferences });
