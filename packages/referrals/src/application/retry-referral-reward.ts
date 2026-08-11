import { ReferralError } from "../errors";
import { createGrantReferralReward, type GrantReferralRewardRepository } from "./grant-referral-reward";
import type { GrantReferralAiCreditsPort, GrantReferralPromotionalDaysPort } from "./ports";
import type { ReferralRewardRecord } from "../domain/types";

export function createRetryReferralReward(dependencies: {
  repository: GrantReferralRewardRepository;
  grantPromotionalDays?: GrantReferralPromotionalDaysPort;
  grantAiCredits?: GrantReferralAiCreditsPort;
  now?: () => Date;
}) {
  const grantReferralReward = createGrantReferralReward(dependencies);

  return async function retryReferralReward(input: { rewardId: string; actor: { userId: string; isAdmin: boolean } }): Promise<ReferralRewardRecord> {
    if (!input.actor.isAdmin) throw new ReferralError("REFERRAL_REWARD_NOT_RETRYABLE");

    const reward = await dependencies.repository.findRewardById(input.rewardId);
    if (!reward) throw new ReferralError("REFERRAL_REWARD_NOT_FOUND");
    if (reward.status !== "FAILED") throw new ReferralError("REFERRAL_REWARD_NOT_RETRYABLE");

    return grantReferralReward({ rewardId: input.rewardId });
  };
}
