import type { BudgetUsageStatus } from "./budget-types";

export type BudgetAlertType = "BUDGET_NEAR_LIMIT" | "BUDGET_EXCEEDED";

export function resolveBudgetAlertType(status: BudgetUsageStatus): BudgetAlertType | null {
  if (status === "EXCEEDED") return "BUDGET_EXCEEDED";
  if (status === "NEAR_LIMIT") return "BUDGET_NEAR_LIMIT";
  return null;
}
