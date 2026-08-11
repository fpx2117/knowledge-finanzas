import {
  budgetRepository,
  categoryRepository,
  createAccountBalanceQueries,
  createActivityQueries,
  createBudgetQueries,
  createDebtSummaryQueries,
  createMonthlySummaryQueries,
  createUpcomingObligationQueries,
  createUserRepository,
  db,
} from "@know-finanzas/db";
import {
  budgetOverviewResultSchema,
  cashflowProjectionResultSchema,
  createToolRegistry,
  debtSummaryResultSchema,
  liquidBalancesResultSchema,
  monthlySummaryResultSchema,
  noArgsSchema,
  searchTransactionsArgsSchema,
  searchTransactionsResultSchema,
  upcomingObligationsResultSchema,
  type AnyToolDefinition,
} from "@know-finanzas/ai";
import { todayInTimezone } from "@know-finanzas/finance";
import { createDashboardService } from "@/features/dashboard/services/dashboard-service";
import { createBudgetService } from "@/features/budgets/services/budget-service";

const users = createUserRepository(db);
const activity = createActivityQueries(db);
const upcoming = createUpcomingObligationQueries(db);

const dashboardService = createDashboardService({
  balances: createAccountBalanceQueries(db),
  monthly: createMonthlySummaryQueries(db),
  activity,
  projections: { debts: createDebtSummaryQueries(db), scheduled: upcoming },
});

const budgetService = createBudgetService({ budgets: budgetRepository, categories: categoryRepository, budgetQueries: createBudgetQueries(db) });

async function requireTimezone(userId: string): Promise<string> {
  return (await users.findTimezoneById(userId)) ?? "UTC";
}

async function getDashboardSummaryForUser(userId: string) {
  const timezone = await requireTimezone(userId);
  return dashboardService.getDashboardSummary({ userId, timezone, now: new Date() });
}

// Real, production-wired read-only finance tools. Every execute() derives its data solely from
// context.userId (server-authenticated) and existing, already-tested application services — no
// tool here writes to packages/db, and none accepts a caller-supplied userId.
const financeTools: AnyToolDefinition[] = [
  {
    name: "getLiquidBalances",
    description: "Total liquid balance per currency across the user's active accounts.",
    argsSchema: noArgsSchema,
    resultSchema: liquidBalancesResultSchema,
    execute: async (_args, context) => (await getDashboardSummaryForUser(context.userId)).liquidBalances,
  },
  {
    name: "getMonthlySummary",
    description: "Income and expense totals per currency for the current calendar month.",
    argsSchema: noArgsSchema,
    resultSchema: monthlySummaryResultSchema,
    execute: async (_args, context) => (await getDashboardSummaryForUser(context.userId)).monthly,
  },
  {
    name: "getDebtSummary",
    description: "Remaining debt balance per currency across active debts.",
    argsSchema: noArgsSchema,
    resultSchema: debtSummaryResultSchema,
    execute: async (_args, context) => (await getDashboardSummaryForUser(context.userId)).debt,
  },
  {
    name: "getCashflowProjection",
    description: "30-day spendable money and projected balance per currency.",
    argsSchema: noArgsSchema,
    resultSchema: cashflowProjectionResultSchema,
    execute: async (_args, context) => {
      const summary = await getDashboardSummaryForUser(context.userId);
      return summary.projections.map((projection) => ({
        currencyCode: projection.currencyCode,
        spendable: projection.spendable.spendable.toString(),
        projectedEndBalance: projection.cashflow.projectedEndBalance.toString(),
        minimumProjectedBalance: projection.cashflow.minimumProjectedBalance.toString(),
        shortfallAmount: projection.cashflow.shortfallAmount ? projection.cashflow.shortfallAmount.toString() : null,
      }));
    },
  },
  {
    name: "getUpcomingObligations",
    description: "Debt installments and scheduled transactions due in the next 30 days.",
    argsSchema: noArgsSchema,
    resultSchema: upcomingObligationsResultSchema,
    execute: async (_args, context) => {
      const timezone = await requireTimezone(context.userId);
      const today = todayInTimezone(new Date(), timezone);
      const horizonEnd = addDays(today, 30);

      const [installmentRows, scheduledRows] = await Promise.all([
        upcoming.listDebtInstallmentsForUser(context.userId, { from: today, to: horizonEnd }),
        upcoming.listScheduledForUser(context.userId, { from: today, to: horizonEnd }),
      ]);

      return [
        ...installmentRows.map((row) => ({
          title: row.debt.name,
          dueDate: row.installment.dueDate,
          amount: row.installment.totalAmount,
          currencyCode: row.debt.currencyCode,
          sourceType: "DEBT_INSTALLMENT" as const,
        })),
        ...scheduledRows.map((row) => ({
          title: row.description,
          dueDate: row.scheduledDate,
          amount: row.expectedAmount,
          currencyCode: row.currencyCode,
          sourceType: "SCHEDULED_TRANSACTION" as const,
        })),
      ];
    },
  },
  {
    name: "getBudgetOverview",
    description: "Active budgets with limit, spent and usage status for the current period.",
    argsSchema: noArgsSchema,
    resultSchema: budgetOverviewResultSchema,
    execute: async (_args, context) => {
      const timezone = await requireTimezone(context.userId);
      const items = await budgetService.getBudgetOverview({ id: context.userId, timezone });
      return items.map((item) => ({
        categoryName: item.categoryName,
        currencyCode: item.currencyCode,
        limitAmount: item.limit,
        spentAmount: item.spent,
        usagePercent: Number(item.usagePercent),
        status: item.status,
      }));
    },
  },
  {
    name: "searchTransactions",
    description: "Recent posted transactions, most recent first, bounded to a small window.",
    argsSchema: searchTransactionsArgsSchema,
    resultSchema: searchTransactionsResultSchema,
    execute: async (args, context) => {
      const from = new Date(Date.now() - args.daysBack * 24 * 60 * 60 * 1000);
      const rows = await activity.listRecentActivity(context.userId, { from, limit: args.limit });
      return rows.map((row) => ({
        description: String(row.description ?? ""),
        merchant: row.merchant ? String(row.merchant) : null,
        categoryName: row.categoryName ? String(row.categoryName) : null,
        type: String(row.type),
        amount: String(row.amount),
        currencyCode: String(row.currencyCode),
        occurredAt: row.occurredAt instanceof Date ? row.occurredAt.toISOString() : String(row.occurredAt),
      }));
    },
  },
];

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export const financeToolRegistry = createToolRegistry(financeTools);
