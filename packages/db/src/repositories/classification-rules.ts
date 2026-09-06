import { and, asc, eq } from "drizzle-orm";

import type { Database } from "../client";
import { userClassificationRules } from "../schema";

export type ClassificationRuleMatcher = "MERCHANT" | "DESCRIPTION";
export type ClassificationRuleMode = "CONTAINS" | "EQUALS" | "STARTS_WITH";

export function createClassificationRuleRepository(database: Database) {
  return {
    listForUser(userId: string) {
      return database
        .select()
        .from(userClassificationRules)
        .where(eq(userClassificationRules.userId, userId))
        .orderBy(asc(userClassificationRules.priority), asc(userClassificationRules.createdAt));
    },

    listActiveForUser(userId: string) {
      return database
        .select({
          id: userClassificationRules.id,
          matcher: userClassificationRules.matcher,
          mode: userClassificationRules.mode,
          pattern: userClassificationRules.pattern,
          categoryId: userClassificationRules.categoryId,
          priority: userClassificationRules.priority,
        })
        .from(userClassificationRules)
        .where(and(eq(userClassificationRules.userId, userId), eq(userClassificationRules.active, true)))
        .orderBy(asc(userClassificationRules.priority), asc(userClassificationRules.createdAt));
    },

    create(input: {
      userId: string;
      matcher: ClassificationRuleMatcher;
      mode: ClassificationRuleMode;
      pattern: string;
      categoryId: string;
      priority?: number;
    }) {
      return database
        .insert(userClassificationRules)
        .values({
          userId: input.userId,
          matcher: input.matcher,
          mode: input.mode,
          pattern: input.pattern.trim().toLowerCase(),
          categoryId: input.categoryId,
          priority: input.priority ?? 100,
        })
        .onConflictDoUpdate({
          target: [userClassificationRules.userId, userClassificationRules.matcher, userClassificationRules.mode, userClassificationRules.pattern],
          set: { categoryId: input.categoryId, active: true, priority: input.priority ?? 100, updatedAt: new Date() },
        })
        .returning()
        .then(([row]) => row);
    },

    findByIdForUser(ruleId: string, userId: string) {
      return database
        .select()
        .from(userClassificationRules)
        .where(and(eq(userClassificationRules.id, ruleId), eq(userClassificationRules.userId, userId)))
        .limit(1)
        .then(([row]) => row);
    },

    deleteForUser(ruleId: string, userId: string) {
      return database
        .delete(userClassificationRules)
        .where(and(eq(userClassificationRules.id, ruleId), eq(userClassificationRules.userId, userId)))
        .returning()
        .then(([row]) => row);
    },
  };
}
