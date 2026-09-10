"use server";

import { z } from "zod";

import { isNotificationError } from "@know-finanzas/notifications";
import type { NotificationChannel } from "@know-finanzas/notifications";
import { createNotificationPreferenceRepository, db } from "@know-finanzas/db";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { emitFinancialEvent } from "@/lib/events/emit-financial-event";
import { notificationService } from "../services/notification-service.instance";
import {
  resolveNotificationPreferences,
  updateNotificationPreference,
  whatsappConsentService,
} from "@/lib/notifications/notification-services.instance";
import { resolveChannelEntitlementsForUser } from "@/lib/notifications/channel-entitlements";

const preferencesRepo = createNotificationPreferenceRepository(db);

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

export type NotificationSettingsView = Awaited<ReturnType<typeof resolveNotificationPreferences>> & { whatsappPhone: string | null };

export async function getNotificationSettingsAction(): Promise<NotificationSettingsView> {
  const user = await requireCurrentUser();
  const channelEntitlements = await resolveChannelEntitlementsForUser(user.id);
  const [prefs, consent] = await Promise.all([
    resolveNotificationPreferences({ userId: user.id, channelEntitlements }),
    preferencesRepo.findWhatsappConsentForUser(user.id),
  ]);
  return { ...prefs, whatsappPhone: consent?.optOutAt ? null : consent?.phoneNumber ?? null };
}

const channelSchema = z.enum(["IN_APP", "REALTIME", "EMAIL", "WHATSAPP"]) satisfies z.ZodType<NotificationChannel>;

export async function setChannelPreferenceAction(input: { channel: NotificationChannel; enabled: boolean }): Promise<NotificationActionState> {
  try {
    const user = await requireCurrentUser();
    const channel = channelSchema.parse(input.channel);
    await updateNotificationPreference({ userId: user.id, notificationType: null, channel, enabled: Boolean(input.enabled) });
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
  return { ok: true };
}

export async function whatsappOptInAction(input: { phoneNumber: string }): Promise<NotificationActionState> {
  try {
    const user = await requireCurrentUser();
    await whatsappConsentService.optIn({ userId: user.id, phoneNumber: input.phoneNumber.trim() });
  } catch (error) {
    if (isNotificationError(error) && error.code === "WHATSAPP_INVALID_PHONE") {
      return { ok: false, error: { code: "INVALID_INPUT", message: "Ingresá un número en formato internacional, ej. +5491122334455." } };
    }
    return { ok: false, error: mapErrorToUi(error) };
  }
  return { ok: true };
}

export async function whatsappOptOutAction(): Promise<NotificationActionState> {
  try {
    const user = await requireCurrentUser();
    await whatsappConsentService.optOut({ userId: user.id });
  } catch (error) {
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
