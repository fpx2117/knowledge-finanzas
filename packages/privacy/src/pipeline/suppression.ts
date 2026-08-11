// Conservative default per the task's own Scope text. Configurable by whoever wires this
// pipeline at the app layer, but a lower value should require a deliberate decision, not a
// default.
export const DEFAULT_MIN_EXTERNAL_COHORT_SIZE = 100;

// Applied at generation time (not just at some later "export" step) — a suppressed cohort's
// median/p25/p75 are never computed into the output row at all (see generate-cohort-aggregate.ts),
// so there is no code path that could accidentally leak them later.
export function isCohortSuppressed(cohortSize: number, minCohortSize: number = DEFAULT_MIN_EXTERNAL_COHORT_SIZE): boolean {
  return cohortSize < minCohortSize;
}
