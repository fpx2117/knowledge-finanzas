export type ReferralCodeStatus = "ACTIVE" | "REVOKED";
export type ReferralAttributionStatus = "ATTRIBUTED" | "CONVERTED" | "INVALIDATED";
export type ReferralRewardStatus = "PENDING" | "GRANTED" | "FAILED" | "INVALIDATED";
export type ReferralRewardType = "PROMOTIONAL_PRO_DAYS" | "AI_CREDITS";
export type ReferralQualificationEvent = "FIRST_PAID_PRO_ACTIVATION";

export type ReferralCodeRecord = {
  id: string;
  ownerUserId: string;
  code: string;
  status: ReferralCodeStatus;
};

export type ReferralAttributionRecord = {
  id: string;
  referralCodeId: string;
  referrerUserId: string;
  referredUserId: string;
  status: ReferralAttributionStatus;
  attributedAt: Date;
  convertedAt: Date | null;
  invalidatedAt: Date | null;
  invalidatedBy: string | null;
  invalidationReason: string | null;
};

export type ReferralRewardRecord = {
  id: string;
  referralAttributionId: string;
  beneficiaryUserId: string;
  qualificationEvent: ReferralQualificationEvent;
  type: ReferralRewardType;
  value: number;
  status: ReferralRewardStatus;
  rewardPolicyVersion: string;
  grantReferenceId: string | null;
  failureReason: string | null;
  createdAt: Date;
  grantedAt: Date | null;
};
