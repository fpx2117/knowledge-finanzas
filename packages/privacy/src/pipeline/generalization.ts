// Buckets the exact cohort size into a coarse range for display — never the exact count, even
// for cohorts well above the suppression threshold, so exact membership counts can't be inferred
// by diffing successive aggregation runs over time.
const COHORT_SIZE_BUCKETS: Array<{ max: number; label: string }> = [
  { max: 99, label: "<100" },
  { max: 249, label: "100-249" },
  { max: 499, label: "250-499" },
  { max: 999, label: "500-999" },
  { max: 4999, label: "1000-4999" },
  { max: Infinity, label: "5000+" },
];

export function bucketCohortSize(exactSize: number): string {
  return COHORT_SIZE_BUCKETS.find((bucket) => exactSize <= bucket.max)!.label;
}

export type CohortKey = {
  regionBucket: string;
  ageBucket: string;
  incomeBucket: string;
  employmentBucket: string;
};

// Deterministic, order-independent string key for grouping — the statistical-profile fields are
// already the generalized buckets a user picked (self-reported ranges, never raw values), so this
// step is pure composition, not further generalization of the fields themselves.
export function cohortKeyToString(key: CohortKey): string {
  return `${key.regionBucket}|${key.ageBucket}|${key.incomeBucket}|${key.employmentBucket}`;
}
