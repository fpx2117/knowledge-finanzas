import { describe, expect, it } from "vitest";
import { createSaveStatisticalProfile, isPrivacyError, type StatisticalProfileRecord, type StatisticalProfileRepository } from "@know-finanzas/privacy";

function record(overrides: Partial<StatisticalProfileRecord> = {}): StatisticalProfileRecord {
  return {
    userId: "user-1", ageRange: null, employmentStatus: null, incomeRange: null, householdSizeRange: null, regionCode: null,
    promptDismissedAt: null, updatedAt: new Date("2026-06-15T00:00:00Z"),
    ...overrides,
  };
}

function createFakeRepository(overrides: Partial<StatisticalProfileRepository> = {}): StatisticalProfileRepository {
  return {
    upsertForUser: async (userId, input) => record({ userId, ...input }),
    dismissPromptForUser: async (userId, dismissedAt) => record({ userId, promptDismissedAt: dismissedAt }),
    ...overrides,
  };
}

describe("saveStatisticalProfile", () => {
  it("accepts a completely empty profile (every field skipped)", async () => {
    const saveStatisticalProfile = createSaveStatisticalProfile({ repository: createFakeRepository() });
    const result = await saveStatisticalProfile("user-1", {});
    expect(result.userId).toBe("user-1");
  });

  it("accepts a partially completed profile", async () => {
    const saveStatisticalProfile = createSaveStatisticalProfile({ repository: createFakeRepository() });
    const result = await saveStatisticalProfile("user-1", { ageRange: "25-34" });
    expect(result.ageRange).toBe("25-34");
  });

  it("accepts PREFER_NOT_TO_SAY for every enumerated field", async () => {
    const saveStatisticalProfile = createSaveStatisticalProfile({ repository: createFakeRepository() });
    const result = await saveStatisticalProfile("user-1", {
      ageRange: "PREFER_NOT_TO_SAY", employmentStatus: "PREFER_NOT_TO_SAY", incomeRange: "PREFER_NOT_TO_SAY",
      householdSizeRange: "PREFER_NOT_TO_SAY", regionCode: "PREFER_NOT_TO_SAY",
    });
    expect(result.regionCode).toBe("PREFER_NOT_TO_SAY");
  });

  it("accepts a well-formed ISO 3166-1 alpha-2 region code", async () => {
    const saveStatisticalProfile = createSaveStatisticalProfile({ repository: createFakeRepository() });
    const result = await saveStatisticalProfile("user-1", { regionCode: "AR" });
    expect(result.regionCode).toBe("AR");
  });

  it("rejects an invalid enum value rather than silently accepting it", async () => {
    const saveStatisticalProfile = createSaveStatisticalProfile({ repository: createFakeRepository() });
    await expect(saveStatisticalProfile("user-1", { ageRange: "not-a-real-range" as never }))
      .rejects.toSatisfy((error) => isPrivacyError(error) && error.code === "PRIVACY_INVALID_STATISTICAL_PROFILE_FIELD");
  });

  it("rejects a malformed region code", async () => {
    const saveStatisticalProfile = createSaveStatisticalProfile({ repository: createFakeRepository() });
    await expect(saveStatisticalProfile("user-1", { regionCode: "Argentina" }))
      .rejects.toSatisfy((error) => isPrivacyError(error));
  });
});
