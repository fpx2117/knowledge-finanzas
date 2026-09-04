import {
  createUpcomingObligationQueries,
  createTransactionRepository,
  createAccountRepository,
  createTransferRepository,
  db,
} from "@know-finanzas/db";
import { Money, monthRangeForTimezone, todayInTimezone } from "@know-finanzas/finance";

export type CalendarEventKind = "income" | "expense" | "obligation" | "transfer";

export type CalendarEvent = {
  id: string;
  /** YYYY-MM-DD in the user's timezone. */
  date: string;
  kind: CalendarEventKind;
  title: string;
  /** Positive decimal string. */
  amount: string;
  currencyCode: string;
  /** True for scheduled / not-yet-posted movements. */
  projected: boolean;
  href?: string;
};

export type CalendarMonth = {
  period: string;
  today: string;
  currencyCode: string;
  events: CalendarEvent[];
  summary: {
    income: string;
    expense: string;
    net: string;
    projectedNet: string;
    obligationsDue: string;
  };
};

function parsePeriod(period: string | undefined, timezone: string, now: Date): { year: number; month: number; period: string } {
  const match = period && /^\d{4}-(0[1-9]|1[0-2])$/.test(period) ? period : todayInTimezone(now, timezone).slice(0, 7);
  const [year, month] = match.split("-").map(Number);
  return { year, month, period: match };
}

export function createCalendarService(database = db) {
  const obligations = createUpcomingObligationQueries(database);
  const transactions = createTransactionRepository(database);
  const accounts = createAccountRepository(database);
  const transfers = createTransferRepository(database);

  return {
    async getMonth(input: { userId: string; timezone: string; baseCurrency: string; period?: string; now?: Date }): Promise<CalendarMonth> {
      const now = input.now ?? new Date();
      const { year, month, period } = parsePeriod(input.period, input.timezone, now);
      const range = monthRangeForTimezone(year, month, input.timezone);
      const fromISO = `${period}-01`;
      const toISO = `${month === 12 ? year + 1 : year}-${String(month === 12 ? 1 : month + 1).padStart(2, "0")}-01`;
      const today = todayInTimezone(now, input.timezone);

      const [txnRows, accountRows, installmentRows, scheduledRows, transferRows] = await Promise.all([
        transactions.listForUser(input.userId, { from: range.start, to: range.end, limit: 1000 }),
        accounts.listForUser(input.userId, { includeArchived: true }),
        obligations.listDebtInstallmentsForUser(input.userId, { from: fromISO, to: toISO }),
        obligations.listScheduledForUser(input.userId, { from: fromISO, to: toISO }),
        transfers.listForUser(input.userId, { limit: 1000 }),
      ]);

      const accountName = new Map(accountRows.map((account) => [account.id, account.name]));

      const events: CalendarEvent[] = [];

      for (const txn of txnRows) {
        if (txn.status !== "POSTED") continue;
        if (txn.type !== "INCOME" && txn.type !== "EXPENSE") continue;
        events.push({
          id: `txn-${txn.id}`,
          date: todayInTimezone(txn.occurredAt, input.timezone),
          kind: txn.type === "INCOME" ? "income" : "expense",
          title: txn.description,
          amount: Money.fromString(txn.amount, txn.currencyCode).toString(),
          currencyCode: txn.currencyCode,
          projected: false,
          href: `/transactions/${txn.id}`,
        });
      }

      for (const row of installmentRows) {
        const remaining = Money.fromString(row.installment.totalAmount, row.debt.currencyCode).subtract(
          Money.fromString(row.allocatedAmount, row.debt.currencyCode),
        );
        events.push({
          id: `debt-${row.installment.id}`,
          date: row.installment.dueDate,
          kind: "obligation",
          title: `${row.debt.name} · cuota ${row.installment.installmentNumber}`,
          amount: remaining.toString(),
          currencyCode: row.debt.currencyCode,
          projected: true,
          href: `/obligations/${row.debt.id}`,
        });
      }

      for (const row of scheduledRows) {
        events.push({
          id: `sched-${row.id}`,
          date: row.scheduledDate,
          kind: row.type === "INCOME" ? "income" : "expense",
          title: row.description,
          amount: Money.fromString(row.expectedAmount, row.currencyCode).toString(),
          currencyCode: row.currencyCode,
          projected: true,
        });
      }

      for (const transfer of transferRows) {
        const date = todayInTimezone(transfer.occurredAt, input.timezone);
        if (date < fromISO || date >= toISO) continue;
        const from = accountName.get(transfer.fromAccountId) ?? "Cuenta";
        const to = accountName.get(transfer.toAccountId) ?? "Cuenta";
        events.push({
          id: `xfer-${transfer.id}`,
          date,
          kind: "transfer",
          title: `${from} → ${to}`,
          amount: Money.fromString(transfer.amount, transfer.currencyCode).toString(),
          currencyCode: transfer.currencyCode,
          projected: false,
          href: `/transactions/transfers/${transfer.id}`,
        });
      }

      events.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));

      const currencyCode = input.baseCurrency;
      const inBase = (event: CalendarEvent) => event.currencyCode === currencyCode;
      const sum = (predicate: (event: CalendarEvent) => boolean) =>
        events
          .filter((event) => inBase(event) && predicate(event))
          .reduce((total, event) => total.add(Money.fromString(event.amount, currencyCode)), Money.zero(currencyCode));

      const income = sum((event) => event.kind === "income" && !event.projected);
      const expense = sum((event) => event.kind === "expense" && !event.projected);
      const scheduledIncome = sum((event) => event.kind === "income" && event.projected);
      const scheduledExpense = sum((event) => event.kind === "expense" && event.projected);
      const obligationsDue = sum((event) => event.kind === "obligation");
      const net = income.subtract(expense);
      const projectedNet = net.add(scheduledIncome).subtract(scheduledExpense).subtract(obligationsDue);

      return {
        period,
        today,
        currencyCode,
        events,
        summary: {
          income: income.toString(),
          expense: expense.toString(),
          net: net.toString(),
          projectedNet: projectedNet.toString(),
          obligationsDue: obligationsDue.toString(),
        },
      };
    },
  };
}
