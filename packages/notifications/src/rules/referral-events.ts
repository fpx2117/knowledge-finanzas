import type { NotificationIntent } from "../domain/types";

// Fired once, right after signup attribution (packages/auth's databaseHooks.user.create.after) —
// category ACCOUNT so it's never gated by product-access entitlement (docs/09 §142), and never
// carries the referred user's identity (Security Requirement: never expose referred-user PII to
// the referrer).
export function buildReferralSignupIntent(input: { attributionId: string; now: Date }): Omit<NotificationIntent, "userId"> {
  return {
    type: "REFERRAL_SIGNUP",
    category: "ACCOUNT",
    priority: "LOW",
    titleKey: "REFERRAL_SIGNUP",
    bodyKey: "REFERRAL_SIGNUP",
    occurredAt: input.now,
    dedupKey: `REFERRAL_SIGNUP:${input.attributionId}`,
  };
}

// Fired once a referral reward actually grants (never invents a value — reward type/value always
// come from the already-persisted referral_rewards row, per the task's Domain Rule that the
// referral page/notifications never estimate reward figures).
export function buildReferralRewardGrantedIntent(input: {
  reward: { id: string; type: "PROMOTIONAL_PRO_DAYS" | "AI_CREDITS"; value: number };
  now: Date;
}): Omit<NotificationIntent, "userId"> {
  return {
    type: "REFERRAL_REWARD_GRANTED",
    category: "ACCOUNT",
    priority: "NORMAL",
    titleKey: "REFERRAL_REWARD_GRANTED",
    bodyKey: "REFERRAL_REWARD_GRANTED",
    metadata: { rewardType: input.reward.type, rewardValue: input.reward.value },
    occurredAt: input.now,
    dedupKey: `REFERRAL_REWARD_GRANTED:${input.reward.id}`,
  };
}
