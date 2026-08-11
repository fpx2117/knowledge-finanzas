"use server";

import { revalidatePath } from "next/cache";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { dismissStatisticalProfilePrompt } from "@/lib/privacy/statistical-profile.instance";

export async function dismissStatisticalProfilePromptAction() {
  const user = await requireCurrentUser();
  await dismissStatisticalProfilePrompt(user.id);
  revalidatePath("/dashboard");
}
