// spec §16 — subscription detection. A subscription is a merchant-based recurring charge at a
// monthly or yearly cadence; we track its price history so a hike is visible. Shares cadence
// analysis with recurring detection but uses its own amount rule (a subscription's price can
// legitimately jump between stable tiers, which the recurring detector's spread gate rejects).

import { addDaysToDate, analyzeCadence, cadenceDays, type RecurringTxn } from "./detect-recurring";

export type SubscriptionFrequency = "MONTHLY" | "YEARLY";

export type PriceTier = { amount: string; from: string };

export type SubscriptionCandidate = {
  merchantId: string;
  label: string;
  frequency: SubscriptionFrequency;
  currencyCode: string;
  categoryId: string | null;
  currentAmount: string;
  previousAmount: string | null;
  priceHistory: PriceTier[];
  chargeCount: number;
  confidence: number;
  firstChargedOn: string;
  lastChargedOn: string;
  nextExpectedOn: string;
};

const MONTHS_PER_CHARGE: Record<SubscriptionFrequency, number> = { MONTHLY: 1, YEARLY: 12 };

/**
 * Cadence from exactly two charges of a known subscription merchant (`minCharges === 2`). One
 * interval can't establish regularity, so we accept it at a modest confidence when it lands near a
 * monthly or yearly spacing.
 */
function cadenceFromPair(
  sorted: RecurringTxn[],
  minCharges: number,
): { frequency: SubscriptionFrequency; regularity: number } | null {
  if (minCharges > 2 || sorted.length !== 2) return null;
  const gap = (Date.parse(`${sorted[1].occurredOn}T00:00:00Z`) - Date.parse(`${sorted[0].occurredOn}T00:00:00Z`)) / 86_400_000;
  for (const frequency of ["MONTHLY", "YEARLY"] as const) {
    const target = cadenceDays(frequency);
    if (Math.abs(gap - target) <= target * 0.35) return { frequency, regularity: 0.7 };
  }
  return null;
}

/** Monthly / yearly impact of a per-charge price change. */
export function priceChangeImpact(frequency: SubscriptionFrequency, perChargeDelta: number): { monthly: number; yearly: number } {
  const monthly = perChargeDelta / MONTHS_PER_CHARGE[frequency];
  return { monthly, yearly: monthly * 12 };
}

/** Collapse a date-ordered list of charge amounts into price tiers (>2% change starts a tier). */
export function buildPriceHistory(charges: Array<{ amount: string; on: string }>): PriceTier[] {
  const tiers: PriceTier[] = [];
  for (const charge of charges) {
    const amount = Number(charge.amount);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const last = tiers[tiers.length - 1];
    if (!last || Math.abs(amount - Number(last.amount)) / Number(last.amount) > 0.02) {
      tiers.push({ amount: amount.toFixed(2), from: charge.on });
    }
  }
  return tiers;
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

export function detectSubscriptions(
  txns: RecurringTxn[],
  options: { now?: string; lowThresholdMerchantIds?: ReadonlySet<string> } = {},
): SubscriptionCandidate[] {
  const now = options.now ?? new Date().toISOString().slice(0, 10);
  const lowThreshold = options.lowThresholdMerchantIds ?? new Set<string>();
  const groups = new Map<string, RecurringTxn[]>();
  for (const txn of txns) {
    if (!txn.merchantId) continue;
    const key = `${txn.merchantId}|${txn.currencyCode}`;
    const bucket = groups.get(key);
    if (bucket) bucket.push(txn);
    else groups.set(key, [txn]);
  }

  const candidates: SubscriptionCandidate[] = [];

  for (const rows of groups.values()) {
    // Known subscription/streaming merchants are recognised from 2 charges; everyone else needs 3.
    const minCharges = rows[0].merchantId && lowThreshold.has(rows[0].merchantId) ? 2 : 3;
    if (rows.length < minCharges) continue;
    const sorted = [...rows].sort((a, b) => a.occurredOn.localeCompare(b.occurredOn));

    const cadence = analyzeCadence(sorted.map((r) => r.occurredOn)) ?? cadenceFromPair(sorted, minCharges);
    if (!cadence || (cadence.frequency !== "MONTHLY" && cadence.frequency !== "YEARLY")) continue;
    const frequency = cadence.frequency;
    const target = cadenceDays(frequency);

    const lastChargedOn = sorted[sorted.length - 1].occurredOn;
    // Cancelled subscriptions go INACTIVE, not detected — the service handles that; here we
    // just skip long-lapsed ones so they don't reappear as "new".
    const daysSinceLast = Math.round((Date.parse(`${now}T00:00:00Z`) - Date.parse(`${lastChargedOn}T00:00:00Z`)) / 86_400_000);
    if (daysSinceLast > target * 3) continue;

    const priceHistory = buildPriceHistory(sorted.map((r) => ({ amount: r.amount, on: r.occurredOn })));
    if (priceHistory.length === 0) continue;

    // Within-tier stability: each tier's charges must be close to the tier amount, and tiers
    // must be broadly non-decreasing (a subscription price rarely drops).
    const tierAmounts = priceHistory.map((t) => Number(t.amount));
    const drops = tierAmounts.filter((a, i) => i > 0 && a < tierAmounts[i - 1] * 0.9).length;
    if (drops > 1) continue;

    const countScore = Math.min(1, sorted.length / 6);
    const confidence = Number((countScore * 0.4 + cadence.regularity * 0.45 + (priceHistory.length <= 3 ? 0.15 : 0.05)).toFixed(3));
    if (confidence < 0.5) continue;

    candidates.push({
      merchantId: sorted[0].merchantId as string,
      label:
        mostCommon(sorted.map((r) => r.merchant).filter((m): m is string => Boolean(m))) ??
        sorted[0].description.trim(),
      frequency,
      currencyCode: sorted[0].currencyCode,
      categoryId: mostCommon(sorted.map((r) => r.categoryId).filter((c): c is string => Boolean(c))) ?? null,
      currentAmount: priceHistory[priceHistory.length - 1].amount,
      previousAmount: priceHistory.length > 1 ? priceHistory[priceHistory.length - 2].amount : null,
      priceHistory,
      chargeCount: sorted.length,
      confidence,
      firstChargedOn: sorted[0].occurredOn,
      lastChargedOn,
      nextExpectedOn: addDaysToDate(lastChargedOn, target),
    });
  }

  return candidates.sort((a, b) => b.confidence - a.confidence);
}
