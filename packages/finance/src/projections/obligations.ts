import { Money } from "../money/money";
import { formatLocalDate } from "../dates/local-date";

/**
 * Unified obligation read model (spec 05 §6 taxonomy, §10 "Próximas").
 *
 * One deterministic shape for every future commitment regardless of where it
 * comes from — debt installments, detected subscriptions, scheduled movements.
 * The rules that matter:
 *  - §22 / RF-03: currencies are never summed together. Totals are per-currency;
 *    anything outside the base currency is reported as excluded, not merged.
 *  - §10.3: "comprometido confirmado" and "estimado" are never added into one
 *    number. A FIXED/CONFIRMED amount is confirmed; ESTIMATED/VARIABLE is not.
 *  - §14.1: this is a projection. It never posts to the ledger and never counts
 *    an obligation that is already PAID/CANCELLED (the caller's queries exclude
 *    those) — so a paid installment can't be double-counted against available
 *    money.
 *  - dedupe by `${sourceType}:${sourceId}` so the same row can't arrive twice.
 */

export type ObligationSourceType = "DEBT_INSTALLMENT" | "SUBSCRIPTION" | "SCHEDULED_TRANSACTION";
export type ObligationType =
  | "DEBT"
  | "INSTALLMENT_PLAN"
  | "SUBSCRIPTION"
  | "RECURRING_BILL"
  | "ONE_TIME"
  | "OTHER";
/** §6.3. FIXED/CONFIRMED count as "confirmed"; ESTIMATED/VARIABLE do not. */
export type ObligationAmountMode = "FIXED" | "VARIABLE" | "ESTIMATED" | "CONFIRMED";
/** §5.2/§5.3. A debt installment is committed; a detected/planned charge is expected. */
export type ObligationConfidence = "COMMITTED" | "EXPECTED";
export type ObligationSource = "MANUAL" | "RECURRENCE" | "DETECTED" | "IMPORTED" | "SYSTEM_DERIVED";
/** §6.4. DUE_SOON / DUE_TODAY / OVERDUE are derived from the date, never persisted. */
export type ObligationStatus =
  | "UPCOMING"
  | "DUE_SOON"
  | "DUE_TODAY"
  | "OVERDUE"
  | "PARTIALLY_PAID";

export type ObligationInput = {
  sourceType: ObligationSourceType;
  sourceId: string;
  title: string;
  type: ObligationType;
  amountMode: ObligationAmountMode;
  source: ObligationSource;
  confidence: ObligationConfidence;
  currencyCode: string;
  /** Full amount owed this cycle (positive decimal string). */
  amount: string;
  /** Already paid/allocated this cycle; "0" when not applicable. */
  paidAmount: string;
  /** Due date, YYYY-MM-DD in the user's timezone. */
  dueDate: string;
  debtId: string | null;
  accountId: string | null;
  categoryId: string | null;
  installmentNumber: number | null;
  href: string | null;
};

export type DerivedObligation = ObligationInput & {
  remainingAmount: string;
  status: ObligationStatus;
  daysUntilDue: number;
  isOverdue: boolean;
  /** True when the amount is an estimate, not a confirmed figure (§6.3). */
  isEstimated: boolean;
};

export type ObligationCurrencyTotals = {
  currencyCode: string;
  /** Sum of remaining amounts whose amountMode is FIXED or CONFIRMED. */
  confirmed: string;
  /** Sum of remaining amounts whose amountMode is ESTIMATED or VARIABLE. */
  estimated: string;
  count: number;
};

export type ObligationReadModel = {
  today: string;
  horizonDays: number;
  horizonEnd: string;
  baseCurrency: string;
  items: DerivedObligation[];
  /** Per-currency totals. `baseCurrency` first when present. Never a cross-currency sum. */
  totals: ObligationCurrencyTotals[];
  /** Currencies present among the items that are not `baseCurrency` (§22). */
  excludedCurrencies: string[];
  /** Count of items whose amount is an estimate — surface, don't hide (§10.4). */
  estimatedCount: number;
  calculationVersion: 1;
};

const DUE_SOON_WITHIN_DAYS = 7;

function addDaysISO(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return formatLocalDate(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
}

function daysBetweenISO(from: string, to: string): number {
  const a = Date.UTC(Number(from.slice(0, 4)), Number(from.slice(5, 7)) - 1, Number(from.slice(8, 10)));
  const b = Date.UTC(Number(to.slice(0, 4)), Number(to.slice(5, 7)) - 1, Number(to.slice(8, 10)));
  return Math.round((b - a) / 86_400_000);
}

/**
 * Roll a recurring date forward to the first occurrence on or after `today`.
 * Used when a detected subscription's `nextExpectedOn` has gone stale — we want
 * a sane forward projection, not a phantom "overdue" charge from months ago.
 */
export function rollForwardRecurringDate(date: string, frequency: "WEEKLY" | "MONTHLY" | "YEARLY", today: string): string {
  if (date >= today) return date;
  const anchorDay = Number(date.slice(8, 10));
  let year = Number(date.slice(0, 4));
  let month = Number(date.slice(5, 7));
  let current = date;

  for (let guard = 0; current < today && guard < 600; guard += 1) {
    if (frequency === "WEEKLY") {
      current = addDaysISO(current, 7);
      continue;
    }
    if (frequency === "YEARLY") {
      year += 1;
    } else {
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    current = formatLocalDate(year, month, Math.min(anchorDay, lastDay));
  }

  return current;
}

export function isConfirmedAmountMode(mode: ObligationAmountMode): boolean {
  return mode === "FIXED" || mode === "CONFIRMED";
}

export function deriveObligationStatus(input: {
  dueDate: string;
  today: string;
  remaining: Money;
  paid: Money;
}): ObligationStatus {
  const isPaidPartially = input.paid.amount.gt(0) && input.remaining.amount.gt(0);
  if (input.dueDate < input.today) return isPaidPartially ? "PARTIALLY_PAID" : "OVERDUE";
  if (isPaidPartially) return "PARTIALLY_PAID";
  if (input.dueDate === input.today) return "DUE_TODAY";
  if (daysBetweenISO(input.today, input.dueDate) <= DUE_SOON_WITHIN_DAYS) return "DUE_SOON";
  return "UPCOMING";
}

/**
 * Build the derived, sorted, deduped obligation list within `[today, horizonEnd]`.
 * Overdue items are kept (they still affect available money) unless older than
 * `overdueGraceDays` before today.
 */
export function buildObligationList(
  inputs: readonly ObligationInput[],
  options: { today: string; horizonEnd: string; overdueGraceDays?: number },
): DerivedObligation[] {
  const graceStart = addDaysISO(options.today, -(options.overdueGraceDays ?? 90));
  const seen = new Map<string, DerivedObligation>();

  for (const input of inputs) {
    if (input.dueDate > options.horizonEnd) continue;
    if (input.dueDate < graceStart) continue;

    const amount = Money.fromString(input.amount, input.currencyCode);
    const paid = Money.fromString(input.paidAmount, input.currencyCode);
    const remaining = amount.subtract(paid);
    if (remaining.amount.lte(0)) continue;

    const status = deriveObligationStatus({ dueDate: input.dueDate, today: options.today, remaining, paid });

    seen.set(`${input.sourceType}:${input.sourceId}`, {
      ...input,
      remainingAmount: remaining.toString(),
      status,
      daysUntilDue: daysBetweenISO(options.today, input.dueDate),
      isOverdue: input.dueDate < options.today,
      isEstimated: !isConfirmedAmountMode(input.amountMode),
    });
  }

  return [...seen.values()].sort(
    (a, b) => a.dueDate.localeCompare(b.dueDate) || b.sourceType.localeCompare(a.sourceType) || a.sourceId.localeCompare(b.sourceId),
  );
}

export function summariseObligationsByCurrency(
  items: readonly DerivedObligation[],
  baseCurrency: string,
): ObligationCurrencyTotals[] {
  const byCurrency = new Map<string, { confirmed: Money; estimated: Money; count: number }>();

  for (const item of items) {
    const bucket = byCurrency.get(item.currencyCode) ?? {
      confirmed: Money.zero(item.currencyCode),
      estimated: Money.zero(item.currencyCode),
      count: 0,
    };
    const remaining = Money.fromString(item.remainingAmount, item.currencyCode);
    if (item.isEstimated) bucket.estimated = bucket.estimated.add(remaining);
    else bucket.confirmed = bucket.confirmed.add(remaining);
    bucket.count += 1;
    byCurrency.set(item.currencyCode, bucket);
  }

  return [...byCurrency.entries()]
    .map(([currencyCode, bucket]) => ({
      currencyCode,
      confirmed: bucket.confirmed.toString(),
      estimated: bucket.estimated.toString(),
      count: bucket.count,
    }))
    .sort((a, b) =>
      a.currencyCode === baseCurrency ? -1 : b.currencyCode === baseCurrency ? 1 : a.currencyCode.localeCompare(b.currencyCode),
    );
}

export function buildObligationReadModel(
  inputs: readonly ObligationInput[],
  options: { today: string; horizonDays: number; baseCurrency: string; overdueGraceDays?: number },
): ObligationReadModel {
  const horizonEnd = addDaysISO(options.today, options.horizonDays);
  const items = buildObligationList(inputs, { today: options.today, horizonEnd, overdueGraceDays: options.overdueGraceDays });
  const totals = summariseObligationsByCurrency(items, options.baseCurrency);
  const excludedCurrencies = [...new Set(items.map((item) => item.currencyCode))]
    .filter((code) => code !== options.baseCurrency)
    .sort();

  return {
    today: options.today,
    horizonDays: options.horizonDays,
    horizonEnd,
    baseCurrency: options.baseCurrency,
    items,
    totals,
    excludedCurrencies,
    estimatedCount: items.filter((item) => item.isEstimated).length,
    calculationVersion: 1,
  };
}
