import {
  createUpcomingObligationQueries,
  createTransactionRepository,
  createAccountRepository,
  createTransferRepository,
  db,
} from "@know-finanzas/db";
import { Money, monthRangeForTimezone, todayInTimezone } from "@know-finanzas/finance";

export type CalendarEventKind = "income" | "expense" | "obligation" | "transfer";

/**
 * spec 06 §0.1 / §5 — every calendar event must state *unambiguously* what kind of
 * financial reality it is. `kind` is for grouping/colour; `layer` is the temporal-
 * financial classification the invariant demands.
 *  - CONFIRMED  §5.1 — backed by a posted ledger movement; affects the real balance.
 *  - COMMITTED  §5.2 — a known future obligation; reduces conservative available money, not the balance.
 *  - SCHEDULED  §5.3 — an explicit planned future movement; feeds projection only.
 *  - ESTIMATED  §5.4 — amount or date is uncertain; must be labelled, never shown as fact.
 *  - OVERDUE    §5.5 — a commitment whose date passed and is still unpaid; not a confirmed expense.
 *  - PAID       §5.6 — an obligation resolved by a linked movement.
 */
export type CalendarLayer = "CONFIRMED" | "COMMITTED" | "SCHEDULED" | "ESTIMATED" | "OVERDUE" | "PAID";

export type CalendarEvent = {
  id: string;
  /** YYYY-MM-DD in the user's timezone. */
  date: string;
  kind: CalendarEventKind;
  layer: CalendarLayer;
  title: string;
  /** Positive decimal string. */
  amount: string;
  currencyCode: string;
  /** Convenience: true unless the event is already in the ledger (CONFIRMED / PAID). */
  projected: boolean;
  href?: string;
};

const LEDGER_LAYERS: ReadonlySet<CalendarLayer> = new Set<CalendarLayer>(["CONFIRMED", "PAID"]);

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
    /** §5 layer breakdown, base currency, this month. Confirmed vs committed vs scheduled are kept apart. */
    layers: { confirmedNet: string; committed: string; scheduled: string; overdue: string };
  };
  /** Currencies present among the month's events other than `currencyCode` (§10 — never summed). */
  excludedCurrencies: string[];
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

      const push = (event: Omit<CalendarEvent, "projected">) => {
        events.push({ ...event, projected: !LEDGER_LAYERS.has(event.layer) });
      };

      for (const txn of txnRows) {
        if (txn.status !== "POSTED") continue;
        if (txn.type !== "INCOME" && txn.type !== "EXPENSE") continue;
        push({
          id: `txn-${txn.id}`,
          date: todayInTimezone(txn.occurredAt, input.timezone),
          kind: txn.type === "INCOME" ? "income" : "expense",
          layer: "CONFIRMED",
          title: txn.description,
          amount: Money.fromString(txn.amount, txn.currencyCode).toString(),
          currencyCode: txn.currencyCode,
          href: `/transactions/${txn.id}`,
        });
      }

      for (const row of installmentRows) {
        const remaining = Money.fromString(row.installment.totalAmount, row.debt.currencyCode).subtract(
          Money.fromString(row.allocatedAmount, row.debt.currencyCode),
        );
        const partiallyPaid = Money.fromString(row.allocatedAmount, row.debt.currencyCode).amount.gt(0);
        // §5.5 vencido vs §5.2 comprometido — derived from the date, never persisted.
        const layer: CalendarLayer = row.installment.dueDate < today ? "OVERDUE" : "COMMITTED";
        push({
          id: `debt-${row.installment.id}`,
          date: row.installment.dueDate,
          kind: "obligation",
          layer,
          title:
            `${row.debt.name} · cuota ${row.installment.installmentNumber}` + (partiallyPaid ? " (saldo)" : ""),
          amount: remaining.toString(),
          currencyCode: row.debt.currencyCode,
          href: `/obligations/${row.debt.id}`,
        });
      }

      for (const row of scheduledRows) {
        push({
          id: `sched-${row.id}`,
          date: row.scheduledDate,
          kind: row.type === "INCOME" ? "income" : "expense",
          layer: "SCHEDULED",
          title: row.description,
          amount: Money.fromString(row.expectedAmount, row.currencyCode).toString(),
          currencyCode: row.currencyCode,
        });
      }

      for (const transfer of transferRows) {
        const date = todayInTimezone(transfer.occurredAt, input.timezone);
        if (date < fromISO || date >= toISO) continue;
        const from = accountName.get(transfer.fromAccountId) ?? "Cuenta";
        const to = accountName.get(transfer.toAccountId) ?? "Cuenta";
        push({
          id: `xfer-${transfer.id}`,
          date,
          kind: "transfer",
          layer: "CONFIRMED",
          title: `${from} → ${to}`,
          amount: Money.fromString(transfer.amount, transfer.currencyCode).toString(),
          currencyCode: transfer.currencyCode,
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

      // §5 layer breakdown — confirmed reality, committed obligations and planned movements
      // stay in their own buckets (never a single "future balance" number).
      const committed = sum((event) => event.layer === "COMMITTED");
      const overdue = sum((event) => event.layer === "OVERDUE");
      const scheduledOut = sum((event) => event.layer === "SCHEDULED" && event.kind === "expense");
      const scheduledIn = sum((event) => event.layer === "SCHEDULED" && event.kind === "income");

      const excludedCurrencies = [...new Set(events.map((event) => event.currencyCode))]
        .filter((code) => code !== currencyCode)
        .sort();

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
          layers: {
            confirmedNet: net.toString(),
            committed: committed.toString(),
            scheduled: scheduledOut.subtract(scheduledIn).toString(),
            overdue: overdue.toString(),
          },
        },
        excludedCurrencies,
      };
    },
  };
}
