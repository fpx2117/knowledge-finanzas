"use server";

import { revalidatePath } from "next/cache";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { markNotificationRead } from "@/lib/notifications/notification-services.instance";
import { analyticsService, isInternalAccount } from "@/lib/analytics/analytics-service.instance";

export async function markNotificationReadAction(formData: FormData) {
  const notificationId = String(formData.get("notificationId") ?? "");
  const user = await requireCurrentUser();
  const notification = await markNotificationRead({ userId: user.id, notificationId });
  // markNotificationRead's declared return type only guarantees `{id}` (its repository port is
  // intentionally minimal — see packages/notifications/src/application/mark-notification-read.ts)
  // but the real row (packages/db's notifications table) always has `type`.
  await analyticsService(
    "notification_action_clicked",
    { notificationType: (notification as unknown as { type: string }).type },
    { userId: user.id, internal: isInternalAccount(user.email) },
  );
  revalidatePath("/notifications");
}
