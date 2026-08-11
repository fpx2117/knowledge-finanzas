import { describe, expect, it } from "vitest";
import { createRetryReferralReward, isReferralError, type GrantReferralRewardRepository, type ReferralRewardRecord } from "@know-finanzas/referrals";

function reward(overrides: Partial<ReferralRewardRecord> = {}): ReferralRewardRecord {
  return {
    id: "reward-1",
    referralAttributionId: "attribution-1",
    beneficiaryUserId: "referrer-1",
    qualificationEvent: "FIRST_PAID_PRO_ACTIVATION",
    type: "PROMOTIONAL_PRO_DAYS",
    value: 30,
    status: "FAILED",
    rewardPolicyVersion: "referral-policy:v1",
    grantReferenceId: null,
    failureReason: "PORT_NOT_WIRED",
    createdAt: new Date("2026-06-15T01:00:00Z"),
    grantedAt: null,
    ...overrides,
  };
}

function createFakeRepository(overrides: Partial<GrantReferralRewardRepository> = {}): GrantReferralRewardRepository {
  return {
    findRewardById: async () => reward(),
    markGranted: async (input) => reward({ status: "GRANTED", grantReferenceId: input.grantReferenceId, grantedAt: input.grantedAt }),
    markFailed: async (input) => reward({ status: "FAILED", failureReason: input.failureReason }),
    ...overrides,
  };
}

describe("retryReferralReward", () => {
  it("retries a FAILED reward for an admin actor", async () => {
    const retryReferralReward = createRetryReferralReward({
      repository: createFakeRepository(),
      grantPromotionalDays: async () => ({ ok: true, grantReferenceId: "grant-1" }),
    });
    const result = await retryReferralReward({ rewardId: "reward-1", actor: { userId: "admin-1", isAdmin: true } });
    expect(result.status).toBe("GRANTED");
  });

  it("rejects a non-admin actor", async () => {
    const retryReferralReward = createRetryReferralReward({ repository: createFakeRepository() });
    await expect(retryReferralReward({ rewardId: "reward-1", actor: { userId: "user-1", isAdmin: false } }))
      .rejects.toSatisfy((error) => isReferralError(error) && error.code === "REFERRAL_REWARD_NOT_RETRYABLE");
  });

  it("rejects retrying a reward that is not FAILED", async () => {
    const retryReferralReward = createRetryReferralReward({
      repository: createFakeRepository({ findRewardById: async () => reward({ status: "PENDING" }) }),
    });
    await expect(retryReferralReward({ rewardId: "reward-1", actor: { userId: "admin-1", isAdmin: true } }))
      .rejects.toSatisfy((error) => isReferralError(error) && error.code === "REFERRAL_REWARD_NOT_RETRYABLE");
  });

  it("throws when the reward does not exist", async () => {
    const retryReferralReward = createRetryReferralReward({ repository: createFakeRepository({ findRewardById: async () => undefined }) });
    await expect(retryReferralReward({ rewardId: "missing", actor: { userId: "admin-1", isAdmin: true } }))
      .rejects.toSatisfy((error) => isReferralError(error) && error.code === "REFERRAL_REWARD_NOT_FOUND");
  });
});
