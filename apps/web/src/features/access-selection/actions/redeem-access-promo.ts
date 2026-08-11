"use server";

import { headers } from "next/headers";

import { createBillingSubscriptionRepository, db } from "@know-finanzas/db";
import { isEffectivePaidSubscription } from "@know-finanzas/billing";
import { env } from "@know-finanzas/config";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { redeemPromotionCode } from "@/lib/promotions/redeem-promotion-code.instance";
import { notifyPromotionStarted } from "@/lib/notifications/notify-promotion-started";
import { analyticsService, isInternalAccount } from "@/lib/analytics/analytics-service.instance";
import { mapPromotionActionErrorToUi } from "@/features/promotions/lib/map-promotion-error";

const subscriptions = createBillingSubscriptionRepository(db);

export type RedeemAccessPromoActionState =
  | { ok: true; endsAt: string }
  | { ok: false; error: ReturnType<typeof mapPromotionActionErrorToUi> };

// Reuses the exact same RedeemPromotionCode (TASK-053) as /settings/billing's redemption form —
// never creates a billing subscription or a trial (Domain Rule), only a promotional grant.
export async function redeemAccessPromoAction(_previousState: RedeemAccessPromoActionState | null, formData: FormData): Promise<RedeemAccessPromoActionState> {
  const rawCode = String(formData.get("code") ?? "");

  try {
    const user = await requireCurrentUser();
    const internal = isInternalAccount(user.email);
    await analyticsService("promotion_code_entered", {}, { userId: user.id, internal });

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
        { eventId: `promotion_redeemed:${result.redemption.id}`, userId: user.id, internal },
      );
    }
    await analyticsService(
      "access_activated",
      { source: "PROMOTION" },
      { eventId: `access_activated:${user.id}`, userId: user.id, internal },
    );

    return { ok: true, endsAt: result.grant.endsAt.toISOString() };
  } catch (error) {
    return { ok: false, error: mapPromotionActionErrorToUi(error) };
  }
}
