"use server";

import { revalidatePath } from "next/cache";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { duplicateReviewService } from "../services/duplicate-review-service.instance";

export async function dismissDuplicatePairAction(idA: string, idB: string): Promise<{ ok: boolean }> {
  try {
    const user = await requireCurrentUser();
    await duplicateReviewService.dismissPair(user.id, idA, idB);
    revalidatePath("/duplicados");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function resolveDuplicatePairAction(keepId: string, voidId: string): Promise<{ ok: boolean }> {
  try {
    const user = await requireCurrentUser();
    await duplicateReviewService.resolvePair(user.id, keepId, voidId);
    revalidatePath("/duplicados");
    revalidatePath("/transactions");
    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
