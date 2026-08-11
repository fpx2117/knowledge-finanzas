import type { NotificationChannel, NotificationType } from "../domain/types";

export type UpdateNotificationPreferenceRepository = {
  upsertForUser(input: {
    userId: string;
    notificationType: NotificationType | null;
    channel: NotificationChannel;
    enabled: boolean;
    leadTimeMinutes?: number | null;
    quietHoursEnabled?: boolean;
    quietHoursStart?: string | null;
    quietHoursEnd?: string | null;
  }): Promise<unknown>;
};

// Ownership is implicit: every write is scoped to input.userId, there is no notion of updating
// another user's preference row by id.
export function createUpdateNotificationPreference(dependencies: { preferences: UpdateNotificationPreferenceRepository }) {
  return function updateNotificationPreference(input: {
    userId: string;
    notificationType?: NotificationType | null;
    channel: NotificationChannel;
    enabled: boolean;
    leadTimeMinutes?: number | null;
    quietHoursEnabled?: boolean;
    quietHoursStart?: string | null;
    quietHoursEnd?: string | null;
  }) {
    return dependencies.preferences.upsertForUser({ ...input, notificationType: input.notificationType ?? null });
  };
}
