import { ReferralError } from "../errors";
import { noopGrantReferralAiCredits, noopGrantReferralPromotionalDays, type GrantReferralAiCreditsPort, type GrantReferralPromotionalDaysPort } from "./ports";
import type { ReferralRewardRecord } from "../domain/types";

export type GrantReferralRewardRepository = {
  findRewardById(rewardId: string): Promise<ReferralRewardRecord | undefined>;
  markGranted(input: { rewardId: string; grantReferenceId: string; grantedAt: Date }): Promise<ReferralRewardRecord>;
  markFailed(input: { rewardId: string; failureReason: string }): Promise<ReferralRewardRecord>;
};

export function createGrantReferralReward(dependencies: {
  repository: GrantReferralRewardRepository;
  grantPromotionalDays?: GrantReferralPromotionalDaysPort;
  grantAiCredits?: GrantReferralAiCreditsPort;
  now?: () => Date;
}) {
  const now = dependencies.now ?? (() => new Date());
  const grantPromotionalDays = dependencies.grantPromotionalDays ?? noopGrantReferralPromotionalDays;
  const grantAiCredits = dependencies.grantAiCredits ?? noopGrantReferralAiCredits;

  return async function grantReferralReward(input: { rewardId: string }): Promise<ReferralRewardRecord> {
    const reward = await dependencies.repository.findRewardById(input.rewardId);
    if (!reward) throw new ReferralError("REFERRAL_REWARD_NOT_FOUND");
    if (reward.status === "GRANTED") return reward;
    if (reward.status !== "PENDING" && reward.status !== "FAILED") throw new ReferralError("REFERRAL_REWARD_NOT_RETRYABLE");

    // Reward failure never rolls back the paid subscription that triggered it (task's Financial
    // Invariants) — a failed grant just leaves the reward row FAILED for a later retry.
    const result =
      reward.type === "PROMOTIONAL_PRO_DAYS"
        ? await grantPromotionalDays({ userId: reward.beneficiaryUserId, days: reward.value, referenceId: reward.id })
        : await grantAiCredits({ userId: reward.beneficiaryUserId, amount: reward.value, referenceId: reward.id });

    if (!result.ok) {
      return dependencies.repository.markFailed({ rewardId: reward.id, failureReason: result.errorCode });
    }

    return dependencies.repository.markGranted({ rewardId: reward.id, grantReferenceId: result.grantReferenceId, grantedAt: now() });
  };
}
