import { and, eq, gte, lt, sql } from "drizzle-orm";
import type { Database } from "../client";
import { accounts, transactions } from "../schema";

export function createMonthlySummaryQueries(database: Database) {
  return {
    getMonthlyIncomeExpense(userId: string, range: { from: Date; to: Date }) {
      const income = sql<string>`coalesce(sum(case when ${transactions.type} = 'INCOME' then ${transactions.amount} else 0 end), 0)`;
      const expense = sql<string>`coalesce(sum(case when ${transactions.type} = 'EXPENSE' then ${transactions.amount} else 0 end), 0)`;
      const refund = sql<string>`coalesce(sum(case when ${transactions.type} = 'REFUND' then ${transactions.amount} else 0 end), 0)`;
      return database.select({ currencyCode: transactions.currencyCode, incomeTotal: income, expenseTotal: expense, refundTotal: refund, netExpense: sql<string>`coalesce(sum(case when ${transactions.type} = 'EXPENSE' then ${transactions.amount} else 0 end), 0) - coalesce(sum(case when ${transactions.type} = 'REFUND' then ${transactions.amount} else 0 end), 0)` })
        .from(transactions)
        .innerJoin(accounts, and(eq(accounts.id, transactions.accountId), eq(accounts.userId, transactions.userId)))
        .where(and(eq(transactions.userId, userId), eq(transactions.status, "POSTED"), gte(transactions.occurredAt, range.from), lt(transactions.occurredAt, range.to)))
        .groupBy(transactions.currencyCode);
    },
  };
}
