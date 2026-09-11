/**
 * The data KAI's deterministic handlers need, expressed as a structural port (spec §26
 * `queries/` + `calculators/`). `packages/kai` stays IO-free: `apps/web` implements this
 * against the real services/queries (`kai-ports.instance.ts`). Every method is read-only
 * and every amount is a decimal string kept in its own currency.
 */

export type MoneyByCurrency = { currencyCode: string; amount: string };

export type KaiDateRangeInput = { from: Date; to: Date };

export type KaiMonthlyResult = {
  currencyCode: string;
  /** POSTED income in the range. */
  income: string;
  /** POSTED expense net of refunds in the range. */
  expense: string;
  /** `income − expense`. */
  net: string;
};

export type KaiRecentExpense = {
  description: string;
  merchant: string | null;
  categoryName: string | null;
  amount: string;
  currencyCode: string;
  occurredAt: string;
};

export type KaiUpcomingObligation = {
  title: string;
  dueDate: string;
  amount: string;
  currencyCode: string;
  daysUntilDue: number;
  isOverdue: boolean;
};

export type KaiSubscription = {
  label: string;
  frequency: string;
  currentAmount: string;
  currencyCode: string;
  nextExpectedOn: string | null;
};

export type KaiBudgetStatus = {
  name: string;
  status: "NORMAL" | "NEAR_LIMIT" | "EXCEEDED";
  usagePercent: number;
  limit: string;
  spent: string;
  currencyCode: string;
};

export type KaiGoalProgress = {
  name: string;
  status: string;
  currentAmount: string;
  targetAmount: string;
  currencyCode: string;
  actualProgressRatio: number;
  requiredMonthly: string | null;
};

export type KaiCategoryExpenses = {
  /** Human label KAI echoes back ("Alimentación"). */
  label: string;
  byCurrency: MoneyByCurrency[];
};

export type KaiTopInsight = {
  title: string;
  body: string;
  severity: "info" | "warning" | "critical";
  route: string | null;
};

export type KaiProactiveInsight = {
  id: string;
  family: string;
  title: string;
  body: string;
  severity: "info" | "warning" | "critical";
  route: string | null;
};

export interface KaiDataPorts {
  getMonthlySummary(range: KaiDateRangeInput): Promise<KaiMonthlyResult[]>;
  getLiquidBalances(): Promise<MoneyByCurrency[]>;
  getAccountBalances(): Promise<{ name: string; currencyCode: string; balance: string }[]>;
  getSpendable(): Promise<{ currencyCode: string; spendable: string }[]>;
  /** Resolves a free-text category name (or taxonomy group) to its spend in `range`, or null. */
  getCategoryExpenses(range: KaiDateRangeInput, categoryQuery: string): Promise<KaiCategoryExpenses | null>;
  /** Spend at a merchant matching `merchantQuery` in `range` — "¿cuánto gasté en Starbucks?". */
  getMerchantExpenses(
    range: KaiDateRangeInput,
    merchantQuery: string,
  ): Promise<{ label: string; count: number; byCurrency: MoneyByCurrency[] } | null>;
  getTopExpenseCategories(
    range: KaiDateRangeInput,
    limit: number,
  ): Promise<{ label: string; amount: string; currencyCode: string }[]>;
  getRecentExpenses(range: KaiDateRangeInput): Promise<KaiRecentExpense[]>;
  getUpcomingObligations(horizonDays: number): Promise<KaiUpcomingObligation[]>;
  getActiveSubscriptions(): Promise<KaiSubscription[]>;
  getBudgetStatus(): Promise<KaiBudgetStatus[]>;
  getGoalProgress(): Promise<KaiGoalProgress[]>;
  getTopInsight(): Promise<KaiTopInsight | null>;
  /** The insight queue, for turning detected insights into proactive cards (spec §4). */
  getInsightsForProactive(limit: number): Promise<KaiProactiveInsight[]>;

  /** Active goals, for resolving "aportá $X a la meta {nombre}". */
  getGoalsForAllocation(): Promise<{ id: string; name: string; currencyCode: string }[]>;
  /** Finds the movement KAI should offer to void — the last one, or one matching a merchant. */
  findTransactionToVoid(criteria: {
    mode: "last" | "merchant";
    merchant?: string;
    ofType?: "EXPENSE" | "INCOME";
  }): Promise<{
    id: string;
    type: "EXPENSE" | "INCOME";
    description: string;
    merchant: string | null;
    amount: string;
    currencyCode: string;
    occurredAt: string;
  } | null>;
}
