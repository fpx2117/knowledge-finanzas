import { describe, expect, it } from "vitest";
import {
  createGrantReferralReward,
  isReferralError,
  type GrantReferralRewardRepository,
  type ReferralRewardRecord,
} from "@know-finanzas/referrals";

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

describe("grantReferralReward", () => {
  it("grants promotional days via the promotional-days port for a PROMOTIONAL_PRO_DAYS reward", async () => {
    const grantReferralReward = createGrantReferralReward({
      repository: createFakeRepository(),
      grantPromotionalDays: async () => ({ ok: true, grantReferenceId: "grant-1" }),
    });
    const result = await grantReferralReward({ rewardId: "reward-1" });
    expect(result.status).toBe("GRANTED");
    expect(result.grantReferenceId).toBe("grant-1");
  });

  it("grants AI credits via the AI-credits port for an AI_CREDITS reward", async () => {
    const grantReferralReward = createGrantReferralReward({
      repository: createFakeRepository({ findRewardById: async () => reward({ type: "AI_CREDITS", value: 100 }) }),
      grantAiCredits: async () => ({ ok: true, grantReferenceId: "grant-2" }),
    });
    const result = await grantReferralReward({ rewardId: "reward-1" });
    expect(result.status).toBe("GRANTED");
    expect(result.grantReferenceId).toBe("grant-2");
  });

  it("marks the reward FAILED without throwing when the port reports failure — never rolls back anything upstream", async () => {
    const grantReferralReward = createGrantReferralReward({
      repository: createFakeRepository(),
      grantPromotionalDays: async () => ({ ok: false, errorCode: "PROMOTION_ALREADY_ACTIVE" }),
    });
    const result = await grantReferralReward({ rewardId: "reward-1" });
    expect(result.status).toBe("FAILED");
    expect(result.failureReason).toBe("PROMOTION_ALREADY_ACTIVE");
  });

  it("is idempotent: a reward already GRANTED is returned as-is without calling any port again", async () => {
    let portCalls = 0;
    const grantReferralReward = createGrantReferralReward({
      repository: createFakeRepository({ findRewardById: async () => reward({ status: "GRANTED", grantReferenceId: "grant-1" }) }),
      grantPromotionalDays: async () => {
        portCalls += 1;
        return { ok: true, grantReferenceId: "grant-should-not-happen" };
      },
    });
    const result = await grantReferralReward({ rewardId: "reward-1" });
    expect(portCalls).toBe(0);
    expect(result.grantReferenceId).toBe("grant-1");
  });

  it("allows retrying a FAILED reward", async () => {
    const grantReferralReward = createGrantReferralReward({
      repository: createFakeRepository({ findRewardById: async () => reward({ status: "FAILED", failureReason: "PORT_NOT_WIRED" }) }),
      grantPromotionalDays: async () => ({ ok: true, grantReferenceId: "grant-retry" }),
    });
    const result = await grantReferralReward({ rewardId: "reward-1" });
    expect(result.status).toBe("GRANTED");
  });

  it("throws when the reward does not exist", async () => {
    const grantReferralReward = createGrantReferralReward({ repository: createFakeRepository({ findRewardById: async () => undefined }) });
    await expect(grantReferralReward({ rewardId: "missing" })).rejects.toSatisfy((error) => isReferralError(error) && error.code === "REFERRAL_REWARD_NOT_FOUND");
  });

  it("throws when the reward is INVALIDATED (not retryable)", async () => {
    const grantReferralReward = createGrantReferralReward({ repository: createFakeRepository({ findRewardById: async () => reward({ status: "INVALIDATED" }) }) });
    await expect(grantReferralReward({ rewardId: "reward-1" })).rejects.toSatisfy((error) => isReferralError(error) && error.code === "REFERRAL_REWARD_NOT_RETRYABLE");
  });
});
