import { and, asc, eq, gte, lt, notInArray, sql } from "drizzle-orm";
import type { Database } from "../client";
import { debtInstallments, debtPaymentAllocations, debtPayments, debts, scheduledTransactions } from "../schema";

export function createUpcomingObligationQueries(database: Database) {
  return {
    listDebtInstallmentsForUser(userId: string, range: { from: string; to: string }) {
      return database.select({ debt: debts, installment: debtInstallments, allocatedAmount: sql<string>`coalesce(sum(case when ${debtPayments.status} = 'POSTED' then ${debtPaymentAllocations.amount} else 0 end), 0)` }).from(debtInstallments).innerJoin(debts, eq(debts.id, debtInstallments.debtId)).leftJoin(debtPaymentAllocations, eq(debtPaymentAllocations.installmentId, debtInstallments.id)).leftJoin(debtPayments, eq(debtPayments.id, debtPaymentAllocations.paymentId)).where(and(eq(debts.userId, userId), notInArray(debtInstallments.status, ["PAID", "CANCELLED"]), gte(debtInstallments.dueDate, range.from), lt(debtInstallments.dueDate, range.to))).groupBy(debts.id, debtInstallments.id).orderBy(asc(debtInstallments.dueDate), asc(debtInstallments.installmentNumber));
    },
    listScheduledForUser(userId: string, range: { from: string; to: string }) {
      return database.select().from(scheduledTransactions).where(and(eq(scheduledTransactions.userId, userId), eq(scheduledTransactions.status, "SCHEDULED"), gte(scheduledTransactions.scheduledDate, range.from), lt(scheduledTransactions.scheduledDate, range.to))).orderBy(asc(scheduledTransactions.scheduledDate));
    },
  };
}
