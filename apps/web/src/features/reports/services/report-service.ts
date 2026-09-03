import {
  createAccountBalanceQueries,
  createActivityQueries,
  createBudgetQueries,
  createCategoryRepository,
  createDebtSummaryQueries,
  createMonthlySummaryQueries,
  db,
} from "@know-finanzas/db";
import { Money, monthRangeForTimezone, todayInTimezone } from "@know-finanzas/finance";

export type ReportTab =
  | "resumen"
  | "gastos"
  | "ingresos"
  | "flujo"
  | "patrimonio"
  | "deudas"
  | "comparativos";

export type MonthPoint = { period: string; label: string; income: string; expense: string; net: string };
export type CategorySlice = { id: string; name: string; amount: string; share: number };

export type ReportData = {
  period: string;
  currencyCode: string;
  kpis: { income: string; expense: string; savings: string; savingsRate: number; netWorth: string };
  months: MonthPoint[];
  expenseByCategory: CategorySlice[];
  incomeByCategory: CategorySlice[];
};

const MONTHS_ES_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function parsePeriod(period: string | undefined, timezone: string, now: Date): { year: number; month: number; period: string } {
  const match = period && /^\d{4}-(0[1-9]|1[0-2])$/.test(period) ? period : todayInTimezone(now, timezone).slice(0, 7);
  const [year, month] = match.split("-").map(Number);
  return { year, month, period: match };
}

function shiftMonth(year: number, month: number, delta: number): { year: number; month: number; period: string } {
  const base = new Date(Date.UTC(year, month - 1 + delta, 1));
  const y = base.getUTCFullYear();
  const m = base.getUTCMonth() + 1;
  return { year: y, month: m, period: `${y}-${String(m).padStart(2, "0")}` };
}

export function createReportService(database = db) {
  const monthly = createMonthlySummaryQueries(database);
  const budgets = createBudgetQueries(database);
  const balances = createAccountBalanceQueries(database);
  const debtSummary = createDebtSummaryQueries(database);
  const activity = createActivityQueries(database);
  const categories = createCategoryRepository(database);

  return {
    async getReport(input: { userId: string; timezone: string; baseCurrency: string; period?: string; now?: Date }): Promise<ReportData> {
      const now = input.now ?? new Date();
      const currencyCode = input.baseCurrency;
      const { year, month, period } = parsePeriod(input.period, input.timezone, now);
      const range = monthRangeForTimezone(year, month, input.timezone);

      const monthSpans = Array.from({ length: 6 }, (_, index) => shiftMonth(year, month, index - 5)).map((entry) => ({
        ...entry,
        range: monthRangeForTimezone(entry.year, entry.month, input.timezone),
      }));

      const [monthlyRows, categorySpend, categoryList, incomeActivity, liquidRows, debtRows, ...monthlyBack] = await Promise.all([
        monthly.getMonthlyIncomeExpense(input.userId, { from: range.start, to: range.end }),
        budgets.getCategorySpendingForUser(input.userId, { from: range.start, to: range.end }),
        categories.listForUser(input.userId, { includeArchived: true }),
        activity.listRecentActivity(input.userId, { from: range.start, to: range.end, limit: 1000 }),
        balances.getAccountBalancesForUser(input.userId),
        debtSummary.listDebtInputsForUser(input.userId),
        ...monthSpans.map((span) => monthly.getMonthlyIncomeExpense(input.userId, { from: span.range.start, to: span.range.end })),
      ]);

      const categoryName = new Map(categoryList.map((category) => [category.id, category.name]));

      const zero = () => Money.zero(currencyCode);
      const pickBase = <T extends { currencyCode: string }>(rows: T[]) => rows.filter((row) => row.currencyCode === currencyCode);

      const periodTotals = pickBase(monthlyRows).reduce(
        (acc, row) => ({
          income: acc.income.add(Money.fromString(row.incomeTotal, currencyCode)),
          expense: acc.expense.add(Money.fromString(row.netExpense ?? row.expenseTotal, currencyCode)),
        }),
        { income: zero(), expense: zero() },
      );
      const savings = periodTotals.income.subtract(periodTotals.expense);
      const savingsRate = Number(periodTotals.income.toString()) > 0
        ? Math.round((Number(savings.toString()) / Number(periodTotals.income.toString())) * 100)
        : 0;

      // Net worth = liquid assets − outstanding debt, base currency only.
      const liquidAssets = pickBase(liquidRows.map((row) => ({ currencyCode: row.account.currencyCode, ...row }))).reduce((total, row) => {
        const balance = Money.fromString(row.account.openingBalance, currencyCode)
          .add(Money.fromString(row.incomeTotal, currencyCode))
          .subtract(Money.fromString(row.expenseTotal, currencyCode))
          .add(Money.fromString(row.refundTotal ?? "0", currencyCode))
          .add(Money.fromString(row.adjustmentInTotal ?? "0", currencyCode))
          .subtract(Money.fromString(row.adjustmentOutTotal ?? "0", currencyCode))
          .subtract(Money.fromString(row.liabilityPaymentTotal ?? "0", currencyCode));
        return total.add(balance);
      }, zero());
      const debtOutstanding = debtRows
        .filter((row) => row.debt.currencyCode === currencyCode && row.installment.status !== "PAID" && row.installment.status !== "CANCELLED" && row.debt.status !== "CANCELLED")
        .reduce(
          (total, row) => total.add(Money.fromString(row.installment.totalAmount, currencyCode).subtract(Money.fromString(row.allocatedAmount, currencyCode))),
          zero(),
        );
      const netWorth = liquidAssets.subtract(debtOutstanding);

      const months: MonthPoint[] = monthSpans.map((span, index) => {
        const rows = pickBase(monthlyBack[index] as Array<{ currencyCode: string; incomeTotal: string; expenseTotal: string; netExpense?: string }>);
        const income = rows.reduce((total, row) => total.add(Money.fromString(row.incomeTotal, currencyCode)), zero());
        const expense = rows.reduce((total, row) => total.add(Money.fromString(row.netExpense ?? row.expenseTotal, currencyCode)), zero());
        return {
          period: span.period,
          label: MONTHS_ES_SHORT[span.month - 1],
          income: income.toString(),
          expense: expense.toString(),
          net: income.subtract(expense).toString(),
        };
      });

      const buildSlices = (entries: Array<{ id: string; name: string; amount: Money }>): CategorySlice[] => {
        const total = entries.reduce((sum, entry) => sum.add(entry.amount), zero());
        const totalNumber = Number(total.toString());
        return entries
          .map((entry) => ({
            id: entry.id,
            name: entry.name,
            amount: entry.amount.toString(),
            share: totalNumber > 0 ? Number(entry.amount.toString()) / totalNumber : 0,
          }))
          .sort((a, b) => Number(b.amount) - Number(a.amount));
      };

      const expenseByCategory = buildSlices(
        pickBase(categorySpend)
          .filter((row) => row.categoryId)
          .map((row) => ({
            id: row.categoryId as string,
            name: categoryName.get(row.categoryId as string) ?? "Sin categoría",
            amount: Money.fromString(row.netExpense ?? row.expenseTotal, currencyCode),
          }))
          .filter((entry) => Number(entry.amount.toString()) > 0),
      );

      const incomeGroups = new Map<string, Money>();
      for (const row of incomeActivity) {
        if (row.type !== "INCOME" || row.currencyCode !== currencyCode) continue;
        const key = row.categoryId ?? "sin-categoria";
        const current = incomeGroups.get(key) ?? zero();
        incomeGroups.set(key, current.add(Money.fromString(row.amount, currencyCode)));
      }
      const incomeByCategory = buildSlices(
        [...incomeGroups.entries()].map(([key, amount]) => ({
          id: key,
          name: key === "sin-categoria" ? "Sin categoría" : categoryName.get(key) ?? "Sin categoría",
          amount,
        })),
      );

      return {
        period,
        currencyCode,
        kpis: {
          income: periodTotals.income.toString(),
          expense: periodTotals.expense.toString(),
          savings: savings.toString(),
          savingsRate,
          netWorth: netWorth.toString(),
        },
        months,
        expenseByCategory,
        incomeByCategory,
      };
    },
  };
}
