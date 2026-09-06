/** spec 09 §21 — the deterministic detector families. */
export type InsightFamily =
  | "INS-SPEND-DELTA"
  | "INS-SPEND-PACE"
  | "INS-BUDGET-LIMIT"
  | "INS-CASH-RISK"
  | "INS-OBL-DUE"
  | "INS-REC-AMOUNT"
  | "INS-REC-DETECT"
  | "INS-ANOMALY-AMOUNT"
  | "INS-GOAL-PACE"
  | "INS-DATA-QUALITY";

/** spec 09 §17 lifecycle. */
export type InsightStatus =
  | "DETECTED"
  | "ACTIVE"
  | "SEEN"
  | "DISMISSED"
  | "RESOLVED"
  | "EXPIRED"
  | "SUPERSEDED"
  | "INVALIDATED";

/** spec 09 §9.1 — evidence sufficiency. INSUFFICIENT means: do not emit. */
export type EvidenceSufficiency = "INSUFFICIENT" | "LIMITED" | "SUFFICIENT" | "STRONG";

/** spec 09 §10 — user-facing confidence. LOW is not shown in P0. */
export type InsightConfidence = "LOW" | "MEDIUM" | "HIGH";

export type InsightEvidenceSource =
  | "transaction"
  | "budget"
  | "obligation"
  | "goal"
  | "account"
  | "recurrence";

/** spec 09 §9 — the structured evidence a candidate must carry before it can render. */
export type InsightEvidence = {
  sourceTypes: InsightEvidenceSource[];
  sourceIds: string[];
  /** YYYY-MM-DD in the user's timezone. */
  period: { from: string; to: string };
  comparisonPeriod?: { from: string; to: string };
  currency: string;
  /** Named decimal-string metrics that the copy is derived from. */
  metrics: Record<string, string>;
  sampleSize?: number;
  calculationVersion: string;
  dataQualityFlags: string[];
  generatedAt: string;
};

export type InsightCandidate = {
  family: InsightFamily;
  /** Stable within (user, family) for "the same condition this period" — drives dedupe/supersede. */
  dedupeKey: string;
  sufficiency: EvidenceSufficiency;
  confidence: InsightConfidence;
  title: string;
  body: string;
  /** Signed impact if the insight has a monetary magnitude; null otherwise. */
  impactAmount: string | null;
  impactCurrency: string | null;
  cta: { label: string; href: string } | null;
  evidence: InsightEvidence;
};
