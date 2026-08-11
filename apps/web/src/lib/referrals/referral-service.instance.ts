import { createAICreditRepository, createPromotionRepository, createReferralRepository, db } from "@know-finanzas/db";
import { createGrantPromotionalProAccess, createPromotionService } from "@know-finanzas/promotions";
import {
  cappedPromotionalDays,
  createGetOrCreateReferralCode,
  createInvalidateReferral,
  createRetryReferralReward,
  DEFAULT_REFERRAL_REWARD_POLICY,
  type GrantReferralAiCreditsPort,
  type GrantReferralPromotionalDaysPort,
} from "@know-finanzas/referrals";

const referralRepository = createReferralRepository(db);
const promotionRepository = createPromotionRepository(db);
const aiCreditRepository = createAICreditRepository(db);

const promotionService = createPromotionService({ codes: promotionRepository, grants: promotionRepository });
const grantPromotionalProAccess = createGrantPromotionalProAccess({ repository: promotionRepository });

const DAY_MS = 24 * 60 * 60 * 1000;

// Composes packages/promotions' PromotionService.extendGrant + GrantPromotionalProAccess to
// implement the MAX_REFERRAL_PROMO_DAYS_AHEAD cap — packages/referrals never touches
// promotional_access_grants directly (its Domain Rules), so this orchestration lives here, at the
// apps/web layer TASK-055 explicitly deferred it to.
const grantReferralPromotionalDays: GrantReferralPromotionalDaysPort = async (input) => {
  const now = new Date();
  const existingGrant = await promotionRepository.findActiveGrantForUser(input.userId);

  if (existingGrant) {
    const alreadyBankedDaysAhead = Math.max(0, Math.ceil((existingGrant.endsAt.getTime() - now.getTime()) / DAY_MS));
    const days = cappedPromotionalDays(DEFAULT_REFERRAL_REWARD_POLICY, { requestedDays: input.days, alreadyBankedDaysAhead });
    if (days <= 0) return { ok: false, errorCode: "MAX_REFERRAL_PROMO_DAYS_AHEAD_REACHED" };

    const newEndsAt = new Date(existingGrant.endsAt.getTime() + days * DAY_MS);
    const extended = await promotionService.extendGrant(existingGrant.id, { endsAt: newEndsAt });
    if (!extended) return { ok: false, errorCode: "PROMOTION_GRANT_NOT_FOUND" };
    return { ok: true, grantReferenceId: extended.id };
  }

  const endsAt = new Date(now.getTime() + input.days * DAY_MS);
  const result = await grantPromotionalProAccess({ userId: input.userId, source: "REFERRAL_REWARD", startsAt: now, endsAt });
  if ("alreadyActive" in result) return { ok: false, errorCode: "PROMOTION_ALREADY_ACTIVE" };
  return { ok: true, grantReferenceId: result.grant.id };
};

const grantReferralAiCredits: GrantReferralAiCreditsPort = async (input) => {
  const result = await aiCreditRepository.grantReferralRewardCredits({ userId: input.userId, amount: input.amount, referenceId: input.referenceId });
  if (!result.entry) return { ok: false, errorCode: "AI_CREDIT_GRANT_FAILED" };
  return { ok: true, grantReferenceId: result.entry.id };
};

export const getOrCreateReferralCode = createGetOrCreateReferralCode({ repository: referralRepository });
export const invalidateReferral = createInvalidateReferral({ repository: referralRepository });
export const retryReferralReward = createRetryReferralReward({
  repository: referralRepository,
  grantPromotionalDays: grantReferralPromotionalDays,
  grantAiCredits: grantReferralAiCredits,
});

export { referralRepository };
