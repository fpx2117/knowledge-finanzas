// spec §20 / §21 — transaction fingerprinting + probabilistic duplicate scoring. Pure.
// Two transactions describing the same real-world event tend to share account, currency,
// amount and a close date; merchant, payment method and any external id sharpen the call.

export type FingerprintInput = {
  merchantId: string | null;
  merchant: string | null;
  amount: string;
  currencyCode: string;
  /** ISO date "YYYY-MM-DD". */
  occurredOn: string;
  accountId: string;
  paymentMethod: string | null;
  /** Bank / import / provider reference, when known. A match here is definitive. */
  externalId?: string | null;
};

function normalizeMerchant(text: string | null): string {
  return (text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function amountCents(amount: string): number {
  return Math.round(Number(amount) * 100);
}

function daysApart(a: string, b: string): number {
  return Math.abs(Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86_400_000));
}

/**
 * A stable coarse key: transactions with the same fingerprint are near-certain duplicates.
 * Same account + currency + exact amount + same day + same merchant identity.
 */
export function transactionFingerprint(t: FingerprintInput): string {
  const merchantKey = t.merchantId ? `m:${t.merchantId}` : `n:${normalizeMerchant(t.merchant)}`;
  return [t.accountId, t.currencyCode, amountCents(t.amount), t.occurredOn, merchantKey].join("|");
}

/**
 * Probability (0–1) that `a` and `b` are the same transaction recorded twice.
 * Spec thresholds: ≥ 0.9 near-certain, 0.7–0.9 ask the user, < 0.7 keep separate.
 */
export function duplicateScore(a: FingerprintInput, b: FingerprintInput): number {
  if (a.externalId && b.externalId) return a.externalId === b.externalId ? 1 : 0;

  if (a.accountId !== b.accountId || a.currencyCode !== b.currencyCode) return 0;

  const centsA = amountCents(a.amount);
  const centsB = amountCents(b.amount);
  const amountEqual = centsA === centsB;
  // "Close" only covers rounding / fx noise — a real duplicate is almost always exact.
  const amountClose = Math.abs(centsA - centsB) <= Math.min(100, Math.round(Math.max(centsA, centsB) * 0.001));
  if (!amountEqual && !amountClose) return 0;

  let score = amountEqual ? 0.5 : 0.4;

  const gap = daysApart(a.occurredOn, b.occurredOn);
  score += gap === 0 ? 0.3 : gap <= 3 ? 0.08 : gap <= 7 ? 0.03 : -0.1;

  if (a.merchantId && b.merchantId) {
    score += a.merchantId === b.merchantId ? 0.2 : -0.25;
  } else {
    const ma = normalizeMerchant(a.merchant);
    const mb = normalizeMerchant(b.merchant);
    if (ma && mb) {
      const overlaps = ma === mb || ma.includes(mb) || mb.includes(ma);
      score += overlaps ? 0.15 : -0.1;
    }
  }

  if (a.paymentMethod && b.paymentMethod && a.paymentMethod === b.paymentMethod) score += 0.05;

  return Math.max(0, Math.min(1, Number(score.toFixed(3))));
}

export const DUPLICATE_BLOCK_THRESHOLD = 0.85;
export const DUPLICATE_REVIEW_THRESHOLD = 0.7;
