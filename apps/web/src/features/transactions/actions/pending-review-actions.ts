"use server";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { emitFinancialEvent } from "@/lib/events/emit-financial-event";
import { pendingReviewService } from "../services/pending-review-service.instance";

export async function categorizePendingItemAction(transactionId: string, categoryId: string): Promise<{ ok: boolean }> {
  try {
    const user = await requireCurrentUser();
    await pendingReviewService.categorize(user.id, transactionId, categoryId);
    emitFinancialEvent({ type: "pending_item.resolved" });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
