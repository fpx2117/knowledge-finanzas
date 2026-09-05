import { describe, expect, it } from "vitest";

import { createAccountRepository } from "../../packages/db/src/repositories/accounts";
import { createCategoryRepository } from "../../packages/db/src/repositories/categories";
import { createBudgetRepository } from "../../packages/db/src/repositories/budgets";
import { createBudgetQueries } from "../../packages/db/src/queries/budgets";
import { createBudgetService } from "../../apps/web/src/features/budgets/services/budget-service";
import { createTransferService } from "../../apps/web/src/features/transfers/services/transfer-service";
import { transactions, users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

// WP-BUDGET-CONSUMPTION (spec 04 §13/§18/§21): budget "spent" must equal net consumption —
// EXPENSE minus linked REFUND — and must exclude transfers, liability payments, adjustments,
// income and voided rows. Locks the real query + service against Postgres.

const userId = "00000000-0000-0000-0000-00000000bc01";
const timezone = "UTC";
const now = () => new Date("2026-09-15T12:00:00Z");

async function seed() {
  const database = getTestDatabase().db;
  await database.insert(users).values({ id: userId, name: "User", email: "budget-consumption@example.test", timezone, baseCurrency: "ARS" });
  const accountsRepo = createAccountRepository(database);
  const account = await accountsRepo.create({
    userId, name: "Cuenta", type: "BANK", currencyCode: "ARS", openingBalance: "1000000", openingDate: "2026-01-01",
  });
  const savings = await accountsRepo.create({
    userId, name: "Ahorro", type: "SAVINGS", currencyCode: "ARS", openingBalance: "0", openingDate: "2026-01-01",
  });
  const categories = createCategoryRepository(database);
  const food = await categories.create({ userId, name: "Supermercado", type: "EXPENSE", parentId: null });
  const sub = await categories.create({ userId, name: "Almacén", type: "EXPENSE", parentId: food.id });

  const budgets = createBudgetRepository(database);
  const budget = await budgets.create({ userId, categoryId: food.id, name: null, currencyCode: "ARS", limitAmount: "100000", startDate: "2026-01-01" });

  const row = (over: Partial<typeof transactions.$inferInsert>) => ({
    userId, accountId: account.id, categoryId: food.id, currencyCode: "ARS", description: "x",
    occurredAt: new Date("2026-09-10T12:00:00Z"), type: "EXPENSE" as const, amount: "0", status: "POSTED" as const,
    ...over,
  });

  await database.insert(transactions).values([
    row({ type: "EXPENSE", amount: "60000", description: "Compra grande" }),
    row({ type: "EXPENSE", amount: "10000", categoryId: sub.id, description: "Compra en subcategoría" }), // subtree rollup
    row({ type: "REFUND", amount: "15000", description: "Devolución" }), // reduces consumption
    row({ type: "LIABILITY_PAYMENT", amount: "80000", categoryId: null, description: "Pago tarjeta" }), // §21 excluded
    row({ type: "ADJUSTMENT_OUT", amount: "7000", categoryId: null, description: "Ajuste contable" }), // §18.2 excluded
    row({ type: "EXPENSE", amount: "999999", description: "Anulada", status: "VOIDED" }), // §18.2 excluded
    row({ type: "EXPENSE", amount: "40000", description: "Mes que viene", occurredAt: new Date("2026-10-02T12:00:00Z") }), // out of period
  ]);

  // §19 — a real transfer between the user's own accounts must not touch the budget.
  await createTransferService(database, undefined, now).createTransfer(
    { id: userId, timezone },
    { fromAccountId: account.id, toAccountId: savings.id, amount: "500000", occurredAt: "2026-09-11T12:00:00Z" },
  );

  const service = createBudgetService({ budgets, categories, budgetQueries: createBudgetQueries(database), now });
  return { service, budgetId: budget.id };
}

describe("budget consumption (§13/§18/§21)", () => {
  it("counts EXPENSE minus REFUND across the category subtree, nothing else", async () => {
    const { service } = await seed();
    const [overview] = await service.getBudgetOverview({ id: userId, timezone });

    // 60000 + 10000 (subtree) - 15000 (refund) = 55000. Transfer, liability payment,
    // adjustment, voided and next-month rows all excluded.
    expect(overview.spent).toBe("55000.00");
    expect(overview.status).toBe("NORMAL");
    expect(overview.remaining).toBe("45000.00");
  });

  it("lets a later refund push net consumption below zero without breaking the budget", async () => {
    const database = getTestDatabase().db;
    const { service, budgetId } = await seed();
    await database.insert(transactions).values({
      userId, accountId: (await createAccountRepository(database).listForUser(userId))[0].id,
      categoryId: (await createCategoryRepository(database).listForUser(userId)).find((c) => c.name === "Supermercado")!.id,
      currencyCode: "ARS", description: "Gran devolución", type: "REFUND", amount: "80000", status: "POSTED",
      occurredAt: new Date("2026-09-12T12:00:00Z"),
    });

    const detail = await service.getBudgetDetail({ id: userId, timezone }, budgetId);
    // 55000 - 80000 = -25000
    expect(detail.spent).toBe("-25000.00");
    expect(detail.status).toBe("NORMAL");
  });
});
