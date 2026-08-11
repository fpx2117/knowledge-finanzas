import Decimal from "decimal.js";

import { Money } from "../money/money";
import { BUDGET_NEAR_LIMIT_PERCENT, type BudgetUsageStatus } from "./budget-types";

export function calculateBudget(input: { limit: Money; spent: Money; nearLimitThresholdPercent?: number }) {
  const threshold = input.nearLimitThresholdPercent ?? BUDGET_NEAR_LIMIT_PERCENT;
  const remaining = input.limit.subtract(input.spent);
  const usagePercent = input.limit.amount.isZero()
    ? new Decimal(0)
    : input.spent.amount.dividedBy(input.limit.amount).times(100);
  const status: BudgetUsageStatus = input.spent.compareTo(input.limit) > 0
    ? "EXCEEDED"
    : usagePercent.gte(threshold)
      ? "NEAR_LIMIT"
      : "NORMAL";

  return { spent: input.spent, remaining, usagePercent, status };
}
