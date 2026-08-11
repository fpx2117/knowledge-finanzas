import type { PreferenceRow } from "../domain/resolve-channel-eligibility";
import type { NotificationChannel } from "../domain/types";

const ALL_CHANNELS: NotificationChannel[] = ["IN_APP", "REALTIME", "EMAIL", "WHATSAPP"];

export type ResolveNotificationPreferencesRepository = {
  listForUser(userId: string): Promise<PreferenceRow[]>;
  findWhatsappConsentForUser(userId: string): Promise<{ optInAt: Date | null; optOutAt: Date | null } | undefined>;
};

// Read model for a settings UI (consumed by TASK-048): the effective state per channel, not just
// the raw preference rows — a channel a user has no entitlement for is still listed, just marked
// not entitled, so the UI can explain why it's unavailable instead of hiding it silently.
export function createResolveNotificationPreferences(dependencies: { preferences: ResolveNotificationPreferencesRepository }) {
  return async function resolveNotificationPreferences(input: { userId: string; channelEntitlements: Record<NotificationChannel, boolean> }) {
    const [rows, consent] = await Promise.all([
      dependencies.preferences.listForUser(input.userId),
      dependencies.preferences.findWhatsappConsentForUser(input.userId),
    ]);

    return {
      whatsappOptedIn: Boolean(consent?.optInAt && !consent.optOutAt),
      channels: ALL_CHANNELS.map((channel) => ({
        channel,
        entitled: input.channelEntitlements[channel] ?? false,
        globalEnabled: rows.find((row) => row.notificationType === null && row.channel === channel)?.enabled ?? true,
        typeOverrides: rows
          .filter((row) => row.notificationType !== null && row.channel === channel)
          .map((row) => ({ notificationType: row.notificationType, enabled: row.enabled })),
      })),
    };
  };
}
