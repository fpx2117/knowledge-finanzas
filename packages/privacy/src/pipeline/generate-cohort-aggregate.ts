import { bucketCohortSize, cohortKeyToString, type CohortKey } from "./generalization";
import { computeCohortStats } from "./aggregation";
import { DEFAULT_MIN_EXTERNAL_COHORT_SIZE, isCohortSuppressed } from "./suppression";

export const COHORT_AGGREGATE_PRIVACY_VERSION = "cohort-aggregate:v1";

// Deliberately takes already-fetched, already-eligibility-filtered inputs rather than querying
// anything itself — packages/privacy stays decoupled from packages/db (same pattern every other
// domain package in this codebase follows). The caller (apps/web) is responsible for resolving
// which users are eligible (consent + not internal/test — see eligibility.ts) and deriving their
// metrics (see metric-derivation.ts) before calling this.
export type EligibleUserMetricInput = {
  cohortKey: CohortKey;
  // metricCode -> value; a null/undefined value for a given metric (e.g. zero-income period)
  // is simply excluded from that metric's cohort rather than skewing it toward zero.
  metrics: Partial<Record<string, number | null>>;
};

export type CohortAggregateOutputRow = {
  period: string;
  regionBucket: string;
  ageBucket: string;
  incomeBucket: string;
  employmentBucket: string;
  metricCode: string;
  cohortSizeBucket: string;
  suppressed: boolean;
  // Always null when suppressed — no code path ever computes real stats for a suppressed
  // cohort, let alone returns them (Acceptance Criterion: "never exposed, not even internally").
  medianValue: number | null;
  p25Value: number | null;
  p75Value: number | null;
  privacyVersion: string;
};

export function generateCohortAggregateV1(input: {
  eligibleUsers: EligibleUserMetricInput[];
  period: string;
  minCohortSize?: number;
}): CohortAggregateOutputRow[] {
  const minCohortSize = input.minCohortSize ?? DEFAULT_MIN_EXTERNAL_COHORT_SIZE;

  const groups = new Map<string, number[]>();
  for (const user of input.eligibleUsers) {
    const cohortKeyStr = cohortKeyToString(user.cohortKey);
    for (const [metricCode, value] of Object.entries(user.metrics)) {
      if (value == null || Number.isNaN(value)) continue;
      const groupKey = `${cohortKeyStr}::${metricCode}`;
      const existing = groups.get(groupKey);
      if (existing) existing.push(value);
      else groups.set(groupKey, [value]);
    }
  }

  const rows: CohortAggregateOutputRow[] = [];
  for (const [groupKey, values] of groups) {
    const [cohortKeyStr, metricCode] = groupKey.split("::");
    const [regionBucket, ageBucket, incomeBucket, employmentBucket] = cohortKeyStr.split("|");
    const stats = computeCohortStats(values);
    const suppressed = isCohortSuppressed(stats.cohortSize, minCohortSize);

    rows.push({
      period: input.period,
      regionBucket,
      ageBucket,
      incomeBucket,
      employmentBucket,
      metricCode,
      cohortSizeBucket: bucketCohortSize(stats.cohortSize),
      suppressed,
      medianValue: suppressed ? null : stats.median,
      p25Value: suppressed ? null : stats.p25,
      p75Value: suppressed ? null : stats.p75,
      privacyVersion: COHORT_AGGREGATE_PRIVACY_VERSION,
    });
  }

  return rows;
}
