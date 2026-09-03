"use server";

import { revalidatePath } from "next/cache";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { pendingReviewService } from "../services/pending-review-service.instance";

export async function categorizePendingItemAction(transactionId: string, categoryId: string): Promise<{ ok: boolean }> {
  try {
    const user = await requireCurrentUser();
    await pendingReviewService.categorize(user.id, transactionId, categoryId);
    revalidatePath("/transactions/pendientes");
    revalidatePath("/transactions");
    revalidatePath("/budgets");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
