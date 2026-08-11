// Stable tool identifiers — the fixed allowlist every insight/assistant capability draws from.
export const FINANCE_TOOL_NAMES = [
  "getLiquidBalances",
  "getMonthlySummary",
  "getDebtSummary",
  "getUpcomingObligations",
  "getBudgetOverview",
  "getCashflowProjection",
  "searchTransactions",
] as const;

export type FinanceToolName = (typeof FINANCE_TOOL_NAMES)[number];
