import { eq } from "drizzle-orm";

import type { Database } from "../client";
import { userFinancialProfiles } from "../schema";

export function createFinancialProfileRepository(database: Database) {
  return {
    findForUser(userId: string) {
      return database.select().from(userFinancialProfiles).where(eq(userFinancialProfiles.userId, userId)).limit(1).then(([row]) => row);
    },

    // Purely declarative — never read by any Finance Engine calculation (Domain Rule).
    upsertForUser(userId: string, input: {
      primaryGoal?: string | null;
      secondaryGoals?: string[];
      incomePattern?: string | null;
      usesCreditCards?: string | null;
      hasDebtDeclared?: string | null;
      hasRecurringExpensesDeclared?: string | null;
      usesMultipleAccounts?: string | null;
      managementStyle?: string | null;
    }) {
      return database.insert(userFinancialProfiles)
        .values({ userId, ...input, updatedAt: new Date() })
        .onConflictDoUpdate({ target: userFinancialProfiles.userId, set: { ...input, updatedAt: new Date() } })
        .returning()
        .then(([row]) => row);
    },
  };
}
