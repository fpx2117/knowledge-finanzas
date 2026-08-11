import { describe, expect, it } from "vitest";
import { createGetOrCreateReferralCode, type GetOrCreateReferralCodeRepository, type ReferralCodeRecord } from "@know-finanzas/referrals";

function code(overrides: Partial<ReferralCodeRecord> = {}): ReferralCodeRecord {
  return { id: "code-1", ownerUserId: "user-1", code: "ABCD2345", status: "ACTIVE", ...overrides };
}

describe("getOrCreateReferralCode", () => {
  it("returns an existing active code without creating a new one", async () => {
    let createCalls = 0;
    const getOrCreateReferralCode = createGetOrCreateReferralCode({
      repository: {
        findActiveCodeByOwner: async () => code(),
        createCode: async (input) => {
          createCalls += 1;
          return code(input);
        },
      },
    });
    const result = await getOrCreateReferralCode({ ownerUserId: "user-1" });
    expect(result.code).toBe("ABCD2345");
    expect(createCalls).toBe(0);
  });

  it("creates a new code using the injected generator when none exists", async () => {
    const repository: GetOrCreateReferralCodeRepository = {
      findActiveCodeByOwner: async () => undefined,
      createCode: async (input) => code(input),
    };
    const getOrCreateReferralCode = createGetOrCreateReferralCode({ repository, generateCode: () => "WXYZ6789" });
    const result = await getOrCreateReferralCode({ ownerUserId: "user-1" });
    expect(result.code).toBe("WXYZ6789");
  });
});
