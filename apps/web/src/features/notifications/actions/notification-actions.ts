"use server";

import { z } from "zod";

import { isNotificationError } from "@know-finanzas/notifications";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { emitFinancialEvent } from "@/lib/events/emit-financial-event";
import { notificationService } from "../services/notification-service.instance";

export type NotificationActionState = { ok: true } | { ok: false; error: ReturnType<typeof mapErrorToUi> };

export async function markNotificationReadAction(
  _previous: NotificationActionState | null,
  formData: FormData,
): Promise<NotificationActionState> {
  try {
    const user = await requireCurrentUser();
    const id = z.string().uuid().parse(formData.get("notificationId"));
    await notificationService.markRead(user.id, id);
    emitFinancialEvent({ type: "notification.updated" });
  } catch (error) {
    // Marking an already-gone notification read is a harmless no-op (§17.6 — read is not a domain
    // mutation), so a missing row is still a success from the caller's point of view.
    if (isNotificationError(error) && error.code === "NOTIFICATION_NOT_FOUND") return { ok: true };
    return { ok: false, error: mapErrorToUi(error) };
  }
  return { ok: true };
}

export async function markAllNotificationsReadAction(): Promise<NotificationActionState> {
  try {
    const user = await requireCurrentUser();
    await notificationService.markAllRead(user.id);
    emitFinancialEvent({ type: "notification.updated" });
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
  return { ok: true };
}
