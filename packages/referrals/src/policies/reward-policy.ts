import type { ReferralRewardType } from "../domain/types";

export type ReferralRewardPolicy = {
  version: string;
  nonPaidRewardType: Extract<ReferralRewardType, "PROMOTIONAL_PRO_DAYS">;
  nonPaidRewardValue: number;
  paidRewardType: Extract<ReferralRewardType, "AI_CREDITS">;
  paidRewardValue: number;
  rewardsPerUserPerPeriod: number;
  rewardPeriodDays: number;
  maxPromoDaysAhead: number;
};

export const DEFAULT_REFERRAL_REWARD_POLICY: ReferralRewardPolicy = {
  version: "referral-policy:v1",
  nonPaidRewardType: "PROMOTIONAL_PRO_DAYS",
  nonPaidRewardValue: 30,
  paidRewardType: "AI_CREDITS",
  paidRewardValue: 100,
  rewardsPerUserPerPeriod: 3,
  rewardPeriodDays: 30,
  maxPromoDaysAhead: 90,
};

export function resolveRewardForReferrer(
  policy: ReferralRewardPolicy,
  input: { referrerHasEffectivePaidAccess: boolean },
): { type: ReferralRewardType; value: number } {
  if (input.referrerHasEffectivePaidAccess) {
    return { type: policy.paidRewardType, value: policy.paidRewardValue };
  }
  return { type: policy.nonPaidRewardType, value: policy.nonPaidRewardValue };
}

export function isRewardCapReached(policy: ReferralRewardPolicy, input: { rewardsGrantedInPeriod: number }): boolean {
  return input.rewardsGrantedInPeriod >= policy.rewardsPerUserPerPeriod;
}

// Caps how many promotional days ahead of "now" a grant may be extended, so a single referrer
// cannot bank an unbounded runway of free Pro access via repeated referrals.
export function cappedPromotionalDays(
  policy: ReferralRewardPolicy,
  input: { requestedDays: number; alreadyBankedDaysAhead: number },
): number {
  const remainingCapacity = policy.maxPromoDaysAhead - input.alreadyBankedDaysAhead;
  if (remainingCapacity <= 0) return 0;
  return Math.min(input.requestedDays, remainingCapacity);
}
