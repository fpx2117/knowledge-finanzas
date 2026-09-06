import type { InsightCandidate, InsightConfidence, InsightFamily } from "./types";

/**
 * spec 09 §8 — priority is derived from visible, auditable factors, never a single opaque
 * score. Urgency (family), confidence and monetary impact combine; ties break by family order.
 */
const FAMILY_URGENCY: Record<InsightFamily, number> = {
  "INS-CASH-RISK": 100,
  "INS-OBL-DUE": 80,
  "INS-BUDGET-LIMIT": 70,
  "INS-ANOMALY-AMOUNT": 65,
  "INS-GOAL-PACE": 50,
  "INS-SPEND-PACE": 45,
  "INS-SPEND-DELTA": 40,
  "INS-REC-AMOUNT": 40,
  "INS-DATA-QUALITY": 30,
  "INS-REC-DETECT": 20,
};

const CONFIDENCE_WEIGHT: Record<InsightConfidence, number> = { HIGH: 1, MEDIUM: 0.75, LOW: 0.4 };

export function insightPriorityScore(candidate: {
  family: InsightFamily;
  confidence: InsightConfidence;
  impactAmount: string | null;
  monthlyScale: string | null;
}): number {
  const urgency = FAMILY_URGENCY[candidate.family];
  const impact = candidate.impactAmount ? Math.abs(Number(candidate.impactAmount)) : 0;
  const scale = candidate.monthlyScale ? Number(candidate.monthlyScale) : 0;
  const impactRatio = scale > 0 ? Math.min(1, impact / scale) : impact > 0 ? 0.5 : 0;
  return Math.round((urgency + impactRatio * 30) * CONFIDENCE_WEIGHT[candidate.confidence]);
}

export function sortByPriority<T extends Pick<InsightCandidate, "family" | "confidence" | "impactAmount">>(
  items: readonly (T & { monthlyScale?: string | null })[],
): T[] {
  return [...items].sort(
    (a, b) =>
      insightPriorityScore({ ...b, monthlyScale: b.monthlyScale ?? null }) -
        insightPriorityScore({ ...a, monthlyScale: a.monthlyScale ?? null }) ||
      FAMILY_URGENCY[b.family] - FAMILY_URGENCY[a.family],
  );
}
