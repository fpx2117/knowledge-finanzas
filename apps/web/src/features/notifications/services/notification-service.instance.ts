import { createNotificationRepository, db } from "@know-finanzas/db";

import { createNotificationService } from "./notification-service";

export const notificationService = createNotificationService({
  notifications: createNotificationRepository(db),
});
