"use server";

import { merchantRepository, subscriptionRepository } from "@know-finanzas/db";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { emitFinancialEvent } from "@/lib/events/emit-financial-event";
import { getTodayInTimezone } from "@/lib/date";
import { subscriptionDetectionService } from "../services/subscription-detection-service.instance";
import { createSubscriptionSchema } from "../schemas/subscription-schemas";

export type SubscriptionScanState = { ok: true; found: number } | { ok: false; error: ReturnType<typeof mapErrorToUi> };

export type CreateSubscriptionState = { ok: true } | { ok: false; error: ReturnType<typeof mapErrorToUi> };

export async function createSubscriptionAction(
  _previousState: CreateSubscriptionState | null,
  formData: FormData,
): Promise<CreateSubscriptionState> {
  try {
    const user = await requireCurrentUser();
    const rawAmount = String(formData.get("amount") ?? "").trim();
    const amount = rawAmount.includes(",") ? rawAmount.replace(/\./g, "").replace(",", ".") : rawAmount;
    const input = createSubscriptionSchema.parse({
      merchantName: formData.get("merchantName"),
      amount,
      currencyCode: formData.get("currencyCode"),
      frequency: formData.get("frequency"),
      nextChargeOn: formData.get("nextChargeOn"),
    });

    const merchant = await merchantRepository.getOrCreateByName(input.merchantName, user.id);
    if (!merchant) return { ok: false, error: mapErrorToUi(new Error("No pudimos registrar el comercio.")) };

    const today = getTodayInTimezone(user.timezone);
    await subscriptionRepository.upsert({
      userId: user.id,
      merchantId: merchant.id,
      label: merchant.canonicalName,
      frequency: input.frequency,
      currencyCode: input.currencyCode,
      currentAmount: input.amount,
      priceHistory: [{ amount: Number(input.amount).toFixed(2), from: today }],
      categoryId: null,
      firstChargedOn: today,
      lastChargedOn: today,
      nextExpectedOn: input.nextChargeOn,
      chargeCount: 1,
      confidence: 1,
    });
    emitFinancialEvent({ type: "subscription.changed" });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
}

export async function scanSubscriptionsAction(): Promise<SubscriptionScanState> {
  try {
    const user = await requireCurrentUser();
    const { found } = await subscriptionDetectionService.refreshForUser(user.id);
    emitFinancialEvent({ type: "subscription.changed" });
    return { ok: true, found };
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
}

export async function dismissSubscriptionAction(subscriptionId: string): Promise<{ ok: boolean }> {
  try {
    const user = await requireCurrentUser();
    await subscriptionDetectionService.dismissSubscription(user.id, subscriptionId);
    emitFinancialEvent({ type: "subscription.changed" });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
