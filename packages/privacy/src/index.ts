export { PrivacyError, isPrivacyError, privacyErrorCodes, type PrivacyErrorCode } from "./errors";

export {
  AGE_RANGES, EMPLOYMENT_STATUSES, INCOME_RANGES, HOUSEHOLD_SIZE_RANGES,
  REGION_CODE_PATTERN, REGION_CODE_PREFER_NOT_TO_SAY,
  type AgeRange, type EmploymentStatus, type IncomeRange, type HouseholdSizeRange,
  type StatisticalProfileRecord,
} from "./statistical-profile/types";

export {
  createSaveStatisticalProfile, createDismissStatisticalProfilePrompt,
  type SaveStatisticalProfileInput, type StatisticalProfileRepository,
} from "./statistical-profile/save-statistical-profile";

export {
  CONSENT_PURPOSES, CONSENT_STATUSES,
  type ConsentPurpose, type ConsentStatus, type AnalyticsConsentRecord, type AnalyticsConsentHistoryEntry,
} from "./consent/types";

export {
  createUpdateAnalyticsConsent, createGetAnalyticsConsent,
  type AnalyticsConsentRepository,
} from "./consent/update-analytics-consent";

export { isEligibleForAggregation, type EligibilityInput } from "./pipeline/eligibility";
export { deriveFinancialMetrics, type PeriodFinancialTotals, type DerivedFinancialMetrics } from "./pipeline/metric-derivation";
export { bucketCohortSize, cohortKeyToString, type CohortKey } from "./pipeline/generalization";
export { computeCohortStats, type CohortAggregateStats } from "./pipeline/aggregation";
export { DEFAULT_MIN_EXTERNAL_COHORT_SIZE, isCohortSuppressed } from "./pipeline/suppression";
export {
  generateCohortAggregateV1, COHORT_AGGREGATE_PRIVACY_VERSION,
  type EligibleUserMetricInput, type CohortAggregateOutputRow,
} from "./pipeline/generate-cohort-aggregate";
