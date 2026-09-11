import { describe, expect, it } from "vitest";

import { createKaiInteractionRepository } from "../../packages/db/src/repositories/kai-interactions";
import { createAccountBalanceQueries, createMonthlySummaryQueries } from "../../packages/db/src/queries";
import { accounts, users } from "../../packages/db/src/schema";
import { createTransactionRepository } from "../../packages/db/src/repositories/transactions";
import {
  resolveKaiInteraction,
  type KaiDataPorts,
} from "../../packages/kai/src/index";
import { Money, monthRangeForTimezone } from "../../packages/finance/src/index";
import { getTestDatabase } from "../support/postgres-test-setup";

const userId = "00000000-0000-0000-0000-0000000004a1";
const accountId = "10000000-0000-0000-0000-0000000004a1";
const now = new Date("2026-09-10T12:00:00Z");
const timezone = "UTC";

async function seed() {
  const database = getTestDatabase().db;
  await database.insert(users).values({
    id: userId, name: "KAI", email: "kai-interactions@example.test", timezone, baseCurrency: "ARS",
  });
  await database.insert(accounts).values({
    id: accountId, userId, name: "Caja", type: "BANK", currencyCode: "ARS", openingBalance: "0", openingDate: "2026-09-01",
  });
  const tx = createTransactionRepository(database);
  await tx.create({ userId, accountId, categoryId: null, type: "INCOME", amount: "1200000", currencyCode: "ARS", description: "Sueldo", merchant: null, occurredAt: new Date("2026-09-02T12:00:00Z"), postedAt: new Date("2026-09-02T12:00:00Z"), source: "MANUAL", notes: null });
  await tx.create({ userId, accountId, categoryId: null, type: "EXPENSE", amount: "850000", currencyCode: "ARS", description: "Alquiler", merchant: null, occurredAt: new Date("2026-09-03T12:00:00Z"), postedAt: new Date("2026-09-03T12:00:00Z"), source: "MANUAL", notes: null });
  return database;
}

function buildPorts(database: ReturnType<typeof getTestDatabase>["db"]): KaiDataPorts {
  const monthly = createMonthlySummaryQueries(database);
  const balances = createAccountBalanceQueries(database);
  const empty = async () => [];
  return {
    async getMonthlySummary(range) {
      const rows = await monthly.getMonthlyIncomeExpense(userId, { from: range.from, to: range.to });
      return rows.map((r) => {
        const income = Money.fromString(r.incomeTotal, r.currencyCode);
        const expense = Money.fromString(r.netExpense ?? r.expenseTotal, r.currencyCode);
        return { currencyCode: r.currencyCode, income: income.toString(), expense: expense.toString(), net: income.subtract(expense).toString() };
      });
    },
    async getLiquidBalances() {
      const rows = await balances.getLiquidTotalsForUser(userId);
      return rows.map((r) => ({ currencyCode: r.currencyCode, amount: r.total }));
    },
    getAccountBalances: empty,
    getSpendable: empty,
    getCategoryExpenses: async () => null,
    getMerchantExpenses: async () => null,
    getTopExpenseCategories: empty,
    getRecentExpenses: empty,
    getUpcomingObligations: empty,
    getActiveSubscriptions: empty,
    getBudgetStatus: empty,
    getGoalProgress: empty,
    getTopInsight: async () => null,
    getGoalsForAllocation: async () => [],
    getObligationsForPayment: async () => [],
    getInsightsForProactive: async () => [],
    findTransactionToVoid: async () => null,
  };
}

describe("KAI interaction pipeline (integration)", () => {
  it("answers 'cuánto gasté este mes' from the DB and records a local-resolution audit row", async () => {
    const database = await seed();
    const repo = createKaiInteractionRepository(database);
    const ports = buildPorts(database);

    const { response, audit } = await resolveKaiInteraction({
      message: "¿cuánto gasté este mes?",
      screenContext: "DASHBOARD",
      history: [],
      ports,
      llmFallback: async () => { throw new Error("must not reach the LLM"); },
      budgetGuard: async () => {},
      now,
      timezone,
    });

    // Parity with the raw query: the metric card carries the same net expense.
    const period = monthRangeForTimezone(2026, 9, timezone);
    const [row] = await createMonthlySummaryQueries(database).getMonthlyIncomeExpense(userId, { from: period.start, to: period.end });
    const expected = Money.fromString(row.netExpense ?? row.expenseTotal, "ARS").toString();
    const values = (response.data as { values?: Array<{ amount: string }> } | undefined)?.values ?? [];
    expect(values[0]?.amount).toBe(expected);
    expect(audit).toMatchObject({ intentId: "GET_MONTH_EXPENSES", resolutionSource: "DATABASE", llmUsed: false });

    await repo.record({ userId, ...audit });
    await repo.record({ userId, intentId: "UNRESOLVED", resolutionSource: "LLM", weight: 5, llmUsed: true, aiCostUsd: 0.002, latencyMs: 10, responseType: "KAI_TEXT", screenContext: null });

    const range = { from: new Date("2026-09-01"), to: new Date("2026-10-01") };
    const stats = await repo.resolutionStats(range);
    expect(stats.total).toBe(2);
    expect(stats.local).toBe(1);
    expect(stats.localResolutionRate).toBeCloseTo(0.5);

    // KAI points: 1 (deterministic) + 5 (LLM) = 6.
    expect(await repo.consumedPointsForUser(userId, range)).toBe(6);
  });
});
