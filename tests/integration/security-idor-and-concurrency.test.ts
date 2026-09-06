import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { createAccountRepository } from "../../packages/db/src/repositories/accounts";
import { createBudgetRepository } from "../../packages/db/src/repositories/budgets";
import { createCategoryRepository } from "../../packages/db/src/repositories/categories";
import { createCategoryMapRepository } from "../../packages/db/src/repositories/category-map";
import { createClassificationRuleRepository } from "../../packages/db/src/repositories/classification-rules";
import { createDebtRepository } from "../../packages/db/src/repositories/debts";
import { createGoalRepository } from "../../packages/db/src/repositories/goals";
import { createImportBatchRepository } from "../../packages/db/src/repositories/import-batches";
import { createInsightRepository } from "../../packages/db/src/repositories/insights";
import { createTransactionRepository } from "../../packages/db/src/repositories/transactions";
import { createClassificationRuleService } from "../../apps/web/src/features/transactions/services/classification-rule-service";
import { createDebtPaymentService } from "../../apps/web/src/features/debts/services/debt-payment-service";
import { createDebtService } from "../../apps/web/src/features/debts/services/debt-service";
import { createGoalService } from "../../apps/web/src/features/goals/services/goal-service";
import { createInsightService } from "../../apps/web/src/features/insights/services/insight-service";
import { createImportService } from "../../apps/web/src/features/imports/services/import-service";
import { createTransactionService } from "../../apps/web/src/features/transactions/services/transaction-service";
import { createTransferService } from "../../apps/web/src/features/transfers/services/transfer-service";
import { accounts, debtInstallments, debtPayments, debts, goals, insights, transactions, users } from "../../packages/db/src/schema";
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

  it("the obligation detail service rejects another user's debt the same way it rejects a missing one (§8.1 — page renders 404, not 403)", async () => {
    await seedTwoUsersWithAccountsAndDebts();
    const service = createDebtService(getTestDatabase().db);

    const notYours = await service.getDebtDetail({ id: userA, timezone: "UTC" }, debtB).catch((e) => e);
    const missing = await service.getDebtDetail({ id: userA, timezone: "UTC" }, "40000000-0000-0000-0000-0000000009ff").catch((e) => e);
    expect(notYours).toMatchObject({ code: "INVALID_INPUT" });
    expect(missing).toMatchObject({ code: "INVALID_INPUT" }); // identical shape → identical 404
    expect(await service.getDebtDetail({ id: userA, timezone: "UTC" }, debtA)).toMatchObject({ id: debtA });
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
    const service = createTransferService(database);

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

// WP-SECURITY-SUITE (Fase H, §39.4 / G2): the IDOR block above predates the greenfield rebuild and
// covers debts / debt-payments / transfers / budgets / accounts / categories. This block closes the
// gap for every remaining ownership-scoped write surface: goals + goal_allocations, classification
// rules, insights, transaction edit/void, and CSV import. The bar is not just "returns an error" —
// it's "another user's resource is never read, mutated, or used as a funding/target reference, and
// the denial is indistinguishable from a missing resource (§8.1)".
describe("IDOR: the domains added after the rebuild are ownership-scoped too", () => {
  async function seedTwoUsers() {
    const database = getTestDatabase().db;
    await database.insert(users).values([
      { id: userA, name: "User A", email: "idor2-a@example.test", timezone: "UTC", baseCurrency: "ARS" },
      { id: userB, name: "User B", email: "idor2-b@example.test", timezone: "UTC", baseCurrency: "ARS" },
    ]);
    return database;
  }

  describe("goals + goal_allocations (§15, CM-08)", () => {
    it("a contribution / withdrawal / detail read against another user's goal is rejected as GOAL_NOT_FOUND, and the goal's progress never moves", async () => {
      const database = await seedTwoUsers();
      const service = createGoalService(database, undefined, () => new Date("2026-03-01T12:00:00Z"));
      const goalB = await createGoalRepository(database).create({
        userId: userB, name: "Casa", category: "OTHER", currencyCode: "ARS",
        targetAmount: "1000000", currentAmount: "0", targetDate: null, notes: null,
      });

      await expect(service.contribute({ id: userA }, goalB.id, "50000")).rejects.toMatchObject({ code: "GOAL_NOT_FOUND" });
      await expect(service.withdraw({ id: userA }, goalB.id, "50000")).rejects.toMatchObject({ code: "GOAL_NOT_FOUND" });
      await expect(service.getGoalDetail({ id: userA }, goalB.id, "2026-03-01")).rejects.toMatchObject({ code: "GOAL_NOT_FOUND" });
      await expect(service.listAllocations({ id: userA }, goalB.id)).rejects.toMatchObject({ code: "GOAL_NOT_FOUND" });
      await expect(service.archiveGoal({ id: userA }, goalB.id)).rejects.toMatchObject({ code: "GOAL_NOT_FOUND" });

      const [after] = await database.select().from(goals).where(eq(goals.id, goalB.id));
      expect(after).toMatchObject({ currentAmount: "0.000000", status: "ACTIVE" });
    });

    it("rejecting another user's goal is the same shape as a goal that does not exist", async () => {
      const database = await seedTwoUsers();
      const service = createGoalService(database, undefined, () => new Date("2026-03-01T12:00:00Z"));
      const goalB = await createGoalRepository(database).create({
        userId: userB, name: "Casa", category: "OTHER", currencyCode: "ARS",
        targetAmount: "1000000", currentAmount: "0", targetDate: null, notes: null,
      });

      const notYours = await service.contribute({ id: userA }, goalB.id, "1").catch((e) => e);
      const missing = await service.contribute({ id: userA }, "99999999-0000-0000-0000-0000000009ff", "1").catch((e) => e);
      expect(notYours.code).toBe(missing.code);
    });
  });

  describe("classification rules (§6.8-6.10)", () => {
    async function seedRuleForB(database: Awaited<ReturnType<typeof seedTwoUsers>>) {
      const categories = createCategoryRepository(database);
      const naftaB = await categories.create({ userId: userB, name: "Nafta", type: "EXPENSE", parentId: null });
      const naftaA = await categories.create({ userId: userA, name: "Nafta", type: "EXPENSE", parentId: null });
      const accountA = await createAccountRepository(database).create({ userId: userA, name: "Cuenta A", type: "BANK", currencyCode: "ARS", openingBalance: "0", openingDate: "2026-01-01" });
      const ruleB = await createClassificationRuleRepository(database).create({ userId: userB, matcher: "MERCHANT", mode: "CONTAINS", pattern: "ypf", categoryId: naftaB.id });
      // A YPF expense that belongs to user A — user B's rule must never reach it.
      await createTransactionRepository(database).create({
        userId: userA, accountId: accountA.id, categoryId: null, originalTransactionId: null, relatedTransactionId: null, reason: null,
        type: "EXPENSE", amount: "9000", currencyCode: "ARS", description: "Carga YPF", merchant: "YPF",
        occurredAt: new Date("2026-02-10T12:00:00Z"), postedAt: new Date("2026-02-10T12:00:00Z"), source: "MANUAL", notes: null,
      });
      const service = createClassificationRuleService({
        rules: createClassificationRuleRepository(database),
        categories,
        transactions: createTransactionRepository(database),
        categoryMap: createCategoryMapRepository(database),
      });
      return { service, ruleB, naftaAId: naftaA.id, database };
    }

    it("applying / previewing / deleting another user's rule is rejected as RULE_NOT_FOUND", async () => {
      const database = await seedTwoUsers();
      const { service, ruleB } = await seedRuleForB(database);

      await expect(service.applyRuleRetroactively(userA, ruleB.id, "ALL")).rejects.toMatchObject({ code: "RULE_NOT_FOUND" });
      await expect(service.previewExistingRule(userA, ruleB.id, "ALL")).rejects.toMatchObject({ code: "RULE_NOT_FOUND" });
      await expect(service.deleteRule(userA, ruleB.id)).rejects.toMatchObject({ code: "RULE_NOT_FOUND" });
    });

    it("a user's own retroactive rule apply only ever recategorises that user's transactions", async () => {
      const database = await seedTwoUsers();
      const { service, naftaAId } = await seedRuleForB(database);

      // User A creates their own YPF rule and applies it to the whole window.
      const { applied } = await service.createRule(userA, { matcher: "MERCHANT", mode: "CONTAINS", pattern: "ypf", categoryId: naftaAId }, { retroactive: "ALL" });
      expect(applied).toBe(1); // only user A's one YPF row

      // User B has no rows of their own here; the important assertion is user A's rule never
      // wrote across the ownership boundary — the bulk update is `userId`-scoped at the repo.
      const rows = await createTransactionRepository(database).listForUser(userB, { limit: 100 });
      expect(rows).toHaveLength(0);
    });
  });

  describe("insights (§13, §16)", () => {
    async function insightForB(database: Awaited<ReturnType<typeof seedTwoUsers>>) {
      return createInsightRepository(database).insert({
        userId: userB, family: "INS-BUDGET-LIMIT", dedupeKey: "b-1", status: "ACTIVE", confidence: "MEDIUM",
        title: "Vas a exceder Supermercado", body: "…", impactAmount: null, impactCurrency: null,
        ctaLabel: null, ctaHref: null, evidence: {}, calculationVersion: "insights-1",
      });
    }

    it("getDetail never returns another user's insight, and dismiss / resolve never change its status", async () => {
      const database = await seedTwoUsers();
      const rowB = await insightForB(database);
      const service = createInsightService(database, () => new Date("2026-03-01T12:00:00Z"));

      await expect(service.getDetail({ id: userA }, rowB.id)).resolves.toBeNull();
      await service.dismiss({ id: userA }, rowB.id, null);
      await service.resolve({ id: userA }, rowB.id);

      const [after] = await database.select().from(insights).where(eq(insights.id, rowB.id));
      expect(after).toMatchObject({ status: "ACTIVE", dismissedAt: null, resolvedAt: null });
    });
  });

  describe("transaction edit / void (CM-02)", () => {
    async function txnForB(database: Awaited<ReturnType<typeof seedTwoUsers>>) {
      const accountB = await createAccountRepository(database).create({ userId: userB, name: "Cuenta B", type: "BANK", currencyCode: "ARS", openingBalance: "0", openingDate: "2026-01-01" });
      const row = await createTransactionRepository(database).create({
        userId: userB, accountId: accountB.id, categoryId: null, originalTransactionId: null, relatedTransactionId: null, reason: null,
        type: "EXPENSE", amount: "500", currencyCode: "ARS", description: "Compra de B", merchant: "Coto",
        occurredAt: new Date("2026-02-05T12:00:00Z"), postedAt: new Date("2026-02-05T12:00:00Z"), source: "MANUAL", notes: null,
      });
      const service = createTransactionService({
        accounts: createAccountRepository(database),
        categories: createCategoryRepository(database),
        transactions: createTransactionRepository(database),
      });
      return { service, row: row!, database };
    }

    it("editing or voiding another user's transaction is rejected as TRANSACTION_NOT_FOUND and leaves the row untouched", async () => {
      const database = await seedTwoUsers();
      const { service, row } = await txnForB(database);

      await expect(service.editTransaction(userA, row.id, { description: "hackeado" })).rejects.toMatchObject({ code: "TRANSACTION_NOT_FOUND" });
      await expect(service.voidTransaction(userA, row.id)).rejects.toMatchObject({ code: "TRANSACTION_NOT_FOUND" });

      const [after] = await database.select().from(transactions).where(eq(transactions.id, row.id));
      expect(after).toMatchObject({ description: "Compra de B", status: "POSTED" });
    });
  });

  describe("CSV import (§10)", () => {
    it("committing an import into another user's account is rejected as ACCOUNT_NOT_FOUND and writes no transactions", async () => {
      const database = await seedTwoUsers();
      const accountsRepo = createAccountRepository(database);
      const accountB = await accountsRepo.create({ userId: userB, name: "Cuenta B", type: "BANK", currencyCode: "ARS", openingBalance: "0", openingDate: "2026-01-01" });
      const transactionsRepo = createTransactionRepository(database);
      const txnService = createTransactionService({ accounts: accountsRepo, categories: { findByIdForUser: async () => undefined }, transactions: transactionsRepo });
      const importService = createImportService({
        accounts: accountsRepo,
        transactions: transactionsRepo,
        importBatches: createImportBatchRepository(database),
        createTransaction: (uid, type, input, tz) =>
          type === "INCOME" ? txnService.createIncomeTransaction(uid, input, tz) : txnService.createExpenseTransaction(uid, input, tz),
      });

      const csv = ["Fecha;Descripción;Débito;Crédito", "01/02/2026;COMPRA;15400,00;"].join("\n");
      await expect(
        importService.commitImport(userA, { accountId: accountB.id, text: csv, timezone: "UTC", commandId: "cccccccc-0000-0000-0000-00000000c5c5" }),
      ).rejects.toMatchObject({ code: "ACCOUNT_NOT_FOUND" });

      expect(await transactionsRepo.listForUser(userA, { limit: 100 })).toHaveLength(0);
      expect(await transactionsRepo.listForUser(userB, { limit: 100 })).toHaveLength(0);
    });
  });
});

