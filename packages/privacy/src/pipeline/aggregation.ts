// Nearest-rank percentile (simple, deterministic, no interpolation) — sufficient for internal
// threshold-suppressed aggregates; this task explicitly excludes more elaborate statistical
// tooling (Out of Scope: "differential privacy, k-anonymity tooling beyond simple threshold
// suppression").
function percentile(sortedValues: number[], p: number): number {
  const index = Math.ceil((p / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))];
}

export type CohortAggregateStats = {
  cohortSize: number;
  median: number;
  p25: number;
  p75: number;
};

export function computeCohortStats(values: number[]): CohortAggregateStats {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    cohortSize: sorted.length,
    median: percentile(sorted, 50),
    p25: percentile(sorted, 25),
    p75: percentile(sorted, 75),
  };
}
