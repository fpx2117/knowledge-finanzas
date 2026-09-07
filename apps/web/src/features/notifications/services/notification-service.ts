import type { NotificationCategory, NotificationPriority, NotificationSubjectType, NotificationType } from "@know-finanzas/notifications";
import { NotificationError } from "@know-finanzas/notifications";

import { notificationCopy } from "../lib/notification-copy";
import { notificationRank } from "../lib/notification-priority";
import { resolveRelatedRoute } from "../lib/resolve-related-route";

type NotificationRow = {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  subjectType: NotificationSubjectType;
  subjectId: string | null;
  metadata: unknown;
  readAt: Date | null;
  createdAt: Date;
};

export type NotificationRepository = {
  listForUser(userId: string, options?: { limit?: number }): Promise<NotificationRow[]>;
  countUnreadForUser(userId: string): Promise<number>;
  findByIdForUser(id: string, userId: string): Promise<{ id: string } | undefined>;
  markReadForUser(id: string, userId: string, readAt: Date): Promise<{ id: string } | undefined>;
  markAllReadForUser(userId: string, readAt: Date): Promise<unknown[]>;
};

export type InboxItem = {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  href: string | null;
  read: boolean;
  createdAt: string;
};

export type Inbox = { items: InboxItem[]; unreadCount: number };

export function createNotificationService(deps: { notifications: NotificationRepository; now?: () => Date }) {
  const now = deps.now ?? (() => new Date());

  return {
    // spec 13 §17 — the notification center. Ordered by §17.4 priority, then most recent first.
    async getInbox(userId: string): Promise<Inbox> {
      const [rows, unreadCount] = await Promise.all([
        deps.notifications.listForUser(userId, { limit: 100 }),
        deps.notifications.countUnreadForUser(userId),
      ]);

      const items = rows
        .map((row): InboxItem & { _rank: number } => {
          const metadata = (row.metadata ?? null) as Record<string, unknown> | null;
          const copy = notificationCopy(row.type, metadata);
          return {
            id: row.id,
            title: copy.title,
            body: copy.body,
            category: row.category,
            priority: row.priority,
            href: resolveRelatedRoute(row.subjectType, row.subjectId),
            read: row.readAt !== null,
            createdAt: row.createdAt.toISOString(),
            _rank: notificationRank({ type: row.type, category: row.category, priority: row.priority }),
          };
        })
        .sort((a, b) => a._rank - b._rank || b.createdAt.localeCompare(a.createdAt))
        .map((item): InboxItem => ({
          id: item.id,
          title: item.title,
          body: item.body,
          category: item.category,
          priority: item.priority,
          href: item.href,
          read: item.read,
          createdAt: item.createdAt,
        }));

      return { items, unreadCount };
    },

    // §17.6 — marking read never touches the underlying domain event.
    async markRead(userId: string, notificationId: string): Promise<void> {
      const existing = await deps.notifications.findByIdForUser(notificationId, userId);
      if (!existing) throw new NotificationError("NOTIFICATION_NOT_FOUND");
      await deps.notifications.markReadForUser(notificationId, userId, now());
    },

    // §17.8
    async markAllRead(userId: string): Promise<{ count: number }> {
      const updated = await deps.notifications.markAllReadForUser(userId, now());
      return { count: updated.length };
    },
  };
}
