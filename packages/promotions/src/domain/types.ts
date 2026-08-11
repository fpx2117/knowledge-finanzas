export type PromotionCodeStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "EXPIRED" | "REVOKED";
export type PromotionDurationUnit = "DAYS";
export type PromotionStackingPolicy = "NOT_STACKABLE";
export type PromotionRedemptionStatus = "REDEEMED" | "REVOKED";
export type PromotionalAccessGrantStatus = "ACTIVE" | "EXPIRED" | "REVOKED";
// CODE_REDEMPTION: user-initiated via RedeemPromotionCode. ADMIN_OVERRIDE: a support-mediated
// compensation/exception grant. MANUAL_PROMOTION: an admin-run promotional campaign with no code
// (e.g. granted in bulk). REFERRAL_REWARD: granted by packages/referrals via GrantPromotionalProAccess
// (never a direct table write from that package). All non-CODE_REDEMPTION sources bypass code lookup.
export type PromotionalAccessGrantSource = "CODE_REDEMPTION" | "ADMIN_OVERRIDE" | "MANUAL_PROMOTION" | "REFERRAL_REWARD";
export type PromotionAccessPeriodStatus = "ACTIVE" | "CLOSED";

export type PromotionCodeSnapshot = {
  id: string;
  normalizedCode: string;
  name: string;
  description: string | null;
  status: PromotionCodeStatus;
  accessLevel: string;
  durationValue: number;
  durationUnit: PromotionDurationUnit;
  redemptionStartsAt: Date | null;
  redemptionEndsAt: Date | null;
  maxRedemptions: number | null;
  maxRedemptionsPerUser: number;
  stackingPolicy: PromotionStackingPolicy;
  aiCreditsPerPeriod: number;
  whatsappMessagesPerPeriod: number;
  redemptionCount: number;
};

export type PromotionRedemptionRecord = {
  id: string;
  promotionCodeId: string;
  userId: string;
  status: PromotionRedemptionStatus;
  redeemedAt: Date;
  grantId: string | null;
};

export type PromotionalAccessGrantRecord = {
  id: string;
  userId: string;
  promotionCodeId: string | null;
  redemptionId: string | null;
  accessLevel: string;
  startsAt: Date;
  endsAt: Date;
  status: PromotionalAccessGrantStatus;
  source: PromotionalAccessGrantSource;
  aiCreditsPerPeriod: number;
  whatsappMessagesPerPeriod: number;
};

export type PromotionAccessPeriodRecord = {
  id: string;
  grantId: string;
  sequence: number;
  startsAt: Date;
  endsAt: Date;
  status: PromotionAccessPeriodStatus;
};
