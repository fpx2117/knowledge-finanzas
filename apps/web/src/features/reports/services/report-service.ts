import {
  createAccountBalanceQueries,
  createActivityQueries,
  createBudgetQueries,
  createCategoryRepository,
  createDebtSummaryQueries,
  createMonthlySummaryQueries,
  createUpcomingObligationQueries,
  db,
} from "@know-finanzas/db";
import { convertAmount, isConvertiblePair, Money, monthRangeForTimezone, todayInTimezone, type FxQuote } from "@know-finanzas/finance";

import { createDashboardService } from "@/features/dashboard/services/dashboard-service";

export type MonthPoint = { period: string; label: string; income: string; expense: string; net: string };
export type CategorySlice = { id: string; name: string; amount: string; share: number; delta?: Delta | null };

/**
 * spec 08 §15 — variación vs. período comparable. `pct` es null cuando no hay base interpretable
 * (comparativo = 0, §15.4). `delta` = actual − comparativo. La UI decide el color por métrica
 * (§15.5 — más ingresos no es alerta).
 */
export type Delta = { value: string; pct: number | null };

function computeDelta(current: string, previous: string): Delta {
  const c = Number(current);
  const p = Number(previous);
  return {
    value: String(Math.round(c - p)),
    pct: Math.abs(p) > 0 ? Math.round(((c - p) / Math.abs(p)) * 100) : null,
  };
}

export type ReportData = {
  period: string;
  currencyCode: string;
  kpis: { income: string; expense: string; savings: string; savingsRate: number | null; netWorth: string };
  months: MonthPoint[];
  /** §15 — the month before `period` and how the period's totals moved against it. */
  comparison: { period: string; label: string; income: Delta; expense: Delta; savings: Delta } | null;
  expenseByCategory: CategorySlice[];
  incomeByCategory: CategorySlice[];
  netWorthDetail: { liquidAssets: string; debtOutstanding: string; netWorth: string };
  /**
   * WP-READMODEL-CONTRACT (spec 14 §21/§42): this read model's calculation shape, bumped whenever
   * the aggregation logic changes so a cached/exported value can be told apart from a re-run.
   * Not a cache key by itself — just a version stamp on the output.
   */
  calculationVersion: 1;
  /**
   * Coverage/warnings (§21): accounts whose currency isn't `currencyCode` are excluded from every
   * total above (§22 — never summed across currencies), not silently merged in. The UI must
   * surface this, not hide it.
   *
   * `movementCount` / `sufficientData` (§9.9): below a minimum number of movements in the period
   * the UI must show the raw totals but must not make trend claims.
   */
  coverage: { excludedCurrencies: string[]; movementCount: number; sufficientData: boolean };
  /**
   * Set only when the report was asked to convert (`convert: true`) and a quote was available.
   * Every total above then folds in the listed currencies at this quote — an explicit,
   * estimated conversion the UI must label as such (spec 00 §285). `null` means the report is
   * single-currency as usual.
   */
  conversion: {
    convertedCurrencies: string[];
    quote: { base: string; quote: string; bid: string; ask: string };
    asOf: string;
    stale: boolean;
  } | null;
};

/** §9.9: minimum movements in the period before Panorama is allowed to describe a trend. */
const SUFFICIENT_DATA_THRESHOLD = 5;

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
  const dashboard = createDashboardService({
    balances,
    monthly,
    activity,
    debts: debtSummary,
    scheduled: createUpcomingObligationQueries(database),
  });

  return {
    /**
     * spec 08 §12 — Flujo de caja tiene dos dominios: REAL (histórico confirmado, en `getReport`)
     * y PROYECTADO (30 días: obligaciones + programados). Nunca se mezclan. Esta reusa el mismo
     * motor de proyección que el Resumen (§35.1 — una sola fórmula).
     */
    async getCashFlowProjection(input: { userId: string; timezone: string; baseCurrency: string; now?: Date }) {
      const summary = await dashboard.getDashboardSummary({
        userId: input.userId,
        timezone: input.timezone,
        now: input.now ?? new Date(),
      });
      const base = summary.projections.find((p) => p.currencyCode === input.baseCurrency) ?? summary.projections[0] ?? null;
      if (!base) return null;
      const { cashflow } = base;
      const inflow = cashflow.points.reduce((sum, point) => sum + Number(point.inflow.toString()), 0);
      const outflow = cashflow.points.reduce((sum, point) => sum + Number(point.outflow.toString()), 0);
      return {
        currencyCode: base.currencyCode,
        horizonDays: cashflow.horizonDays,
        startingBalance: cashflow.startingBalance.toString(),
        projectedEndBalance: cashflow.projectedEndBalance.toString(),
        totalInflow: String(inflow),
        totalOutflow: String(outflow),
        minimumProjectedBalance: cashflow.minimumProjectedBalance.toString(),
        minimumBalanceDate: cashflow.minimumBalanceDate,
        firstNegativeDate: cashflow.firstNegativeDate,
        shortfallAmount: cashflow.shortfallAmount ? cashflow.shortfallAmount.toString() : null,
        events: cashflow.points
          .flatMap((point) => point.events.map((event) => ({
            date: event.date,
            title: event.title,
            direction: event.direction,
            amount: event.amount.toString(),
            confidence: event.confidence,
          })))
          .sort((a, b) => a.date.localeCompare(b.date)),
      };
    },

    /**
     * spec 08 §13 — Patrimonio por moneda: activos líquidos (saldo derivado del ledger) menos
     * deuda pendiente, SIN combinar monedas (§13.4). Cada moneda es una fila.
     */
    async getNetPosition(input: { userId: string }) {
      const [liquidRows, debtRows] = await Promise.all([
        balances.getAccountBalancesForUser(input.userId),
        debtSummary.listDebtInputsForUser(input.userId),
      ]);
      const byCurrency = new Map<string, { liquid: Money; debt: Money; accounts: number }>();
      const bucket = (code: string) => {
        let entry = byCurrency.get(code);
        if (!entry) {
          entry = { liquid: Money.zero(code), debt: Money.zero(code), accounts: 0 };
          byCurrency.set(code, entry);
        }
        return entry;
      };

      for (const row of liquidRows) {
        const code = row.account.currencyCode;
        const entry = bucket(code);
        const balance = Money.fromString(row.account.openingBalance, code)
          .add(Money.fromString(row.incomeTotal, code))
          .subtract(Money.fromString(row.expenseTotal, code))
          .add(Money.fromString(row.refundTotal ?? "0", code))
          .add(Money.fromString(row.adjustmentInTotal ?? "0", code))
          .subtract(Money.fromString(row.adjustmentOutTotal ?? "0", code))
          .subtract(Money.fromString(row.liabilityPaymentTotal ?? "0", code));
        entry.liquid = entry.liquid.add(balance);
        entry.accounts += 1;
      }

      for (const row of debtRows) {
        if (row.installment.status === "PAID" || row.installment.status === "CANCELLED" || row.debt.status === "CANCELLED") continue;
        const code = row.debt.currencyCode;
        const entry = bucket(code);
        entry.debt = entry.debt.add(
          Money.fromString(row.installment.totalAmount, code).subtract(Money.fromString(row.allocatedAmount, code)),
        );
      }

      return [...byCurrency.entries()]
        .map(([currencyCode, entry]) => ({
          currencyCode,
          liquidAssets: entry.liquid.toString(),
          debtOutstanding: entry.debt.toString(),
          netWorth: entry.liquid.subtract(entry.debt).toString(),
          accountCount: entry.accounts,
        }))
        .sort((a, b) => a.currencyCode.localeCompare(b.currencyCode));
    },

    /** Currencies the user actually holds/moves money in — for the §7.7 report currency selector. */
    async listReportCurrencies(userId: string, baseCurrency: string): Promise<string[]> {
      const rows = await balances.getAccountBalancesForUser(userId);
      const set = new Set<string>([baseCurrency, ...rows.map((row) => row.account.currencyCode)]);
      return [...set].sort();
    },

    async getReport(input: {
      userId: string;
      timezone: string;
      baseCurrency: string;
      /** Which currency the report is expressed in (§7.7 — never combined). Defaults to base. */
      currency?: string;
      period?: string;
      now?: Date;
      /** When true and `fxQuote` is set, fold other currencies into `currency` at that quote. */
      convert?: boolean;
      /** The dólar-blue (or other) quote to convert at. Provided by the caller, never fetched here. */
      fxQuote?: (FxQuote & { asOf: string; stale: boolean }) | null;
    }): Promise<ReportData> {
      const now = input.now ?? new Date();
      const currencyCode = input.currency ?? input.baseCurrency;
      const quote = input.convert && input.fxQuote ? input.fxQuote : null;

      /** Amount from `fromCode` expressed in `currencyCode`; identity when already there. */
      const toDisplay = (amount: string, fromCode: string): string =>
        fromCode === currencyCode || !quote ? amount : convertAmount(amount, fromCode, currencyCode, quote);
      /** Rows we can include: the display currency, plus (in convert mode) convertible ones. */
      const includable = (fromCode: string): boolean =>
        fromCode === currencyCode || (quote != null && isConvertiblePair(fromCode, currencyCode, quote));
      const { year, month, period } = parsePeriod(input.period, input.timezone, now);
      const range = monthRangeForTimezone(year, month, input.timezone);

      const monthSpans = Array.from({ length: 6 }, (_, index) => shiftMonth(year, month, index - 5)).map((entry) => ({
        ...entry,
        range: monthRangeForTimezone(entry.year, entry.month, input.timezone),
      }));
      const prevSpan = shiftMonth(year, month, -1);
      const prevRange = monthRangeForTimezone(prevSpan.year, prevSpan.month, input.timezone);

      const [rawMonthly, rawCategorySpend, rawPrevCategorySpend, categoryList, rawIncomeActivity, rawLiquidRows, rawDebtRows, ...rawMonthlyBack] = await Promise.all([
        monthly.getMonthlyIncomeExpense(input.userId, { from: range.start, to: range.end }),
        budgets.getCategorySpendingForUser(input.userId, { from: range.start, to: range.end }),
        budgets.getCategorySpendingForUser(input.userId, { from: prevRange.start, to: prevRange.end }),
        categories.listForUser(input.userId, { includeArchived: true }),
        activity.listRecentActivity(input.userId, { from: range.start, to: range.end, limit: 1000 }),
        balances.getAccountBalancesForUser(input.userId),
        debtSummary.listDebtInputsForUser(input.userId),
        ...monthSpans.map((span) => monthly.getMonthlyIncomeExpense(input.userId, { from: span.range.start, to: span.range.end })),
      ]);

      // Convert mode (spec 00 §285): rewrite every fetched row we can convert into the display
      // currency, so all the single-currency aggregation below just works. Rows in a currency
      // the quote can't reach are dropped here and reported under `excludedCurrencies`. Without
      // a quote the arrays pass through untouched.
      const convertedCurrencies = new Set<string>();
      const money = (amount: string, from: string) => {
        if (from !== currencyCode) convertedCurrencies.add(from);
        return toDisplay(amount, from);
      };
      const monthMap = <T extends { currencyCode: string; incomeTotal: string; expenseTotal: string; netExpense?: string | null }>(rows: T[]): T[] =>
        rows
          .filter((row) => includable(row.currencyCode))
          .map((row) => ({
            ...row,
            currencyCode,
            incomeTotal: money(row.incomeTotal, row.currencyCode),
            expenseTotal: money(row.expenseTotal, row.currencyCode),
            netExpense: row.netExpense == null ? row.netExpense : money(row.netExpense, row.currencyCode),
          }));
      const spendMap = <T extends { currencyCode: string; expenseTotal: string; netExpense?: string | null }>(rows: T[]): T[] =>
        rows
          .filter((row) => includable(row.currencyCode))
          .map((row) => ({
            ...row,
            currencyCode,
            expenseTotal: money(row.expenseTotal, row.currencyCode),
            netExpense: row.netExpense == null ? row.netExpense : money(row.netExpense, row.currencyCode),
          }));

      const monthlyRows = quote ? monthMap(rawMonthly) : rawMonthly;
      const monthlyBack = quote ? rawMonthlyBack.map((rows) => monthMap(rows)) : rawMonthlyBack;
      const categorySpend = quote ? spendMap(rawCategorySpend) : rawCategorySpend;
      const prevCategorySpend = quote ? spendMap(rawPrevCategorySpend) : rawPrevCategorySpend;
      const incomeActivity = quote
        ? rawIncomeActivity
            .filter((row) => includable(row.currencyCode))
            .map((row) => ({ ...row, currencyCode, amount: money(row.amount, row.currencyCode) }))
        : rawIncomeActivity;
      const liquidRows = quote
        ? rawLiquidRows
            .filter((row) => includable(row.account.currencyCode))
            .map((row) => {
              const from = row.account.currencyCode;
              return {
                ...row,
                account: { ...row.account, currencyCode, openingBalance: money(row.account.openingBalance, from) },
                incomeTotal: money(row.incomeTotal, from),
                expenseTotal: money(row.expenseTotal, from),
                refundTotal: row.refundTotal == null ? row.refundTotal : money(row.refundTotal, from),
                adjustmentInTotal: row.adjustmentInTotal == null ? row.adjustmentInTotal : money(row.adjustmentInTotal, from),
                adjustmentOutTotal: row.adjustmentOutTotal == null ? row.adjustmentOutTotal : money(row.adjustmentOutTotal, from),
                liabilityPaymentTotal: row.liabilityPaymentTotal == null ? row.liabilityPaymentTotal : money(row.liabilityPaymentTotal, from),
              };
            })
        : rawLiquidRows;
      const debtRows = quote
        ? rawDebtRows
            .filter((row) => includable(row.debt.currencyCode))
            .map((row) => {
              const from = row.debt.currencyCode;
              return {
                ...row,
                debt: { ...row.debt, currencyCode },
                installment: { ...row.installment, totalAmount: money(row.installment.totalAmount, from) },
                allocatedAmount: money(row.allocatedAmount, from),
              };
            })
        : rawDebtRows;

      const prevExpenseByCategoryId = new Map<string, number>();
      for (const row of prevCategorySpend) {
        if (row.currencyCode !== currencyCode || !row.categoryId) continue;
        prevExpenseByCategoryId.set(row.categoryId, Number(row.netExpense ?? row.expenseTotal));
      }

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
      const incomeNumber = Number(periodTotals.income.toString());
      // §5.4: with no confirmed income the rate is undefined — show "—", never a misleading 0%.
      const savingsRate = incomeNumber > 0 ? Math.round((Number(savings.toString()) / incomeNumber) * 100) : null;

      // §9.9: how many confirmed income/expense movements fell in the period, base currency only.
      const movementCount = incomeActivity.filter(
        (row) => (row.type === "INCOME" || row.type === "EXPENSE") && row.currencyCode === currencyCode,
      ).length;

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

      // Currencies still left out of the totals: those we never converted — either convert mode
      // is off, or the quote can't reach them.
      const excludedCurrencies = [
        ...new Set(
          rawLiquidRows.map((row) => row.account.currencyCode).filter((code) => code !== currencyCode && !includable(code)),
        ),
      ];

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

      // §15.1 — período anterior equivalente = el mes previo (ya calculado en `months`).
      const prevMonth = months[months.length - 2];
      const comparison = prevMonth
        ? {
            period: prevMonth.period,
            label: MONTHS_ES_SHORT[Number(prevMonth.period.slice(5, 7)) - 1],
            income: computeDelta(periodTotals.income.toString(), prevMonth.income),
            expense: computeDelta(periodTotals.expense.toString(), prevMonth.expense),
            savings: computeDelta(savings.toString(), prevMonth.net),
          }
        : null;

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
      ).map((slice) => ({
        // §14.2 "Vs. anterior" — variación de cada categoría contra el mes previo.
        ...slice,
        delta: prevExpenseByCategoryId.has(slice.id)
          ? computeDelta(slice.amount, String(prevExpenseByCategoryId.get(slice.id)))
          : null,
      }));

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
        comparison,
        expenseByCategory,
        incomeByCategory,
        netWorthDetail: {
          liquidAssets: liquidAssets.toString(),
          debtOutstanding: debtOutstanding.toString(),
          netWorth: netWorth.toString(),
        },
        calculationVersion: 1,
        coverage: { excludedCurrencies, movementCount, sufficientData: movementCount >= SUFFICIENT_DATA_THRESHOLD },
        conversion:
          quote && convertedCurrencies.size > 0
            ? {
                convertedCurrencies: [...convertedCurrencies].sort(),
                quote: { base: quote.base, quote: quote.quote, bid: quote.bid, ask: quote.ask },
                asOf: quote.asOf,
                stale: quote.stale,
              }
            : null,
      };
    },
  };
}
