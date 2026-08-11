import { NotificationError } from "../errors";

export type MarkNotificationReadRepository = {
  findByIdForUser(id: string, userId: string): Promise<{ id: string } | undefined>;
  markReadForUser(id: string, userId: string, readAt: Date): Promise<{ id: string } | undefined>;
};

export function createMarkNotificationRead(dependencies: { notifications: MarkNotificationReadRepository; now?: () => Date }) {
  const now = dependencies.now ?? (() => new Date());

  return async function markNotificationRead(input: { userId: string; notificationId: string }) {
    const notification = await dependencies.notifications.findByIdForUser(input.notificationId, input.userId);
    if (!notification) throw new NotificationError("NOTIFICATION_NOT_FOUND");

    const updated = await dependencies.notifications.markReadForUser(input.notificationId, input.userId, now());
    if (!updated) throw new NotificationError("NOTIFICATION_NOT_FOUND");
    return updated;
  };
}
