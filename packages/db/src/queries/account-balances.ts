import { and, asc, eq, lte, sql } from "drizzle-orm";
import type { Database } from "../client";
import { accounts, transactions } from "../schema";

export function createAccountBalanceQueries(database: Database) {
  return {
    getAccountBalancesForUser(userId: string, options: { accountId?: string; includeArchived?: boolean; asOf?: Date } = {}) {
      const income = sql<string>`coalesce(sum(case when ${transactions.type} = 'INCOME' then ${transactions.amount} else 0 end), 0)`;
      const expense = sql<string>`coalesce(sum(case when ${transactions.type} = 'EXPENSE' then ${transactions.amount} else 0 end), 0)`;
      const refund = sql<string>`coalesce(sum(case when ${transactions.type} = 'REFUND' then ${transactions.amount} else 0 end), 0)`;
      const adjustmentIn = sql<string>`coalesce(sum(case when ${transactions.type} = 'ADJUSTMENT_IN' then ${transactions.amount} else 0 end), 0)`;
      const adjustmentOut = sql<string>`coalesce(sum(case when ${transactions.type} = 'ADJUSTMENT_OUT' then ${transactions.amount} else 0 end), 0)`;
      const liabilityPayment = sql<string>`coalesce(sum(case when ${transactions.type} = 'LIABILITY_PAYMENT' then ${transactions.amount} else 0 end), 0)`;
      return database.select({ account: accounts, incomeTotal: income, expenseTotal: expense, refundTotal: refund, adjustmentInTotal: adjustmentIn, adjustmentOutTotal: adjustmentOut, liabilityPaymentTotal: liabilityPayment })
        .from(accounts)
        .leftJoin(transactions, and(
          eq(transactions.accountId, accounts.id),
          eq(transactions.userId, accounts.userId),
          eq(transactions.status, "POSTED"),
          options.asOf ? lte(transactions.occurredAt, options.asOf) : undefined,
        ))
        .where(and(eq(accounts.userId, userId), options.accountId ? eq(accounts.id, options.accountId) : undefined, options.includeArchived ? undefined : eq(accounts.status, "ACTIVE")))
        .groupBy(accounts.id)
        .orderBy(asc(accounts.name));
    },

    getLiquidTotalsForUser(userId: string, options: { includeArchived?: boolean; asOf?: Date } = {}) {
      const movementTotals = database.select({
        accountId: transactions.accountId,
        income: sql<string>`coalesce(sum(case when ${transactions.type} = 'INCOME' then ${transactions.amount} else 0 end), 0)`.as("income"),
        expense: sql<string>`coalesce(sum(case when ${transactions.type} = 'EXPENSE' then ${transactions.amount} else 0 end), 0)`.as("expense"),
        refund: sql<string>`coalesce(sum(case when ${transactions.type} = 'REFUND' then ${transactions.amount} else 0 end), 0)`.as("refund"),
        adjustmentIn: sql<string>`coalesce(sum(case when ${transactions.type} = 'ADJUSTMENT_IN' then ${transactions.amount} else 0 end), 0)`.as("adjustment_in"),
        adjustmentOut: sql<string>`coalesce(sum(case when ${transactions.type} = 'ADJUSTMENT_OUT' then ${transactions.amount} else 0 end), 0)`.as("adjustment_out"),
        liabilityPayment: sql<string>`coalesce(sum(case when ${transactions.type} = 'LIABILITY_PAYMENT' then ${transactions.amount} else 0 end), 0)`.as("liability_payment"),
      }).from(transactions)
        .where(and(eq(transactions.userId, userId), eq(transactions.status, "POSTED"), options.asOf ? lte(transactions.occurredAt, options.asOf) : undefined))
        .groupBy(transactions.accountId).as("movement_totals");
      const total = sql<string>`coalesce(sum(${accounts.openingBalance} + coalesce(${movementTotals.income}, 0) - coalesce(${movementTotals.expense}, 0) + coalesce(${movementTotals.refund}, 0) + coalesce(${movementTotals.adjustmentIn}, 0) - coalesce(${movementTotals.adjustmentOut}, 0) - coalesce(${movementTotals.liabilityPayment}, 0)), 0)`;
      return database.select({ currencyCode: accounts.currencyCode, total })
        .from(accounts)
        .leftJoin(movementTotals, eq(movementTotals.accountId, accounts.id))
        .where(and(eq(accounts.userId, userId), options.includeArchived ? undefined : eq(accounts.status, "ACTIVE")))
        .groupBy(accounts.currencyCode)
        .orderBy(asc(accounts.currencyCode));
    },

  };
}
