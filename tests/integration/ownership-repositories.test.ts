import { and, eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { calculateAssetAccountBalance } from "@know-finanzas/finance";
import { monthRangeForTimezone } from "@know-finanzas/finance";
import { createAccountBalanceQueries, createActivityQueries, createBudgetQueries, createMonthlySummaryQueries } from "../../packages/db/src/queries";
import { createBudgetRepository } from "../../packages/db/src/repositories/budgets";
import { createBudgetAlertRepository } from "../../packages/db/src/repositories/budget-alerts";
import { createBudgetService } from "../../apps/web/src/features/budgets/services/budget-service";
import { createTransferService } from "../../apps/web/src/features/transfers/services/transfer-service";
import { createDebtPaymentService } from "../../apps/web/src/features/debts/services/debt-payment-service";
import { createScheduledTransactionService } from "../../apps/web/src/features/planning/services/scheduled-transaction-service";
import { createRecurringTransactionService } from "../../apps/web/src/features/planning/services/recurring-transaction-service";
import { recurringTransactions, scheduledTransactions } from "../../packages/db/src/schema";
import { accounts, categories, debtInstallments, debtPaymentAllocations, debts, transactions, transfers, users } from "../../packages/db/src/schema";
import { createAccountRepository } from "../../packages/db/src/repositories/accounts";
import { createCategoryRepository } from "../../packages/db/src/repositories/categories";
import { createTransactionRepository } from "../../packages/db/src/repositories/transactions";
import { getTestDatabase } from "../support/postgres-test-setup";

const userA = "00000000-0000-0000-0000-000000000001";
const userB = "00000000-0000-0000-0000-000000000002";
const accountA = "10000000-0000-0000-0000-000000000001";
const accountB = "10000000-0000-0000-0000-000000000002";
const categoryA = "20000000-0000-0000-0000-000000000001";
const categoryB = "20000000-0000-0000-0000-000000000002";
const transactionA = "30000000-0000-0000-0000-000000000001";
const transactionB = "30000000-0000-0000-0000-000000000002";
const categoryTestUserA = "00000000-0000-0000-0000-000000000011";
const categoryTestUserB = "00000000-0000-0000-0000-000000000012";
const categoryTestIdB = "20000000-0000-0000-0000-000000000012";

async function seedUsersResources() {
  const database = getTestDatabase().db;

  await database.insert(users).values([
    { id: userA, name: "User A", email: "user-a@example.test", timezone: "UTC", baseCurrency: "ARS" },
    { id: userB, name: "User B", email: "user-b@example.test", timezone: "UTC", baseCurrency: "ARS" },
  ]);
  await database.insert(accounts).values([
    { id: accountA, userId: userA, name: "Account A", type: "BANK", currencyCode: "ARS", openingBalance: "1000", openingDate: "2026-01-01" },
    { id: accountB, userId: userB, name: "Account B", type: "BANK", currencyCode: "ARS", openingBalance: "2000", openingDate: "2026-01-01" },
  ]);
  await database.insert(categories).values([
    { id: categoryA, userId: userA, name: "Category A", type: "EXPENSE" },
    { id: categoryB, userId: userB, name: "Category B", type: "EXPENSE" },
  ]);
  await database.insert(transactions).values([
    { id: transactionA, userId: userA, accountId: accountA, categoryId: categoryA, type: "EXPENSE", amount: "200", currencyCode: "ARS", description: "Transaction A", occurredAt: new Date("2026-01-15T12:00:00Z"), postedAt: new Date("2026-01-15T12:00:00Z") },
    { id: transactionB, userId: userB, accountId: accountB, categoryId: categoryB, type: "EXPENSE", amount: "300", currencyCode: "ARS", description: "Transaction B", occurredAt: new Date("2026-01-15T12:00:00Z"), postedAt: new Date("2026-01-15T12:00:00Z") },
  ]);
}

describe("ownership-first repositories", () => {
  it("returns only the account owned by the requested user", async () => {
    await seedUsersResources();
    const repository = createAccountRepository(getTestDatabase().db);

    await expect(repository.findByIdForUser(accountA, userA)).resolves.toMatchObject({ id: accountA });
    await expect(repository.findByIdForUser(accountB, userA)).resolves.toBeUndefined();
    await expect(repository.listForUser(userA)).resolves.toHaveLength(1);
  });

  it("archives only the owned account and preserves its opening data", async () => {
    await seedUsersResources();
    const repository = createAccountRepository(getTestDatabase().db);
    const archivedAt = new Date("2026-02-01T00:00:00Z");

    const archived = await repository.archiveForUser(accountA, userA, archivedAt);

    expect(archived).toMatchObject({ id: accountA, status: "ARCHIVED", openingBalance: "1000.000000" });
    await expect(repository.listForUser(userA)).resolves.toHaveLength(0);
    await expect(repository.listForUser(userA, { includeArchived: true })).resolves.toHaveLength(1);
    await expect(repository.archiveForUser(accountB, userA, archivedAt)).resolves.toBeUndefined();
  });

  it("returns only categories owned by the requested user, including parent checks", async () => {
    await seedUsersResources();
    const repository = createCategoryRepository(getTestDatabase().db);

    await expect(repository.findByIdForUser(categoryA, userA)).resolves.toMatchObject({ id: categoryA });
    await expect(repository.findByIdForUser(categoryB, userA)).resolves.toBeUndefined();
    await expect(repository.findParentByIdForUser(categoryB, userA)).resolves.toBeUndefined();
  });

  it("returns only transactions owned by the requested user", async () => {
    await seedUsersResources();
    const repository = createTransactionRepository(getTestDatabase().db);

    await expect(repository.findByIdForUser(transactionA, userA)).resolves.toMatchObject({ id: transactionA });
    await expect(repository.findByIdForUser(transactionB, userA)).resolves.toBeUndefined();
    await expect(repository.listForUser(userA)).resolves.toHaveLength(1);
  });

  it("persists manual posted transactions and voids them without deleting history", async () => {
    await seedUsersResources();
    const repository = createTransactionRepository(getTestDatabase().db);
    const created = await repository.create({
      userId: userA, accountId: accountA, categoryId: categoryA, type: "EXPENSE",
      amount: "45.50", currencyCode: "ARS", description: "Manual expense", merchant: "Shop",
      occurredAt: new Date("2026-02-01T12:00:00Z"), postedAt: new Date("2026-02-01T12:00:00Z"), source: "MANUAL", notes: null,
    });

    expect(created.status).toBe("POSTED");
    const accountRepository = createAccountRepository(getTestDatabase().db);
    const before = await accountRepository.getBalanceInputsForUser(userA, accountA);
    expect(calculateAssetAccountBalance({ currency: "ARS", openingBalance: before[0].account.openingBalance, incomeTotal: before[0].incomeTotal, expenseTotal: before[0].expenseTotal }).toString()).toBe("754.50");
    const voided = await repository.voidForUser(created.id, userA, new Date("2026-02-02T12:00:00Z"));
    expect(voided).toMatchObject({ id: created.id, status: "VOIDED", amount: "45.500000" });
    await expect(repository.findByIdForUser(created.id, userA)).resolves.toMatchObject({ status: "VOIDED" });
    const after = await accountRepository.getBalanceInputsForUser(userA, accountA);
    expect(calculateAssetAccountBalance({ currency: "ARS", openingBalance: after[0].account.openingBalance, incomeTotal: after[0].incomeTotal, expenseTotal: after[0].expenseTotal }).toString()).toBe("800.00");
    await expect(repository.voidForUser(transactionB, userA, new Date())).resolves.toBeUndefined();
  });

  it("persists category ownership, filters active categories and preserves archives", async () => {
    const database = getTestDatabase().db;
    await database.insert(users).values([
      { id: categoryTestUserA, name: "Category A", email: "category-a@example.test", timezone: "UTC", baseCurrency: "ARS" },
      { id: categoryTestUserB, name: "Category B", email: "category-b@example.test", timezone: "UTC", baseCurrency: "ARS" },
    ]);
    const repository = createCategoryRepository(database);
    await repository.create({ userId: categoryTestUserA, name: "Comida", type: "EXPENSE", parentId: null });
    await repository.create({ userId: categoryTestUserB, name: "Sueldo", type: "INCOME", parentId: null });

    const own = await repository.listForUser(categoryTestUserA, { type: "EXPENSE" });
    expect(own).toHaveLength(1);
    await repository.archiveForUser(own[0].id, categoryTestUserA, new Date("2026-02-01T00:00:00Z"));
    await expect(repository.listForUser(categoryTestUserA)).resolves.toHaveLength(0);
    await expect(repository.listForUser(categoryTestUserA, { includeArchived: true })).resolves.toHaveLength(1);
    await expect(repository.findByIdForUser(categoryTestIdB, categoryTestUserA)).resolves.toBeUndefined();
  });

  it("updates only an owned active category", async () => {
    const database = getTestDatabase().db;
    await database.insert(users).values({ id: categoryTestUserA, name: "Category A", email: "category-update@example.test", timezone: "UTC", baseCurrency: "ARS" });
    const repository = createCategoryRepository(database);
    const created = await repository.create({ userId: categoryTestUserA, name: "Transporte", type: "EXPENSE", parentId: null });

    await expect(repository.updateMetadataForUser(created.id, categoryTestUserA, { name: "Movilidad", parentId: null })).resolves.toMatchObject({ name: "Movilidad" });
    await expect(repository.updateMetadataForUser(created.id, categoryTestUserB, { name: "No", parentId: null })).resolves.toBeUndefined();
  });

  it("connects to the migrated database", async () => {
    const result = await getTestDatabase().db.execute(sql`select to_regclass('public.users') as users_table`);
    expect(result[0]?.users_table).toBe("users");
  });

  it("derives balances, recent activity and monthly totals from POSTED rows", async () => {
    await seedUsersResources();
    const database = getTestDatabase().db;
    const balances = createAccountBalanceQueries(database);
    const activity = createActivityQueries(database);
    const monthly = createMonthlySummaryQueries(database);
    const balanceRows = await balances.getAccountBalancesForUser(userA, { accountId: accountA });
    expect(balanceRows).toHaveLength(1);
    expect(calculateAssetAccountBalance({ currency: "ARS", openingBalance: balanceRows[0].account.openingBalance, incomeTotal: balanceRows[0].incomeTotal, expenseTotal: balanceRows[0].expenseTotal }).toString()).toBe("800.00");
    await expect(activity.listRecentActivity(userA, { limit: 5 })).resolves.toHaveLength(1);
    const range = monthRangeForTimezone(2026, 1, "UTC");
    const summary = await monthly.getMonthlyIncomeExpense(userA, { from: range.start, to: range.end });
    expect(summary[0]).toMatchObject({ currencyCode: "ARS", incomeTotal: "0", expenseTotal: "200.000000" });
    await database.insert(accounts).values({ id: "10000000-0000-0000-0000-000000000011", userId: userA, name: "USD Account", type: "SAVINGS", currencyCode: "USD", openingBalance: "500", openingDate: "2026-01-01" });
    const totals = await balances.getLiquidTotalsForUser(userA);
    expect(totals).toEqual(expect.arrayContaining([{ currencyCode: "ARS", total: "800.000000" }, { currencyCode: "USD", total: "500.000000" }]));
  });

  it("stores refunds and explicit adjustments as separate ledger events", async () => {
    await seedUsersResources();
    const database = getTestDatabase().db;
    const transactionsRepository = createTransactionRepository(database);
    await transactionsRepository.create({ userId: userA, accountId: accountA, categoryId: categoryA, originalTransactionId: transactionA, relatedTransactionId: null, reason: null, type: "REFUND", amount: "50", currencyCode: "ARS", description: "Refund", merchant: null, occurredAt: new Date("2026-02-01T12:00:00Z"), postedAt: new Date("2026-02-01T12:00:00Z"), source: "MANUAL", notes: null });
    await transactionsRepository.create({ userId: userA, accountId: accountA, categoryId: null, originalTransactionId: null, relatedTransactionId: transactionA, reason: "Conciliación positiva", type: "ADJUSTMENT_IN", amount: "20", currencyCode: "ARS", description: "Conciliación positiva", merchant: null, occurredAt: new Date("2026-02-01T12:00:00Z"), postedAt: new Date("2026-02-01T12:00:00Z"), source: "MANUAL", notes: null });
    await transactionsRepository.create({ userId: userA, accountId: accountA, categoryId: null, originalTransactionId: null, relatedTransactionId: null, reason: "Diferencia bancaria", type: "ADJUSTMENT_OUT", amount: "5", currencyCode: "ARS", description: "Diferencia bancaria", merchant: null, occurredAt: new Date("2026-02-01T12:00:00Z"), postedAt: new Date("2026-02-01T12:00:00Z"), source: "MANUAL", notes: null });
    const balanceRows = await createAccountBalanceQueries(database).getAccountBalancesForUser(userA, { accountId: accountA });
    expect(calculateAssetAccountBalance({ currency: "ARS", openingBalance: balanceRows[0].account.openingBalance, incomeTotal: balanceRows[0].incomeTotal, expenseTotal: balanceRows[0].expenseTotal, refundTotal: balanceRows[0].refundTotal, adjustmentInTotal: balanceRows[0].adjustmentInTotal, adjustmentOutTotal: balanceRows[0].adjustmentOutTotal }).toString()).toBe("865.00");
    await expect(transactionsRepository.sumPostedRefundsForOriginal(transactionA, userA)).resolves.toBe("50.000000");
  });

  it("does not allow refunds to exceed the original expense", async () => {
    await seedUsersResources();
    const repository = createTransactionRepository(getTestDatabase().db);
    const base = { userId: userA, accountId: accountA, categoryId: categoryA, originalTransactionId: transactionA, currencyCode: "ARS", description: "Refund", occurredAt: new Date("2026-02-01T12:00:00Z"), postedAt: new Date("2026-02-01T12:00:00Z"), source: "MANUAL" as const, notes: null };
    await expect(repository.createRefundAtomic({ ...base, amount: "150" })).resolves.toBeTruthy();
    await expect(repository.createRefundAtomic({ ...base, amount: "60" })).resolves.toBeUndefined();
    await expect(repository.sumPostedRefundsForOriginal(transactionA, userA)).resolves.toBe("150.000000");
  });

  it("creates one transfer and exactly two owned legs atomically", async () => {
    const database = getTestDatabase().db;
    await database.insert(users).values({ id: userA, name: "Transfer A", email: "transfer-a@example.test", timezone: "UTC", baseCurrency: "ARS" });
    await database.insert(accounts).values([
      { id: "10000000-0000-0000-0000-000000000021", userId: userA, name: "From", type: "BANK", currencyCode: "ARS", openingBalance: "1000", openingDate: "2026-01-01" },
      { id: "10000000-0000-0000-0000-000000000022", userId: userA, name: "To", type: "CASH", currencyCode: "ARS", openingBalance: "100", openingDate: "2026-01-01" },
    ]);
    const service = createTransferService({ database: getTestDatabase().db, now: () => new Date("2026-08-02T12:00:00Z") });
    const result = await service.createTransfer({ id: userA, timezone: "UTC" }, { fromAccountId: "10000000-0000-0000-0000-000000000021", toAccountId: "10000000-0000-0000-0000-000000000022", amount: "200", occurredAt: "2026-08-01T12:00:00Z" });
    expect(result.legs.map((leg) => leg.type).sort()).toEqual(["TRANSFER_IN", "TRANSFER_OUT"]);
    expect(result.legs.every((leg) => leg.amount === "200.000000" && leg.currencyCode === "ARS" && leg.source === "TRANSFER")).toBe(true);
  });

  it("rolls back the shell and both legs when a post-leg step fails", async () => {
    const database = getTestDatabase().db;
    const from = "10000000-0000-0000-0000-000000000031";
    const to = "10000000-0000-0000-0000-000000000032";
    const user = "00000000-0000-0000-0000-000000000031";
    await database.insert(users).values({ id: user, name: "Rollback", email: "transfer-rollback@example.test", timezone: "UTC", baseCurrency: "ARS" });
    await database.insert(accounts).values([
      { id: from, userId: user, name: "From", type: "BANK", currencyCode: "ARS", openingBalance: "1000", openingDate: "2026-01-01" },
      { id: to, userId: user, name: "To", type: "CASH", currencyCode: "ARS", openingBalance: "0", openingDate: "2026-01-01" },
    ]);
    const service = createTransferService({ database, now: () => new Date("2026-08-02T12:00:00Z"), afterLegs: () => { throw new Error("forced rollback"); } });
    await expect(service.createTransfer({ id: user, timezone: "UTC" }, { fromAccountId: from, toAccountId: to, amount: "200", occurredAt: "2026-08-01T12:00:00Z" })).rejects.toThrow("forced rollback");
    await expect(database.select().from(transfers)).resolves.toHaveLength(0);
    await expect(database.select().from(transactions)).resolves.toHaveLength(0);
  });

  it("persists debts/installments with ownership and exact components", async () => {
    const database = getTestDatabase().db;
    const user = "00000000-0000-0000-0000-000000000041";
    const other = "00000000-0000-0000-0000-000000000042";
    await database.insert(users).values([
      { id: user, name: "Debt A", email: "debt-a@example.test", timezone: "UTC", baseCurrency: "ARS" },
      { id: other, name: "Debt B", email: "debt-b@example.test", timezone: "UTC", baseCurrency: "ARS" },
    ]);
    const [debt] = await database.insert(debts).values({ userId: user, name: "Personal loan", creditor: "Creditor", type: "PERSONAL_LOAN", currencyCode: "ARS", originalAmount: "1200.125000", startDate: "2026-01-01", interestType: "NO_INTEREST" }).returning();
    const [installment] = await database.insert(debtInstallments).values({ debtId: debt.id, installmentNumber: 1, dueDate: "2026-02-01", principalAmount: "1200.125000", interestAmount: "0", feeAmount: "0", totalAmount: "1200.125000" }).returning();
    expect(installment.totalAmount).toBe("1200.125000");
    await expect(database.select().from(debtInstallments).where(eq(debtInstallments.debtId, debt.id))).resolves.toHaveLength(1);
    await expect(database.select().from(debts).where(and(eq(debts.id, debt.id), eq(debts.userId, other)))).resolves.toHaveLength(0);
    await expect(database.insert(debtInstallments).values({ debtId: debt.id, installmentNumber: 1, dueDate: "2026-03-01", principalAmount: "1200.125000", interestAmount: "0", feeAmount: "0", totalAmount: "1200.125000" })).rejects.toThrow();
  });

  it("records a debt payment, liability transaction and allocations atomically", async () => {
    const database = getTestDatabase().db;
    const user = "00000000-0000-0000-0000-000000000051";
    const accountId = "10000000-0000-0000-0000-000000000051";
    await database.insert(users).values({ id: user, name: "Payment A", email: "payment-a@example.test", timezone: "UTC", baseCurrency: "ARS" });
    await database.insert(accounts).values({ id: accountId, userId: user, name: "Payment account", type: "BANK", currencyCode: "ARS", openingBalance: "1000", openingDate: "2026-01-01" });
    const [debt] = await database.insert(debts).values({ userId: user, name: "Debt payment", type: "OTHER", currencyCode: "ARS", originalAmount: "100", startDate: "2026-01-01", interestType: "NO_INTEREST" }).returning();
    const [installment] = await database.insert(debtInstallments).values({ debtId: debt.id, installmentNumber: 1, dueDate: "2026-12-01", principalAmount: "100", interestAmount: "0", feeAmount: "0", totalAmount: "100" }).returning();
    const result = await createDebtPaymentService(database, () => new Date("2026-08-01T12:00:00Z")).recordDebtPayment({ id: user, timezone: "UTC" }, { debtId: debt.id, accountId, amount: "60", strategy: "OLDEST_DUE_FIRST" });
    expect(result.debtRemaining).toBe("40.00");
    await expect(database.select().from(transactions).where(eq(transactions.type, "LIABILITY_PAYMENT"))).resolves.toHaveLength(1);
    await expect(database.select().from(debtPaymentAllocations).where(eq(debtPaymentAllocations.installmentId, installment.id))).resolves.toHaveLength(1);
    const accountBalance = await createAccountRepository(database).getBalanceInputsForUser(user, accountId);
    expect(calculateAssetAccountBalance({ currency: "ARS", openingBalance: accountBalance[0].account.openingBalance, incomeTotal: accountBalance[0].incomeTotal, expenseTotal: accountBalance[0].expenseTotal, liabilityPaymentTotal: accountBalance[0].liabilityPaymentTotal }).toString()).toBe("940.00");
  });

  it("keeps scheduled expectations out of balance until posting and is idempotent", async () => {
    const database = getTestDatabase().db;
    const user = "00000000-0000-0000-0000-000000000061";
    const accountId = "10000000-0000-0000-0000-000000000061";
    await database.insert(users).values({ id: user, name: "Scheduled A", email: "scheduled-a@example.test", timezone: "UTC", baseCurrency: "ARS" });
    await database.insert(accounts).values({ id: accountId, userId: user, name: "Scheduled account", type: "BANK", currencyCode: "ARS", openingBalance: "1000", openingDate: "2026-01-01" });
    const service = createScheduledTransactionService(database, () => new Date("2026-08-10T12:00:00Z"));
    const scheduled = await service.create(user, { accountId, type: "EXPENSE", expectedAmount: "200", description: "Future expense", scheduledDate: "2026-08-10" });
    await expect(database.select().from(transactions).where(eq(transactions.userId, user))).resolves.toHaveLength(0);
    const posted = await service.post(user, scheduled.id, { actualOccurredAt: new Date("2026-08-09T12:00:00Z") });
    expect(posted.scheduledTransactionId).toBe(scheduled.id);
    const retry = await service.post(user, scheduled.id);
    expect(retry.id).toBe(posted.id);
    await expect(database.select().from(scheduledTransactions).where(eq(scheduledTransactions.id, scheduled.id))).resolves.toMatchObject([{ status: "POSTED" }]);
  });

  it("materializes recurring occurrences idempotently within the horizon", async () => {
    const database = getTestDatabase().db;
    const user = "00000000-0000-0000-0000-000000000071";
    const accountId = "10000000-0000-0000-0000-000000000071";
    await database.insert(users).values({ id: user, name: "Recurring A", email: "recurring-a@example.test", timezone: "UTC", baseCurrency: "ARS" });
    await database.insert(accounts).values({ id: accountId, userId: user, name: "Recurring account", type: "BANK", currencyCode: "ARS", openingBalance: "1000", openingDate: "2026-01-01" });
    const service = createRecurringTransactionService(database, () => new Date("2026-08-01T12:00:00Z"));
    const rule = await service.create({ id: user, timezone: "UTC" }, { accountId, type: "EXPENSE", amount: "100", description: "Recurring expense", frequency: "MONTHLY", startDate: "2026-08-01" });
    const occurrences = await database.select().from(scheduledTransactions).where(eq(scheduledTransactions.recurringTransactionId, rule.id));
    expect(occurrences.length).toBeGreaterThan(0);
    expect(occurrences.every((item) => item.source === "RECURRING" && item.status === "SCHEDULED")).toBe(true);
    await expect(database.select().from(recurringTransactions).where(eq(recurringTransactions.id, rule.id))).resolves.toHaveLength(1);
  });

  it("persists budget ownership and enforces one active budget per user/category/currency", async () => {
    await seedUsersResources();
    const database = getTestDatabase().db;
    const repository = createBudgetRepository(database);
    const created = await repository.create({ userId: userA, categoryId: categoryA, name: null, currencyCode: "ARS", limitAmount: "200", startDate: "2026-01-01" });

    await expect(repository.findByIdForUser(created.id, userA)).resolves.toMatchObject({ id: created.id });
    await expect(repository.findByIdForUser(created.id, userB)).resolves.toBeUndefined();
    await expect(repository.existsActiveForCategoryCurrencyForUser({ userId: userA, categoryId: categoryA, currencyCode: "ARS" })).resolves.toBe(true);
    await expect(repository.create({ userId: userA, categoryId: categoryA, name: null, currencyCode: "ARS", limitAmount: "300", startDate: "2026-01-01" })).rejects.toThrow();

    const archived = await repository.archiveForUser(created.id, userA, new Date("2026-02-01T00:00:00Z"));
    expect(archived).toMatchObject({ status: "ARCHIVED" });
    await expect(repository.listForUser(userA)).resolves.toHaveLength(0);
    await expect(repository.updateLimitForUser(created.id, userA, { limitAmount: "400", name: null })).resolves.toBeUndefined();
  });

  it("aggregates net category spending for budgets within the requested period", async () => {
    await seedUsersResources();
    const database = getTestDatabase().db;
    const transactionsRepository = createTransactionRepository(database);
    await transactionsRepository.create({ userId: userA, accountId: accountA, categoryId: categoryA, originalTransactionId: transactionA, relatedTransactionId: null, reason: null, type: "REFUND", amount: "40", currencyCode: "ARS", description: "Refund", merchant: null, occurredAt: new Date("2026-01-20T12:00:00Z"), postedAt: new Date("2026-01-20T12:00:00Z"), source: "MANUAL", notes: null });
    await transactionsRepository.create({ userId: userA, accountId: accountA, categoryId: categoryA, originalTransactionId: null, relatedTransactionId: null, reason: null, type: "EXPENSE", amount: "500", currencyCode: "ARS", description: "Next month", merchant: null, occurredAt: new Date("2026-02-05T12:00:00Z"), postedAt: new Date("2026-02-05T12:00:00Z"), source: "MANUAL", notes: null });

    const queries = createBudgetQueries(database);
    const range = monthRangeForTimezone(2026, 1, "UTC");
    const rows = await queries.getCategorySpendingForUser(userA, { from: range.start, to: range.end });

    expect(rows).toEqual([{ categoryId: categoryA, currencyCode: "ARS", expenseTotal: "200.000000", refundTotal: "40.000000", netExpense: "160.000000" }]);
  });

  it("deduplicates budget alerts per budget/period/type at the database level", async () => {
    await seedUsersResources();
    const database = getTestDatabase().db;
    const repository = createBudgetAlertRepository(database);
    const budget = await createBudgetRepository(database).create({ userId: userA, categoryId: categoryA, name: null, currencyCode: "ARS", limitAmount: "100", startDate: "2026-01-01" });

    const first = await repository.recordIfAbsent({ userId: userA, budgetId: budget.id, periodKey: "2026-01", alertType: "BUDGET_EXCEEDED", triggeredAt: new Date("2026-01-15T00:00:00Z") });
    const second = await repository.recordIfAbsent({ userId: userA, budgetId: budget.id, periodKey: "2026-01", alertType: "BUDGET_EXCEEDED", triggeredAt: new Date("2026-01-16T00:00:00Z") });

    expect(first).toMatchObject({ alertType: "BUDGET_EXCEEDED" });
    expect(second).toBeUndefined();
    await expect(repository.listForUserPeriod(userA, "2026-01")).resolves.toHaveLength(1);
  });

  it("recalculates budget spend after an expense is voided", async () => {
    await seedUsersResources();
    const database = getTestDatabase().db;
    const budgetService = createBudgetService({
      budgets: createBudgetRepository(database),
      categories: createCategoryRepository(database),
      budgetQueries: createBudgetQueries(database),
      now: () => new Date("2026-01-20T00:00:00Z"),
    });
    const transactionsRepository = createTransactionRepository(database);
    const budget = await createBudgetRepository(database).create({ userId: userA, categoryId: categoryA, name: null, currencyCode: "ARS", limitAmount: "150", startDate: "2026-01-01" });
    const user = { id: userA, timezone: "UTC" };

    const before = await budgetService.getBudgetDetail(user, budget.id);
    expect(before.spent).toBe("200.00");
    expect(before.status).toBe("EXCEEDED");

    const voided = await transactionsRepository.voidForUser(transactionA, userA, new Date("2026-01-20T00:00:00Z"));
    expect(voided).toBeTruthy();

    const after = await budgetService.getBudgetDetail(user, budget.id);
    expect(after.spent).toBe("0.00");
    expect(after.status).toBe("NORMAL");
  });
});
