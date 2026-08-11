// Security Requirement: "no raw amounts... in general analytics payloads; amount buckets only
// where genuinely useful." Buckets are deliberately coarse and currency-agnostic (comparing a
// normalized-to-USD-ish order of magnitude would need live FX, which this package has no access
// to) — good enough to see "is this a small or large transaction" without ever persisting the
// real number.
export type AmountBucket = "LOW" | "MEDIUM" | "HIGH";

const LOW_MAX = 50;
const MEDIUM_MAX = 500;

export function bucketAmount(amount: number): AmountBucket {
  if (amount <= LOW_MAX) return "LOW";
  if (amount <= MEDIUM_MAX) return "MEDIUM";
  return "HIGH";
}
