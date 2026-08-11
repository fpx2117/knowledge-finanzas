import { describe, expect, it } from "vitest";
import {
  createInvalidateReferral,
  isReferralError,
  type InvalidateReferralRepository,
  type ReferralAttributionRecord,
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

function createFakeRepository(overrides: Partial<InvalidateReferralRepository> = {}): InvalidateReferralRepository {
  return {
    findAttributionById: async () => attribution(),
    markInvalidated: async (input) => attribution({ status: "INVALIDATED", invalidatedAt: input.invalidatedAt, invalidatedBy: input.invalidatedBy, invalidationReason: input.invalidationReason }),
    ...overrides,
  };
}

describe("invalidateReferral", () => {
  it("invalidates an attribution when called by an admin with a reason", async () => {
    const invalidateReferral = createInvalidateReferral({ repository: createFakeRepository() });
    const result = await invalidateReferral({ attributionId: "attribution-1", actor: { userId: "admin-1", isAdmin: true }, reason: "fraud" });
    expect(result.status).toBe("INVALIDATED");
    expect(result.invalidationReason).toBe("fraud");
  });

  it("rejects a non-admin actor", async () => {
    const invalidateReferral = createInvalidateReferral({ repository: createFakeRepository() });
    await expect(invalidateReferral({ attributionId: "attribution-1", actor: { userId: "user-1", isAdmin: false }, reason: "fraud" }))
      .rejects.toSatisfy((error) => isReferralError(error));
  });

  it("requires a non-empty reason", async () => {
    const invalidateReferral = createInvalidateReferral({ repository: createFakeRepository() });
    await expect(invalidateReferral({ attributionId: "attribution-1", actor: { userId: "admin-1", isAdmin: true }, reason: "   " }))
      .rejects.toSatisfy((error) => isReferralError(error) && error.code === "REFERRAL_REASON_REQUIRED");
  });

  it("is idempotent: invalidating an already-INVALIDATED attribution returns it unchanged", async () => {
    let markInvalidatedCalls = 0;
    const invalidateReferral = createInvalidateReferral({
      repository: createFakeRepository({
        findAttributionById: async () => attribution({ status: "INVALIDATED" }),
        markInvalidated: async (input) => {
          markInvalidatedCalls += 1;
          return attribution({ status: "INVALIDATED", invalidatedAt: input.invalidatedAt });
        },
      }),
    });
    const result = await invalidateReferral({ attributionId: "attribution-1", actor: { userId: "admin-1", isAdmin: true }, reason: "fraud" });
    expect(markInvalidatedCalls).toBe(0);
    expect(result.status).toBe("INVALIDATED");
  });

  it("throws when the attribution does not exist", async () => {
    const invalidateReferral = createInvalidateReferral({ repository: createFakeRepository({ findAttributionById: async () => undefined }) });
    await expect(invalidateReferral({ attributionId: "missing", actor: { userId: "admin-1", isAdmin: true }, reason: "fraud" }))
      .rejects.toSatisfy((error) => isReferralError(error) && error.code === "REFERRAL_ATTRIBUTION_NOT_FOUND");
  });
});
