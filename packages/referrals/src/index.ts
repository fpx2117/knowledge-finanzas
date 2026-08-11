export { ReferralError, isReferralError, referralErrorCodes, type ReferralErrorCode } from "./errors";

export type {
  ReferralCodeStatus,
  ReferralAttributionStatus,
  ReferralRewardStatus,
  ReferralRewardType,
  ReferralQualificationEvent,
  ReferralCodeRecord,
  ReferralAttributionRecord,
  ReferralRewardRecord,
} from "./domain/types";

export { generateReferralCode } from "./domain/generate-code";
export { isWithinAttributionWindow, DEFAULT_REFERRAL_ATTRIBUTION_WINDOW_HOURS } from "./domain/attribution-window";

export {
  DEFAULT_REFERRAL_REWARD_POLICY,
  resolveRewardForReferrer,
  isRewardCapReached,
  cappedPromotionalDays,
  type ReferralRewardPolicy,
} from "./policies/reward-policy";

export {
  noopGrantReferralAiCredits,
  noopGrantReferralPromotionalDays,
  type GrantReferralAiCreditsInput,
  type GrantReferralAiCreditsPort,
  type GrantReferralAiCreditsResult,
  type GrantReferralPromotionalDaysInput,
  type GrantReferralPromotionalDaysPort,
  type GrantReferralPromotionalDaysResult,
} from "./application/ports";

export { createGetOrCreateReferralCode, type GetOrCreateReferralCodeRepository } from "./application/get-or-create-referral-code";
export { createAttributeReferral, type AttributeReferralRepository } from "./application/attribute-referral";
export { createHandleReferralConversion, type HandleReferralConversionRepository } from "./application/handle-referral-conversion";
export { createGrantReferralReward, type GrantReferralRewardRepository } from "./application/grant-referral-reward";
export { createRetryReferralReward } from "./application/retry-referral-reward";
export { createInvalidateReferral, type InvalidateReferralActor, type InvalidateReferralRepository } from "./application/invalidate-referral";
