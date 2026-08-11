import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";

import type { Database } from "../client";
import { notificationDeliveries, notifications, type NotificationDelivery } from "../schema";

export function createNotificationDeliveryRepository(database: Database) {
  return {
    create(input: { notificationId: string; channel: NotificationDelivery["channel"] }) {
      return database.insert(notificationDeliveries).values(input).returning().then(([row]) => row);
    },

    listForNotification(notificationId: string) {
      return database.select().from(notificationDeliveries).where(eq(notificationDeliveries.notificationId, notificationId));
    },

    findById(id: string) {
      return database.select().from(notificationDeliveries).where(eq(notificationDeliveries.id, id)).limit(1).then(([row]) => row);
    },

    // Unscoped by design: webhook processing has no user session, only the provider's own
    // message id (set when the delivery was sent).
    findByProviderMessageId(providerMessageId: string) {
      return database.select().from(notificationDeliveries)
        .where(eq(notificationDeliveries.providerMessageId, providerMessageId))
        .limit(1)
        .then(([row]) => row);
    },

    // Usage counter for the WhatsApp trial/period allowance (TASK-051): counts messages that
    // actually reached the provider successfully, not attempts — a failed send should never
    // consume a user's limited WhatsApp budget.
    async countSentWhatsAppSince(userId: string, since: Date): Promise<number> {
      const [row] = await database.select({ count: sql<number>`count(*)::int` })
        .from(notificationDeliveries)
        .innerJoin(notifications, eq(notifications.id, notificationDeliveries.notificationId))
        .where(and(
          eq(notifications.userId, userId),
          eq(notificationDeliveries.channel, "WHATSAPP"),
          inArray(notificationDeliveries.status, ["SENT", "DELIVERED"]),
          gte(notificationDeliveries.sentAt, since),
        ));
      return row?.count ?? 0;
    },

    // Admin delivery-history view (TASK-060): joined to notifications so callers get channel +
    // failure code without a second round trip. Unscoped by userId parameter here since the
    // caller (admin summary) already knows which user it's viewing.
    listForUser(userId: string, limit: number) {
      return database.select({
        id: notificationDeliveries.id,
        notificationId: notificationDeliveries.notificationId,
        channel: notificationDeliveries.channel,
        status: notificationDeliveries.status,
        provider: notificationDeliveries.provider,
        lastErrorCode: notificationDeliveries.lastErrorCode,
        attemptCount: notificationDeliveries.attemptCount,
        sentAt: notificationDeliveries.sentAt,
        deliveredAt: notificationDeliveries.deliveredAt,
        failedAt: notificationDeliveries.failedAt,
        createdAt: notificationDeliveries.createdAt,
        notificationType: notifications.type,
      })
        .from(notificationDeliveries)
        .innerJoin(notifications, eq(notifications.id, notificationDeliveries.notificationId))
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notificationDeliveries.createdAt))
        .limit(limit);
    },

    updateStatus(id: string, input: {
      status: NotificationDelivery["status"];
      provider?: string | null;
      providerMessageId?: string | null;
      lastErrorCode?: string | null;
      queuedAt?: Date | null;
      sentAt?: Date | null;
      deliveredAt?: Date | null;
      failedAt?: Date | null;
      incrementAttempt?: boolean;
    }) {
      const { incrementAttempt, ...fields } = input;
      return database.update(notificationDeliveries)
        .set({ ...fields, attemptCount: incrementAttempt ? sql`${notificationDeliveries.attemptCount} + 1` : undefined, updatedAt: new Date() })
        .where(eq(notificationDeliveries.id, id))
        .returning()
        .then(([row]) => row);
    },
  };
}
