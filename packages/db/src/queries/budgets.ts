import { and, desc, eq, gte, inArray, isNotNull, lt, sql } from "drizzle-orm";

import type { Database } from "../client";
import { transactions } from "../schema";

export function createBudgetQueries(database: Database) {
  return {
    /**
     * Budget consumption (spec 04 §13 / §18 / §21). `netExpense` is exactly the sum of
     * `classifyLedgerEffect().consumptionDelta` over the POSTED rows selected here:
     *  - only `EXPENSE` (+amount) and `REFUND` (−amount) are summed — the `type in (...)` filter
     *    excludes `TRANSFER_IN/OUT` (§19 transfers never touch a budget), `LIABILITY_PAYMENT`
     *    (§21 a debt/card payment is a settlement, not new consumption — no double count),
     *    `ADJUSTMENT_IN/OUT` (§18.2 pure accounting adjustments) and `INCOME`.
     *  - `status = 'POSTED'` excludes VOIDED rows (the enum has no PENDING state).
     *  - a refund reduces the period it is *recorded* in (§20.3 P0), so `occurredAt in [from,to)`.
     * `netExpense` can go negative when refunds exceed expenses in a period — that is correct
     * and `calculateBudget` handles it (status NORMAL, remaining above the limit).
     */
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
