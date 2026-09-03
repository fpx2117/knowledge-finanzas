"use server";

import { revalidatePath } from "next/cache";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { inboxService } from "../services/inbox-service.instance";

export async function categorizeInboxItemAction(transactionId: string, categoryId: string): Promise<{ ok: boolean }> {
  try {
    const user = await requireCurrentUser();
    await inboxService.categorize(user.id, transactionId, categoryId);
    revalidatePath("/inbox");
    revalidatePath("/transactions");
    revalidatePath("/budgets");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
