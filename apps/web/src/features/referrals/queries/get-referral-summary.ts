import type { ReferralAttributionRecord, ReferralAttributionStatus, ReferralCodeRecord, ReferralRewardRecord } from "@know-finanzas/referrals";

export type ReferralInvitationStatus = "REGISTERED" | "CONVERTED_REWARD_PENDING" | "CONVERTED_REWARDED" | "INVALIDATED";

export type ReferralSummaryInvitation = {
  id: string;
  sequence: number;
  status: ReferralInvitationStatus;
  attributedAt: Date;
};

export type ReferralSummaryView = {
  code: string;
  totalSignups: number;
  totalConverted: number;
  totalRewardsGranted: number;
  invitations: ReferralSummaryInvitation[];
  rewardPolicy: {
    nonPaidType: "PROMOTIONAL_PRO_DAYS";
    nonPaidValue: number;
    paidType: "AI_CREDITS";
    paidValue: number;
  };
};

export function deriveInvitationStatus(attributionStatus: ReferralAttributionStatus, reward: ReferralRewardRecord | null): ReferralInvitationStatus {
  if (attributionStatus === "INVALIDATED") return "INVALIDATED";
  if (attributionStatus === "ATTRIBUTED") return "REGISTERED";
  return reward?.status === "GRANTED" ? "CONVERTED_REWARDED" : "CONVERTED_REWARD_PENDING";
}

// Every figure here comes straight from persisted rows — never estimated or computed
// client-side (task's Domain Rule: "the referral page never invents or estimates reward
// values"). Invitations are shown ordinally (sequence only), never by referred-user identity
// (Security Requirement: never expose the referred user's email/financial data to the referrer).
export function createGetReferralSummary(dependencies: {
  getOrCreateReferralCode(input: { ownerUserId: string }): Promise<ReferralCodeRecord>;
  listAttributionsForReferrer(referrerUserId: string): Promise<Array<{ attribution: ReferralAttributionRecord; reward: ReferralRewardRecord | null }>>;
  rewardPolicy: { nonPaidType: "PROMOTIONAL_PRO_DAYS"; nonPaidValue: number; paidType: "AI_CREDITS"; paidValue: number };
}) {
  return async function getReferralSummary(userId: string): Promise<ReferralSummaryView> {
    const [code, rows] = await Promise.all([
      dependencies.getOrCreateReferralCode({ ownerUserId: userId }),
      dependencies.listAttributionsForReferrer(userId),
    ]);

    const invitations: ReferralSummaryInvitation[] = rows.map((row, index) => ({
      id: row.attribution.id,
      sequence: index + 1,
      status: deriveInvitationStatus(row.attribution.status, row.reward),
      attributedAt: row.attribution.attributedAt,
    }));

    return {
      code: code.code,
      totalSignups: invitations.length,
      totalConverted: rows.filter((row) => row.attribution.status === "CONVERTED").length,
      totalRewardsGranted: rows.filter((row) => row.reward?.status === "GRANTED").length,
      invitations,
      rewardPolicy: dependencies.rewardPolicy,
    };
  };
}
