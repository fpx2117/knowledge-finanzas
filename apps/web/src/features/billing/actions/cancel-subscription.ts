"use server";

import { revalidatePath } from "next/cache";

import { createBillingSubscriptionRepository, db } from "@know-finanzas/db";
import { createCancelSubscription, createMercadoPagoBillingProvider } from "@know-finanzas/billing";
import { env } from "@know-finanzas/config";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { subscriptionSynchronizer } from "@/lib/billing/subscription-synchronizer.instance";
import { notifySubscriptionCancelled } from "@/lib/notifications/notify-billing-events";
import { analyticsService, isInternalAccount } from "@/lib/analytics/analytics-service.instance";
import { mapBillingActionErrorToUi } from "../lib/map-billing-error";

const subscriptions = createBillingSubscriptionRepository(db);

const cancelSubscription = createCancelSubscription({
  subscriptions: { findByIdForUser: subscriptions.findByIdForUser, cancelWithoutProvider: subscriptions.markFailed, recordCancellationReason: subscriptions.recordCancellationReason },
  provider: createMercadoPagoBillingProvider({ accessToken: env.MERCADOPAGO_ACCESS_TOKEN ?? "" }),
  synchronizer: subscriptionSynchronizer,
});

export type CancelSubscriptionState =
  | { ok: true }
  | { ok: false; error: ReturnType<typeof mapBillingActionErrorToUi> };

export async function cancelSubscriptionAction(_previousState: CancelSubscriptionState | null, formData: FormData): Promise<CancelSubscriptionState> {
  const subscriptionId = String(formData.get("subscriptionId") ?? "");
  const reasonCode = formData.get("reasonCode");
  const reasonComment = formData.get("reasonComment");

  try {
    const user = await requireCurrentUser();
    await cancelSubscription({
      userId: user.id,
      subscriptionId,
      reason: reasonCode || reasonComment ? { reasonCode: reasonCode ? String(reasonCode) : null, reasonComment: reasonComment ? String(reasonComment).trim().slice(0, 500) || null : null } : undefined,
    });
    await notifySubscriptionCancelled({ userId: user.id, userTimezone: user.timezone, subscriptionId });
    await analyticsService(
      "subscription_cancelled",
      { reasonCode: reasonCode ? String(reasonCode) : null },
      { eventId: `subscription_cancelled:${subscriptionId}`, userId: user.id, internal: isInternalAccount(user.email) },
    );
  } catch (error) {
    return { ok: false, error: mapBillingActionErrorToUi(error) };
  }

  revalidatePath("/settings/billing");
  return { ok: true };
}
