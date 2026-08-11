export type AdminAggregateAnalyticsSummary = {
  totalUsers: number;
  consentedProductAnalytics: number;
  consentedExternalAggregatedStatistics: number;
  profileCompletionCount: number;
  latestPeriod: string | null;
  totalCohortCount: number;
  suppressedCohortCount: number;
};

export type AdminAggregateAnalyticsSummaryRepository = {
  countTotalUsers(): Promise<number>;
  countUsersWithGrantedConsent(purpose: string): Promise<number>;
  countProfilesWithAnyFieldFilled(): Promise<number>;
  findLatestCohortPeriod(): Promise<string | null>;
  countRowsForPeriod(period: string, options?: { suppressedOnly?: boolean }): Promise<number>;
};

// Aggregate counts/completion rates only — deliberately has no method here that could return a
// single row of cohort data or any per-user financial detail (Security Requirement: "no user-level
// explorer for the commercial team").
export function createGetAdminAggregateAnalyticsSummary(dependencies: { repository: AdminAggregateAnalyticsSummaryRepository }) {
  return async function getAdminAggregateAnalyticsSummary(): Promise<AdminAggregateAnalyticsSummary> {
    const [totalUsers, consentedProductAnalytics, consentedExternalAggregatedStatistics, profileCompletionCount, latestPeriod] = await Promise.all([
      dependencies.repository.countTotalUsers(),
      dependencies.repository.countUsersWithGrantedConsent("PRODUCT_ANALYTICS"),
      dependencies.repository.countUsersWithGrantedConsent("EXTERNAL_AGGREGATED_STATISTICS"),
      dependencies.repository.countProfilesWithAnyFieldFilled(),
      dependencies.repository.findLatestCohortPeriod(),
    ]);

    const [totalCohortCount, suppressedCohortCount] = latestPeriod
      ? await Promise.all([
          dependencies.repository.countRowsForPeriod(latestPeriod),
          dependencies.repository.countRowsForPeriod(latestPeriod, { suppressedOnly: true }),
        ])
      : [0, 0];

    return {
      totalUsers,
      consentedProductAnalytics,
      consentedExternalAggregatedStatistics,
      profileCompletionCount,
      latestPeriod,
      totalCohortCount,
      suppressedCohortCount,
    };
  };
}
