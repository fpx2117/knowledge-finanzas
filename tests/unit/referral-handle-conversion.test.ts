import { describe, expect, it } from "vitest";
import {
  createHandleReferralConversion,
  isReferralError,
  type HandleReferralConversionRepository,
  type ReferralAttributionRecord,
  type ReferralRewardRecord,
} from "@know-finanzas/referrals";

function attribution(overrides: Partial<ReferralAttributionRecord> = {}): ReferralAttributionRecord {
  return {
    id: "attribution-1",
    referralCodeId: "code-1",
    referrerUserId: "referrer-1",
    referredUserId: "referred-1",
    status: "ATTRIBUTED",
    attributedAt: new Date("2026-06-15T00:00:00Z"),
    convertedAt: null,
    invalidatedAt: null,
    invalidatedBy: null,
    invalidationReason: null,
    ...overrides,
  };
}

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

function createFakeRepository(overrides: Partial<HandleReferralConversionRepository> = {}): HandleReferralConversionRepository {
  return {
    findAttributionByReferredUser: async () => attribution(),
    markConverted: async (input) => attribution({ id: input.attributionId, status: "CONVERTED", convertedAt: input.convertedAt }),
    countRewardsGrantedToBeneficiarySince: async () => 0,
    createPendingReward: async (input) => reward({ referralAttributionId: input.referralAttributionId, beneficiaryUserId: input.beneficiaryUserId, type: input.type, value: input.value, rewardPolicyVersion: input.rewardPolicyVersion }),
    ...overrides,
  };
}

describe("handleReferralConversion", () => {
  it("converts an ATTRIBUTED attribution and creates a PENDING reward", async () => {
    const handleReferralConversion = createHandleReferralConversion({ repository: createFakeRepository() });
    const result = await handleReferralConversion({ referredUserId: "referred-1", referrerHasEffectivePaidAccess: false });
    expect(result.attribution.status).toBe("CONVERTED");
    expect(result.reward).not.toBeNull();
    expect(result.reward?.type).toBe("PROMOTIONAL_PRO_DAYS");
  });

  it("grants AI credits when the referrer already has effective paid access", async () => {
    const handleReferralConversion = createHandleReferralConversion({ repository: createFakeRepository() });
    const result = await handleReferralConversion({ referredUserId: "referred-1", referrerHasEffectivePaidAccess: true });
    expect(result.reward?.type).toBe("AI_CREDITS");
    expect(result.reward?.value).toBe(100);
  });

  it("is idempotent: a second call for an already-CONVERTED attribution does not error and reuses the reward", async () => {
    let markConvertedCalls = 0;
    const handleReferralConversion = createHandleReferralConversion({
      repository: createFakeRepository({
        findAttributionByReferredUser: async () => attribution({ status: "CONVERTED", convertedAt: new Date("2026-06-15T01:00:00Z") }),
        markConverted: async () => {
          markConvertedCalls += 1;
          throw new Error("should not be called for an already-CONVERTED attribution");
        },
      }),
    });
    const result = await handleReferralConversion({ referredUserId: "referred-1", referrerHasEffectivePaidAccess: false });
    expect(markConvertedCalls).toBe(0);
    expect(result.attribution.status).toBe("CONVERTED");
  });

  it("throws when no attribution exists for the referred user", async () => {
    const handleReferralConversion = createHandleReferralConversion({
      repository: createFakeRepository({ findAttributionByReferredUser: async () => undefined }),
    });
    await expect(handleReferralConversion({ referredUserId: "referred-1", referrerHasEffectivePaidAccess: false }))
      .rejects.toSatisfy((error) => isReferralError(error) && error.code === "REFERRAL_ATTRIBUTION_NOT_FOUND");
  });

  it("leaves an INVALIDATED attribution untouched and grants no reward", async () => {
    const handleReferralConversion = createHandleReferralConversion({
      repository: createFakeRepository({ findAttributionByReferredUser: async () => attribution({ status: "INVALIDATED" }) }),
    });
    const result = await handleReferralConversion({ referredUserId: "referred-1", referrerHasEffectivePaidAccess: false });
    expect(result.attribution.status).toBe("INVALIDATED");
    expect(result.reward).toBeNull();
  });

  it("grants no reward once the per-period cap is reached", async () => {
    const handleReferralConversion = createHandleReferralConversion({
      repository: createFakeRepository({ countRewardsGrantedToBeneficiarySince: async () => 3 }),
    });
    const result = await handleReferralConversion({ referredUserId: "referred-1", referrerHasEffectivePaidAccess: false });
    expect(result.reward).toBeNull();
  });
});
