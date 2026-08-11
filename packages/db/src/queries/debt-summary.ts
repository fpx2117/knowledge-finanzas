import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import type { Database } from "../client";
import { debtInstallments, debtPaymentAllocations, debtPayments, debts } from "../schema";

export function createDebtSummaryQueries(database: Database) {
  const base = (userId: string, dateRange?: { from?: string; to?: string }) => database.select({
    debt: debts,
    installment: debtInstallments,
    allocatedAmount: sql<string>`coalesce(sum(case when ${debtPayments.status} = 'POSTED' then ${debtPaymentAllocations.amount} else 0 end), 0)`,
  }).from(debtInstallments)
    .innerJoin(debts, eq(debts.id, debtInstallments.debtId))
    .leftJoin(debtPaymentAllocations, eq(debtPaymentAllocations.installmentId, debtInstallments.id))
    .leftJoin(debtPayments, and(eq(debtPayments.id, debtPaymentAllocations.paymentId), eq(debtPayments.status, "POSTED")))
    .where(and(eq(debts.userId, userId), dateRange?.from ? gte(debtInstallments.dueDate, dateRange.from) : undefined, dateRange?.to ? lte(debtInstallments.dueDate, dateRange.to) : undefined))
    .groupBy(debts.id, debtInstallments.id);
  return {
    listDebtInputsForUser(userId: string) { return base(userId).orderBy(asc(debtInstallments.dueDate), asc(debtInstallments.installmentNumber)); },
    listUpcomingInputsForUser(userId: string, options: { from: string; to: string }) { return base(userId, options); },

    // Used by packages/privacy's debt_service_ratio metric (TASK-062) — a real, canonical amount
    // (debt_payments is its own first-class table, not an inferred category), grouped by
    // currency the same way getMonthlyIncomeExpense is, so both totals line up per currency.
    async sumDebtPaymentsForUser(userId: string, range: { from: Date; to: Date }) {
      return database.select({
        currencyCode: debtPayments.currencyCode,
        total: sql<string>`coalesce(sum(${debtPayments.amount}), 0)`,
      }).from(debtPayments)
        .where(and(eq(debtPayments.userId, userId), eq(debtPayments.status, "POSTED"), gte(debtPayments.paidAt, range.from), lte(debtPayments.paidAt, range.to)))
        .groupBy(debtPayments.currencyCode);
    },
  };
}
