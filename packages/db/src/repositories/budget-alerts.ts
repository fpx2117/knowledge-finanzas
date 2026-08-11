import { and, eq } from "drizzle-orm";

import type { Database } from "../client";
import { budgetAlerts } from "../schema";

export function createBudgetAlertRepository(database: Database) {
  return {
    recordIfAbsent(input: {
      userId: string;
      budgetId: string;
      periodKey: string;
      alertType: "BUDGET_NEAR_LIMIT" | "BUDGET_EXCEEDED";
      triggeredAt: Date;
    }) {
      return database.insert(budgetAlerts)
        .values(input)
        .onConflictDoNothing({ target: [budgetAlerts.budgetId, budgetAlerts.periodKey, budgetAlerts.alertType] })
        .returning()
        .then(([alert]) => alert);
    },

    listForUserPeriod(userId: string, periodKey: string) {
      return database.select().from(budgetAlerts)
        .where(and(eq(budgetAlerts.userId, userId), eq(budgetAlerts.periodKey, periodKey)));
    },
  };
}
