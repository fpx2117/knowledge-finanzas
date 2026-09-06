import type { InsightFamily } from "./types";

/**
 * spec 09 §23 — materiality is parametrised per family; never a single fixed monetary
 * threshold. A change is material when BOTH an absolute floor and a relative floor are
 * cleared (so a huge % on tiny amounts, and a tiny % on huge amounts, are both filtered).
 * The absolute floor scales with the user's typical monthly spend when it's known.
 * Threshold comparisons only — not money arithmetic — so plain numbers are fine here.
 */
type MaterialityRule = { minRelative: number; minAbsoluteFractionOfScale: number; minAbsoluteFloor: number };

const RULES: Record<InsightFamily, MaterialityRule> = {
  "INS-SPEND-DELTA": { minRelative: 0.15, minAbsoluteFractionOfScale: 0.03, minAbsoluteFloor: 3000 },
  "INS-SPEND-PACE": { minRelative: 0.15, minAbsoluteFractionOfScale: 0.03, minAbsoluteFloor: 3000 },
  "INS-BUDGET-LIMIT": { minRelative: 0, minAbsoluteFractionOfScale: 0, minAbsoluteFloor: 0 },
  "INS-CASH-RISK": { minRelative: 0, minAbsoluteFractionOfScale: 0, minAbsoluteFloor: 1 },
  "INS-OBL-DUE": { minRelative: 0, minAbsoluteFractionOfScale: 0.02, minAbsoluteFloor: 2000 },
  "INS-REC-AMOUNT": { minRelative: 0.1, minAbsoluteFractionOfScale: 0.01, minAbsoluteFloor: 1000 },
  "INS-REC-DETECT": { minRelative: 0, minAbsoluteFractionOfScale: 0, minAbsoluteFloor: 0 },
  "INS-ANOMALY-AMOUNT": { minRelative: 0.5, minAbsoluteFractionOfScale: 0.05, minAbsoluteFloor: 5000 },
  "INS-GOAL-PACE": { minRelative: 0, minAbsoluteFractionOfScale: 0, minAbsoluteFloor: 0 },
  "INS-DATA-QUALITY": { minRelative: 0, minAbsoluteFractionOfScale: 0, minAbsoluteFloor: 0 },
};

export function assessMateriality(input: {
  family: InsightFamily;
  /** Absolute magnitude of the change/impact, positive decimal string. */
  amount: string;
  /** Relative change 0..1 (e.g. 0.18 for +18%), or null when a ratio isn't meaningful. */
  relativeChange: number | null;
  /** The user's typical monthly spend in this currency, decimal string, or null if unknown. */
  monthlyScale: string | null;
}): { material: boolean; reason: string } {
  const rule = RULES[input.family];
  const amount = Number(input.amount);
  const scale = input.monthlyScale ? Number(input.monthlyScale) : 0;

  const absoluteFloor = Math.max(rule.minAbsoluteFloor, scale > 0 ? scale * rule.minAbsoluteFractionOfScale : 0);

  if (amount < absoluteFloor) {
    return { material: false, reason: `below absolute floor (${absoluteFloor.toFixed(2)})` };
  }
  if (rule.minRelative > 0) {
    if (input.relativeChange === null) {
      return { material: false, reason: "no relative change available for a relative-threshold family" };
    }
    if (Math.abs(input.relativeChange) < rule.minRelative) {
      return { material: false, reason: `below relative floor (${Math.round(rule.minRelative * 100)}%)` };
    }
  }
  return { material: true, reason: "clears absolute and relative floors" };
}
