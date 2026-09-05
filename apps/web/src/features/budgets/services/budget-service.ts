import {
  calculateBudget,
  getCurrencyMetadata,
  Money,
  monthRangeForTimezone,
  resolveBudgetAlertType,
  todayInTimezone,
  type BudgetAlertType,
  type BudgetUsageStatus,
} from "@know-finanzas/finance";
import { ApplicationError } from "@know-finanzas/shared";

import { allowAllProductAccessGate, type ProductAccessGate } from "@/lib/billing/product-access-gate";

type CategoryType = "INCOME" | "EXPENSE";
type EntityStatus = "ACTIVE" | "ARCHIVED";

type CategoryRecord = {
  id: string;
  userId: string;
  parentId: string | null;
  name: string;
  type: CategoryType;
  status: EntityStatus;
};

type BudgetRecord = {
  id: string;
  userId: string;
  categoryId: string;
  name: string | null;
  currencyCode: string;
  limitAmount: string;
  startDate: string;
  status: EntityStatus;
  archivedAt: Date | null;
};

type BudgetSpendingRow = { categoryId: string | null; currencyCode: string; netExpense: string };

type CategoryRepository = {
  findByIdForUser(categoryId: string, userId: string): Promise<CategoryRecord | undefined>;
  listForUser(userId: string, options?: { type?: CategoryType; includeArchived?: boolean }): Promise<CategoryRecord[]>;
};

type BudgetRepository = {
  create(input: {
    userId: string;
    categoryId: string;
    name: string | null;
    currencyCode: string;
    limitAmount: string;
    startDate: string;
  }): Promise<BudgetRecord>;
  findByIdForUser(budgetId: string, userId: string): Promise<BudgetRecord | undefined>;
  listForUser(userId: string, options?: { includeArchived?: boolean }): Promise<BudgetRecord[]>;
  existsActiveForCategoryCurrencyForUser(input: {
    userId: string;
    categoryId: string;
    currencyCode: string;
    excludeBudgetId?: string;
  }): Promise<boolean>;
  updateLimitForUser(
    budgetId: string,
    userId: string,
    input: { limitAmount: string; name: string | null },
  ): Promise<BudgetRecord | undefined>;
  archiveForUser(budgetId: string, userId: string, archivedAt: Date): Promise<BudgetRecord | undefined>;
};

type ContributingTransactionRow = {
  id: string;
  type: string;
  amount: string;
  currencyCode: string;
  description: string;
  merchant: string | null;
  categoryId: string | null;
  occurredAt: Date;
};

type BudgetQueries = {
  getCategorySpendingForUser(userId: string, range: { from: Date; to: Date }): Promise<BudgetSpendingRow[]>;
  listContributingTransactionsForUser(
    userId: string,
    categoryIds: string[],
    range: { from: Date; to: Date },
  ): Promise<ContributingTransactionRow[]>;
};

type User = { id: string; timezone: string };

export type BudgetOverviewItem = {
  budgetId: string;
  categoryId: string;
  categoryName: string;
  currencyCode: string;
  limit: string;
  spent: string;
  remaining: string;
  usagePercent: string;
  status: BudgetUsageStatus;
};

const STATUS_PRIORITY: Record<BudgetUsageStatus, number> = { EXCEEDED: 0, NEAR_LIMIT: 1, NORMAL: 2 };

function currentPeriod(user: User, now: Date) {
  const today = todayInTimezone(now, user.timezone);
  const [year, month] = today.split("-").map(Number);
  const range = monthRangeForTimezone(year, month, user.timezone);
  return { from: range.start, to: range.end };
}

function resolveCategorySubtreeIds(categoryById: Map<string, CategoryRecord>, rootCategoryId: string) {
  const ids = new Set([rootCategoryId]);
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

function buildOverviewItem(
  budget: BudgetRecord,
  categoryById: Map<string, CategoryRecord>,
  spendingRows: BudgetSpendingRow[],
): BudgetOverviewItem | null {
  const category = categoryById.get(budget.categoryId);
  if (!category) return null;

  const subtreeIds = resolveCategorySubtreeIds(categoryById, budget.categoryId);
  const zero = Money.zero(budget.currencyCode);
  const spent = spendingRows
    .filter((row) => row.categoryId !== null && subtreeIds.has(row.categoryId) && row.currencyCode === budget.currencyCode)
    .reduce((sum, row) => sum.add(Money.fromString(row.netExpense, budget.currencyCode)), zero);

  const result = calculateBudget({ limit: Money.fromString(budget.limitAmount, budget.currencyCode), spent });

  return {
    budgetId: budget.id,
    categoryId: budget.categoryId,
    categoryName: category.name,
    currencyCode: budget.currencyCode,
    limit: budget.limitAmount,
    spent: result.spent.toString(),
    remaining: result.remaining.toString(),
    usagePercent: result.usagePercent.toFixed(2),
    status: result.status,
  };
}

function validateCategory(category: CategoryRecord | undefined) {
  if (!category) throw new ApplicationError("BUDGET_CATEGORY_NOT_FOUND", { field: "categoryId" });
  if (category.status === "ARCHIVED") throw new ApplicationError("BUDGET_CATEGORY_ARCHIVED", { field: "categoryId" });
  if (category.type !== "EXPENSE") throw new ApplicationError("BUDGET_CATEGORY_TYPE_INVALID", { field: "categoryId" });
  return category;
}

function validateCurrency(currencyCode: string) {
  const code = currencyCode.trim().toUpperCase();
  try {
    return getCurrencyMetadata(code).code;
  } catch (error) {
    throw new ApplicationError("BUDGET_CURRENCY_MISMATCH", { field: "currencyCode", cause: error });
  }
}

function validateAmount(limitAmount: string, currencyCode: string) {
  try {
    Money.fromPositiveString(limitAmount, currencyCode);
  } catch (error) {
    throw new ApplicationError("INVALID_BUDGET_AMOUNT", { field: "limitAmount", cause: error });
  }
}

export function createBudgetService({
  budgets,
  categories,
  budgetQueries,
  now = () => new Date(),
  gate = allowAllProductAccessGate,
}: {
  budgets: BudgetRepository;
  categories: CategoryRepository;
  budgetQueries: BudgetQueries;
  now?: () => Date;
  gate?: ProductAccessGate;
}) {
  async function computeOverviewItems(user: User, period = currentPeriod(user, now())): Promise<BudgetOverviewItem[]> {
    const activeBudgets = await budgets.listForUser(user.id);
    if (activeBudgets.length === 0) return [];

    const [allCategories, spendingRows] = await Promise.all([
      categories.listForUser(user.id, { includeArchived: true }),
      budgetQueries.getCategorySpendingForUser(user.id, period),
    ]);
    const categoryById = new Map(allCategories.map((category) => [category.id, category]));

    return activeBudgets
      .map((budget) => buildOverviewItem(budget, categoryById, spendingRows))
      .filter((item): item is BudgetOverviewItem => item !== null)
      .sort(
        (a, b) => STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status] || Number(b.usagePercent) - Number(a.usagePercent),
      );
  }

  return {
    async createBudget(
      user: User,
      input: { categoryId: string; name?: string; currencyCode: string; limitAmount: string; startDate?: string },
    ) {
      await gate.assertCanWrite(user.id);
      const category = validateCategory(await categories.findByIdForUser(input.categoryId, user.id));
      const currencyCode = validateCurrency(input.currencyCode);
      validateAmount(input.limitAmount, currencyCode);

      if (await budgets.existsActiveForCategoryCurrencyForUser({ userId: user.id, categoryId: category.id, currencyCode })) {
        throw new ApplicationError("BUDGET_ALREADY_EXISTS", { field: "categoryId" });
      }

      return budgets.create({
        userId: user.id,
        categoryId: category.id,
        name: input.name?.trim() || null,
        currencyCode,
        limitAmount: Money.fromPositiveString(input.limitAmount, currencyCode).toString(),
        startDate: input.startDate ?? todayInTimezone(now(), user.timezone),
      });
    },

    async updateBudget(user: User, input: { budgetId: string; limitAmount: string; name?: string }) {
      await gate.assertCanWrite(user.id);
      const budget = await budgets.findByIdForUser(input.budgetId, user.id);
      if (!budget) throw new ApplicationError("BUDGET_NOT_FOUND");
      if (budget.status === "ARCHIVED") throw new ApplicationError("BUDGET_ARCHIVED");
      validateAmount(input.limitAmount, budget.currencyCode);

      const updated = await budgets.updateLimitForUser(input.budgetId, user.id, {
        limitAmount: Money.fromPositiveString(input.limitAmount, budget.currencyCode).toString(),
        name: input.name?.trim() || null,
      });
      if (!updated) throw new ApplicationError("BUDGET_NOT_FOUND");
      return updated;
    },

    async archiveBudget(user: User, budgetId: string) {
      const budget = await budgets.findByIdForUser(budgetId, user.id);
      if (!budget) throw new ApplicationError("BUDGET_NOT_FOUND");
      if (budget.status === "ARCHIVED") return budget;
      const archived = await budgets.archiveForUser(budgetId, user.id, now());
      if (!archived) throw new ApplicationError("BUDGET_NOT_FOUND");
      return archived;
    },

    getBudgetOverview(user: User): Promise<BudgetOverviewItem[]> {
      return computeOverviewItems(user);
    },

    // WP-ROUTES-SUBVIEWS (/budgets/history): the same overview computation, for an arbitrary
    // past month — budgets are a standing per-category limit, not a per-month row, so "history"
    // means re-running the real spend calculation against each past period, never a snapshot.
    getBudgetOverviewForMonth(user: User, year: number, month: number): Promise<BudgetOverviewItem[]> {
      const range = monthRangeForTimezone(year, month, user.timezone);
      return computeOverviewItems(user, { from: range.start, to: range.end });
    },

    async getBudgetDetail(
      user: User,
      budgetId: string,
    ): Promise<BudgetOverviewItem & { name: string | null; budgetStatus: EntityStatus; transactions: ContributingTransactionRow[] }> {
      const budget = await budgets.findByIdForUser(budgetId, user.id);
      if (!budget) throw new ApplicationError("BUDGET_NOT_FOUND");

      const allCategories = await categories.listForUser(user.id, { includeArchived: true });
      const categoryById = new Map(allCategories.map((category) => [category.id, category]));
      const period = currentPeriod(user, now());
      const spendingRows = await budgetQueries.getCategorySpendingForUser(user.id, period);

      const item = buildOverviewItem(budget, categoryById, spendingRows);
      if (!item) throw new ApplicationError("BUDGET_CATEGORY_NOT_FOUND");

      const subtreeIds = [...resolveCategorySubtreeIds(categoryById, budget.categoryId)];
      const transactions = await budgetQueries.listContributingTransactionsForUser(user.id, subtreeIds, period);

      return {
        ...item,
        name: budget.name,
        budgetStatus: budget.status,
        transactions: transactions.filter((row) => row.currencyCode === budget.currencyCode),
      };
    },

    resolveAlertType(status: BudgetUsageStatus): BudgetAlertType | null {
      return resolveBudgetAlertType(status);
    },
  };
}
