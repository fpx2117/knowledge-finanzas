import { buildReferralRewardGrantedIntent } from "@know-finanzas/notifications";
import { notifyUser } from "./notify";

// Fired once, right after a referral reward actually grants — currently only reachable from the
// admin RetryReferralReward action (packages/referrals' HandleReferralConversion/GrantReferralReward
// have no live PaidProActivated trigger yet, see TASK-055's Notes), but the notification itself is
// fully built for whenever that live wiring lands.
export function notifyReferralRewardGranted(input: {
  beneficiaryUserId: string;
  beneficiaryTimezone: string;
  reward: { id: string; type: "PROMOTIONAL_PRO_DAYS" | "AI_CREDITS"; value: number };
}) {
  return notifyUser({
    userId: input.beneficiaryUserId,
    userTimezone: input.beneficiaryTimezone,
    intent: buildReferralRewardGrantedIntent({ reward: input.reward, now: new Date() }),
  });
}
