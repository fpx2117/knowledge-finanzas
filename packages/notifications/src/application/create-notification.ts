import { resolveScheduledFor, resolveChannelEligibility, type PreferenceRow } from "../domain/resolve-channel-eligibility";
import type { NotificationChannel, NotificationIntent } from "../domain/types";

const ALL_CHANNELS: NotificationChannel[] = ["IN_APP", "REALTIME", "EMAIL", "WHATSAPP"];

export type NotificationRecord = {
  id: string;
  userId: string;
  type: NotificationIntent["type"];
  category: NotificationIntent["category"];
  scheduledFor: Date | null;
};

export type DeliveryRecord = { id: string; notificationId: string; channel: NotificationChannel; status: string };

export type CreateNotificationRepository = {
  createIfNotDuplicate(input: {
    userId: string; type: NotificationIntent["type"]; category: NotificationIntent["category"]; priority?: NotificationIntent["priority"];
    titleKey: string; bodyKey: string; subjectType?: NotificationIntent["subjectType"]; subjectId?: string | null;
    metadata?: unknown; dedupKey?: string | null; scheduledFor?: Date | null;
  }): Promise<{ notification: NotificationRecord; created: boolean }>;
};

export type CreateNotificationDeliveryRepository = {
  create(input: { notificationId: string; channel: NotificationChannel }): Promise<DeliveryRecord>;
  updateStatus(id: string, input: { status: string; deliveredAt?: Date | null }): Promise<unknown>;
};

export type CreateNotificationPreferenceRepository = {
  listForUser(userId: string): Promise<PreferenceRow[]>;
  findWhatsappConsentForUser(userId: string): Promise<{ optInAt: Date | null; optOutAt: Date | null } | undefined>;
};

// Persists the notification (idempotent on dedupKey) and, only for a newly created one, plans
// which channels are eligible and creates their delivery rows — never sends anything (no
// provider integration exists until TASK-048/050/051). A duplicate intent creates no new
// deliveries, matching the notification it deduplicated against.
export function createCreateNotification(dependencies: {
  notifications: CreateNotificationRepository;
  deliveries: CreateNotificationDeliveryRepository;
  preferences: CreateNotificationPreferenceRepository;
  now?: () => Date;
}) {
  const now = dependencies.now ?? (() => new Date());

  return async function createNotification(input: {
    intent: NotificationIntent;
    userTimezone: string;
    channelEntitlements: Record<NotificationChannel, boolean>;
  }) {
    const [preferenceRows, whatsappConsent] = await Promise.all([
      dependencies.preferences.listForUser(input.intent.userId),
      dependencies.preferences.findWhatsappConsentForUser(input.intent.userId),
    ]);
    const whatsappOptedIn = Boolean(whatsappConsent?.optInAt && !whatsappConsent.optOutAt);

    const inAppPreference = preferenceRows.find((row) => row.notificationType === null && row.channel === "IN_APP");
    const scheduledFor = resolveScheduledFor(input.intent.scheduledFor ?? input.intent.occurredAt, input.userTimezone, inAppPreference);

    const { notification, created } = await dependencies.notifications.createIfNotDuplicate({
      userId: input.intent.userId,
      type: input.intent.type,
      category: input.intent.category,
      priority: input.intent.priority,
      titleKey: input.intent.titleKey,
      bodyKey: input.intent.bodyKey,
      subjectType: input.intent.subjectType,
      subjectId: input.intent.subjectId,
      metadata: input.intent.metadata,
      dedupKey: input.intent.dedupKey,
      scheduledFor,
    });

    if (!created) return { notification, created, deliveries: [] };

    const deliveries: DeliveryRecord[] = [];
    for (const channel of ALL_CHANNELS) {
      const eligibility = resolveChannelEligibility({
        category: input.intent.category,
        channel,
        notificationType: input.intent.type,
        preferences: preferenceRows,
        channelEntitled: input.channelEntitlements[channel] ?? false,
        whatsappOptedIn,
      });
      if (!eligibility.eligible) continue;

      const delivery = await dependencies.deliveries.create({ notificationId: notification.id, channel });
      // IN_APP has no separate send step — persisting the notification row already satisfies it.
      if (channel === "IN_APP") await dependencies.deliveries.updateStatus(delivery.id, { status: "DELIVERED", deliveredAt: now() });
      deliveries.push(delivery);
    }

    return { notification, created, deliveries };
  };
}
