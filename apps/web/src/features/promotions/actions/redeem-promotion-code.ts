"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { createBillingSubscriptionRepository, db } from "@know-finanzas/db";
import { isEffectivePaidSubscription } from "@know-finanzas/billing";
import { env } from "@know-finanzas/config";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { redeemPromotionCode } from "@/lib/promotions/redeem-promotion-code.instance";
import { notifyPromotionStarted } from "@/lib/notifications/notify-promotion-started";
import { analyticsService, isInternalAccount } from "@/lib/analytics/analytics-service.instance";
import { mapPromotionActionErrorToUi } from "../lib/map-promotion-error";

const subscriptions = createBillingSubscriptionRepository(db);

export type RedeemPromotionCodeState =
  | { ok: true; endsAt: string }
  | { ok: false; error: ReturnType<typeof mapPromotionActionErrorToUi> };

// Redemption input from the client is limited to `code` (Security Requirement) — userId always
// comes from the authenticated session, hasActivePaidSubscription is resolved server-side from
// the real subscription repository, never trusted from the client.
export async function redeemPromotionCodeAction(_previousState: RedeemPromotionCodeState | null, formData: FormData): Promise<RedeemPromotionCodeState> {
  const rawCode = String(formData.get("code") ?? "");

  try {
    const user = await requireCurrentUser();
    const requestHeaders = await headers();
    const forwardedFor = requestHeaders.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : null;

    const subscription = await subscriptions.findEffectiveForUser(user.id);
    const hasActivePaidSubscription = isEffectivePaidSubscription(
      subscription ? { status: subscription.status, currentPeriodEnd: subscription.currentPeriodEnd } : null,
      new Date(),
      env.BILLING_GRACE_PERIOD_DAYS,
    );

    const result = await redeemPromotionCode({
      rawCode,
      userId: user.id,
      hasActivePaidSubscription,
      rateLimitKeys: ip ? [`user:${user.id}`, `ip:${ip}`] : [`user:${user.id}`],
    });

    await notifyPromotionStarted({ userId: user.id, userTimezone: user.timezone, grant: result.grant });
    if (result.grant.promotionCodeId) {
      await analyticsService(
        "promotion_redeemed",
        { promotionCodeId: result.grant.promotionCodeId },
        { eventId: `promotion_redeemed:${result.redemption.id}`, userId: user.id, internal: isInternalAccount(user.email) },
      );
    }

    revalidatePath("/settings/billing");
    return { ok: true, endsAt: result.grant.endsAt.toISOString() };
  } catch (error) {
    return { ok: false, error: mapPromotionActionErrorToUi(error) };
  }
}
