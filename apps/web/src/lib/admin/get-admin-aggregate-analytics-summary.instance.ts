import { createAdminOverviewRepository, createAnalyticsConsentRepository, createCohortMetricRepository, createStatisticalProfileRepository, db } from "@know-finanzas/db";
import { createGetAdminAggregateAnalyticsSummary } from "@/features/admin/analytics/services/get-admin-aggregate-analytics-summary";

const overview = createAdminOverviewRepository(db);
const consents = createAnalyticsConsentRepository(db);
const profiles = createStatisticalProfileRepository(db);
const cohorts = createCohortMetricRepository(db);

export const getAdminAggregateAnalyticsSummary = createGetAdminAggregateAnalyticsSummary({
  repository: {
    countTotalUsers: () => overview.countTotalUsers(),
    countUsersWithGrantedConsent: (purpose) => consents.countUsersWithGrantedConsent(purpose),
    countProfilesWithAnyFieldFilled: () => profiles.countProfilesWithAnyFieldFilled(),
    findLatestCohortPeriod: () => cohorts.findLatestCohortPeriod(),
    countRowsForPeriod: (period, options) => cohorts.countRowsForPeriod(period, options),
  },
});
