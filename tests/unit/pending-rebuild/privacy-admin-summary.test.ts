import { describe, expect, it } from "vitest";
import { createGetAdminAggregateAnalyticsSummary, type AdminAggregateAnalyticsSummaryRepository } from "../../apps/web/src/features/admin/analytics/services/get-admin-aggregate-analytics-summary";

function createFakeRepository(overrides: Partial<AdminAggregateAnalyticsSummaryRepository> = {}): AdminAggregateAnalyticsSummaryRepository {
  return {
    countTotalUsers: async () => 10,
    countUsersWithGrantedConsent: async () => 4,
    countProfilesWithAnyFieldFilled: async () => 3,
    findLatestCohortPeriod: async () => "2026-06",
    countRowsForPeriod: async (_period, options) => (options?.suppressedOnly ? 1 : 5),
    ...overrides,
  };
}

describe("GetAdminAggregateAnalyticsSummary", () => {
  it("returns only aggregate counts — the result shape has no field that could identify a single user (Security Requirement)", async () => {
    const getAdminAggregateAnalyticsSummary = createGetAdminAggregateAnalyticsSummary({ repository: createFakeRepository() });
    const summary = await getAdminAggregateAnalyticsSummary();

    expect(Object.keys(summary).sort()).toEqual([
      "consentedExternalAggregatedStatistics",
      "consentedProductAnalytics",
      "latestPeriod",
      "profileCompletionCount",
      "suppressedCohortCount",
      "totalCohortCount",
      "totalUsers",
    ]);
    // Every value is a number or a period label string — never an object/array that could carry
    // per-user rows or identifiers.
    for (const [key, value] of Object.entries(summary)) {
      if (key === "latestPeriod") { expect(typeof value === "string" || value === null).toBe(true); continue; }
      expect(typeof value).toBe("number");
    }
  });

  it("reports zero cohorts when no aggregation run has ever happened, without calling countRowsForPeriod at all", async () => {
    let called = false;
    const getAdminAggregateAnalyticsSummary = createGetAdminAggregateAnalyticsSummary({
      repository: createFakeRepository({ findLatestCohortPeriod: async () => null, countRowsForPeriod: async () => { called = true; return 0; } }),
    });
    const summary = await getAdminAggregateAnalyticsSummary();
    expect(summary.latestPeriod).toBeNull();
    expect(summary.totalCohortCount).toBe(0);
    expect(summary.suppressedCohortCount).toBe(0);
    expect(called).toBe(false);
  });
});
