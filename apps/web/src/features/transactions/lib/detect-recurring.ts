// #16 / spec §15 — recurring-expense detection. Pure: given a user's recent posted expenses,
// find groups (same merchant / description + currency) that recur at a regular cadence with a
// stable amount. Deterministic, no AI.

export type RecurringTxn = {
  merchantId: string | null;
  merchant: string | null;
  description: string;
  /** Plain decimal string, e.g. "4599.00". */
  amount: string;
  currencyCode: string;
  /** ISO date, "YYYY-MM-DD". */
  occurredOn: string;
  categoryId: string | null;
};

export type RecurringFrequency = "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";

export type RecurringCandidate = {
  groupKey: string;
  label: string;
  merchantId: string | null;
  frequency: RecurringFrequency;
  typicalAmount: string;
  currencyCode: string;
  categoryId: string | null;
  occurrenceCount: number;
  /** 0–1. */
  confidence: number;
  lastSeenOn: string;
  nextExpectedOn: string;
};

const CADENCE_DAYS: Record<RecurringFrequency, number> = {
  WEEKLY: 7,
  BIWEEKLY: 14,
  MONTHLY: 30,
  QUARTERLY: 91,
  YEARLY: 365,
};

// [min, max] median-interval windows that map to each cadence, widest last.
const CADENCE_WINDOWS: Array<[RecurringFrequency, number, number]> = [
  ["WEEKLY", 5, 10],
  ["BIWEEKLY", 11, 18],
  ["MONTHLY", 24, 38],
  ["QUARTERLY", 78, 104],
  ["YEARLY", 320, 410],
];

function normalizeKey(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function median(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}

function mostCommon<T>(values: T[]): T | null {
  const counts = new Map<T, number>();
  let best: T | null = null;
  let bestCount = 0;
  for (const v of values) {
    const n = (counts.get(v) ?? 0) + 1;
    counts.set(v, n);
    if (n > bestCount) {
      best = v;
      bestCount = n;
    }
  }
  return best;
}

/**
 * Cadence analysis over a date-ordered list. Returns null when the spacing isn't regular
 * enough to call a cadence. Shared by recurring + subscription detection.
 */
export function analyzeCadence(datesSorted: string[]): { frequency: RecurringFrequency; regularity: number } | null {
  if (datesSorted.length < 3) return null;
  const intervals: number[] = [];
  for (let i = 1; i < datesSorted.length; i++) intervals.push(daysBetween(datesSorted[i - 1], datesSorted[i]));
  if (intervals.some((d) => d <= 0)) return null;

  const intervalMean = intervals.reduce((sum, d) => sum + d, 0) / intervals.length;
  const intervalStdev = Math.sqrt(intervals.reduce((sum, d) => sum + (d - intervalMean) ** 2, 0) / intervals.length);
  if (intervalMean > 0 && intervalStdev / intervalMean > 0.35) return null;

  const intervalMedian = median([...intervals].sort((a, b) => a - b));
  const cadenceWindow = CADENCE_WINDOWS.find(([, lo, hi]) => intervalMedian >= lo && intervalMedian <= hi);
  if (!cadenceWindow) return null;
  const frequency = cadenceWindow[0];
  const target = CADENCE_DAYS[frequency];

  const regularity = intervals.filter((d) => Math.abs(d - target) <= target * 0.35).length / intervals.length;
  if (regularity < 0.6) return null;
  return { frequency, regularity };
}

export function cadenceDays(frequency: RecurringFrequency): number {
  return CADENCE_DAYS[frequency];
}

export function addDaysToDate(date: string, days: number): string {
  return addDays(date, days);
}

export function detectRecurringSeries(
  txns: RecurringTxn[],
  options: { minOccurrences?: number; minConfidence?: number; now?: string } = {},
): RecurringCandidate[] {
  const minOccurrences = Math.max(3, options.minOccurrences ?? 3);
  const minConfidence = options.minConfidence ?? 0.5;
  const now = options.now ?? new Date().toISOString().slice(0, 10);

  const groups = new Map<string, RecurringTxn[]>();
  for (const txn of txns) {
    const key = txn.merchantId
      ? `m:${txn.merchantId}|${txn.currencyCode}`
      : `d:${normalizeKey(txn.description)}|${txn.currencyCode}`;
    if (!txn.merchantId && !normalizeKey(txn.description)) continue;
    const bucket = groups.get(key);
    if (bucket) bucket.push(txn);
    else groups.set(key, [txn]);
  }

  const candidates: RecurringCandidate[] = [];

  for (const [key, rows] of groups) {
    if (rows.length < minOccurrences) continue;
    const sorted = [...rows].sort((a, b) => a.occurredOn.localeCompare(b.occurredOn));

    const amounts = sorted.map((r) => Number(r.amount)).filter((n) => Number.isFinite(n) && n > 0);
    if (amounts.length < minOccurrences) continue;
    const amountMedian = median([...amounts].sort((a, b) => a - b));
    const amountSpread = (Math.max(...amounts) - Math.min(...amounts)) / amountMedian;
    if (amountSpread > 0.6) continue;

    const cadence = analyzeCadence(sorted.map((r) => r.occurredOn));
    if (!cadence) continue;
    const { frequency, regularity: regular } = cadence;
    const target = CADENCE_DAYS[frequency];

    const lastSeenOn = sorted[sorted.length - 1].occurredOn;
    // Skip series that have clearly lapsed (no occurrence for > 2 cadences).
    if (daysBetween(lastSeenOn, now) > target * 2.5) continue;

    const occurrenceCount = sorted.length;
    const countScore = Math.min(1, occurrenceCount / 6);
    const spreadScore = 1 - Math.min(1, amountSpread / 0.6);
    const confidence = Number((countScore * 0.4 + regular * 0.35 + spreadScore * 0.25).toFixed(3));
    if (confidence < minConfidence) continue;

    candidates.push({
      groupKey: key.split("|")[0],
      label: mostCommon(sorted.map((r) => r.merchant).filter((m): m is string => Boolean(m))) ??
        mostCommon(sorted.map((r) => r.description.trim())) ??
        sorted[0].description,
      merchantId: sorted[0].merchantId,
      frequency,
      typicalAmount: amountMedian.toFixed(2),
      currencyCode: sorted[0].currencyCode,
      categoryId: mostCommon(sorted.map((r) => r.categoryId).filter((c): c is string => Boolean(c))) ?? null,
      occurrenceCount,
      confidence,
      lastSeenOn,
      nextExpectedOn: addDays(lastSeenOn, target),
    });
  }

  return candidates.sort((a, b) => b.confidence - a.confidence);
}
