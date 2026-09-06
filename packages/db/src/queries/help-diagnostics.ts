import { and, countDistinct, desc, eq, gt, gte, inArray, sql } from "drizzle-orm";

import type { Database } from "../client";
import { accounts, budgets, debts, goals, importBatches, transactions } from "../schema";

/**
 * WP-HELP-MODULE (spec 12 §11 — "Diagnóstico de saldo"). Every query here is strictly
 * read-only: it detects *common causes* of a balance that doesn't match, and never corrects
 * or deletes anything (§11.4). One targeted aggregate per signal.
 */
export function createHelpDiagnosticQueries(database: Database) {
  return {
    async balanceSignals(userId: string, options: { now: Date; recentSince: Date }) {
      const [uncategorized] = await database
        .select({ count: sql<number>`count(*)::int` })
        .from(transactions)
        .where(and(
          eq(transactions.userId, userId),
          eq(transactions.status, "POSTED"),
          sql`${transactions.categoryId} is null`,
          inArray(transactions.type, ["INCOME", "EXPENSE"]),
        ));

      const importExceptions = await database
        .select({ id: importBatches.id, filename: importBatches.filename, skipped: importBatches.skippedCount, failed: importBatches.failedCount, createdAt: importBatches.createdAt })
        .from(importBatches)
        .where(and(eq(importBatches.userId, userId), sql`${importBatches.skippedCount} + ${importBatches.failedCount} > 0`))
        .orderBy(desc(importBatches.createdAt))
        .limit(3);

      const adjustments = await database
        .select({ id: transactions.id, type: transactions.type, amount: transactions.amount, currencyCode: transactions.currencyCode, occurredAt: transactions.occurredAt })
        .from(transactions)
        .where(and(
          eq(transactions.userId, userId),
          eq(transactions.status, "POSTED"),
          inArray(transactions.type, ["ADJUSTMENT_IN", "ADJUSTMENT_OUT"]),
          gte(transactions.occurredAt, options.recentSince),
        ))
        .orderBy(desc(transactions.occurredAt))
        .limit(3);

      const [futureDated] = await database
        .select({ count: sql<number>`count(*)::int` })
        .from(transactions)
        .where(and(eq(transactions.userId, userId), eq(transactions.status, "POSTED"), gt(transactions.occurredAt, options.now)));

      const [recentVoided] = await database
        .select({ count: sql<number>`count(*)::int` })
        .from(transactions)
        .where(and(
          eq(transactions.userId, userId),
          eq(transactions.status, "VOIDED"),
          gte(transactions.updatedAt, options.recentSince),
        ));

      const [currencies] = await database
        .select({ count: countDistinct(accounts.currencyCode) })
        .from(accounts)
        .where(and(eq(accounts.userId, userId), eq(accounts.status, "ACTIVE")));

      const [recentImports] = await database
        .select({ count: sql<number>`count(*)::int` })
        .from(importBatches)
        .where(and(eq(importBatches.userId, userId), gte(importBatches.createdAt, options.recentSince)));

      return {
        uncategorizedCount: uncategorized?.count ?? 0,
        importExceptions,
        adjustments,
        futureDatedCount: futureDated?.count ?? 0,
        recentVoidedCount: recentVoided?.count ?? 0,
        currencyCount: Number(currencies?.count ?? 0),
        recentImportCount: recentImports?.count ?? 0,
      };
    },

    /** Getting-started checklist — real product state, not tracked "events" (§9.4). */
    async gettingStartedState(userId: string) {
      const [accountCount] = await database
        .select({ count: sql<number>`count(*)::int` })
        .from(accounts)
        .where(and(eq(accounts.userId, userId), eq(accounts.status, "ACTIVE")));

      const [movementCount] = await database
        .select({ count: sql<number>`count(*)::int` })
        .from(transactions)
        .where(and(eq(transactions.userId, userId), eq(transactions.status, "POSTED")));

      const [categorizedCount] = await database
        .select({ count: sql<number>`count(*)::int` })
        .from(transactions)
        .where(and(
          eq(transactions.userId, userId),
          eq(transactions.status, "POSTED"),
          eq(transactions.type, "EXPENSE"),
          sql`${transactions.categoryId} is not null`,
        ));

      const [debtCount] = await database
        .select({ count: sql<number>`count(*)::int` })
        .from(debts)
        .where(and(eq(debts.userId, userId), sql`${debts.status} <> 'CANCELLED'`));
      const [budgetCount] = await database
        .select({ count: sql<number>`count(*)::int` })
        .from(budgets)
        .where(and(eq(budgets.userId, userId), eq(budgets.status, "ACTIVE")));
      const [goalCount] = await database
        .select({ count: sql<number>`count(*)::int` })
        .from(goals)
        .where(and(eq(goals.userId, userId), sql`${goals.status} <> 'ARCHIVED'`));

      return {
        accountCount: accountCount?.count ?? 0,
        movementCount: movementCount?.count ?? 0,
        categorizedExpenseCount: categorizedCount?.count ?? 0,
        debtCount: debtCount?.count ?? 0,
        budgetCount: budgetCount?.count ?? 0,
        goalCount: goalCount?.count ?? 0,
      };
    },
  };
}
