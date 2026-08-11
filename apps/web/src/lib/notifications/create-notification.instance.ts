import { createNotificationDeliveryRepository, createNotificationPreferenceRepository, createNotificationRepository, db } from "@know-finanzas/db";
import { createCreateNotification } from "@know-finanzas/notifications";

export const createNotification = createCreateNotification({
  notifications: createNotificationRepository(db),
  deliveries: createNotificationDeliveryRepository(db),
  preferences: createNotificationPreferenceRepository(db),
});
