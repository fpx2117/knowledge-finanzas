import { describe, expect, it } from "vitest";
import { createBudgetService } from "../../apps/web/src/features/budgets/services/budget-service";

const userA = "00000000-0000-0000-0000-000000000001";
const userB = "00000000-0000-0000-0000-000000000002";
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
    updateLimitForUser: async (id: string, userId: string, input: { limitAmount: string; name: string | null }) => {
      const record = records.find((item) => item.id === id && item.userId === userId && item.status === "ACTIVE");
      if (!record) return undefined;
      record.limitAmount = input.limitAmount;
      record.name = input.name;
      return record;
    },
    archiveForUser: async (id: string, userId: string, archivedAt: Date) => {
      const record = records.find((item) => item.id === id && item.userId === userId && item.status === "ACTIVE");
      if (!record) return undefined;
      record.status = "ARCHIVED";
      record.archivedAt = archivedAt;
      return record;
    },
  };
}

function fakeBudgetQueries(rows: Array<{ categoryId: string | null; currencyCode: string; netExpense: string }>, transactions: Array<{ id: string; type: string; amount: string; currencyCode: string; description: string; merchant: string | null; categoryId: string | null; occurredAt: Date }> = []) {
  return { getCategorySpendingForUser: async () => rows, listContributingTransactionsForUser: async () => transactions };
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

describe("budget service", () => {
  it("creates a budget for an owned active expense category", async () => {
    const budgets = fakeBudgets();
    const service = createBudgetService({ budgets, categories: fakeCategories(), budgetQueries: fakeBudgetQueries([]) });

    const created = await service.createBudget({ id: userA, timezone: "UTC" }, { categoryId: foodCategory.id, currencyCode: "ars", limitAmount: "200" });

    expect(created).toMatchObject({ userId: userA, categoryId: foodCategory.id, currencyCode: "ARS", limitAmount: "200.00" });
  });

  it("rejects an income category", async () => {
    const service = createBudgetService({ budgets: fakeBudgets(), categories: fakeCategories(), budgetQueries: fakeBudgetQueries([]) });
    await expect(service.createBudget({ id: userA, timezone: "UTC" }, { categoryId: salaryCategory.id, currencyCode: "ARS", limitAmount: "200" }))
      .rejects.toMatchObject({ code: "BUDGET_CATEGORY_TYPE_INVALID" });
  });

  it("rejects an archived category", async () => {
    const service = createBudgetService({ budgets: fakeBudgets(), categories: fakeCategories(), budgetQueries: fakeBudgetQueries([]) });
    await expect(service.createBudget({ id: userA, timezone: "UTC" }, { categoryId: archivedCategory.id, currencyCode: "ARS", limitAmount: "200" }))
      .rejects.toMatchObject({ code: "BUDGET_CATEGORY_ARCHIVED" });
  });

  it("rejects a category owned by another user", async () => {
    const service = createBudgetService({ budgets: fakeBudgets(), categories: fakeCategories(), budgetQueries: fakeBudgetQueries([]) });
    await expect(service.createBudget({ id: userB, timezone: "UTC" }, { categoryId: foodCategory.id, currencyCode: "ARS", limitAmount: "200" }))
      .rejects.toMatchObject({ code: "BUDGET_CATEGORY_NOT_FOUND" });
  });

  it("rejects a non-positive limit", async () => {
    const service = createBudgetService({ budgets: fakeBudgets(), categories: fakeCategories(), budgetQueries: fakeBudgetQueries([]) });
    await expect(service.createBudget({ id: userA, timezone: "UTC" }, { categoryId: foodCategory.id, currencyCode: "ARS", limitAmount: "0" }))
      .rejects.toMatchObject({ code: "INVALID_BUDGET_AMOUNT" });
  });

  it("rejects a duplicate active budget for the same category and currency", async () => {
    const budgets = fakeBudgets();
    const service = createBudgetService({ budgets, categories: fakeCategories(), budgetQueries: fakeBudgetQueries([]) });
    await service.createBudget({ id: userA, timezone: "UTC" }, { categoryId: foodCategory.id, currencyCode: "ARS", limitAmount: "200" });

    await expect(service.createBudget({ id: userA, timezone: "UTC" }, { categoryId: foodCategory.id, currencyCode: "ARS", limitAmount: "300" }))
      .rejects.toMatchObject({ code: "BUDGET_ALREADY_EXISTS" });
  });

  it("archives an active budget and is idempotent", async () => {
    const budgets = fakeBudgets();
    const service = createBudgetService({ budgets, categories: fakeCategories(), budgetQueries: fakeBudgetQueries([]) });
    const created = await service.createBudget({ id: userA, timezone: "UTC" }, { categoryId: foodCategory.id, currencyCode: "ARS", limitAmount: "200" });

    const archived = await service.archiveBudget({ id: userA, timezone: "UTC" }, created.id);
    expect(archived.status).toBe("ARCHIVED");
    await expect(service.archiveBudget({ id: userA, timezone: "UTC" }, created.id)).resolves.toMatchObject({ status: "ARCHIVED" });
  });

  it("rejects archiving or updating a budget owned by another user", async () => {
    const budgets = fakeBudgets();
    const service = createBudgetService({ budgets, categories: fakeCategories(), budgetQueries: fakeBudgetQueries([]) });
    const created = await service.createBudget({ id: userA, timezone: "UTC" }, { categoryId: foodCategory.id, currencyCode: "ARS", limitAmount: "200" });

    await expect(service.archiveBudget({ id: userB, timezone: "UTC" }, created.id)).rejects.toMatchObject({ code: "BUDGET_NOT_FOUND" });
    await expect(service.updateBudget({ id: userB, timezone: "UTC" }, { budgetId: created.id, limitAmount: "300" })).rejects.toMatchObject({ code: "BUDGET_NOT_FOUND" });
  });

  it("rolls up descendant category spending into the parent budget overview", async () => {
    const budgets = fakeBudgets();
    const rows = [{ categoryId: restaurantsCategory.id, currencyCode: "ARS", netExpense: "60.000000" }];
    const service = createBudgetService({ budgets, categories: fakeCategories(), budgetQueries: fakeBudgetQueries(rows) });
    await service.createBudget({ id: userA, timezone: "UTC" }, { categoryId: foodCategory.id, currencyCode: "ARS", limitAmount: "100" });

    const overview = await service.getBudgetOverview({ id: userA, timezone: "UTC" });

    expect(overview).toHaveLength(1);
    expect(overview[0]).toMatchObject({ categoryId: foodCategory.id, spent: "60.00", remaining: "40.00", status: "NORMAL" });
  });

  it("sorts the overview by exceeded first, then near-limit, then usage descending", async () => {
    const budgets = fakeBudgets();
    const foodRows = [{ categoryId: foodCategory.id, currencyCode: "ARS", netExpense: "50.000000" }];
    const restaurantRows = [{ categoryId: restaurantsCategory.id, currencyCode: "ARS", netExpense: "150.000000" }];
    const service = createBudgetService({ budgets, categories: fakeCategories(), budgetQueries: fakeBudgetQueries([...foodRows, ...restaurantRows]) });
    await service.createBudget({ id: userA, timezone: "UTC" }, { categoryId: foodCategory.id, currencyCode: "ARS", limitAmount: "1000" });
    await service.createBudget({ id: userA, timezone: "UTC" }, { categoryId: restaurantsCategory.id, currencyCode: "ARS", limitAmount: "100" });

    const overview = await service.getBudgetOverview({ id: userA, timezone: "UTC" });

    expect(overview.map((item) => item.categoryId)).toEqual([restaurantsCategory.id, foodCategory.id]);
    expect(overview[0].status).toBe("EXCEEDED");
  });

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

  it("returns the current-period contributing transactions in the budget detail", async () => {
    const budgets = fakeBudgets();
    const transactions = [{ id: "tx-1", type: "EXPENSE", amount: "60.000000", currencyCode: "ARS", description: "Supermercado", merchant: null, categoryId: foodCategory.id, occurredAt: new Date("2026-08-08T12:00:00Z") }];
    const service = createBudgetService({ budgets, categories: fakeCategories(), budgetQueries: fakeBudgetQueries([], transactions) });
    const created = await service.createBudget({ id: userA, timezone: "UTC" }, { categoryId: foodCategory.id, currencyCode: "ARS", limitAmount: "100" });

    const detail = await service.getBudgetDetail({ id: userA, timezone: "UTC" }, created.id);

    expect(detail.transactions).toHaveLength(1);
    expect(detail.transactions[0]).toMatchObject({ id: "tx-1", description: "Supermercado" });
    expect(detail.budgetStatus).toBe("ACTIVE");
  });

  it("rejects viewing a budget owned by another user", async () => {
    const budgets = fakeBudgets();
    const service = createBudgetService({ budgets, categories: fakeCategories(), budgetQueries: fakeBudgetQueries([]) });
    const created = await service.createBudget({ id: userA, timezone: "UTC" }, { categoryId: foodCategory.id, currencyCode: "ARS", limitAmount: "100" });

    await expect(service.getBudgetDetail({ id: userB, timezone: "UTC" }, created.id)).rejects.toMatchObject({ code: "BUDGET_NOT_FOUND" });
  });
});
