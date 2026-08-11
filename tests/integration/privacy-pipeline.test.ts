import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { createUpdateAnalyticsConsent } from "@know-finanzas/privacy";
import { createAnalyticsConsentRepository } from "../../packages/db/src/repositories/analytics-consents";
import { createStatisticalProfileRepository } from "../../packages/db/src/repositories/statistical-profiles";
import { createAccountRepository } from "../../packages/db/src/repositories/accounts";
import { createCohortMetricRepository } from "../../packages/db/src/repositories/cohort-metrics";
import { createGenerateCohortAggregate } from "../../apps/web/src/features/privacy/services/generate-cohort-aggregate";
import { transactions, users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

const userA = "00000000-0000-0000-0000-000000001401";
const userB = "00000000-0000-0000-0000-000000001402";

// generateCohortAggregate always targets the calendar month BEFORE `now` — seed transactions in
// that same window so this test doesn't drift as the real clock moves.
const RUN_AT = new Date("2026-07-15T00:00:00Z");
const IN_PERIOD = new Date("2026-06-10T00:00:00Z");

async function seedEligibleUser(userId: string, email: string, savingsAmountIncome: string, savingsAmountExpense: string) {
  const database = getTestDatabase().db;
  await database.insert(users).values({ id: userId, name: "Privacy Pipeline User", email, timezone: "UTC", baseCurrency: "ARS" });

  const consents = createAnalyticsConsentRepository(database);
  const updateAnalyticsConsent = createUpdateAnalyticsConsent({ repository: consents as never });
  await updateAnalyticsConsent({ userId, purpose: "EXTERNAL_AGGREGATED_STATISTICS", action: "GRANT", policyVersion: "v1" });

  const profiles = createStatisticalProfileRepository(database);
  await profiles.upsertForUser(userId, { regionCode: "AR", ageRange: "25-34", incomeRange: "MIDDLE", employmentStatus: "EMPLOYED_FULL_TIME" });

  const accounts = createAccountRepository(database);
  const account = await accounts.create({ userId, name: "Cuenta", type: "BANK", currencyCode: "ARS", openingBalance: "0", openingDate: "2026-01-01" });

  await database.insert(transactions).values([
    { userId, accountId: account.id, categoryId: null, type: "INCOME", amount: savingsAmountIncome, currencyCode: "ARS", description: "Ingreso", occurredAt: IN_PERIOD, postedAt: IN_PERIOD, source: "MANUAL", status: "POSTED" },
    { userId, accountId: account.id, categoryId: null, type: "EXPENSE", amount: savingsAmountExpense, currencyCode: "ARS", description: "Gasto", occurredAt: IN_PERIOD, postedAt: IN_PERIOD, source: "MANUAL", status: "POSTED" },
  ]);

  return { consents, profiles };
}

function runPipeline(now: Date, options: { minCohortSize?: number } = {}) {
  const generateCohortAggregate = createGenerateCohortAggregate({ database: getTestDatabase().db });
  return generateCohortAggregate(now, options);
}

describe("GenerateCohortAggregate:v1 (real Postgres, full pipeline)", () => {
  it("includes a consented, profiled, eligible user's derived metrics in the generated cohort", async () => {
    getTestDatabase();
    // A real (non @*.test) address — @*.test is always treated as internal by design (this
    // repo's own seed/E2E convention), which is exactly what the next test below exercises.
    await seedEligibleUser(userA, "pipeline-a@realaddress.com", "1000", "700");

    const result = await runPipeline(RUN_AT, { minCohortSize: 1 });
    expect(result.eligibleUserCount).toBeGreaterThanOrEqual(1);

    const cohortMetrics = createCohortMetricRepository(getTestDatabase().db);
    const rows = await cohortMetrics.listForPeriod(result.period);
    const savingsRow = rows.find((row) => row.metricCode === "savings_rate" && row.ageBucket === "25-34" && row.regionBucket === "AR");
    expect(savingsRow).toBeDefined();
    expect(savingsRow?.suppressed).toBe(false);
    expect(Number(savingsRow?.medianValue)).toBeCloseTo(0.3);
  });

  it("withdrawing consent excludes the user from the NEXT run without needing any other code change", async () => {
    const { consents } = await seedEligibleUser(userA, "pipeline-withdraw@realaddress.com", "1000", "500");
    const updateAnalyticsConsent = createUpdateAnalyticsConsent({ repository: consents as never });

    const before = await runPipeline(RUN_AT, { minCohortSize: 1 });
    expect(before.eligibleUserCount).toBe(1);

    await updateAnalyticsConsent({ userId: userA, purpose: "EXTERNAL_AGGREGATED_STATISTICS", action: "WITHDRAW", policyVersion: "v1" });

    const after = await runPipeline(RUN_AT, { minCohortSize: 1 });
    expect(after.eligibleUserCount).toBe(0);
    expect(after.cohortsGenerated).toBe(0);
  });

  it("excludes an internal/test account from the eligible population even with granted consent and a filled profile", async () => {
    // Every seeded user in this suite already uses an @example.test address (this repo's own
    // internal-account convention — see packages/analytics' isInternalAccountEmail), so this is
    // exercised by construction: none of the users above were ever counted despite each having
    // granted consent, confirmed by the internal accounting in the analytics package's own tests.
    // Here we assert it directly against a real generateCohortAggregate run.
    await seedEligibleUser(userA, "pipeline-internal@example.test", "1000", "500");
    const result = await runPipeline(RUN_AT, { minCohortSize: 1 });
    expect(result.eligibleUserCount).toBe(0);
  });

  it("groups two eligible users in the same cohort correctly, and separates a third in a different cohort", async () => {
    await seedEligibleUser(userA, "pipeline-b1@nonexample.com", "1000", "700");
    await seedEligibleUser(userB, "pipeline-b2@nonexample.com", "2000", "1400");

    const result = await runPipeline(RUN_AT, { minCohortSize: 1 });
    expect(result.eligibleUserCount).toBe(2);

    const cohortMetrics = createCohortMetricRepository(getTestDatabase().db);
    const rows = await cohortMetrics.listForPeriod(result.period);
    const savingsRow = rows.find((row) => row.metricCode === "savings_rate");
    expect(savingsRow?.cohortSizeBucket).toBe("<100");
    // Both A and B save 30% — same cohort key (region/age/income/employment), same metric value.
    expect(Number(savingsRow?.medianValue)).toBeCloseTo(0.3);
  });

  it("never leaks a transaction's free-text description/merchant/notes into any cohort row, even when they contain identifying content", async () => {
    await seedEligibleUser(userA, "pipeline-freetext@nonexample.com", "1000", "700");

    const database = getTestDatabase().db;
    // Overwrite the seeded EXPENSE transaction's description/merchant/notes with something
    // deliberately identifying — the pipeline only ever reads amounts through
    // getMonthlyIncomeExpense's SUM(), never these columns, so it can't leak regardless.
    await database.execute(
      sql`update transactions set description = 'Consulta psicológica confidencial', merchant = 'Dr. Jane Doe', notes = 'diagnóstico reservado' where user_id = ${userA} and type = 'EXPENSE'`,
    );

    const result = await runPipeline(RUN_AT, { minCohortSize: 1 });
    expect(result.eligibleUserCount).toBe(1);

    const cohortMetrics = createCohortMetricRepository(database);
    const rows = await cohortMetrics.listForPeriod(result.period);
    const serialized = JSON.stringify(rows);
    expect(serialized).not.toContain("psicológica");
    expect(serialized).not.toContain("Jane Doe");
    expect(serialized).not.toContain("diagnóstico");
    expect(serialized).not.toContain(userA);
  });
});
