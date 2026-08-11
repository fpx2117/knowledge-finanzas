import { notifyUser } from "./notify";

export async function notifyBudgetAlert(input: { userId: string; userTimezone: string; budgetId: string; categoryName: string; usagePercent: string; alertType: "BUDGET_NEAR_LIMIT" | "BUDGET_EXCEEDED"; periodKey: string }) {
  return notifyUser({
    userId: input.userId,
    userTimezone: input.userTimezone,
    intent: {
      type: input.alertType,
      category: "FINANCIAL",
      priority: input.alertType === "BUDGET_EXCEEDED" ? "HIGH" : "NORMAL",
      titleKey: input.alertType,
      bodyKey: input.alertType,
      subjectType: "BUDGET",
      subjectId: input.budgetId,
      metadata: { categoryName: input.categoryName, usagePercent: input.usagePercent },
      occurredAt: new Date(),
      dedupKey: `${input.alertType}:${input.budgetId}:${input.periodKey}`,
    },
  });
}
