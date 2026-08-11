// A user's data enters a NEW aggregation run only if every one of these holds at run time.
// Withdrawing consent takes effect here — it never retroactively rewrites already-generated
// aggregates (Acceptance Criterion: "existing already-anonymized aggregates are not required to
// be, and are documented as not being, retroactively rebuilt").
export type EligibilityInput = {
  externalAggregatedStatisticsConsentGranted: boolean;
  isInternalOrTestAccount: boolean;
};

export function isEligibleForAggregation(input: EligibilityInput): boolean {
  return input.externalAggregatedStatisticsConsentGranted && !input.isInternalOrTestAccount;
}
