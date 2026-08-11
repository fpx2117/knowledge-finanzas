import { describe, expect, it } from "vitest";
import {
  createAttributeReferral,
  isReferralError,
  type AttributeReferralRepository,
  type ReferralAttributionRecord,
  type ReferralCodeRecord,
} from "@know-finanzas/referrals";

function code(overrides: Partial<ReferralCodeRecord> = {}): ReferralCodeRecord {
  return { id: "code-1", ownerUserId: "referrer-1", code: "ABCD2345", status: "ACTIVE", ...overrides };
}

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

function createFakeRepository(overrides: Partial<AttributeReferralRepository> = {}): AttributeReferralRepository {
  return {
    findActiveCodeByCode: async () => code(),
    findAttributionByReferredUser: async () => undefined,
    createAttribution: async (input) => attribution(input),
    ...overrides,
  };
}

const now = new Date("2026-06-15T01:00:00Z");
const referredUserCreatedAt = new Date("2026-06-15T00:00:00Z");

describe("attributeReferral", () => {
  it("creates an attribution for a valid code submitted within the window", async () => {
    const attributeReferral = createAttributeReferral({ repository: createFakeRepository(), now: () => now });
    const result = await attributeReferral({ rawCode: "abcd2345", referredUserId: "referred-1", referredUserCreatedAt });
    expect(result.referrerUserId).toBe("referrer-1");
    expect(result.referredUserId).toBe("referred-1");
  });

  it("rejects self-referral", async () => {
    const attributeReferral = createAttributeReferral({
      repository: createFakeRepository({ findActiveCodeByCode: async () => code({ ownerUserId: "referred-1" }) }),
      now: () => now,
    });
    await expect(attributeReferral({ rawCode: "ABCD2345", referredUserId: "referred-1", referredUserCreatedAt }))
      .rejects.toSatisfy((error) => isReferralError(error) && error.code === "REFERRAL_SELF_REFERRAL");
  });

  it("rejects a code that does not exist", async () => {
    const attributeReferral = createAttributeReferral({
      repository: createFakeRepository({ findActiveCodeByCode: async () => undefined }),
      now: () => now,
    });
    await expect(attributeReferral({ rawCode: "NOPE0000", referredUserId: "referred-1", referredUserCreatedAt }))
      .rejects.toSatisfy((error) => isReferralError(error) && error.code === "REFERRAL_CODE_NOT_FOUND");
  });

  it("rejects a revoked code", async () => {
    const attributeReferral = createAttributeReferral({
      repository: createFakeRepository({ findActiveCodeByCode: async () => code({ status: "REVOKED" }) }),
      now: () => now,
    });
    await expect(attributeReferral({ rawCode: "ABCD2345", referredUserId: "referred-1", referredUserCreatedAt }))
      .rejects.toSatisfy((error) => isReferralError(error) && error.code === "REFERRAL_CODE_REVOKED");
  });

  it("rejects submission outside the post-signup attribution window", async () => {
    const attributeReferral = createAttributeReferral({
      repository: createFakeRepository(),
      now: () => new Date(referredUserCreatedAt.getTime() + 25 * 60 * 60 * 1000),
    });
    await expect(attributeReferral({ rawCode: "ABCD2345", referredUserId: "referred-1", referredUserCreatedAt }))
      .rejects.toSatisfy((error) => isReferralError(error) && error.code === "REFERRAL_ATTRIBUTION_WINDOW_EXPIRED");
  });

  it("rejects a referred user who already has an attribution (idempotent, no double-attribution)", async () => {
    const attributeReferral = createAttributeReferral({
      repository: createFakeRepository({ findAttributionByReferredUser: async () => attribution() }),
      now: () => now,
    });
    await expect(attributeReferral({ rawCode: "ABCD2345", referredUserId: "referred-1", referredUserCreatedAt }))
      .rejects.toSatisfy((error) => isReferralError(error) && error.code === "REFERRAL_ALREADY_ATTRIBUTED");
  });
});
