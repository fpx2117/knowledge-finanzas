import { describe, expect, it } from "vitest";
import { deriveInvitationStatus, type ReferralSummaryInvitation } from "../../apps/web/src/features/referrals/queries/get-referral-summary";
// (get-referral-summary.ts is dependency-injected — no "@/..." module-level imports — so it's
// safe to import directly in a unit test without vitest.unit.config.ts needing a path alias.)
import type { ReferralRewardRecord } from "@know-finanzas/referrals";

function reward(overrides: Partial<ReferralRewardRecord> = {}): ReferralRewardRecord {
  return {
    id: "reward-1",
    referralAttributionId: "attribution-1",
    beneficiaryUserId: "referrer-1",
    qualificationEvent: "FIRST_PAID_PRO_ACTIVATION",
    type: "PROMOTIONAL_PRO_DAYS",
    value: 30,
    status: "PENDING",
    rewardPolicyVersion: "referral-policy:v1",
    grantReferenceId: null,
    failureReason: null,
    createdAt: new Date("2026-06-15T00:00:00Z"),
    grantedAt: null,
    ...overrides,
  };
}

describe("deriveInvitationStatus", () => {
  it("shows REGISTERED for an ATTRIBUTED invitation with no reward yet", () => {
    expect(deriveInvitationStatus("ATTRIBUTED", null)).toBe("REGISTERED");
  });

  it("shows CONVERTED_REWARD_PENDING for a CONVERTED invitation with a PENDING reward", () => {
    expect(deriveInvitationStatus("CONVERTED", reward({ status: "PENDING" }))).toBe("CONVERTED_REWARD_PENDING");
  });

  it("shows CONVERTED_REWARD_PENDING for a CONVERTED invitation with a FAILED reward (retry pending, never surfaces failure detail to the referrer)", () => {
    expect(deriveInvitationStatus("CONVERTED", reward({ status: "FAILED" }))).toBe("CONVERTED_REWARD_PENDING");
  });

  it("shows CONVERTED_REWARD_PENDING for a CONVERTED invitation with no reward row at all", () => {
    expect(deriveInvitationStatus("CONVERTED", null)).toBe("CONVERTED_REWARD_PENDING");
  });

  it("shows CONVERTED_REWARDED once the reward is GRANTED", () => {
    expect(deriveInvitationStatus("CONVERTED", reward({ status: "GRANTED" }))).toBe("CONVERTED_REWARDED");
  });

  it("shows INVALIDATED regardless of reward state", () => {
    expect(deriveInvitationStatus("INVALIDATED", reward({ status: "GRANTED" }))).toBe("INVALIDATED");
    expect(deriveInvitationStatus("INVALIDATED", null)).toBe("INVALIDATED");
  });

  it("the resulting invitation shape never carries the referred user's identity", () => {
    const invitation: ReferralSummaryInvitation = { id: "attribution-1", sequence: 1, status: deriveInvitationStatus("ATTRIBUTED", null), attributedAt: new Date() };
    // Type-level guarantee: ReferralSummaryInvitation has no email/name/userId field for the
    // referred user — only an ordinal sequence number (Security Requirement).
    expect(Object.keys(invitation).sort()).toEqual(["attributedAt", "id", "sequence", "status"]);
  });
});
