"use server";

import { revalidatePath } from "next/cache";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { archiveNotification } from "@/lib/notifications/notification-services.instance";

export async function archiveNotificationAction(formData: FormData) {
  const notificationId = String(formData.get("notificationId") ?? "");
  const user = await requireCurrentUser();
  await archiveNotification({ userId: user.id, notificationId });
  revalidatePath("/notifications");
}
