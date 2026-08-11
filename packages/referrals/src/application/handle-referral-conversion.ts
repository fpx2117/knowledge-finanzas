import { ReferralError } from "../errors";
import { DEFAULT_REFERRAL_REWARD_POLICY, isRewardCapReached, resolveRewardForReferrer, type ReferralRewardPolicy } from "../policies/reward-policy";
import type { ReferralAttributionRecord, ReferralRewardRecord } from "../domain/types";

export type HandleReferralConversionRepository = {
  findAttributionByReferredUser(referredUserId: string): Promise<ReferralAttributionRecord | undefined>;
  // No-op if already CONVERTED — this makes the whole flow safe to call twice for the same
  // referredUserId (task's Idempotency Requirements: duplicate qualification events).
  markConverted(input: { attributionId: string; convertedAt: Date }): Promise<ReferralAttributionRecord>;
  countRewardsGrantedToBeneficiarySince(input: { beneficiaryUserId: string; since: Date }): Promise<number>;
  // Idempotent on the (referralAttributionId, qualificationEvent, beneficiaryUserId) unique
  // constraint: a second call for the same attribution returns the existing PENDING/GRANTED row
  // instead of erroring.
  createPendingReward(input: {
    referralAttributionId: string;
    beneficiaryUserId: string;
    type: "PROMOTIONAL_PRO_DAYS" | "AI_CREDITS";
    value: number;
    rewardPolicyVersion: string;
  }): Promise<ReferralRewardRecord>;
};

export function createHandleReferralConversion(dependencies: {
  repository: HandleReferralConversionRepository;
  policy?: ReferralRewardPolicy;
  now?: () => Date;
}) {
  const now = dependencies.now ?? (() => new Date());
  const policy = dependencies.policy ?? DEFAULT_REFERRAL_REWARD_POLICY;

  return async function handleReferralConversion(input: {
    referredUserId: string;
    // Whether the referrer (the reward beneficiary) currently has effective paid Pro access —
    // resolved by the caller from @know-finanzas/billing, not imported here, keeping this
    // package decoupled (same pattern as promotions' hasActivePaidSubscription).
    referrerHasEffectivePaidAccess: boolean;
    occurredAt?: Date;
  }): Promise<{ attribution: ReferralAttributionRecord; reward: ReferralRewardRecord | null }> {
    const attribution = await dependencies.repository.findAttributionByReferredUser(input.referredUserId);
    if (!attribution) throw new ReferralError("REFERRAL_ATTRIBUTION_NOT_FOUND");
    if (attribution.status === "INVALIDATED") return { attribution, reward: null };

    const convertedAt = input.occurredAt ?? now();
    const convertedAttribution =
      attribution.status === "CONVERTED" ? attribution : await dependencies.repository.markConverted({ attributionId: attribution.id, convertedAt });

    const periodStart = new Date(convertedAt.getTime() - policy.rewardPeriodDays * 24 * 60 * 60 * 1000);
    const rewardsGrantedInPeriod = await dependencies.repository.countRewardsGrantedToBeneficiarySince({
      beneficiaryUserId: attribution.referrerUserId,
      since: periodStart,
    });
    if (isRewardCapReached(policy, { rewardsGrantedInPeriod })) {
      return { attribution: convertedAttribution, reward: null };
    }

    const { type, value } = resolveRewardForReferrer(policy, { referrerHasEffectivePaidAccess: input.referrerHasEffectivePaidAccess });

    const reward = await dependencies.repository.createPendingReward({
      referralAttributionId: convertedAttribution.id,
      beneficiaryUserId: convertedAttribution.referrerUserId,
      type,
      value,
      rewardPolicyVersion: policy.version,
    });

    return { attribution: convertedAttribution, reward };
  };
}
