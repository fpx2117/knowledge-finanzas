import { buildPromotionStartedIntent } from "@know-finanzas/notifications";
import { notifyUser } from "./notify";

// Fired once, right after a successful redemption — see
// packages/notifications/src/rules/promotion-expiry.ts for why this isn't part of the recurring
// evaluate-financial-alerts sweep (it only ever needs to happen once, at redemption time).
export function notifyPromotionStarted(input: { userId: string; userTimezone: string; grant: { id: string; endsAt: Date } }) {
  return notifyUser({
    userId: input.userId,
    userTimezone: input.userTimezone,
    intent: buildPromotionStartedIntent({ grant: input.grant, now: new Date() }),
  });
}
