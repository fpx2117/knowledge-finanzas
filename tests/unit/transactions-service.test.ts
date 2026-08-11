import { describe, expect, it } from "vitest";
import { createTransactionService } from "../../apps/web/src/features/transactions/services/transaction-service";

const account = { id: "10000000-0000-0000-0000-000000000001", userId: "user-a", currencyCode: "ARS", openingDate: "2026-01-01", status: "ACTIVE" as const };
const category = { id: "20000000-0000-0000-0000-000000000001", userId: "user-a", type: "EXPENSE" as const, status: "ACTIVE" as const };
const input = { accountId: account.id, amount: "100.50", description: "Compra", categoryId: category.id, occurredAt: "2026-02-01T12:00:00Z", notes: "Nota" };

function setup(overrides: Partial<typeof account> = {}, categoryOverride = category) {
  const created: Record<string, unknown>[] = [];
  return {
    created,
    service: createTransactionService({
      accounts: { findByIdForUser: async () => ({ ...account, ...overrides }) },
      categories: { findByIdForUser: async () => categoryOverride },
      transactions: { create: async (value) => { created.push(value); return value; } },
      now: () => new Date("2026-02-02T12:00:00Z"),
    }),
  };
}

describe("transaction service", () => {
  it("creates an expense as a positive posted manual magnitude", async () => {
    const { service, created } = setup();
    await service.createExpenseTransaction("user-a", { ...input, merchant: "Comercio" }, "UTC");
    expect(created[0]).toMatchObject({ type: "EXPENSE", amount: "100.50", currencyCode: "ARS", source: "MANUAL", categoryId: category.id });
  });

  it("rejects archived accounts and incompatible categories", async () => {
    await expect(setup({ status: "ARCHIVED" }).service.createExpenseTransaction("user-a", input, "UTC")).rejects.toMatchObject({ code: "ACCOUNT_ARCHIVED" });
    await expect(setup({}, { ...category, type: "INCOME" }).service.createExpenseTransaction("user-a", input, "UTC")).rejects.toMatchObject({ code: "CATEGORY_TYPE_MISMATCH" });
  });

  it("rejects future dates and foreign accounts", async () => {
    await expect(setup().service.createExpenseTransaction("user-a", { ...input, occurredAt: "2026-02-03T12:00:00Z" }, "UTC")).rejects.toMatchObject({ code: "INVALID_INPUT" });
    const service = createTransactionService({ accounts: { findByIdForUser: async () => undefined }, categories: { findByIdForUser: async () => category }, transactions: { create: async () => ({}) }, now: () => new Date("2026-02-02T12:00:00Z") });
    await expect(service.createIncomeTransaction("user-a", { ...input, categoryId: undefined }, "UTC")).rejects.toMatchObject({ code: "ACCOUNT_NOT_FOUND" });
  });
});
