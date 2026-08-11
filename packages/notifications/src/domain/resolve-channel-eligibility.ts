import type { NotificationCategory, NotificationChannel, NotificationType } from "./types";
import { isWithinQuietHours, nextLocalTimeAtOrAfter } from "./quiet-hours";

// Docs/09-notifications-alerts.md §142 domain rule: BILLING/SECURITY/ACCOUNT notifications stay
// eligible even when a user's premium channel entitlement has lapsed (EXPIRED_READ_ONLY) — these
// are operational, not "premium financial" notifications. FINANCIAL/PRODUCT categories are gated
// normally by channel entitlement.
const CATEGORIES_BYPASSING_ENTITLEMENT: ReadonlySet<NotificationCategory> = new Set(["BILLING", "SECURITY", "ACCOUNT"]);

export type PreferenceRow = {
  notificationType: NotificationType | null;
  channel: NotificationChannel;
  enabled: boolean;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
};

export type ChannelEligibilityInput = {
  category: NotificationCategory;
  channel: NotificationChannel;
  notificationType: NotificationType;
  preferences: PreferenceRow[];
  channelEntitled: boolean;
  whatsappOptedIn?: boolean;
};

export type ChannelEligibilityResult =
  | { eligible: true }
  | { eligible: false; reason: "NOTIFICATION_CHANNEL_NOT_ENTITLED" | "WHATSAPP_NOT_OPTED_IN" | "NOTIFICATION_PREFERENCE_DISABLED" };

export function resolveChannelEligibility(input: ChannelEligibilityInput): ChannelEligibilityResult {
  const entitled = input.channelEntitled || CATEGORIES_BYPASSING_ENTITLEMENT.has(input.category);
  if (!entitled) return { eligible: false, reason: "NOTIFICATION_CHANNEL_NOT_ENTITLED" };

  if (input.channel === "WHATSAPP" && !input.whatsappOptedIn) return { eligible: false, reason: "WHATSAPP_NOT_OPTED_IN" };

  // Global (notificationType === null) OFF overrides any per-type preference — domain rule.
  const global = input.preferences.find((row) => row.notificationType === null && row.channel === input.channel);
  if (global && !global.enabled) return { eligible: false, reason: "NOTIFICATION_PREFERENCE_DISABLED" };

  const perType = input.preferences.find((row) => row.notificationType === input.notificationType && row.channel === input.channel);
  if (perType && !perType.enabled) return { eligible: false, reason: "NOTIFICATION_PREFERENCE_DISABLED" };

  return { eligible: true };
}

// If quiet hours are active for the given moment, returns the next instant they end (in UTC);
// otherwise returns `at` unchanged. Actually delaying delivery until this instant is TASK-049's
// job (the scheduler/worker) — this only computes the timing signal.
export function resolveScheduledFor(at: Date, timezone: string, preference: PreferenceRow | undefined): Date {
  if (!preference?.quietHoursEnabled || !preference.quietHoursStart || !preference.quietHoursEnd) return at;
  if (!isWithinQuietHours(at, timezone, preference.quietHoursStart, preference.quietHoursEnd)) return at;
  return nextLocalTimeAtOrAfter(at, timezone, preference.quietHoursEnd);
}
