import { and, desc, eq, sql } from "drizzle-orm";

import type { Database } from "../client";
import { quickTemplates } from "../schema";

export function mergeAmountHints(amount: string, current: unknown): string[] {
  const hints = Array.isArray(current) ? current.filter((hint): hint is string => typeof hint === "string") : [];
  return [amount, ...hints.filter((hint) => hint !== amount)].slice(0, 4);
}

export function createQuickTemplateRepository(database: Database) {
  return {
    listForUser(userId: string) {
      return database
        .select()
        .from(quickTemplates)
        .where(eq(quickTemplates.userId, userId))
        .orderBy(desc(quickTemplates.usageCount), desc(quickTemplates.lastUsedAt));
    },

    findByIdForUser(id: string, userId: string) {
      return database
        .select()
        .from(quickTemplates)
        .where(and(eq(quickTemplates.id, id), eq(quickTemplates.userId, userId)))
        .limit(1)
        .then(([row]) => row);
    },

    create(input: {
      userId: string;
      label: string;
      type: "INCOME" | "EXPENSE";
      description: string;
      accountId: string | null;
      categoryId: string | null;
      merchantText: string | null;
      amountHints: string[];
    }) {
      return database.insert(quickTemplates).values(input).returning().then(([row]) => row);
    },

    deleteForUser(id: string, userId: string) {
      return database
        .delete(quickTemplates)
        .where(and(eq(quickTemplates.id, id), eq(quickTemplates.userId, userId)))
        .returning()
        .then(([row]) => row);
    },

    /** Bump usage and fold a new amount into the (max 4) hint list, most-recent first. */
    async recordUse(id: string, userId: string, amount: string) {
      const existing = await this.findByIdForUser(id, userId);
      if (!existing) return undefined;
      return database
        .update(quickTemplates)
        .set({
          usageCount: sql`${quickTemplates.usageCount} + 1`,
          lastUsedAt: new Date(),
          amountHints: mergeAmountHints(amount, existing.amountHints),
          updatedAt: new Date(),
        })
        .where(and(eq(quickTemplates.id, id), eq(quickTemplates.userId, userId)))
        .returning()
        .then(([row]) => row);
    },
  };
}
