// Every value set includes PREFER_NOT_TO_SAY and every field is nullable at the schema level
// (Domain Rule: "Statistical Profile != Core Product Requirement" — never required to use the
// product). income_range is a self-reported, currency-agnostic qualitative bucket (not an
// absolute-amount range) since this app supports multiple currencies/regions and there is no
// single meaningful absolute threshold across them.
export const AGE_RANGES = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+", "PREFER_NOT_TO_SAY"] as const;
export type AgeRange = (typeof AGE_RANGES)[number];

export const EMPLOYMENT_STATUSES = [
  "EMPLOYED_FULL_TIME", "EMPLOYED_PART_TIME", "SELF_EMPLOYED", "UNEMPLOYED", "STUDENT", "RETIRED", "OTHER", "PREFER_NOT_TO_SAY",
] as const;
export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number];

export const INCOME_RANGES = ["LOW", "LOWER_MIDDLE", "MIDDLE", "UPPER_MIDDLE", "HIGH", "PREFER_NOT_TO_SAY"] as const;
export type IncomeRange = (typeof INCOME_RANGES)[number];

export const HOUSEHOLD_SIZE_RANGES = ["ONE", "TWO", "THREE_TO_FOUR", "FIVE_PLUS", "PREFER_NOT_TO_SAY"] as const;
export type HouseholdSizeRange = (typeof HOUSEHOLD_SIZE_RANGES)[number];

// ISO 3166-1 alpha-2 country code, or the PREFER_NOT_TO_SAY sentinel — deliberately not scoped
// to a single country's subdivisions so this doesn't overfit to one region.
export const REGION_CODE_PREFER_NOT_TO_SAY = "PREFER_NOT_TO_SAY";
export const REGION_CODE_PATTERN = /^[A-Z]{2}$/;

export type StatisticalProfileRecord = {
  userId: string;
  ageRange: AgeRange | null;
  employmentStatus: EmploymentStatus | null;
  incomeRange: IncomeRange | null;
  householdSizeRange: HouseholdSizeRange | null;
  regionCode: string | null;
  promptDismissedAt: Date | null;
  updatedAt: Date;
};
