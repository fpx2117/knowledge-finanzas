import { and, desc, eq, gte, inArray, isNotNull, lt, sql } from "drizzle-orm";

import type { Database } from "../client";
import { transactions } from "../schema";

export function createBudgetQueries(database: Database) {
  return {
    getCategorySpendingForUser(userId: string, range: { from: Date; to: Date }) {
      const expense = sql<string>`coalesce(sum(case when ${transactions.type} = 'EXPENSE' then ${transactions.amount} else 0 end), 0)`;
      const refund = sql<string>`coalesce(sum(case when ${transactions.type} = 'REFUND' then ${transactions.amount} else 0 end), 0)`;
      const netExpense = sql<string>`coalesce(sum(case when ${transactions.type} = 'EXPENSE' then ${transactions.amount} else 0 end), 0) - coalesce(sum(case when ${transactions.type} = 'REFUND' then ${transactions.amount} else 0 end), 0)`;
      return database.select({
        categoryId: transactions.categoryId,
        currencyCode: transactions.currencyCode,
        expenseTotal: expense,
        refundTotal: refund,
        netExpense,
      })
        .from(transactions)
        .where(and(
          eq(transactions.userId, userId),
          eq(transactions.status, "POSTED"),
          isNotNull(transactions.categoryId),
          sql`${transactions.type} in ('EXPENSE', 'REFUND')`,
          gte(transactions.occurredAt, range.from),
          lt(transactions.occurredAt, range.to),
        ))
        .groupBy(transactions.categoryId, transactions.currencyCode);
    },

    listContributingTransactionsForUser(userId: string, categoryIds: string[], range: { from: Date; to: Date }) {
      if (categoryIds.length === 0) return Promise.resolve([]);
      return database.select({
        id: transactions.id,
        type: transactions.type,
        amount: transactions.amount,
        currencyCode: transactions.currencyCode,
        description: transactions.description,
        merchant: transactions.merchant,
        categoryId: transactions.categoryId,
        occurredAt: transactions.occurredAt,
      })
        .from(transactions)
        .where(and(
          eq(transactions.userId, userId),
          eq(transactions.status, "POSTED"),
          inArray(transactions.categoryId, categoryIds),
          sql`${transactions.type} in ('EXPENSE', 'REFUND')`,
          gte(transactions.occurredAt, range.from),
          lt(transactions.occurredAt, range.to),
        ))
        .orderBy(desc(transactions.occurredAt));
    },
  };
}
