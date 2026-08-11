"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { updateNotificationPreference } from "@/lib/notifications/notification-services.instance";
import { mapNotificationActionErrorToUi } from "../lib/map-notification-error";

const channelSchema = z.enum(["REALTIME", "EMAIL", "WHATSAPP"]);

export async function updateNotificationChannelPreferenceAction(_previousState: unknown, formData: FormData) {
  try {
    const user = await requireCurrentUser();
    const channel = channelSchema.parse(formData.get("channel"));
    const enabled = formData.get("enabled") === "true";
    await updateNotificationPreference({ userId: user.id, notificationType: null, channel, enabled });
  } catch (error) {
    return { ok: false as const, error: mapNotificationActionErrorToUi(error) };
  }

  revalidatePath("/settings/notifications");
  return { ok: true as const };
}
