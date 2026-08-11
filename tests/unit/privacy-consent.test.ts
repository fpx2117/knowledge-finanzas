import { describe, expect, it } from "vitest";
import { createGetAnalyticsConsent, createUpdateAnalyticsConsent, type AnalyticsConsentRecord, type AnalyticsConsentRepository } from "@know-finanzas/privacy";

function record(overrides: Partial<AnalyticsConsentRecord> = {}): AnalyticsConsentRecord {
  return {
    id: "consent-1",
    userId: "user-1",
    purpose: "PRODUCT_ANALYTICS",
    status: "WITHDRAWN",
    policyVersion: "v1",
    grantedAt: null,
    withdrawnAt: null,
    createdAt: new Date("2026-06-15T00:00:00Z"),
    ...overrides,
  };
}

function createFakeRepository(overrides: Partial<AnalyticsConsentRepository> = {}): AnalyticsConsentRepository {
  const history: Array<{ status: string; occurredAt: Date }> = [];
  return {
    findCurrentForUser: async () => undefined,
    upsertAndRecordHistory: async (input) => {
      history.push({ status: input.status, occurredAt: input.occurredAt });
      return record({ status: input.status, policyVersion: input.policyVersion, grantedAt: input.status === "GRANTED" ? input.occurredAt : null, withdrawnAt: input.status === "WITHDRAWN" ? input.occurredAt : null });
    },
    ...overrides,
  };
}

describe("updateAnalyticsConsent", () => {
  it("transitions to GRANTED on a GRANT action", async () => {
    const updateAnalyticsConsent = createUpdateAnalyticsConsent({ repository: createFakeRepository(), now: () => new Date("2026-06-15T00:00:00Z") });
    const result = await updateAnalyticsConsent({ userId: "user-1", purpose: "PRODUCT_ANALYTICS", action: "GRANT", policyVersion: "v1" });
    expect(result.status).toBe("GRANTED");
    expect(result.grantedAt).toEqual(new Date("2026-06-15T00:00:00Z"));
  });

  it("transitions to WITHDRAWN on a WITHDRAW action", async () => {
    const updateAnalyticsConsent = createUpdateAnalyticsConsent({ repository: createFakeRepository(), now: () => new Date("2026-06-15T00:00:00Z") });
    const result = await updateAnalyticsConsent({ userId: "user-1", purpose: "PRODUCT_ANALYTICS", action: "WITHDRAW", policyVersion: "v1" });
    expect(result.status).toBe("WITHDRAWN");
    expect(result.withdrawnAt).toEqual(new Date("2026-06-15T00:00:00Z"));
  });

  it("calls the repository's atomic upsert-and-record-history method exactly once per call", async () => {
    let calls = 0;
    const repository = createFakeRepository({ upsertAndRecordHistory: async (input) => { calls += 1; return record({ status: input.status }); } });
    const updateAnalyticsConsent = createUpdateAnalyticsConsent({ repository });
    await updateAnalyticsConsent({ userId: "user-1", purpose: "PRODUCT_ANALYTICS", action: "GRANT", policyVersion: "v1" });
    expect(calls).toBe(1);
  });
});

describe("getAnalyticsConsent", () => {
  it("reports WITHDRAWN when no consent row exists (default is always off, never assumed)", async () => {
    const getAnalyticsConsent = createGetAnalyticsConsent({ repository: createFakeRepository({ findCurrentForUser: async () => undefined }) });
    const status = await getAnalyticsConsent("user-1", "EXTERNAL_AGGREGATED_STATISTICS");
    expect(status).toBe("WITHDRAWN");
  });

  it("reports the current stored status when a row exists", async () => {
    const getAnalyticsConsent = createGetAnalyticsConsent({ repository: createFakeRepository({ findCurrentForUser: async () => record({ status: "GRANTED" }) }) });
    const status = await getAnalyticsConsent("user-1", "PRODUCT_ANALYTICS");
    expect(status).toBe("GRANTED");
  });
});
