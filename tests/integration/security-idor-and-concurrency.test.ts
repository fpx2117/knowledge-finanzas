import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { createDebtRepository } from "../../packages/db/src/repositories/debts";
import { createBudgetRepository } from "../../packages/db/src/repositories/budgets";
import { createCategoryRepository } from "../../packages/db/src/repositories/categories";
import { createDebtPaymentService } from "../../apps/web/src/features/debts/services/debt-payment-service";
import { createTransferService } from "../../apps/web/src/features/transfers/services/transfer-service";
import { accounts, debtInstallments, debtPaymentAllocations, debtPayments, debts, users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

// TASK-040's consolidated IDOR + concurrency security suite. This complements
// tests/integration/ownership-repositories.test.ts (which already covers accounts/categories/
// transactions/budgets-uniqueness cross-user denial and transfer/debt-payment atomicity) with the
// specific gaps that file doesn't exercise: cross-user access to debts/debt-payments/transfers at
// the *service* layer (not just a repository lookup), and a real concurrent-write invariant proof
// for debt payments under real Postgres row locking.

const userA = "00000000-0000-0000-0000-000000000301";
const userB = "00000000-0000-0000-0000-000000000302";
const accountA = "10000000-0000-0000-0000-000000000301";
const accountB = "10000000-0000-0000-0000-000000000302";
const debtA = "40000000-0000-0000-0000-000000000301";
const debtB = "40000000-0000-0000-0000-000000000302";

async function seedTwoUsersWithAccountsAndDebts() {
  const database = getTestDatabase().db;
  await database.insert(users).values([
    { id: userA, name: "User A", email: "idor-a@example.test", timezone: "UTC", baseCurrency: "ARS" },
    { id: userB, name: "User B", email: "idor-b@example.test", timezone: "UTC", baseCurrency: "ARS" },
  ]);
  await database.insert(accounts).values([
    { id: accountA, userId: userA, name: "Account A", type: "BANK", currencyCode: "ARS", openingBalance: "10000", openingDate: "2026-01-01" },
    { id: accountB, userId: userB, name: "Account B", type: "BANK", currencyCode: "ARS", openingBalance: "10000", openingDate: "2026-01-01" },
  ]);
  await database.insert(debts).values([
    { id: debtA, userId: userA, name: "Debt A", type: "OTHER", currencyCode: "ARS", originalAmount: "1000", startDate: "2026-01-01", interestType: "NO_INTEREST" },
    { id: debtB, userId: userB, name: "Debt B", type: "OTHER", currencyCode: "ARS", originalAmount: "1000", startDate: "2026-01-01", interestType: "NO_INTEREST" },
  ]);
  await database.insert(debtInstallments).values({ debtId: debtA, installmentNumber: 1, dueDate: "2026-02-01", principalAmount: "1000", interestAmount: "0", feeAmount: "0", totalAmount: "1000" });
}

describe("IDOR: cross-user access is denied at every ownership-scoped boundary", () => {
  it("a debt repository lookup by ID never returns another user's debt", async () => {
    await seedTwoUsersWithAccountsAndDebts();
    const repository = createDebtRepository(getTestDatabase().db);

    await expect(repository.findByIdForUser(debtB, userA)).resolves.toBeUndefined();
    await expect(repository.findByIdForUser(debtA, userA)).resolves.toMatchObject({ id: debtA });
  });

  it("recording a debt payment against another user's debt is rejected, not silently redirected to the caller's own debt", async () => {
    await seedTwoUsersWithAccountsAndDebts();
    const database = getTestDatabase().db;
    const service = createDebtPaymentService(database);

    await expect(service.recordDebtPayment({ id: userA, timezone: "UTC" }, { debtId: debtB, accountId: accountA, amount: "100", strategy: "OLDEST_DUE_FIRST" }))
      .rejects.toMatchObject({ code: "INVALID_INPUT", field: "debtId" });

    // No payment row was created for the rejected attempt.
    const payments = await database.select().from(debtPayments).where(eq(debtPayments.userId, userA));
    expect(payments).toHaveLength(0);
  });

  it("recording a debt payment using another user's account as the funding account is rejected", async () => {
    await seedTwoUsersWithAccountsAndDebts();
    const database = getTestDatabase().db;
    const service = createDebtPaymentService(database);

    await expect(service.recordDebtPayment({ id: userA, timezone: "UTC" }, { debtId: debtA, accountId: accountB, amount: "100", strategy: "OLDEST_DUE_FIRST" }))
      .rejects.toMatchObject({ code: "ACCOUNT_NOT_FOUND" });
  });

  it("a transfer using another user's account as the destination is rejected, never silently crossing account boundaries", async () => {
    await seedTwoUsersWithAccountsAndDebts();
    const database = getTestDatabase().db;
    const service = createTransferService({ database });

    await expect(service.createTransfer({ id: userA, timezone: "UTC" }, { fromAccountId: accountA, toAccountId: accountB, amount: "100", occurredAt: "2026-01-15" }))
      .rejects.toMatchObject({ code: "TRANSFER_ACCOUNT_NOT_FOUND" });
  });

  it("a budget repository lookup by ID never returns another user's budget", async () => {
    await seedTwoUsersWithAccountsAndDebts();
    const database = getTestDatabase().db;
    const categories = createCategoryRepository(database);
    const budgets = createBudgetRepository(database);

    const category = await categories.create({ userId: userB, name: "Groceries", type: "EXPENSE", parentId: null });
    const budget = await budgets.create({ userId: userB, categoryId: category.id, name: null, currencyCode: "ARS", limitAmount: "500", startDate: "2026-01-01" });

    await expect(budgets.findByIdForUser(budget.id, userA)).resolves.toBeUndefined();
    await expect(budgets.findByIdForUser(budget.id, userB)).resolves.toMatchObject({ id: budget.id });
  });
});

describe("concurrency: concurrent writes against shared state never corrupt financial totals", () => {
  it("two concurrent payments against the same debt serialize correctly under row locking — both post, and the remaining balance reflects exactly the sum of both, never double-counted or lost", async () => {
    await seedTwoUsersWithAccountsAndDebts();
    const database = getTestDatabase().db;
    const service = createDebtPaymentService(database);

    const [first, second] = await Promise.all([
      service.recordDebtPayment({ id: userA, timezone: "UTC" }, { debtId: debtA, accountId: accountA, amount: "300", strategy: "OLDEST_DUE_FIRST" }),
      service.recordDebtPayment({ id: userA, timezone: "UTC" }, { debtId: debtA, accountId: accountA, amount: "300", strategy: "OLDEST_DUE_FIRST" }),
    ]);

    // Both payments are real, distinct, and posted — this row-locking design doesn't deduplicate a
    // genuine double-click (no idempotency key exists on this write), but it does guarantee neither
    // payment's allocation math ever reads a stale, pre-other-payment snapshot.
    expect(first.transactionId).not.toBe(second.transactionId);
    expect(first.debtRemaining).toBe("700.00");
    expect(second.debtRemaining).toBe("400.00");

    const allocations = await database.select().from(debtPaymentAllocations)
      .innerJoin(debtPayments, and(eq(debtPayments.id, debtPaymentAllocations.paymentId), eq(debtPayments.debtId, debtA)));
    const totalAllocated = allocations.reduce((sum, row) => sum + Number(row.debt_payment_allocations.amount), 0);
    expect(totalAllocated).toBe(600);
  });
});
