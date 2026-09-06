import { describe, expect, it } from "vitest";

import { runFinanceAudit } from "../../packages/db/src/audit/finance-audit";
import {
  accounts,
  categories,
  debtInstallments,
  debtPaymentAllocations,
  debtPayments,
  debts,
  goalAllocations,
  goals,
  scheduledTransactions,
  transactions,
  transfers,
  users,
} from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

// TASK-043: known-good fixtures (produce zero findings) and one intentionally-corrupt fixture per
// documented corruption class, proving the audit both stays silent on healthy data and actually
// detects each invariant violation it claims to. Every corruption below is deliberately something
// Postgres's own schema constraints (FK/CHECK) do NOT reject — if the schema already prevented it,
// there would be nothing for this audit to catch.

const userA = "00000000-0000-0000-0000-000000000401";
const userB = "00000000-0000-0000-0000-000000000402";
const accountA = "10000000-0000-0000-0000-000000000401";
const accountB = "10000000-0000-0000-0000-000000000402";

async function seedUsersAndAccounts() {
  const database = getTestDatabase().db;
  await database.insert(users).values([
    { id: userA, name: "User A", email: "audit-a@example.test", timezone: "UTC", baseCurrency: "ARS" },
    { id: userB, name: "User B", email: "audit-b@example.test", timezone: "UTC", baseCurrency: "ARS" },
  ]);
  await database.insert(accounts).values([
    { id: accountA, userId: userA, name: "Account A", type: "BANK", currencyCode: "ARS", openingBalance: "1000", openingDate: "2026-01-01" },
    { id: accountB, userId: userB, name: "Account B", type: "BANK", currencyCode: "USD", openingBalance: "1000", openingDate: "2026-01-01" },
  ]);
}

describe("runFinanceAudit against known-good data", () => {
  it("reports zero findings for a well-formed transfer, debt payment, and scheduled transaction", async () => {
    await seedUsersAndAccounts();
    const database = getTestDatabase().db;

    const transferId = "20000000-0000-0000-0000-000000000401";
    const accountA2 = "10000000-0000-0000-0000-000000000403";
    await database.insert(accounts).values({ id: accountA2, userId: userA, name: "Account A2", type: "CASH", currencyCode: "ARS", openingBalance: "0", openingDate: "2026-01-01" });
    await database.insert(transfers).values({ id: transferId, userId: userA, fromAccountId: accountA, toAccountId: accountA2, amount: "100", currencyCode: "ARS", occurredAt: new Date("2026-01-15T00:00:00Z") });
    await database.insert(transactions).values([
      { id: "30000000-0000-0000-0000-000000000401", userId: userA, accountId: accountA, type: "TRANSFER_OUT", status: "POSTED", amount: "100", currencyCode: "ARS", description: "Transferencia", transferId, source: "TRANSFER", occurredAt: new Date("2026-01-15T00:00:00Z"), postedAt: new Date("2026-01-15T00:00:00Z") },
      { id: "30000000-0000-0000-0000-000000000402", userId: userA, accountId: accountA2, type: "TRANSFER_IN", status: "POSTED", amount: "100", currencyCode: "ARS", description: "Transferencia", transferId, source: "TRANSFER", occurredAt: new Date("2026-01-15T00:00:00Z"), postedAt: new Date("2026-01-15T00:00:00Z") },
    ]);

    const debtId = "40000000-0000-0000-0000-000000000401";
    const installmentId = "50000000-0000-0000-0000-000000000401";
    const paymentTransactionId = "30000000-0000-0000-0000-000000000403";
    const paymentId = "60000000-0000-0000-0000-000000000401";
    await database.insert(debts).values({ id: debtId, userId: userA, name: "Debt A", type: "OTHER", currencyCode: "ARS", originalAmount: "500", startDate: "2026-01-01", interestType: "NO_INTEREST" });
    await database.insert(debtInstallments).values({ id: installmentId, debtId, installmentNumber: 1, dueDate: "2026-02-01", principalAmount: "500", interestAmount: "0", feeAmount: "0", totalAmount: "500" });
    await database.insert(transactions).values({ id: paymentTransactionId, userId: userA, accountId: accountA, type: "LIABILITY_PAYMENT", status: "POSTED", amount: "200", currencyCode: "ARS", description: "Pago", occurredAt: new Date("2026-01-20T00:00:00Z"), postedAt: new Date("2026-01-20T00:00:00Z") });
    await database.insert(debtPayments).values({ id: paymentId, userId: userA, debtId, accountId: accountA, amount: "200", currencyCode: "ARS", paidAt: new Date("2026-01-20T00:00:00Z"), transactionId: paymentTransactionId, status: "POSTED" });
    await database.insert(debtPaymentAllocations).values({ paymentId, installmentId, amount: "200" });

    const scheduledId = "70000000-0000-0000-0000-000000000401";
    const scheduledPostedTxId = "30000000-0000-0000-0000-000000000404";
    await database.insert(transactions).values({ id: scheduledPostedTxId, userId: userA, accountId: accountA, type: "EXPENSE", status: "POSTED", amount: "50", currencyCode: "ARS", description: "Gasto programado", occurredAt: new Date("2026-01-25T00:00:00Z"), postedAt: new Date("2026-01-25T00:00:00Z") });
    await database.insert(scheduledTransactions).values({ id: scheduledId, userId: userA, accountId: accountA, type: "EXPENSE", expectedAmount: "50", currencyCode: "ARS", description: "Gasto programado", scheduledDate: "2026-01-25", status: "POSTED", postedTransactionId: scheduledPostedTxId });

    const report = await runFinanceAudit(database);
    expect(report.findings).toEqual([]);
  });
});

describe("runFinanceAudit detects each documented corruption class", () => {
  it("flags a transfer missing its TRANSFER_IN leg", async () => {
    await seedUsersAndAccounts();
    const database = getTestDatabase().db;

    const transferId = "20000000-0000-0000-0000-000000000501";
    await database.insert(transfers).values({ id: transferId, userId: userA, fromAccountId: accountA, toAccountId: accountB, amount: "100", currencyCode: "ARS", occurredAt: new Date("2026-01-15T00:00:00Z") });
    await database.insert(transactions).values({ id: "30000000-0000-0000-0000-000000000501", userId: userA, accountId: accountA, type: "TRANSFER_OUT", status: "POSTED", amount: "100", currencyCode: "ARS", description: "Transferencia", transferId, source: "TRANSFER", occurredAt: new Date("2026-01-15T00:00:00Z"), postedAt: new Date("2026-01-15T00:00:00Z") });

    const report = await runFinanceAudit(database);
    expect(report.findings).toContainEqual(expect.objectContaining({ check: "transfer_leg_pairing", entityId: transferId }));
  });

  it("flags a debt payment whose allocations don't sum to its own amount", async () => {
    await seedUsersAndAccounts();
    const database = getTestDatabase().db;

    const debtId = "40000000-0000-0000-0000-000000000501";
    const installmentId = "50000000-0000-0000-0000-000000000501";
    const paymentTransactionId = "30000000-0000-0000-0000-000000000502";
    const paymentId = "60000000-0000-0000-0000-000000000501";
    await database.insert(debts).values({ id: debtId, userId: userA, name: "Debt A", type: "OTHER", currencyCode: "ARS", originalAmount: "500", startDate: "2026-01-01", interestType: "NO_INTEREST" });
    await database.insert(debtInstallments).values({ id: installmentId, debtId, installmentNumber: 1, dueDate: "2026-02-01", principalAmount: "500", interestAmount: "0", feeAmount: "0", totalAmount: "500" });
    await database.insert(transactions).values({ id: paymentTransactionId, userId: userA, accountId: accountA, type: "LIABILITY_PAYMENT", status: "POSTED", amount: "200", currencyCode: "ARS", description: "Pago", occurredAt: new Date("2026-01-20T00:00:00Z"), postedAt: new Date("2026-01-20T00:00:00Z") });
    await database.insert(debtPayments).values({ id: paymentId, userId: userA, debtId, accountId: accountA, amount: "200", currencyCode: "ARS", paidAt: new Date("2026-01-20T00:00:00Z"), transactionId: paymentTransactionId, status: "POSTED" });
    // Under-allocated on purpose: payment is 200, only 50 was allocated to the installment.
    await database.insert(debtPaymentAllocations).values({ paymentId, installmentId, amount: "50" });

    const report = await runFinanceAudit(database);
    expect(report.findings).toContainEqual(expect.objectContaining({ check: "debt_payment_allocation_equality", entityId: paymentId }));
  });

  it("flags an installment that received more allocation than its total amount", async () => {
    await seedUsersAndAccounts();
    const database = getTestDatabase().db;

    const debtId = "40000000-0000-0000-0000-000000000502";
    const installmentId = "50000000-0000-0000-0000-000000000502";
    const paymentTransactionId = "30000000-0000-0000-0000-000000000503";
    const paymentId = "60000000-0000-0000-0000-000000000502";
    await database.insert(debts).values({ id: debtId, userId: userA, name: "Debt A", type: "OTHER", currencyCode: "ARS", originalAmount: "100", startDate: "2026-01-01", interestType: "NO_INTEREST" });
    await database.insert(debtInstallments).values({ id: installmentId, debtId, installmentNumber: 1, dueDate: "2026-02-01", principalAmount: "100", interestAmount: "0", feeAmount: "0", totalAmount: "100" });
    await database.insert(transactions).values({ id: paymentTransactionId, userId: userA, accountId: accountA, type: "LIABILITY_PAYMENT", status: "POSTED", amount: "150", currencyCode: "ARS", description: "Pago", occurredAt: new Date("2026-01-20T00:00:00Z"), postedAt: new Date("2026-01-20T00:00:00Z") });
    await database.insert(debtPayments).values({ id: paymentId, userId: userA, debtId, accountId: accountA, amount: "150", currencyCode: "ARS", paidAt: new Date("2026-01-20T00:00:00Z"), transactionId: paymentTransactionId, status: "POSTED" });
    // Over-allocated on purpose: installment total is 100, allocation is 150.
    await database.insert(debtPaymentAllocations).values({ paymentId, installmentId, amount: "150" });

    const report = await runFinanceAudit(database);
    expect(report.findings).toContainEqual(expect.objectContaining({ check: "installment_not_overpaid", entityId: installmentId }));
  });

  it("flags a transaction whose account belongs to a different user", async () => {
    await seedUsersAndAccounts();
    const database = getTestDatabase().db;

    const transactionId = "30000000-0000-0000-0000-000000000504";
    // userId says userA, but accountId points at userB's account — never reachable through any
    // real application service (all of them scope the account lookup by the caller's own userId),
    // only through a corrupted/mismatched restore.
    await database.insert(transactions).values({ id: transactionId, userId: userA, accountId: accountB, type: "EXPENSE", status: "POSTED", amount: "50", currencyCode: "USD", description: "Gasto", occurredAt: new Date("2026-01-15T00:00:00Z"), postedAt: new Date("2026-01-15T00:00:00Z") });

    const report = await runFinanceAudit(database);
    expect(report.findings).toContainEqual(expect.objectContaining({ check: "transaction_account_ownership", entityId: transactionId }));
  });

  it("flags a transaction whose currency doesn't match its account's currency", async () => {
    await seedUsersAndAccounts();
    const database = getTestDatabase().db;

    const transactionId = "30000000-0000-0000-0000-000000000505";
    // accountA is ARS; this transaction claims USD.
    await database.insert(transactions).values({ id: transactionId, userId: userA, accountId: accountA, type: "EXPENSE", status: "POSTED", amount: "50", currencyCode: "USD", description: "Gasto", occurredAt: new Date("2026-01-15T00:00:00Z"), postedAt: new Date("2026-01-15T00:00:00Z") });

    const report = await runFinanceAudit(database);
    expect(report.findings).toContainEqual(expect.objectContaining({ check: "transaction_account_currency", entityId: transactionId }));
  });

  it("flags a POSTED scheduled transaction with no posted_transaction_id", async () => {
    await seedUsersAndAccounts();
    const database = getTestDatabase().db;

    const scheduledId = "70000000-0000-0000-0000-000000000502";
    await database.insert(scheduledTransactions).values({ id: scheduledId, userId: userA, accountId: accountA, type: "EXPENSE", expectedAmount: "50", currencyCode: "ARS", description: "Gasto programado", scheduledDate: "2026-01-25", status: "POSTED", postedTransactionId: null });

    const report = await runFinanceAudit(database);
    expect(report.findings).toContainEqual(expect.objectContaining({ check: "scheduled_transaction_posted_link", entityId: scheduledId }));
  });

  it("flags a POSTED scheduled transaction linked to a transaction owned by a different user", async () => {
    await seedUsersAndAccounts();
    const database = getTestDatabase().db;

    // The posted transaction is userB's; the scheduled item claims to be userA's — the unique
    // index on posted_transaction_id can't express "and it's the same owner".
    const postedTxId = "30000000-0000-0000-0000-000000000561";
    const scheduledId = "70000000-0000-0000-0000-000000000561";
    await database.insert(transactions).values({ id: postedTxId, userId: userB, accountId: accountB, type: "EXPENSE", status: "POSTED", amount: "50", currencyCode: "USD", description: "Gasto de B", occurredAt: new Date("2026-01-25T00:00:00Z"), postedAt: new Date("2026-01-25T00:00:00Z") });
    await database.insert(scheduledTransactions).values({ id: scheduledId, userId: userA, accountId: accountA, type: "EXPENSE", expectedAmount: "50", currencyCode: "ARS", description: "Gasto programado", scheduledDate: "2026-01-25", status: "POSTED", postedTransactionId: postedTxId });

    const report = await runFinanceAudit(database);
    expect(report.findings).toContainEqual(expect.objectContaining({ check: "scheduled_transaction_posted_link", entityId: scheduledId }));
  });

  it("flags a transaction whose category belongs to a different user", async () => {
    await seedUsersAndAccounts();
    const database = getTestDatabase().db;

    const categoryB = "80000000-0000-0000-0000-000000000562";
    const transactionId = "30000000-0000-0000-0000-000000000562";
    await database.insert(categories).values({ id: categoryB, userId: userB, name: "Cat de B", type: "EXPENSE", parentId: null });
    // userA's transaction, userA's account (ARS), but categorised with userB's category.
    await database.insert(transactions).values({ id: transactionId, userId: userA, accountId: accountA, categoryId: categoryB, type: "EXPENSE", status: "POSTED", amount: "50", currencyCode: "ARS", description: "Gasto", occurredAt: new Date("2026-01-15T00:00:00Z"), postedAt: new Date("2026-01-15T00:00:00Z") });

    const report = await runFinanceAudit(database);
    expect(report.findings).toContainEqual(expect.objectContaining({ check: "transaction_category_ownership", entityId: transactionId }));
  });

  it("flags a goal allocation whose currency does not match its goal", async () => {
    await seedUsersAndAccounts();
    const database = getTestDatabase().db;

    const goalId = "90000000-0000-0000-0000-000000000563";
    const allocationId = "91000000-0000-0000-0000-000000000563";
    await database.insert(goals).values({ id: goalId, userId: userA, name: "Meta", category: "OTHER", currencyCode: "ARS", targetAmount: "1000", currentAmount: "100", status: "ACTIVE" });
    // currency mismatch: goal is ARS, allocation claims USD (and the cache is kept consistent so
    // only the ownership/currency check should fire).
    await database.insert(goalAllocations).values({ id: allocationId, userId: userA, goalId, kind: "CONTRIBUTION", amount: "100", currencyCode: "USD", occurredOn: "2026-01-10" });

    const report = await runFinanceAudit(database);
    expect(report.findings).toContainEqual(expect.objectContaining({ check: "goal_allocation_ownership_currency", entityId: allocationId }));
  });

  it("also reports scanned counts alongside findings", async () => {
    await seedUsersAndAccounts();
    const database = getTestDatabase().db;
    const report = await runFinanceAudit(database);
    expect(report.scannedCounts).toEqual({ transfers: 0, transactions: 0, debtPayments: 0, debtInstallments: 0, scheduledTransactions: 0, goalAllocations: 0 });
  });
});
