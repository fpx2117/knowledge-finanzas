"use server";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { emitFinancialEvent } from "@/lib/events/emit-financial-event";
import { duplicateReviewService } from "../services/duplicate-review-service.instance";

export async function dismissDuplicatePairAction(idA: string, idB: string): Promise<{ ok: boolean }> {
  try {
    const user = await requireCurrentUser();
    await duplicateReviewService.dismissPair(user.id, idA, idB);
    emitFinancialEvent({ type: "pending_item.resolved" });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function resolveDuplicatePairAction(keepId: string, voidId: string): Promise<{ ok: boolean }> {
  try {
    const user = await requireCurrentUser();
    await duplicateReviewService.resolvePair(user.id, keepId, voidId);
    emitFinancialEvent({ type: "pending_item.resolved" });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
