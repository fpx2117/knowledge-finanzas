import {
  createAnalyticsConsentRepository, createCohortMetricRepository, createDebtSummaryQueries, createMonthlySummaryQueries,
  createStatisticalProfileRepository, createUserRepository, type Database,
} from "@know-finanzas/db";
import { deriveFinancialMetrics, generateCohortAggregateV1, isEligibleForAggregation, type EligibleUserMetricInput } from "@know-finanzas/privacy";
import { isInternalAccountEmail } from "@know-finanzas/analytics";

const UNSPECIFIED = "UNSPECIFIED";

function previousMonthRange(now: Date): { periodLabel: string; from: Date; to: Date } {
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const periodLabel = `${from.getUTCFullYear()}-${String(from.getUTCMonth() + 1).padStart(2, "0")}`;
  return { periodLabel, from, to };
}

// Pure DI factory (same pattern every other app-layer service in this codebase follows —
// createDashboardService, createBillingPageService, etc.) rather than a module-level singleton
// wired against the global `db` — that's what lets both the real instance (apps/web/src/lib/privacy/
// generate-cohort-aggregate.instance.ts) AND integration tests (which use an isolated test
// database, never the global `db`) construct this against the right connection.
export function createGenerateCohortAggregate(dependencies: { database: Database; internalEmailDomains?: string[] }) {
  const consents = createAnalyticsConsentRepository(dependencies.database);
  const profiles = createStatisticalProfileRepository(dependencies.database);
  const monthlySummary = createMonthlySummaryQueries(dependencies.database);
  const debtSummary = createDebtSummaryQueries(dependencies.database);
  const cohortMetrics = createCohortMetricRepository(dependencies.database);
  const users = createUserRepository(dependencies.database);
  const internalEmailDomains = dependencies.internalEmailDomains ?? [];

  // GenerateCohortAggregate:v1 — "not yet wired to a scheduler" in exactly the same sense as
  // apps/web/src/lib/billing/expire-past-due-subscriptions.instance.ts (TASK-039/041 own the real
  // cron/worker infrastructure). Reads finance data through the SAME queries the dashboard/debt
  // features already use (createMonthlySummaryQueries, createDebtSummaryQueries) — never a
  // bespoke transaction-type reimplementation (Implementation Notes).
  return async function generateCohortAggregate(now: Date = new Date(), options: { minCohortSize?: number } = {}) {
    const { periodLabel, from, to } = previousMonthRange(now);

    const consentedUserIds = await consents.listUserIdsWithGrantedConsent("EXTERNAL_AGGREGATED_STATISTICS");

    const eligibleUsers: EligibleUserMetricInput[] = [];

    for (const userId of consentedUserIds) {
      const [user, profile] = await Promise.all([users.findById(userId), profiles.findForUser(userId)]);
      if (!user) continue;

      const eligible = isEligibleForAggregation({
        externalAggregatedStatisticsConsentGranted: true,
        isInternalOrTestAccount: isInternalAccountEmail(user.email, internalEmailDomains),
      });
      if (!eligible) continue;

      const [incomeExpenseRows, debtPaymentRows] = await Promise.all([
        monthlySummary.getMonthlyIncomeExpense(userId, { from, to }),
        debtSummary.sumDebtPaymentsForUser(userId, { from, to }),
      ]);
      if (incomeExpenseRows.length === 0) continue;

      // A user with balances in multiple currencies contributes one cohort-metric input per
      // currency it holds financial activity in — never mixed/summed across currencies.
      for (const row of incomeExpenseRows) {
        const debtRow = debtPaymentRows.find((debt) => debt.currencyCode === row.currencyCode);
        const metrics = deriveFinancialMetrics({
          currency: row.currencyCode,
          totalIncome: row.incomeTotal,
          totalConsumption: row.netExpense,
          totalDebtPayments: debtRow?.total ?? "0",
        });

        eligibleUsers.push({
          cohortKey: {
            regionBucket: profile?.regionCode ?? UNSPECIFIED,
            ageBucket: profile?.ageRange ?? UNSPECIFIED,
            incomeBucket: profile?.incomeRange ?? UNSPECIFIED,
            employmentBucket: profile?.employmentStatus ?? UNSPECIFIED,
          },
          metrics: { savings_rate: metrics.savingsRate, debt_service_ratio: metrics.debtServiceRatio },
        });
      }
    }

    const rows = generateCohortAggregateV1({ eligibleUsers, period: periodLabel, minCohortSize: options.minCohortSize });
    await cohortMetrics.replaceForPeriod(periodLabel, rows);
    return { period: periodLabel, cohortsGenerated: rows.length, eligibleUserCount: eligibleUsers.length };
  };
}
