"use server";

import { revalidatePath } from "next/cache";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { whatsappConsentService } from "@/lib/notifications/notification-services.instance";
import { mapNotificationActionErrorToUi } from "../lib/map-notification-error";

export async function whatsappOptInAction(_previousState: unknown, formData: FormData) {
  try {
    const user = await requireCurrentUser();
    const phoneNumber = String(formData.get("phoneNumber") ?? "").trim();
    await whatsappConsentService.optIn({ userId: user.id, phoneNumber });
  } catch (error) {
    return { ok: false as const, error: mapNotificationActionErrorToUi(error) };
  }

  revalidatePath("/settings/notifications");
  return { ok: true as const };
}

export async function whatsappOptOutAction() {
  const user = await requireCurrentUser();
  await whatsappConsentService.optOut({ userId: user.id });
  revalidatePath("/settings/notifications");
}
