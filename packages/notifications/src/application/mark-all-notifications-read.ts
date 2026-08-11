export type MarkAllNotificationsReadRepository = {
  markAllReadForUser(userId: string, readAt: Date): Promise<unknown[]>;
};

export function createMarkAllNotificationsRead(dependencies: { notifications: MarkAllNotificationsReadRepository; now?: () => Date }) {
  const now = dependencies.now ?? (() => new Date());

  return async function markAllNotificationsRead(input: { userId: string }) {
    const updated = await dependencies.notifications.markAllReadForUser(input.userId, now());
    return { count: updated.length };
  };
}
