export { PromotionError, isPromotionError, promotionErrorCodes, type PromotionErrorCode } from "./errors";

export type {
  PromotionCodeStatus,
  PromotionDurationUnit,
  PromotionStackingPolicy,
  PromotionRedemptionStatus,
  PromotionalAccessGrantStatus,
  PromotionalAccessGrantSource,
  PromotionAccessPeriodStatus,
  PromotionCodeSnapshot,
  PromotionRedemptionRecord,
  PromotionalAccessGrantRecord,
  PromotionAccessPeriodRecord,
} from "./domain/types";

export { normalizePromotionCode } from "./domain/normalize-code";
export { computePromotionUsagePeriods, type UsagePeriodBoundary } from "./domain/compute-usage-periods";
export { decideRedemption, type RedeemDecision, type RedeemDecisionContext } from "./domain/redemption-decision";

export {
  noopAiCreditGrant,
  noopNotificationAllowance,
  type AiCreditGrantPort,
  type NotificationAllowancePort,
  type PromotionAiCreditGrantInput,
  type PromotionNotificationAllowanceInput,
} from "./application/ports";

export {
  createRedeemPromotionCode,
  type RedeemCodeOutcome,
  type RedeemPromotionCodeRepository,
  type RedeemRateLimiter,
} from "./application/redeem-promotion-code";

export { createInMemoryRateLimiter } from "./application/rate-limiter";

export {
  createPromotionService,
  type CreatePromotionCodeInput,
  type PromotionGrantRepository,
  type PromotionServiceRepository,
  type UpdatePromotionCodeInput,
} from "./application/promotion-service";

export { createGrantPromotionalProAccess, type GrantPromotionalProAccessRepository } from "./application/grant-promotional-pro-access";
