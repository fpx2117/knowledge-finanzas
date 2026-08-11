import { and, desc, eq, isNull, sql } from "drizzle-orm";

import type { Database } from "../client";
import { notifications, type Notification } from "../schema";

export function createNotificationRepository(database: Database) {
  return {
    // Idempotent on (userId, dedupKey) when a dedup key is supplied — a repeated intent for the
    // same event/window returns the original row instead of creating a duplicate
    // (docs/09-notifications-alerts.md §73-75).
    async createIfNotDuplicate(input: {
      userId: string;
      type: Notification["type"];
      category: Notification["category"];
      priority?: Notification["priority"];
      titleKey: string;
      bodyKey: string;
      subjectType?: Notification["subjectType"];
      subjectId?: string | null;
      metadata?: unknown;
      dedupKey?: string | null;
      scheduledFor?: Date | null;
    }): Promise<{ notification: Notification; created: boolean }> {
      const [inserted] = await database.insert(notifications).values(input)
        .onConflictDoNothing({ target: [notifications.userId, notifications.dedupKey], where: sql`${notifications.dedupKey} is not null` })
        .returning();

      if (inserted) return { notification: inserted, created: true };

      const [existing] = await database.select().from(notifications)
        .where(and(eq(notifications.userId, input.userId), input.dedupKey ? eq(notifications.dedupKey, input.dedupKey) : isNull(notifications.dedupKey)))
        .limit(1);
      if (!existing) throw new Error("createIfNotDuplicate: insert conflicted but no existing row was found");
      return { notification: existing, created: false };
    },

    findByIdForUser(id: string, userId: string) {
      return database.select().from(notifications)
        .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
        .limit(1)
        .then(([row]) => row);
    },

    // Unscoped by design: webhook processing has no user session, only the notification id
    // reached via its delivery row's provider message id.
    findById(id: string) {
      return database.select().from(notifications)
        .where(eq(notifications.id, id))
        .limit(1)
        .then(([row]) => row);
    },

    listForUser(userId: string, options: { unreadOnly?: boolean; includeArchived?: boolean; limit?: number; offset?: number } = {}) {
      return database.select().from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          options.unreadOnly ? isNull(notifications.readAt) : undefined,
          options.includeArchived ? undefined : isNull(notifications.dismissedAt),
        ))
        .orderBy(desc(notifications.createdAt))
        .limit(options.limit ?? 50)
        .offset(options.offset ?? 0);
    },

    // Cheap poll target for the SSE stream and the sidebar badge — avoids fetching full rows.
    async countUnreadForUser(userId: string): Promise<number> {
      const [row] = await database.select({ count: sql<number>`count(*)::int` }).from(notifications)
        .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
      return row?.count ?? 0;
    },

    markReadForUser(id: string, userId: string, readAt: Date) {
      return database.update(notifications).set({ readAt, updatedAt: new Date() })
        .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
        .returning()
        .then(([row]) => row);
    },

    markAllReadForUser(userId: string, readAt: Date) {
      return database.update(notifications).set({ readAt, updatedAt: new Date() })
        .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
        .returning();
    },

    archiveForUser(id: string, userId: string, dismissedAt: Date) {
      return database.update(notifications).set({ dismissedAt, updatedAt: new Date() })
        .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
        .returning()
        .then(([row]) => row);
    },
  };
}
