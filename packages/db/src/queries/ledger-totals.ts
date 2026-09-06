import { sql, type SQL } from "drizzle-orm";

import { transactions, transactionTypeEnum } from "../schema";

export type LedgerTotalKey =
  | "incomeTotal"
  | "expenseTotal"
  | "refundTotal"
  | "adjustmentInTotal"
  | "adjustmentOutTotal"
  | "transferInTotal"
  | "transferOutTotal"
  | "liabilityPaymentTotal";

/**
 * WP-LEDGER-EXHAUSTIVE (spec 14 §4.5/§5.1): the single place that decides how each
 * `transactionTypeEnum` value contributes to an account's derived balance.
 *
 * Every balance-total query in the codebase (`account-balances.ts`, `accounts.ts` repository)
 * must build its `sum(case when type = …)` columns from `buildLedgerTotalColumns()` below,
 * never by hand-rolling its own CASE expressions. A hand-rolled query that forgets a type (as
 * `TRANSFER_IN`/`TRANSFER_OUT` were forgotten in three places before this file existed — see
 * `docs/implementation/02-financial-domain-audit.md` L-3) silently produces a wrong balance with
 * no error. This `Record` requires every member of `transactionTypeEnum.enumValues`: if the enum
 * ever grows, this file fails to typecheck until the new type is mapped here.
 */
const TOTAL_KEY_BY_TYPE: Record<(typeof transactionTypeEnum.enumValues)[number], LedgerTotalKey> = {
  INCOME: "incomeTotal",
  EXPENSE: "expenseTotal",
  REFUND: "refundTotal",
  ADJUSTMENT_IN: "adjustmentInTotal",
  ADJUSTMENT_OUT: "adjustmentOutTotal",
  TRANSFER_IN: "transferInTotal",
  TRANSFER_OUT: "transferOutTotal",
  LIABILITY_PAYMENT: "liabilityPaymentTotal",
};

/** One `sum(case when type = X …)` column per ledger transaction type, keyed for `.select()`. */
export function buildLedgerTotalColumns() {
  const columns = {} as Record<LedgerTotalKey, SQL<string>>;
  for (const type of transactionTypeEnum.enumValues) {
    const key = TOTAL_KEY_BY_TYPE[type];
    columns[key] = sql<string>`coalesce(sum(case when ${transactions.type} = ${type} then ${transactions.amount} else 0 end), 0)`;
  }
  return columns;
}

/**
 * Same columns, each given an explicit SQL alias. Required when the totals are selected inside a
 * subquery whose fields are later referenced by name (`subquery.incomeTotal`) — drizzle throws
 * "raw SQL field … doesn't have an alias declared" otherwise. Use `buildLedgerTotalColumns()` for
 * a plain top-level select; use this for `.select({...}).as("alias")`.
 */
export function buildAliasedLedgerTotalColumns() {
  const columns = {} as Record<LedgerTotalKey, ReturnType<SQL<string>["as"]>>;
  for (const type of transactionTypeEnum.enumValues) {
    const key = TOTAL_KEY_BY_TYPE[type];
    columns[key] = sql<string>`coalesce(sum(case when ${transactions.type} = ${type} then ${transactions.amount} else 0 end), 0)`.as(key);
  }
  return columns;
}

export const LEDGER_TOTAL_KEYS = Object.values(TOTAL_KEY_BY_TYPE) as readonly LedgerTotalKey[];
