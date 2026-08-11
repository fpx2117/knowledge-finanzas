import { NotificationError } from "../errors";

export type ArchiveNotificationRepository = {
  findByIdForUser(id: string, userId: string): Promise<{ id: string } | undefined>;
  archiveForUser(id: string, userId: string, dismissedAt: Date): Promise<{ id: string } | undefined>;
};

export function createArchiveNotification(dependencies: { notifications: ArchiveNotificationRepository; now?: () => Date }) {
  const now = dependencies.now ?? (() => new Date());

  return async function archiveNotification(input: { userId: string; notificationId: string }) {
    const notification = await dependencies.notifications.findByIdForUser(input.notificationId, input.userId);
    if (!notification) throw new NotificationError("NOTIFICATION_NOT_FOUND");

    const updated = await dependencies.notifications.archiveForUser(input.notificationId, input.userId, now());
    if (!updated) throw new NotificationError("NOTIFICATION_NOT_FOUND");
    return updated;
  };
}
