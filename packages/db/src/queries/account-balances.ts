import { and, asc, eq, lte, sql } from "drizzle-orm";
import type { Database } from "../client";
import { accounts, transactions } from "../schema";
import { buildLedgerTotalColumns } from "./ledger-totals";

export function createAccountBalanceQueries(database: Database) {
  return {
    getAccountBalancesForUser(userId: string, options: { accountId?: string; includeArchived?: boolean; asOf?: Date } = {}) {
      return database.select({ account: accounts, ...buildLedgerTotalColumns() })
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
        ...buildLedgerTotalColumns(),
      }).from(transactions)
        .where(and(eq(transactions.userId, userId), eq(transactions.status, "POSTED"), options.asOf ? lte(transactions.occurredAt, options.asOf) : undefined))
        .groupBy(transactions.accountId).as("movement_totals");
      const total = sql<string>`coalesce(sum(${accounts.openingBalance} + coalesce(${movementTotals.incomeTotal}, 0) - coalesce(${movementTotals.expenseTotal}, 0) + coalesce(${movementTotals.refundTotal}, 0) + coalesce(${movementTotals.adjustmentInTotal}, 0) - coalesce(${movementTotals.adjustmentOutTotal}, 0) + coalesce(${movementTotals.transferInTotal}, 0) - coalesce(${movementTotals.transferOutTotal}, 0) - coalesce(${movementTotals.liabilityPaymentTotal}, 0)), 0)`;
      return database.select({ currencyCode: accounts.currencyCode, total })
        .from(accounts)
        .leftJoin(movementTotals, eq(movementTotals.accountId, accounts.id))
        .where(and(eq(accounts.userId, userId), options.includeArchived ? undefined : eq(accounts.status, "ACTIVE")))
        .groupBy(accounts.currencyCode)
        .orderBy(asc(accounts.currencyCode));
    },

  };
}
