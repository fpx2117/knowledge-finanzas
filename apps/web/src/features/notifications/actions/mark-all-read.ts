"use server";

import { revalidatePath } from "next/cache";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { markAllNotificationsRead } from "@/lib/notifications/notification-services.instance";

export async function markAllNotificationsReadAction() {
  const user = await requireCurrentUser();
  await markAllNotificationsRead({ userId: user.id });
  revalidatePath("/notifications");
}
