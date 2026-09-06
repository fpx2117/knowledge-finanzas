import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { createAccountRepository } from "../../packages/db/src/repositories/accounts";
import { createCategoryRepository } from "../../packages/db/src/repositories/categories";
import { createGoalRepository } from "../../packages/db/src/repositories/goals";
import { createTransactionRepository } from "../../packages/db/src/repositories/transactions";
import { createDebtPaymentService } from "../../apps/web/src/features/debts/services/debt-payment-service";
import { createGoalService } from "../../apps/web/src/features/goals/services/goal-service";
import { createTransactionService } from "../../apps/web/src/features/transactions/services/transaction-service";
import { createTransferService } from "../../apps/web/src/features/transfers/services/transfer-service";
import { runFinanceAudit } from "../../packages/db/src/audit/finance-audit";
import { Money } from "../../packages/finance/src";
import {
  debtInstallments,
  debts,
  goalAllocations,
  goals,
  scheduledTransactions,
  transactions,
  transfers,
  users,
} from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

// WP-RECONCILIATION (Fase H, gate G1): the per-WP tests each prove one invariant in isolation.
// This proves the whole thing reconciles at once — a single dataset that exercises every domain
// `finance:audit` validates (transfers, debt payments + allocations, installments, transaction
// ownership/currency, scheduled links, goal allocation cache), built through the *real services*
// (not hand-inserted rows), must produce zero audit findings. If any service ever starts writing
// a derived/cached value that drifts from its source, this test goes red.

const userId = "00000000-0000-0000-0000-00000000d001";
const otherUserId = "00000000-0000-0000-0000-00000000d002";
const timezone = "UTC";
const now = () => new Date("2026-03-15T12:00:00Z");

async function buildRealisticLedger() {
  const database = getTestDatabase().db;
  await database.insert(users).values([
    { id: userId, name: "User", email: "reconcile@example.test", timezone, baseCurrency: "ARS" },
    { id: otherUserId, name: "Other", email: "reconcile-other@example.test", timezone, baseCurrency: "ARS" },
  ]);

  const accountsRepo = createAccountRepository(database);
  const categoriesRepo = createCategoryRepository(database);
  const transactionsRepo = createTransactionRepository(database);

  const checking = await accountsRepo.create({ userId, name: "Caja de ahorro", type: "BANK", currencyCode: "ARS", openingBalance: "500000", openingDate: "2026-01-01" });
  const cash = await accountsRepo.create({ userId, name: "Efectivo", type: "CASH", currencyCode: "ARS", openingBalance: "0", openingDate: "2026-01-01" });
  const groceries = await categoriesRepo.create({ userId, name: "Supermercado", type: "EXPENSE", parentId: null });
  const salary = await categoriesRepo.create({ userId, name: "Sueldo", type: "INCOME", parentId: null });

  const txnService = createTransactionService({ accounts: accountsRepo, categories: categoriesRepo, transactions: transactionsRepo });

  // Income + expenses through the real service.
  await txnService.createIncomeTransaction(userId, {
    accountId: checking.id, amount: "300000", description: "Sueldo marzo", categoryId: salary.id,
    occurredAt: "2026-03-02T12:00:00Z",
  }, timezone);
  const expense = await txnService.createExpenseTransaction(userId, {
    accountId: checking.id, amount: "45000", description: "Compra mensual", categoryId: groceries.id,
    occurredAt: "2026-03-05T12:00:00Z",
  }, timezone);
  await txnService.createExpenseTransaction(userId, {
    accountId: cash.id, amount: "8000", description: "Feria",
    occurredAt: "2026-03-06T12:00:00Z",
  }, timezone);

  // A transfer through the real service — two legs, net zero.
  const transferService = createTransferService(database, undefined, now);
  await transferService.createTransfer({ id: userId, timezone }, {
    fromAccountId: checking.id, toAccountId: cash.id, amount: "20000", occurredAt: "2026-03-08T12:00:00Z",
  });

  // A debt with installments (no create-debt service in the rebuild) + a partial payment through
  // the real service — allocations must sum to the payment, installment must not be overpaid.
  const debtId = "40000000-0000-0000-0000-00000000d001";
  await database.insert(debts).values({ id: debtId, userId, name: "Préstamo", type: "OTHER", currencyCode: "ARS", originalAmount: "120000", startDate: "2026-01-01", interestType: "NO_INTEREST" });
  await database.insert(debtInstallments).values([
    { debtId, installmentNumber: 1, dueDate: "2026-02-01", principalAmount: "60000", interestAmount: "0", feeAmount: "0", totalAmount: "60000" },
    { debtId, installmentNumber: 2, dueDate: "2026-03-01", principalAmount: "60000", interestAmount: "0", feeAmount: "0", totalAmount: "60000" },
  ]);
  const payments = createDebtPaymentService(database, now);
  await payments.recordDebtPayment({ id: userId, timezone }, { debtId, accountId: checking.id, amount: "60000" });

  // A goal built through the real service: initial + contribution + withdrawal. The cache
  // `goals.current_amount` must equal Σ signed allocations.
  const goalService = createGoalService(database, undefined, now);
  const goal = await goalService.createGoal({ id: userId }, {
    name: "Viaje", category: "TRAVEL", currencyCode: "ARS", targetAmount: "400000", initialAmount: "50000",
  });
  await goalService.contribute({ id: userId }, goal.id, "30000");
  await goalService.withdraw({ id: userId }, goal.id, "10000");

  // A well-formed scheduled transaction already posted (no posting service in the rebuild).
  const scheduledPostedTxId = "30000000-0000-0000-0000-00000000d0ff";
  await database.insert(transactions).values({ id: scheduledPostedTxId, userId, accountId: checking.id, type: "EXPENSE", status: "POSTED", amount: "12000", currencyCode: "ARS", description: "Servicio", occurredAt: new Date("2026-03-10T12:00:00Z"), postedAt: new Date("2026-03-10T12:00:00Z"), source: "MANUAL" });
  await database.insert(scheduledTransactions).values({ userId, accountId: checking.id, type: "EXPENSE", expectedAmount: "12000", currencyCode: "ARS", description: "Servicio", scheduledDate: "2026-03-10", status: "POSTED", postedTransactionId: scheduledPostedTxId });

  return { database, checkingId: checking.id, cashId: cash.id, goalId: goal.id, debtId, expenseId: expense!.id, transactionsRepo };
}

describe("WP-RECONCILIATION (G1): the whole ledger reconciles", () => {
  it("a realistic multi-domain dataset built through the real services produces zero finance:audit findings", async () => {
    const { database } = await buildRealisticLedger();

    const report = await runFinanceAudit(database);

    expect(report.findings).toEqual([]);
    // The dataset actually touched every audited domain — a silent audit over an empty DB proves nothing.
    expect(report.scannedCounts).toMatchObject({
      transfers: 1,
      debtPayments: 1,
      debtInstallments: 2,
      scheduledTransactions: 1,
      goalAllocations: 3, // INITIAL + CONTRIBUTION + WITHDRAWAL
    });
    expect(report.scannedCounts.transactions).toBeGreaterThanOrEqual(7);
  });

  it("stays reconciled after a transaction is voided and a transfer is voided", async () => {
    const { database, expenseId } = await buildRealisticLedger();
    const transactionsRepo = createTransactionRepository(database);
    const transferService = createTransferService(database, undefined, now);

    await transactionsRepo.voidForUser(expenseId, userId, now());
    const [transfer] = await database.select().from(transfers).where(eq(transfers.userId, userId));
    await transferService.voidTransfer(userId, transfer.id);

    const report = await runFinanceAudit(database);
    expect(report.findings).toEqual([]);

    // Both transfer legs moved to VOIDED together — the pairing check would flag a split status.
    const legs = await database.select().from(transactions).where(eq(transactions.transferId, transfer.id));
    expect(legs).toHaveLength(2);
    expect(new Set(legs.map((l) => l.status))).toEqual(new Set(["VOIDED"]));
  });

  it("the goal cache equals the signed sum of its allocations, to the currency's scale", async () => {
    const { database, goalId } = await buildRealisticLedger();

    const [goal] = await database.select().from(goals).where(eq(goals.id, goalId));
    const allocs = await database.select().from(goalAllocations).where(eq(goalAllocations.goalId, goalId));

    const derived = allocs.reduce(
      (sum, a) => (a.kind === "WITHDRAWAL" ? sum.subtract(Money.fromString(a.amount, "ARS")) : sum.add(Money.fromString(a.amount, "ARS"))),
      Money.zero("ARS"),
    );
    expect(goal.currentAmount).toBe("70000.000000"); // 50000 + 30000 - 10000
    expect(derived.toString()).toBe("70000.00");
  });

});
