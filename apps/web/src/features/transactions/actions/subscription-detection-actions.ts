"use server";

import { revalidatePath } from "next/cache";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { subscriptionDetectionService } from "../services/subscription-detection-service.instance";

export type SubscriptionScanState = { ok: true; found: number } | { ok: false; error: ReturnType<typeof mapErrorToUi> };

export async function scanSubscriptionsAction(): Promise<SubscriptionScanState> {
  try {
    const user = await requireCurrentUser();
    const { found } = await subscriptionDetectionService.refreshForUser(user.id);
    revalidatePath("/debts/suscripciones");
    return { ok: true, found };
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
}

export async function dismissSubscriptionAction(subscriptionId: string): Promise<{ ok: boolean }> {
  try {
    const user = await requireCurrentUser();
    await subscriptionDetectionService.dismissSubscription(user.id, subscriptionId);
    revalidatePath("/debts/suscripciones");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
