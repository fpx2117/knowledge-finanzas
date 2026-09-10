import {
  budgetRepository,
  categoryRepository,
  createAccountBalanceQueries,
  createActivityQueries,
  createBudgetQueries,
  createDebtSummaryQueries,
  createMonthlySummaryQueries,
  createUpcomingObligationQueries,
  db,
  subscriptionRepository,
} from "@know-finanzas/db";
import {
  calculateAssetAccountBalance,
  Money,
  todayInTimezone,
} from "@know-finanzas/finance";
import { normalizeText, type KaiDataPorts, type KaiDateRangeInput } from "@know-finanzas/kai";

import type { CurrentUser } from "@/lib/auth/require-current-user";
import { createBudgetService } from "@/features/budgets/services/budget-service";
import { createGoalService } from "@/features/goals/services/goal-service";
import { createDashboardService } from "@/features/dashboard/services/dashboard-service";
import { createObligationReadModel } from "@/features/obligations/services/obligation-read-model";
import { createInsightService } from "@/features/insights/services/insight-service";

const accountBalanceQueries = createAccountBalanceQueries(db);
const activityQueries = createActivityQueries(db);
const budgetQueries = createBudgetQueries(db);
const monthlySummaryQueries = createMonthlySummaryQueries(db);

const budgetService = createBudgetService({
  budgets: budgetRepository,
  categories: categoryRepository,
  budgetQueries,
});
const goalService = createGoalService();
const obligationReadModel = createObligationReadModel(db);
const insightService = createInsightService();

const dashboardService = createDashboardService({
  balances: accountBalanceQueries,
  monthly: monthlySummaryQueries,
  activity: activityQueries,
  debts: createDebtSummaryQueries(db),
  scheduled: createUpcomingObligationQueries(db),
});

function daysBetween(fromISO: string, toISO: string): number {
  const a = Date.UTC(+fromISO.slice(0, 4), +fromISO.slice(5, 7) - 1, +fromISO.slice(8, 10));
  const b = Date.UTC(+toISO.slice(0, 4), +toISO.slice(5, 7) - 1, +toISO.slice(8, 10));
  return Math.round((b - a) / 86_400_000);
}

/**
 * Builds the read-only data ports the deterministic KAI handlers use, from the app's
 * existing services/queries. Everything here is a parity wrapper — the numbers match the
 * dashboard, reports and obligations views (spec §1: deterministic, auditable).
 */
export function buildKaiPorts(user: CurrentUser, now: Date): KaiDataPorts {
  return {
    async getMonthlySummary(range: KaiDateRangeInput) {
      const rows = await monthlySummaryQueries.getMonthlyIncomeExpense(user.id, { from: range.from, to: range.to });
      return rows.map((row) => {
        const income = Money.fromString(row.incomeTotal, row.currencyCode);
        const expense = Money.fromString(row.netExpense ?? row.expenseTotal, row.currencyCode);
        return {
          currencyCode: row.currencyCode,
          income: income.toString(),
          expense: expense.toString(),
          net: income.subtract(expense).toString(),
        };
      });
    },

    async getLiquidBalances() {
      const rows = await accountBalanceQueries.getLiquidTotalsForUser(user.id);
      return rows.map((row) => ({ currencyCode: row.currencyCode, amount: row.total }));
    },

    async getAccountBalances() {
      const rows = await accountBalanceQueries.getAccountBalancesForUser(user.id, { asOf: now });
      return rows
        .filter((row) => row.account.status === "ACTIVE")
        .map((row) => ({
          name: row.account.name,
          currencyCode: row.account.currencyCode,
          balance: calculateAssetAccountBalance({
            currency: row.account.currencyCode,
            openingBalance: row.account.openingBalance,
            incomeTotal: row.incomeTotal,
            expenseTotal: row.expenseTotal,
            refundTotal: row.refundTotal,
            adjustmentInTotal: row.adjustmentInTotal,
            adjustmentOutTotal: row.adjustmentOutTotal,
            transferInTotal: row.transferInTotal,
            transferOutTotal: row.transferOutTotal,
            liabilityPaymentTotal: row.liabilityPaymentTotal,
          }).toString(),
        }));
    },

    async getSpendable() {
      const summary = await dashboardService.getDashboardSummary({ userId: user.id, timezone: user.timezone, now });
      return summary.projections.map((p) => ({
        currencyCode: p.currencyCode,
        spendable: p.spendable.spendable.toString(),
      }));
    },

    async getCategoryExpenses(range, categoryQuery) {
      const [rows, categories] = await Promise.all([
        budgetQueries.getCategorySpendingForUser(user.id, { from: range.from, to: range.to }),
        categoryRepository.listForUser(user.id, { includeArchived: true }),
      ]);
      const query = normalizeText(categoryQuery);
      const matched = categories.filter((c) => {
        const name = normalizeText(c.name);
        return name === query || name.includes(query) || query.includes(name);
      });
      if (matched.length === 0) return null;
      const matchedIds = new Set(matched.map((c) => c.id));
      const byCurrency = new Map<string, Money>();
      for (const row of rows) {
        if (!row.categoryId || !matchedIds.has(row.categoryId)) continue;
        const current = byCurrency.get(row.currencyCode) ?? Money.zero(row.currencyCode);
        byCurrency.set(row.currencyCode, current.add(Money.fromString(row.netExpense, row.currencyCode)));
      }
      if (byCurrency.size === 0) {
        return { label: matched[0].name, byCurrency: [{ currencyCode: user.baseCurrency, amount: "0" }] };
      }
      return {
        label: matched[0].name,
        byCurrency: [...byCurrency.entries()].map(([currencyCode, money]) => ({ currencyCode, amount: money.toString() })),
      };
    },

    async getTopExpenseCategories(range, limit) {
      const [rows, categories] = await Promise.all([
        budgetQueries.getCategorySpendingForUser(user.id, { from: range.from, to: range.to }),
        categoryRepository.listForUser(user.id, { includeArchived: true }),
      ]);
      const nameById = new Map(categories.map((c) => [c.id, c.name]));
      return rows
        .filter((row) => row.categoryId && Number(row.netExpense) > 0)
        .map((row) => ({
          label: nameById.get(row.categoryId as string) ?? "Sin categoría",
          amount: Money.fromString(row.netExpense, row.currencyCode).toString(),
          currencyCode: row.currencyCode,
        }))
        .sort((a, b) => Number(b.amount) - Number(a.amount))
        .slice(0, limit);
    },

    async getRecentExpenses(range) {
      const rows = await activityQueries.listRecentActivity(user.id, { from: range.from, to: range.to, limit: 100 });
      return rows
        .filter((row) => row.type === "EXPENSE")
        .map((row) => ({
          description: (row.description as string) ?? "",
          merchant: (row.merchant as string | null) ?? null,
          categoryName: (row.categoryName as string | null) ?? null,
          amount: Money.fromString(row.amount as string, row.currencyCode as string).toString(),
          currencyCode: row.currencyCode as string,
          occurredAt: new Date(row.occurredAt as string | Date).toISOString(),
        }));
    },

    async getUpcomingObligations(horizonDays) {
      const model = await obligationReadModel.getObligations({
        userId: user.id,
        timezone: user.timezone,
        baseCurrency: user.baseCurrency,
        horizonDays,
        now,
      });
      const today = todayInTimezone(now, user.timezone);
      return model.items
        .filter((item) => item.daysUntilDue <= horizonDays)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .map((item) => ({
          title: item.title,
          dueDate: item.dueDate,
          amount: item.remainingAmount,
          currencyCode: item.currencyCode,
          daysUntilDue: daysBetween(today, item.dueDate),
          isOverdue: item.isOverdue,
        }));
    },

    async getActiveSubscriptions() {
      const rows = await subscriptionRepository.listForUser(user.id, "ACTIVE");
      return rows.map((row) => ({
        label: row.label,
        frequency: row.frequency,
        currentAmount: row.currentAmount,
        currencyCode: row.currencyCode,
        nextExpectedOn: row.nextExpectedOn ?? null,
      }));
    },

    async getBudgetStatus() {
      const items = await budgetService.getBudgetOverview(user);
      return items.map((item) => ({
        name: item.categoryName,
        status: item.status,
        usagePercent: Number(item.usagePercent),
        limit: item.limit,
        spent: item.spent,
        currencyCode: item.currencyCode,
      }));
    },

    async getGoalProgress() {
      const today = todayInTimezone(now, user.timezone);
      const goals = await goalService.listGoals(user, today);
      return goals
        .filter((goal) => goal.status === "ACTIVE" || goal.status === "COMPLETED")
        .map((goal) => ({
          name: goal.name,
          status: goal.pace.status === "GOAL_REACHED" || goal.percent >= 100 ? "GOAL_REACHED" : goal.pace.status,
          currentAmount: goal.currentAmount,
          targetAmount: goal.targetAmount,
          currencyCode: goal.currencyCode,
          actualProgressRatio: goal.percent / 100,
          requiredMonthly: goal.pace.requiredMonthly,
        }));
    },

    async getTopInsight() {
      const queue = await insightService
        .getQueue(user)
        .catch(() => [] as Awaited<ReturnType<typeof insightService.getQueue>>);
      const top = queue[0];
      if (!top) return null;
      const family = String(top.family);
      const severity: "info" | "warning" | "critical" = family.includes("CASH-RISK")
        ? "critical"
        : family.includes("BUDGET-LIMIT") || top.confidence === "HIGH"
          ? "warning"
          : "info";
      return { title: top.title, body: top.body, severity, route: top.cta?.href ?? "/insights" };
    },
  };
}
