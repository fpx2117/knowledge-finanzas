import { and, eq, sql } from "drizzle-orm";

import type { Database } from "../client";
import { budgets } from "../schema";

export function createBudgetRepository(database: Database) {
  return {
    create(input: {
      userId: string;
      categoryId: string;
      name: string | null;
      currencyCode: string;
      limitAmount: string;
      startDate: string;
    }) {
      return database.insert(budgets).values({
        ...input,
        period: "MONTHLY",
        status: "ACTIVE",
        archivedAt: null,
      }).returning().then(([budget]) => budget);
    },

    findByIdForUser(budgetId: string, userId: string) {
      return database.select().from(budgets)
        .where(and(eq(budgets.id, budgetId), eq(budgets.userId, userId)))
        .limit(1)
        .then(([budget]) => budget);
    },

    listForUser(userId: string, options: { includeArchived?: boolean } = {}) {
      return database.select().from(budgets)
        .where(and(
          eq(budgets.userId, userId),
          options.includeArchived ? undefined : eq(budgets.status, "ACTIVE"),
        ));
    },

    existsActiveForCategoryCurrencyForUser(input: {
      userId: string;
      categoryId: string;
      currencyCode: string;
      excludeBudgetId?: string;
    }) {
      return database.select({ id: budgets.id }).from(budgets)
        .where(and(
          eq(budgets.userId, input.userId),
          eq(budgets.categoryId, input.categoryId),
          eq(budgets.currencyCode, input.currencyCode),
          eq(budgets.status, "ACTIVE"),
          input.excludeBudgetId ? sql`${budgets.id} <> ${input.excludeBudgetId}` : undefined,
        ))
        .limit(1)
        .then(([budget]) => Boolean(budget));
    },

    updateLimitForUser(budgetId: string, userId: string, input: { limitAmount: string; name: string | null }) {
      return database.update(budgets)
        .set({ limitAmount: input.limitAmount, name: input.name, updatedAt: new Date() })
        .where(and(eq(budgets.id, budgetId), eq(budgets.userId, userId), eq(budgets.status, "ACTIVE")))
        .returning()
        .then(([budget]) => budget);
    },

    archiveForUser(budgetId: string, userId: string, archivedAt: Date) {
      return database.update(budgets)
        .set({ status: "ARCHIVED", archivedAt, updatedAt: archivedAt })
        .where(and(eq(budgets.id, budgetId), eq(budgets.userId, userId), eq(budgets.status, "ACTIVE")))
        .returning()
        .then(([budget]) => budget);
    },
  };
}
