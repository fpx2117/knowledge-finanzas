import {
  calculateAssetAccountBalance,
  calculateCashflow,
  calculateSpendable,
  monthRangeForTimezone,
  Money,
  todayInTimezone,
} from "@know-finanzas/finance";

type AccountType = "CASH" | "BANK" | "DIGITAL_WALLET" | "SAVINGS";
type EntityStatus = "ACTIVE" | "ARCHIVED";

type BalanceRow = {
  account: {
    id: string;
    name: string;
    type: AccountType;
    currencyCode: string;
    openingBalance: string;
    status: EntityStatus;
  };
  incomeTotal: string;
  expenseTotal: string;
  refundTotal?: string;
  adjustmentInTotal?: string;
  adjustmentOutTotal?: string;
  liabilityPaymentTotal?: string;
};

type DebtInputRow = {
  debt: { id: string; name: string; currencyCode: string; status: string };
  installment: { id: string; dueDate: string; installmentNumber: number; totalAmount: string; status: string };
  allocatedAmount: string;
};

type ScheduledRow = {
  id: string;
  scheduledDate: string;
  type: string;
  expectedAmount: string;
  currencyCode: string;
  description: string;
};

type Dependencies = {
  balances: {
    getAccountBalancesForUser(
      userId: string,
      options?: { asOf?: Date },
    ): Promise<BalanceRow[]>;
  };
  monthly: {
    getMonthlyIncomeExpense(
      userId: string,
      range: { from: Date; to: Date },
    ): Promise<Array<{ currencyCode: string; incomeTotal: string; expenseTotal: string; netExpense?: string }>>;
  };
  activity: {
    listRecentActivity(
      userId: string,
      options?: { limit?: number; includeVoided?: boolean },
    ): Promise<Array<Record<string, unknown>>>;
  };
  debts: { listDebtInputsForUser(userId: string): Promise<DebtInputRow[]> };
  scheduled: {
    listScheduledForUser(userId: string, range: { from: string; to: string }): Promise<ScheduledRow[]>;
  };
};

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function buildDebtSummary(rows: DebtInputRow[]) {
  const totals = new Map<string, Money>();
  for (const row of rows) {
    if (row.installment.status === "PAID" || row.installment.status === "CANCELLED" || row.debt.status === "CANCELLED") {
      continue;
    }
    const remaining = Money.fromString(row.installment.totalAmount, row.debt.currencyCode).subtract(
      Money.fromString(row.allocatedAmount, row.debt.currencyCode),
    );
    const current = totals.get(row.debt.currencyCode) ?? Money.zero(row.debt.currencyCode);
    totals.set(row.debt.currencyCode, current.add(remaining));
  }
  return [...totals.entries()].map(([currencyCode, remaining]) => ({ currencyCode, remaining: remaining.toString() }));
}

export function createDashboardService(dependencies: Dependencies) {
  return {
    async getDashboardSummary(input: { userId: string; timezone: string; now: Date }) {
      const period = monthRangeForTimezone(
        input.now.getUTCFullYear(),
        input.now.getUTCMonth() + 1,
        input.timezone,
      );
      const today = todayInTimezone(input.now, input.timezone);
      const horizonEnd = addDays(today, 29);

      const [balanceRows, monthlyRows, recentActivity, debtRows, scheduledRows] = await Promise.all([
        dependencies.balances.getAccountBalancesForUser(input.userId, { asOf: input.now }),
        dependencies.monthly.getMonthlyIncomeExpense(input.userId, { from: period.start, to: period.end }),
        dependencies.activity.listRecentActivity(input.userId, { limit: 6, includeVoided: false }),
        dependencies.debts.listDebtInputsForUser(input.userId),
        dependencies.scheduled.listScheduledForUser(input.userId, { from: today, to: addDays(today, 30) }),
      ]);

      const accounts = balanceRows.map((row) => ({
        id: row.account.id,
        name: row.account.name,
        type: row.account.type,
        currencyCode: row.account.currencyCode,
        balance: calculateAssetAccountBalance({
          currency: row.account.currencyCode,
          openingBalance: row.account.openingBalance,
          incomeTotal: row.incomeTotal,
          expenseTotal: row.expenseTotal,
          refundTotal: row.refundTotal,
          adjustmentInTotal: row.adjustmentInTotal,
          adjustmentOutTotal: row.adjustmentOutTotal,
          liabilityPaymentTotal: row.liabilityPaymentTotal,
        }).toString(),
        status: row.account.status,
      }));

      const totals = new Map<string, Money>();
      for (const account of accounts) {
        const current = totals.get(account.currencyCode);
        const value = Money.fromString(account.balance, account.currencyCode);
        totals.set(account.currencyCode, current ? current.add(value) : value);
      }

      const debt = buildDebtSummary(debtRows);

      const projectionCurrencies = new Set<string>([
        ...accounts.map((account) => account.currencyCode),
        ...debt.map((item) => item.currencyCode),
        ...scheduledRows.map((item) => item.currencyCode),
      ]);

      const projections = [...projectionCurrencies].map((currencyCode) => {
        const liquid = totals.get(currencyCode) ?? Money.zero(currencyCode);
        const obligations = debtRows
          .filter(
            (row) =>
              row.debt.currencyCode === currencyCode &&
              row.installment.status !== "PAID" &&
              row.installment.status !== "CANCELLED",
          )
          .map((row) => ({
            sourceId: row.installment.id,
            title: row.debt.name,
            dueDate: row.installment.dueDate,
            remainingAmount: Money.fromString(row.installment.totalAmount, currencyCode).subtract(
              Money.fromString(row.allocatedAmount, currencyCode),
            ),
            isOverdue: row.installment.dueDate < today,
          }));
        const spendable = calculateSpendable({
          currency: currencyCode,
          liquidBalance: liquid,
          horizonStart: today,
          horizonEnd,
          obligations,
        });
        const events = [
          ...obligations.map((item) => ({
            sourceId: item.sourceId,
            sourceType: "DEBT_INSTALLMENT" as const,
            date: item.dueDate,
            direction: "OUTFLOW" as const,
            amount: item.remainingAmount,
            confidence: "COMMITTED" as const,
            title: item.title,
          })),
          ...scheduledRows
            .filter((item) => item.currencyCode === currencyCode)
            .map((item) => ({
              sourceId: item.id,
              sourceType: "SCHEDULED_TRANSACTION" as const,
              date: item.scheduledDate,
              direction: item.type === "INCOME" ? ("INFLOW" as const) : ("OUTFLOW" as const),
              amount: Money.fromString(item.expectedAmount, currencyCode),
              confidence: "EXPECTED" as const,
              title: item.description,
            })),
        ];
        return {
          currencyCode,
          spendable,
          cashflow: calculateCashflow({
            currency: currencyCode,
            startingBalance: liquid,
            horizonStart: today,
            horizonEnd,
            events,
          }),
        };
      });

      const upcomingObligations = debtRows
        .filter((row) => row.installment.status !== "PAID" && row.installment.status !== "CANCELLED")
        .map((row) => ({
          id: row.installment.id,
          title: row.debt.name,
          dueDate: row.installment.dueDate,
          currencyCode: row.debt.currencyCode,
          amount: Money.fromString(row.installment.totalAmount, row.debt.currencyCode)
            .subtract(Money.fromString(row.allocatedAmount, row.debt.currencyCode))
            .toString(),
          isOverdue: row.installment.dueDate < today,
        }))
        .filter((item) => item.dueDate <= addDays(today, 30))
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

      return {
        period: { timezone: input.timezone, from: period.start.toISOString(), to: period.end.toISOString() },
        today,
        accounts,
        liquidBalances: [...totals.entries()].map(([currencyCode, amount]) => ({
          currencyCode,
          total: amount.toString(),
        })),
        monthly: monthlyRows.map((row) => ({
          currencyCode: row.currencyCode,
          income: Money.fromString(row.incomeTotal, row.currencyCode).toString(),
          expense: Money.fromString(row.netExpense ?? row.expenseTotal, row.currencyCode).toString(),
        })),
        debt,
        projections,
        upcomingObligations,
        recentActivity,
      };
    },
  };
}
