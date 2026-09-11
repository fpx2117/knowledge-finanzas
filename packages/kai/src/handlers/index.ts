import type { KaiIntentId } from "../domain/kai-intent";
import {
  getAccountBalances,
  getAvailableMoney,
  getCategoryExpenses,
  getCurrentBalance,
  getExpenseComparison,
  getLargestExpense,
  getMonthExpenses,
  getMonthIncome,
  getMonthSavings,
  getNetCashflow,
  getTopBalanceAccount,
  getTopExpenseCategories,
  getYesterdayExpenses,
} from "./money.handler";
import {
  getBudgetStatus,
  getGoalProgress,
  getInsights,
  getSubscriptionCost,
  getSubscriptionNext,
  getSubscriptions,
  getUpcomingPayments,
} from "./commitments.handler";
import { createExpense, createIncome } from "./write.handler";
import type { KaiHandler } from "./types";

/** Intent id → deterministic handler (spec §14 Query Registry). */
export const KAI_HANDLERS: Record<KaiIntentId, KaiHandler> = {
  GET_MONTH_EXPENSES: getMonthExpenses,
  GET_MONTH_INCOME: getMonthIncome,
  GET_MONTH_SAVINGS: getMonthSavings,
  GET_NET_CASHFLOW: getNetCashflow,
  GET_CURRENT_BALANCE: getCurrentBalance,
  GET_ACCOUNT_BALANCES: getAccountBalances,
  GET_TOP_BALANCE_ACCOUNT: getTopBalanceAccount,
  GET_AVAILABLE_MONEY: getAvailableMoney,
  GET_CATEGORY_EXPENSES: getCategoryExpenses,
  GET_TOP_EXPENSE_CATEGORIES: getTopExpenseCategories,
  GET_LARGEST_EXPENSE: getLargestExpense,
  GET_YESTERDAY_EXPENSES: getYesterdayExpenses,
  GET_UPCOMING_PAYMENTS: getUpcomingPayments,
  GET_SUBSCRIPTIONS: getSubscriptions,
  GET_SUBSCRIPTION_COST: getSubscriptionCost,
  GET_BUDGET_STATUS: getBudgetStatus,
  GET_GOAL_PROGRESS: getGoalProgress,
  GET_INSIGHTS: getInsights,
  GET_EXPENSE_COMPARISON: getExpenseComparison,
  GET_SUBSCRIPTION_NEXT: getSubscriptionNext,
  CREATE_EXPENSE: createExpense,
  CREATE_INCOME: createIncome,
};

export * from "./ports";
export * from "./types";
