// QUARANTINED — `budgetService.getBudgetAlerts` was removed when `budget-service.ts` was
// rebuilt in the greenfield frontend work; its sibling `evaluate-financial-alerts`
// (notifications) is also in pending-rebuild/. Restore these cases (and move the file back
// to tests/unit/) when the budget-alerts / notifications slice is rebuilt.
// See docs/capture/implementation-backlog.md.
import { describe, expect, it } from "vitest";
import { createBudgetService } from "../../../apps/web/src/features/budgets/services/budget-service";

const userA = "00000000-0000-0000-0000-000000000001";
const foodCategory = { id: "20000000-0000-0000-0000-000000000001", userId: userA, parentId: null, name: "Comida", type: "EXPENSE" as const, status: "ACTIVE" as const };
const restaurantsCategory = { id: "20000000-0000-0000-0000-000000000002", userId: userA, parentId: foodCategory.id, name: "Restaurantes", type: "EXPENSE" as const, status: "ACTIVE" as const };
const archivedCategory = { id: "20000000-0000-0000-0000-000000000003", userId: userA, parentId: null, name: "Archivada", type: "EXPENSE" as const, status: "ARCHIVED" as const };
const salaryCategory = { id: "20000000-0000-0000-0000-000000000004", userId: userA, parentId: null, name: "Sueldo", type: "INCOME" as const, status: "ACTIVE" as const };

function fakeCategories() {
  const records = [foodCategory, restaurantsCategory, archivedCategory, salaryCategory];
  return {
    findByIdForUser: async (id: string, userId: string) => records.find((item) => item.id === id && item.userId === userId),
    listForUser: async (userId: string) => records.filter((item) => item.userId === userId),
  };
}

function fakeBudgets() {
  const records: Array<{ id: string; userId: string; categoryId: string; name: string | null; currencyCode: string; limitAmount: string; startDate: string; status: "ACTIVE" | "ARCHIVED"; archivedAt: Date | null }> = [];
  let counter = 0;
  return {
    records,
    create: async (input: { userId: string; categoryId: string; name: string | null; currencyCode: string; limitAmount: string; startDate: string }) => {
      counter += 1;
      const record = { id: `budget-${counter}`, status: "ACTIVE" as const, archivedAt: null, ...input };
      records.push(record);
      return record;
    },
    findByIdForUser: async (id: string, userId: string) => records.find((item) => item.id === id && item.userId === userId),
    listForUser: async (userId: string) => records.filter((item) => item.userId === userId && item.status === "ACTIVE"),
    existsActiveForCategoryCurrencyForUser: async (input: { userId: string; categoryId: string; currencyCode: string; excludeBudgetId?: string }) =>
      records.some((item) => item.userId === input.userId && item.categoryId === input.categoryId && item.currencyCode === input.currencyCode && item.status === "ACTIVE" && item.id !== input.excludeBudgetId),
    updateLimitForUser: async () => undefined,
    archiveForUser: async () => undefined,
  };
}

function fakeBudgetQueries(rows: Array<{ categoryId: string | null; currencyCode: string; netExpense: string }>) {
  return { getCategorySpendingForUser: async () => rows, listContributingTransactionsForUser: async () => [] };
}

function fakeBudgetAlerts() {
  const records: Array<{ id: string; userId: string; budgetId: string; periodKey: string; alertType: "BUDGET_NEAR_LIMIT" | "BUDGET_EXCEEDED"; triggeredAt: Date }> = [];
  let counter = 0;
  return {
    records,
    recordIfAbsent: async (input: { userId: string; budgetId: string; periodKey: string; alertType: "BUDGET_NEAR_LIMIT" | "BUDGET_EXCEEDED"; triggeredAt: Date }) => {
      const exists = records.some((item) => item.budgetId === input.budgetId && item.periodKey === input.periodKey && item.alertType === input.alertType);
      if (exists) return undefined;
      counter += 1;
      const record = { id: `alert-${counter}`, ...input };
      records.push(record);
      return record;
    },
    listForUserPeriod: async (userId: string, periodKey: string) => records.filter((item) => item.userId === userId && item.periodKey === periodKey),
  };
}

describe("budget service — alerts (pending rebuild)", () => {
  it("records a deduplicated alert once per budget/period/type and does not duplicate on repeated evaluation", async () => {
    const budgets = fakeBudgets();
    const budgetAlerts = fakeBudgetAlerts();
    const rows = [{ categoryId: foodCategory.id, currencyCode: "ARS", netExpense: "120.000000" }];
    const service = createBudgetService({ budgets, categories: fakeCategories(), budgetQueries: fakeBudgetQueries(rows), budgetAlerts });
    await service.createBudget({ id: userA, timezone: "UTC" }, { categoryId: foodCategory.id, currencyCode: "ARS", limitAmount: "100" });

    const first = await service.getBudgetAlerts({ id: userA, timezone: "UTC" });
    const second = await service.getBudgetAlerts({ id: userA, timezone: "UTC" });

    expect(first).toHaveLength(1);
    expect(first[0]).toMatchObject({ alertType: "BUDGET_EXCEEDED", categoryName: "Comida" });
    expect(second).toHaveLength(1);
    expect(second[0].id).toBe(first[0].id);
    expect(budgetAlerts.records).toHaveLength(1);
  });

  it("does not raise an alert for a budget within normal usage", async () => {
    const budgets = fakeBudgets();
    const budgetAlerts = fakeBudgetAlerts();
    const rows = [{ categoryId: foodCategory.id, currencyCode: "ARS", netExpense: "10.000000" }];
    const service = createBudgetService({ budgets, categories: fakeCategories(), budgetQueries: fakeBudgetQueries(rows), budgetAlerts });
    await service.createBudget({ id: userA, timezone: "UTC" }, { categoryId: foodCategory.id, currencyCode: "ARS", limitAmount: "100" });

    const alerts = await service.getBudgetAlerts({ id: userA, timezone: "UTC" });

    expect(alerts).toHaveLength(0);
  });
});
