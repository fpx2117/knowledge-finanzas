import { DEFAULT_REFERRAL_REWARD_POLICY } from "@know-finanzas/referrals";
import { getOrCreateReferralCode, referralRepository } from "@/lib/referrals/referral-service.instance";
import { createGetReferralSummary } from "./get-referral-summary";

export const getReferralSummary = createGetReferralSummary({
  getOrCreateReferralCode,
  listAttributionsForReferrer: (referrerUserId) => referralRepository.listAttributionsForReferrer(referrerUserId),
  rewardPolicy: {
    nonPaidType: DEFAULT_REFERRAL_REWARD_POLICY.nonPaidRewardType,
    nonPaidValue: DEFAULT_REFERRAL_REWARD_POLICY.nonPaidRewardValue,
    paidType: DEFAULT_REFERRAL_REWARD_POLICY.paidRewardType,
    paidValue: DEFAULT_REFERRAL_REWARD_POLICY.paidRewardValue,
  },
});
