import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { createAccountBalanceQueries, createActivityQueries, createDebtSummaryQueries, createMonthlySummaryQueries, createUpcomingObligationQueries } from "../../packages/db/src/queries";
import { accounts, debtInstallments, debts, scheduledTransactions, transactions, users } from "../../packages/db/src/schema";
import { createTransactionRepository } from "../../packages/db/src/repositories/transactions";
import { createDashboardService } from "../../apps/web/src/features/dashboard/services/dashboard-service";
import { getTestDatabase } from "../support/postgres-test-setup";

const userA = "00000000-0000-0000-0000-000000000101";
const userB = "00000000-0000-0000-0000-000000000102";
const accountA = "10000000-0000-0000-0000-000000000101";
const accountB = "10000000-0000-0000-0000-000000000102";

function buildService(database: ReturnType<typeof getTestDatabase>["db"]) {
  return createDashboardService({
    balances: createAccountBalanceQueries(database),
    monthly: createMonthlySummaryQueries(database),
    activity: createActivityQueries(database),
    projections: { debts: createDebtSummaryQueries(database), scheduled: createUpcomingObligationQueries(database) },
  });
}

async function seedTwoUsers() {
  const database = getTestDatabase().db;
  await database.insert(users).values([
    { id: userA, name: "Dashboard A", email: "dashboard-a@example.test", timezone: "UTC", baseCurrency: "ARS" },
    { id: userB, name: "Dashboard B", email: "dashboard-b@example.test", timezone: "UTC", baseCurrency: "ARS" },
  ]);
  await database.insert(accounts).values([
    { id: accountA, userId: userA, name: "Account A", type: "BANK", currencyCode: "ARS", openingBalance: "1000", openingDate: "2026-01-01" },
    { id: accountB, userId: userB, name: "Account B", type: "BANK", currencyCode: "ARS", openingBalance: "5000", openingDate: "2026-01-01" },
  ]);
  return database;
}

describe("dashboard service, read models and user isolation", () => {
  it("composes balances, monthly totals and recent activity for a single user", async () => {
    const database = await seedTwoUsers();
    const transactionsRepository = createTransactionRepository(database);
    await transactionsRepository.create({ userId: userA, accountId: accountA, categoryId: null, type: "EXPENSE", amount: "150", currencyCode: "ARS", description: "Groceries", merchant: null, occurredAt: new Date("2026-08-05T12:00:00Z"), postedAt: new Date("2026-08-05T12:00:00Z"), source: "MANUAL", notes: null });

    const service = buildService(database);
    const summary = await service.getDashboardSummary({ userId: userA, timezone: "UTC", now: new Date("2026-08-10T12:00:00Z") });

    expect(summary.accounts).toHaveLength(1);
    expect(summary.liquidBalances).toEqual([{ currencyCode: "ARS", total: "850.00" }]);
    expect(summary.monthly).toEqual([expect.objectContaining({ currencyCode: "ARS", income: "0.00", expense: "150.00" })]);
    expect(summary.recentActivity).toHaveLength(1);
  });

  it("never mixes user A's data into user B's dashboard summary", async () => {
    const database = await seedTwoUsers();
    const transactionsRepository = createTransactionRepository(database);
    await transactionsRepository.create({ userId: userA, accountId: accountA, categoryId: null, type: "EXPENSE", amount: "150", currencyCode: "ARS", description: "User A expense", merchant: null, occurredAt: new Date("2026-08-05T12:00:00Z"), postedAt: new Date("2026-08-05T12:00:00Z"), source: "MANUAL", notes: null });
    const [debtA] = await database.insert(debts).values({ userId: userA, name: "User A loan", type: "OTHER", currencyCode: "ARS", originalAmount: "300", startDate: "2026-01-01", interestType: "NO_INTEREST" }).returning();
    await database.insert(debtInstallments).values({ debtId: debtA.id, installmentNumber: 1, dueDate: "2026-08-20", principalAmount: "300", interestAmount: "0", feeAmount: "0", totalAmount: "300" });
    await database.insert(scheduledTransactions).values({ userId: userA, accountId: accountA, type: "EXPENSE", expectedAmount: "80", currencyCode: "ARS", description: "User A scheduled", scheduledDate: "2026-08-15", status: "SCHEDULED", source: "MANUAL" });

    const service = buildService(database);
    const summaryB = await service.getDashboardSummary({ userId: userB, timezone: "UTC", now: new Date("2026-08-10T12:00:00Z") });

    expect(summaryB.accounts).toEqual([expect.objectContaining({ id: accountB, balance: "5000.00" })]);
    expect(summaryB.debt).toEqual([]);
    expect(summaryB.recentActivity).toHaveLength(0);
    const arsProjectionB = summaryB.projections.find((item) => item.currencyCode === "ARS");
    expect(arsProjectionB?.spendable.committedObligations.toString()).toBe("0.00");

    const summaryA = await service.getDashboardSummary({ userId: userA, timezone: "UTC", now: new Date("2026-08-10T12:00:00Z") });
    expect(summaryA.debt).toEqual([{ currencyCode: "ARS", remaining: "300.00" }]);
    expect(summaryA.recentActivity).toHaveLength(1);
  });

  it("reflects newly posted transactions on the next read without caching stale totals", async () => {
    const database = await seedTwoUsers();
    const service = buildService(database);
    const before = await service.getDashboardSummary({ userId: userA, timezone: "UTC", now: new Date("2026-08-10T12:00:00Z") });
    expect(before.liquidBalances).toEqual([{ currencyCode: "ARS", total: "1000.00" }]);

    const transactionsRepository = createTransactionRepository(database);
    await transactionsRepository.create({ userId: userA, accountId: accountA, categoryId: null, type: "INCOME", amount: "500", currencyCode: "ARS", description: "Freelance", merchant: null, occurredAt: new Date("2026-08-06T12:00:00Z"), postedAt: new Date("2026-08-06T12:00:00Z"), source: "MANUAL", notes: null });

    const after = await service.getDashboardSummary({ userId: userA, timezone: "UTC", now: new Date("2026-08-10T12:00:00Z") });
    expect(after.liquidBalances).toEqual([{ currencyCode: "ARS", total: "1500.00" }]);
    expect(after.monthly).toEqual([expect.objectContaining({ currencyCode: "ARS", income: "500.00" })]);
  });

  it("voids a transaction and immediately reflects the reverted balance", async () => {
    const database = await seedTwoUsers();
    const transactionsRepository = createTransactionRepository(database);
    const created = await transactionsRepository.create({ userId: userA, accountId: accountA, categoryId: null, type: "EXPENSE", amount: "100", currencyCode: "ARS", description: "Temp expense", merchant: null, occurredAt: new Date("2026-08-06T12:00:00Z"), postedAt: new Date("2026-08-06T12:00:00Z"), source: "MANUAL", notes: null });
    const service = buildService(database);
    const withExpense = await service.getDashboardSummary({ userId: userA, timezone: "UTC", now: new Date("2026-08-10T12:00:00Z") });
    expect(withExpense.liquidBalances).toEqual([{ currencyCode: "ARS", total: "900.00" }]);

    await transactionsRepository.voidForUser(created.id, userA, new Date("2026-08-07T12:00:00Z"));

    const afterVoid = await service.getDashboardSummary({ userId: userA, timezone: "UTC", now: new Date("2026-08-10T12:00:00Z") });
    expect(afterVoid.liquidBalances).toEqual([{ currencyCode: "ARS", total: "1000.00" }]);
    await expect(database.select().from(transactions).where(eq(transactions.id, created.id))).resolves.toMatchObject([{ status: "VOIDED" }]);
  });
});
