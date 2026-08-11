import { and, eq, isNull } from "drizzle-orm";

import type { Database } from "../client";
import { notificationPreferences, notificationWhatsappConsent, type NotificationPreference, type NotificationWhatsappConsent } from "../schema";

export function createNotificationPreferenceRepository(database: Database) {
  return {
    listForUser(userId: string) {
      return database.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId));
    },

    // One row per (userId, channel) when notificationType is null (the global default for that
    // channel), or per (userId, notificationType, channel) otherwise — matches the two partial
    // unique indexes on the table, so this upsert always targets exactly the row the caller means.
    async upsertForUser(input: {
      userId: string;
      notificationType: NotificationPreference["notificationType"];
      channel: NotificationPreference["channel"];
      enabled: boolean;
      leadTimeMinutes?: number | null;
      quietHoursEnabled?: boolean;
      quietHoursStart?: string | null;
      quietHoursEnd?: string | null;
    }): Promise<NotificationPreference> {
      const existing = await database.select().from(notificationPreferences)
        .where(and(
          eq(notificationPreferences.userId, input.userId),
          eq(notificationPreferences.channel, input.channel),
          input.notificationType ? eq(notificationPreferences.notificationType, input.notificationType) : isNull(notificationPreferences.notificationType),
        ))
        .limit(1)
        .then(([row]) => row);

      const values = {
        enabled: input.enabled,
        leadTimeMinutes: input.leadTimeMinutes ?? null,
        quietHoursEnabled: input.quietHoursEnabled ?? false,
        quietHoursStart: input.quietHoursStart ?? null,
        quietHoursEnd: input.quietHoursEnd ?? null,
      };

      if (existing) {
        return database.update(notificationPreferences).set({ ...values, updatedAt: new Date() })
          .where(eq(notificationPreferences.id, existing.id))
          .returning()
          .then(([row]) => row);
      }

      return database.insert(notificationPreferences)
        .values({ userId: input.userId, notificationType: input.notificationType, channel: input.channel, ...values })
        .returning()
        .then(([row]) => row);
    },

    findWhatsappConsentForUser(userId: string): Promise<NotificationWhatsappConsent | undefined> {
      return database.select().from(notificationWhatsappConsent)
        .where(eq(notificationWhatsappConsent.userId, userId))
        .limit(1)
        .then(([row]) => row);
    },

    optInWhatsapp(userId: string, phoneNumber: string, optInAt: Date): Promise<NotificationWhatsappConsent> {
      return database.insert(notificationWhatsappConsent)
        .values({ userId, phoneNumber, optInAt, optOutAt: null })
        .onConflictDoUpdate({ target: notificationWhatsappConsent.userId, set: { phoneNumber, optInAt, optOutAt: null, updatedAt: new Date() } })
        .returning()
        .then(([row]) => row);
    },

    optOutWhatsapp(userId: string, optOutAt: Date): Promise<NotificationWhatsappConsent | undefined> {
      return database.update(notificationWhatsappConsent).set({ optOutAt, updatedAt: new Date() })
        .where(eq(notificationWhatsappConsent.userId, userId))
        .returning()
        .then(([row]) => row);
    },
  };
}
