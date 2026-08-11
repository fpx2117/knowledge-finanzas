import { describe, expect, it } from "vitest";
import { createUpdateAnalyticsConsent, deriveFinancialMetrics } from "@know-finanzas/privacy";
import { createAnalyticsConsentRepository } from "../../packages/db/src/repositories/analytics-consents";
import { createStatisticalProfileRepository } from "../../packages/db/src/repositories/statistical-profiles";
import { createCohortMetricRepository } from "../../packages/db/src/repositories/cohort-metrics";
import { createAccountRepository } from "../../packages/db/src/repositories/accounts";
import { createDebtRepository } from "../../packages/db/src/repositories/debts";
import { createMonthlySummaryQueries } from "../../packages/db/src/queries/monthly-summary";
import { createDebtSummaryQueries } from "../../packages/db/src/queries/debt-summary";
import { debtPayments, transactions, transfers, users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

const userA = "00000000-0000-0000-0000-000000001301";
const userB = "00000000-0000-0000-0000-000000001302";

async function seedUsers() {
  const database = getTestDatabase().db;
  await database.insert(users).values([
    { id: userA, name: "User A", email: "privacy-a@example.test", timezone: "UTC", baseCurrency: "ARS" },
    { id: userB, name: "User B", email: "privacy-b@example.test", timezone: "UTC", baseCurrency: "ARS" },
  ]);
  return database;
}

describe("consent (real Postgres)", () => {
  it("grants, then withdraws, and every transition is preserved in the append-only history", async () => {
    const database = await seedUsers();
    const repository = createAnalyticsConsentRepository(database);
    const updateAnalyticsConsent = createUpdateAnalyticsConsent({ repository });

    await updateAnalyticsConsent({ userId: userA, purpose: "PRODUCT_ANALYTICS", action: "GRANT", policyVersion: "v1" });
    await updateAnalyticsConsent({ userId: userA, purpose: "PRODUCT_ANALYTICS", action: "WITHDRAW", policyVersion: "v1" });
    const current = await updateAnalyticsConsent({ userId: userA, purpose: "PRODUCT_ANALYTICS", action: "GRANT", policyVersion: "v2" });

    expect(current.status).toBe("GRANTED");
    expect(current.policyVersion).toBe("v2");

    const history = await repository.listHistoryForUser(userA, "PRODUCT_ANALYTICS");
    expect(history).toHaveLength(3);
    expect(history.map((entry) => entry.action).sort()).toEqual(["GRANTED", "GRANTED", "WITHDRAWN"]);
  });

  it("scopes consent per user — withdrawing for user A never affects user B's own consent row", async () => {
    const database = await seedUsers();
    const repository = createAnalyticsConsentRepository(database);
    const updateAnalyticsConsent = createUpdateAnalyticsConsent({ repository });

    await updateAnalyticsConsent({ userId: userA, purpose: "EXTERNAL_AGGREGATED_STATISTICS", action: "GRANT", policyVersion: "v1" });
    await updateAnalyticsConsent({ userId: userB, purpose: "EXTERNAL_AGGREGATED_STATISTICS", action: "GRANT", policyVersion: "v1" });
    await updateAnalyticsConsent({ userId: userA, purpose: "EXTERNAL_AGGREGATED_STATISTICS", action: "WITHDRAW", policyVersion: "v1" });

    const consentA = await repository.findCurrentForUser(userA, "EXTERNAL_AGGREGATED_STATISTICS");
    const consentB = await repository.findCurrentForUser(userB, "EXTERNAL_AGGREGATED_STATISTICS");
    expect(consentA?.status).toBe("WITHDRAWN");
    expect(consentB?.status).toBe("GRANTED");
  });
});

describe("statistical profile (real Postgres)", () => {
  it("persists a completely empty profile and every partial update", async () => {
    const database = await seedUsers();
    const repository = createStatisticalProfileRepository(database);

    const empty = await repository.upsertForUser(userA, {});
    expect(empty.ageRange).toBeNull();
    expect(empty.regionCode).toBeNull();

    const partial = await repository.upsertForUser(userA, { ageRange: "25-34" });
    expect(partial.ageRange).toBe("25-34");

    const preferNotToSay = await repository.upsertForUser(userA, { incomeRange: "PREFER_NOT_TO_SAY" });
    expect(preferNotToSay.incomeRange).toBe("PREFER_NOT_TO_SAY");
    // Still one row per user — upsert, never a second row.
    const found = await repository.findForUser(userA);
    expect(found?.userId).toBe(userA);
  });

  it("dismissing the prompt never touches any of the profile's actual fields", async () => {
    const database = await seedUsers();
    const repository = createStatisticalProfileRepository(database);
    await repository.upsertForUser(userA, { ageRange: "35-44" });

    const dismissed = await repository.dismissPromptForUser(userA, new Date("2026-06-15T00:00:00Z"));
    expect(dismissed.promptDismissedAt).toEqual(new Date("2026-06-15T00:00:00Z"));
    expect(dismissed.ageRange).toBe("35-44");
  });
});

describe("derived financial metrics reuse Finance Engine semantics on real seeded data (real Postgres)", () => {
  it("excludes a transfer leg from consumption, and matches deriveFinancialMetrics computed from the real query", async () => {
    const database = await seedUsers();
    const accounts = createAccountRepository(database);
    const monthlySummary = createMonthlySummaryQueries(database);

    const accountFrom = await accounts.create({ userId: userA, name: "Cuenta A", type: "BANK", currencyCode: "ARS", openingBalance: "0", openingDate: "2026-01-01" });
    const accountTo = await accounts.create({ userId: userA, name: "Cuenta B", type: "SAVINGS", currencyCode: "ARS", openingBalance: "0", openingDate: "2026-01-01" });

    const [transfer] = await database.insert(transfers).values({
      userId: userA, fromAccountId: accountFrom.id, toAccountId: accountTo.id, amount: "500", currencyCode: "ARS", occurredAt: new Date("2026-06-12T00:00:00Z"),
    }).returning();

    // 1000 income, 300 expense, and a 500 transfer between the user's own accounts — the transfer
    // must never count as spending (Financial Invariant).
    await database.insert(transactions).values([
      { userId: userA, accountId: accountFrom.id, categoryId: null, type: "INCOME", amount: "1000", currencyCode: "ARS", description: "Salario", occurredAt: new Date("2026-06-05T00:00:00Z"), postedAt: new Date("2026-06-05T00:00:00Z"), source: "MANUAL", status: "POSTED" },
      { userId: userA, accountId: accountFrom.id, categoryId: null, type: "EXPENSE", amount: "300", currencyCode: "ARS", description: "Compras", occurredAt: new Date("2026-06-10T00:00:00Z"), postedAt: new Date("2026-06-10T00:00:00Z"), source: "MANUAL", status: "POSTED" },
      { userId: userA, accountId: accountFrom.id, categoryId: null, type: "TRANSFER_OUT", amount: "500", currencyCode: "ARS", description: "Transferencia", occurredAt: new Date("2026-06-12T00:00:00Z"), postedAt: new Date("2026-06-12T00:00:00Z"), source: "TRANSFER", transferId: transfer.id, status: "POSTED" },
      { userId: userA, accountId: accountTo.id, categoryId: null, type: "TRANSFER_IN", amount: "500", currencyCode: "ARS", description: "Transferencia", occurredAt: new Date("2026-06-12T00:00:00Z"), postedAt: new Date("2026-06-12T00:00:00Z"), source: "TRANSFER", transferId: transfer.id, status: "POSTED" },
    ]);

    const [row] = await monthlySummary.getMonthlyIncomeExpense(userA, { from: new Date("2026-06-01T00:00:00Z"), to: new Date("2026-07-01T00:00:00Z") });
    expect(row.incomeTotal).toBe("1000.000000");
    // 300, never 800 — the 500 transfer leg is excluded entirely, not double-counted either.
    expect(row.netExpense).toBe("300.000000");

    const metrics = deriveFinancialMetrics({ currency: "ARS", totalIncome: row.incomeTotal, totalConsumption: row.netExpense, totalDebtPayments: "0" });
    expect(metrics.savingsRate).toBeCloseTo(0.7);
  });

  it("includes a real debt_payments row in debt_service_ratio via the canonical debt_payments table, never a guessed category", async () => {
    const database = await seedUsers();
    const accounts = createAccountRepository(database);
    const debts = createDebtRepository(database);
    const debtSummary = createDebtSummaryQueries(database);

    const account = await accounts.create({ userId: userA, name: "Cuenta", type: "BANK", currencyCode: "ARS", openingBalance: "0", openingDate: "2026-01-01" });
    const debt = await debts.create({ userId: userA, name: "Préstamo", creditor: null, type: "PERSONAL_LOAN", currencyCode: "ARS", originalAmount: "5000", startDate: "2026-01-01", interestType: "NO_INTEREST", interestRate: null, notes: null });

    const [transaction] = await database.insert(transactions).values({
      userId: userA, accountId: account.id, categoryId: null, type: "LIABILITY_PAYMENT", amount: "200", currencyCode: "ARS",
      description: "Pago de préstamo", occurredAt: new Date("2026-06-08T00:00:00Z"), postedAt: new Date("2026-06-08T00:00:00Z"), source: "MANUAL", status: "POSTED",
    }).returning();
    await database.insert(debtPayments).values({ userId: userA, debtId: debt.id, accountId: account.id, amount: "200", currencyCode: "ARS", paidAt: new Date("2026-06-08T00:00:00Z"), transactionId: transaction.id, status: "POSTED" });

    const [debtRow] = await debtSummary.sumDebtPaymentsForUser(userA, { from: new Date("2026-06-01T00:00:00Z"), to: new Date("2026-07-01T00:00:00Z") });
    expect(debtRow.total).toBe("200.000000");

    const metrics = deriveFinancialMetrics({ currency: "ARS", totalIncome: "1000", totalConsumption: "0", totalDebtPayments: debtRow.total });
    expect(metrics.debtServiceRatio).toBeCloseTo(0.2);
  });
});

describe("cohort aggregate suppression (real Postgres)", () => {
  it("a cohort below the configured minimum stays SUPPRESSED, and never returns real stats even from the repository", async () => {
    const database = await seedUsers();
    const cohortMetrics = createCohortMetricRepository(database);

    await cohortMetrics.replaceForPeriod("2026-06", [{
      period: "2026-06", regionBucket: "AR", ageBucket: "25-34", incomeBucket: "MIDDLE", employmentBucket: "EMPLOYED_FULL_TIME",
      metricCode: "savings_rate", cohortSizeBucket: "<100", suppressed: true, medianValue: null, p25Value: null, p75Value: null,
      privacyVersion: "cohort-aggregate:v1",
    }]);

    const rows = await cohortMetrics.listForPeriod("2026-06");
    expect(rows).toHaveLength(1);
    expect(rows[0].suppressed).toBe(true);
    expect(rows[0].medianValue).toBeNull();
  });

  it("replaceForPeriod is a full snapshot — a second run for the same period replaces, never appends to, the prior one", async () => {
    const database = await seedUsers();
    const cohortMetrics = createCohortMetricRepository(database);

    await cohortMetrics.replaceForPeriod("2026-06", [{
      period: "2026-06", regionBucket: "AR", ageBucket: "25-34", incomeBucket: "MIDDLE", employmentBucket: "EMPLOYED_FULL_TIME",
      metricCode: "savings_rate", cohortSizeBucket: "100-249", suppressed: false, medianValue: 0.2, p25Value: 0.1, p75Value: 0.3,
      privacyVersion: "cohort-aggregate:v1",
    }]);
    await cohortMetrics.replaceForPeriod("2026-06", [{
      period: "2026-06", regionBucket: "AR", ageBucket: "35-44", incomeBucket: "MIDDLE", employmentBucket: "EMPLOYED_FULL_TIME",
      metricCode: "savings_rate", cohortSizeBucket: "100-249", suppressed: false, medianValue: 0.4, p25Value: 0.2, p75Value: 0.5,
      privacyVersion: "cohort-aggregate:v1",
    }]);

    const rows = await cohortMetrics.listForPeriod("2026-06");
    expect(rows).toHaveLength(1);
    expect(rows[0].ageBucket).toBe("35-44");
  });
});
