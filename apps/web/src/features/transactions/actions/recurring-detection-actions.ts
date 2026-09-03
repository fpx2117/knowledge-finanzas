"use server";

import { revalidatePath } from "next/cache";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { recurringDetectionService } from "../services/recurring-detection-service.instance";

export type RecurringScanState = { ok: true; found: number } | { ok: false; error: ReturnType<typeof mapErrorToUi> };

export async function scanRecurringAction(): Promise<RecurringScanState> {
  try {
    const user = await requireCurrentUser();
    const { found } = await recurringDetectionService.refreshForUser(user.id);
    revalidatePath("/recurrentes");
    return { ok: true, found };
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
}

export async function confirmRecurringAction(seriesId: string): Promise<{ ok: boolean }> {
  try {
    const user = await requireCurrentUser();
    await recurringDetectionService.confirmSuggestion(user.id, seriesId);
    revalidatePath("/recurrentes");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function dismissRecurringAction(seriesId: string): Promise<{ ok: boolean }> {
  try {
    const user = await requireCurrentUser();
    await recurringDetectionService.dismissSuggestion(user.id, seriesId);
    revalidatePath("/recurrentes");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
