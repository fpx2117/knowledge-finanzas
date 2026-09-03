import { calculateBudget, monthRangeForTimezone, Money, todayInTimezone, type BudgetUsageStatus } from "@know-finanzas/finance";

type EntityStatus = "ACTIVE" | "ARCHIVED";

type BudgetRecord = {
  id: string;
  categoryId: string;
  name: string | null;
  currencyCode: string;
  limitAmount: string;
  status: EntityStatus;
};

type CategoryRecord = { id: string; name: string; parentId: string | null };

type SpendingRow = { categoryId: string | null; currencyCode: string; netExpense: string };

type Deps = {
  budgets: { listForUser(userId: string, options?: { includeArchived?: boolean }): Promise<BudgetRecord[]> };
  categories: {
    listForUser(
      userId: string,
      options?: { type?: "INCOME" | "EXPENSE"; includeArchived?: boolean },
    ): Promise<CategoryRecord[]>;
  };
  budgetQueries: {
    getCategorySpendingForUser(userId: string, range: { from: Date; to: Date }): Promise<SpendingRow[]>;
  };
};

export type BudgetOverviewItem = {
  budgetId: string;
  categoryName: string;
  currencyCode: string;
  limit: string;
  spent: string;
  remaining: string;
  usagePercent: string;
  status: BudgetUsageStatus;
};

const STATUS_PRIORITY: Record<BudgetUsageStatus, number> = { EXCEEDED: 0, NEAR_LIMIT: 1, NORMAL: 2 };

function subtreeIds(categoryById: Map<string, CategoryRecord>, root: string): Set<string> {
  const ids = new Set([root]);
  let added = true;
  while (added) {
    added = false;
    for (const category of categoryById.values()) {
      if (category.parentId && ids.has(category.parentId) && !ids.has(category.id)) {
        ids.add(category.id);
        added = true;
      }
    }
  }
  return ids;
}

/**
 * Compact budget-vs-actual overview for the dashboard's "Presupuesto del mes"
 * panel. The full budget service (create / update / alerts) belongs to the
 * Presupuestos screen.
 */
export async function getBudgetOverview(
  user: { id: string; timezone: string },
  deps: Deps,
  now: Date = new Date(),
): Promise<BudgetOverviewItem[]> {
  const activeBudgets = await deps.budgets.listForUser(user.id);
  if (activeBudgets.length === 0) return [];

  const today = todayInTimezone(now, user.timezone);
  const [year, month] = today.split("-").map(Number);
  const range = monthRangeForTimezone(year, month, user.timezone);

  const [allCategories, spendingRows] = await Promise.all([
    deps.categories.listForUser(user.id, { includeArchived: true }),
    deps.budgetQueries.getCategorySpendingForUser(user.id, { from: range.start, to: range.end }),
  ]);
  const categoryById = new Map(allCategories.map((category) => [category.id, category]));

  return activeBudgets
    .map((budget): BudgetOverviewItem | null => {
      const category = categoryById.get(budget.categoryId);
      if (!category) return null;
      const ids = subtreeIds(categoryById, budget.categoryId);
      const spent = spendingRows
        .filter((row) => row.categoryId !== null && ids.has(row.categoryId) && row.currencyCode === budget.currencyCode)
        .reduce((sum, row) => sum.add(Money.fromString(row.netExpense, budget.currencyCode)), Money.zero(budget.currencyCode));
      const result = calculateBudget({ limit: Money.fromString(budget.limitAmount, budget.currencyCode), spent });
      return {
        budgetId: budget.id,
        categoryName: category.name,
        currencyCode: budget.currencyCode,
        limit: budget.limitAmount,
        spent: result.spent.toString(),
        remaining: result.remaining.toString(),
        usagePercent: result.usagePercent.toFixed(2),
        status: result.status,
      };
    })
    .filter((item): item is BudgetOverviewItem => item !== null)
    .sort(
      (a, b) =>
        STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status] || Number(b.usagePercent) - Number(a.usagePercent),
    );
}
