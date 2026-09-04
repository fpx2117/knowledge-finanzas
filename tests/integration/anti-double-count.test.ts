import { describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";

import { createAccountRepository } from "../../packages/db/src/repositories/accounts";
import { createAccountBalanceQueries, createDebtSummaryQueries, createUpcomingObligationQueries } from "../../packages/db/src/queries";
import { createDebtPaymentService } from "../../apps/web/src/features/debts/services/debt-payment-service";
import { createDashboardService } from "../../apps/web/src/features/dashboard/services/dashboard-service";
import { debts, debtInstallments, transactions, users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

// WP-ANTI-DOUBLE-COUNT (spec 14 §14.1 / Foundation §14 "no duplicar consumo al registrar el pago
// de una deuda"). Reproduces the invariant's canonical numeric example end-to-end against the
// *real* production wiring (dashboard-service + the actual account-balance / debt-summary SQL
// queries), independent of the idempotency guarantees proven separately in
// debt-payment-idempotency.test.ts:
//
//   ANTES:   saldo 1.000.000 − obligación pendiente 300.000 = disponible 700.000
//   DESPUÉS: saldo   700.000 − obligación pendiente     0   = disponible 700.000 (NUNCA 400.000)

const userId = "00000000-0000-0000-0000-0000000007a1";
const debtId = "40000000-0000-0000-0000-0000000007a1";
const timezone = "UTC";

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

async function seed(now: Date) {
  const database = getTestDatabase().db;
  const today = now.toISOString().slice(0, 10);
  await database.insert(users).values({ id: userId, name: "User", email: "anti-double-count@example.test", timezone, baseCurrency: "ARS" });
  const account = await createAccountRepository(database).create({
    userId, name: "Cuenta", type: "BANK", currencyCode: "ARS", openingBalance: "1000000", openingDate: "2026-01-01",
  });
  await database.insert(debts).values({ id: debtId, userId, name: "Obligación", type: "OTHER", currencyCode: "ARS", originalAmount: "300000", startDate: "2026-01-01", interestType: "NO_INTEREST" });
  await database.insert(debtInstallments).values({ debtId, installmentNumber: 1, dueDate: addDays(today, 5), principalAmount: "300000", interestAmount: "0", feeAmount: "0", totalAmount: "300000" });

  const dashboard = createDashboardService({
    balances: createAccountBalanceQueries(database),
    monthly: { getMonthlyIncomeExpense: async () => [] },
    activity: { listRecentActivity: async () => [] },
    debts: createDebtSummaryQueries(database),
    scheduled: createUpcomingObligationQueries(database),
  });
  const payments = createDebtPaymentService(database, () => now);
  return { database, accountId: account.id, dashboard, payments };
}

function arsSpendable(summary: Awaited<ReturnType<ReturnType<typeof createDashboardService>["getDashboardSummary"]>>) {
  const projection = summary.projections.find((p) => p.currencyCode === "ARS");
  return {
    liquidBalance: projection?.spendable.liquidBalance.toString(),
    committedObligations: projection?.spendable.committedObligations.toString(),
    spendable: projection?.spendable.spendable.toString(),
  };
}

describe("obligation payment anti-double-count (§14.1)", () => {
  it("before payment: balance 1,000,000 minus committed 300,000 = spendable 700,000", async () => {
    const now = new Date("2026-03-01T12:00:00Z");
    const { dashboard } = await seed(now);

    const summary = await dashboard.getDashboardSummary({ userId, timezone, now });
    expect(arsSpendable(summary)).toEqual({ liquidBalance: "1000000.00", committedObligations: "300000.00", spendable: "700000.00" });
  });

  it("after full payment: balance 700,000, no pending obligation, spendable stays 700,000 — never 400,000", async () => {
    const now = new Date("2026-03-01T12:00:00Z");
    const { accountId, dashboard, payments } = await seed(now);

    await payments.recordDebtPayment({ id: userId, timezone }, { debtId, accountId, amount: "300000" });

    const summary = await dashboard.getDashboardSummary({ userId, timezone, now });
    expect(arsSpendable(summary)).toEqual({ liquidBalance: "700000.00", committedObligations: "0.00", spendable: "700000.00" });
  });

  it("after a partial payment: balance 900,000, committed drops to the remainder, spendable stays 700,000", async () => {
    const now = new Date("2026-03-01T12:00:00Z");
    const { accountId, dashboard, payments } = await seed(now);

    await payments.recordDebtPayment({ id: userId, timezone }, { debtId, accountId, amount: "100000" });

    const summary = await dashboard.getDashboardSummary({ userId, timezone, now });
    expect(arsSpendable(summary)).toEqual({ liquidBalance: "900000.00", committedObligations: "200000.00", spendable: "700000.00" });
  });

  it("a debt payment never re-consumes budget — it posts as LIABILITY_PAYMENT, not EXPENSE (§13)", async () => {
    const now = new Date("2026-03-01T12:00:00Z");
    const { database, accountId, payments } = await seed(now);

    await payments.recordDebtPayment({ id: userId, timezone }, { debtId, accountId, amount: "300000" });

    // §13: a debt payment must never also count as budget consumption. `LIABILITY_PAYMENT` sits
    // outside the EXPENSE/INCOME/REFUND/ADJUSTMENT/TRANSFER union entirely (finding O-4 in the
    // domain audit) — what matters here is that no EXPENSE row exists for the payment.
    const expenseRows = await database.select().from(transactions).where(and(eq(transactions.userId, userId), eq(transactions.type, "EXPENSE")));
    const liabilityRows = await database.select().from(transactions).where(and(eq(transactions.userId, userId), eq(transactions.type, "LIABILITY_PAYMENT")));
    expect(expenseRows).toHaveLength(0);
    expect(liabilityRows).toHaveLength(1);
  });
});
