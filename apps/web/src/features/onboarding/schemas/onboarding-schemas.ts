import { z } from "zod";

export const ONBOARDING_VERSION = "onboarding:v1";

export const ONBOARDING_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] as const;
export type OnboardingStatus = (typeof ONBOARDING_STATUSES)[number];

// Order matters — resume-at-step and the (not-yet-enforced) routing guard both walk this array.
export const ONBOARDING_STEPS = ["WELCOME", "BASIC_PROFILE", "GOAL", "FINANCIAL_CONTEXT", "STATISTICAL_PROFILE", "PRIVACY_CONSENT"] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export function nextOnboardingStep(step: OnboardingStep): OnboardingStep | null {
  const index = ONBOARDING_STEPS.indexOf(step);
  return ONBOARDING_STEPS[index + 1] ?? null;
}

export const FINANCIAL_GOALS = [
  "CONTROL_SPENDING", "ORGANIZE_FINANCES", "PAY_OFF_DEBT", "SAVE_MORE",
  "BUILD_EMERGENCY_FUND", "PLAN_EXPENSES", "TRACK_RECURRING_EXPENSES", "UNDERSTAND_CASHFLOW", "OTHER",
] as const;
export type FinancialGoal = (typeof FINANCIAL_GOALS)[number];

// Every financial-context question is Sí/No/Prefiero no responder — Domain Rule: "optional
// questions are truly skippable," never a numeric amount.
export const TRI_STATE_VALUES = ["YES", "NO", "PREFER_NOT_TO_SAY"] as const;
export type TriState = (typeof TRI_STATE_VALUES)[number];

const countryCodeSchema = z.string().regex(/^[A-Z]{2}$/, "country must be an ISO 3166-1 alpha-2 code");

// Core mandatory fields per the source doc's fast path: país/moneda/timezone. displayName and
// language are optional (defaulted from signup/browser detection).
export const basicProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(120).optional(),
  country: countryCodeSchema,
  currencyCode: z.string().length(3),
  timezone: z.string().min(1).max(64),
  language: z.string().min(2).max(10).optional(),
});
export type BasicProfileInput = z.infer<typeof basicProfileSchema>;

export const goalSchema = z.object({
  primaryGoal: z.enum(FINANCIAL_GOALS),
  secondaryGoals: z.array(z.enum(FINANCIAL_GOALS)).max(2).optional(),
}).refine((data) => !data.secondaryGoals?.includes(data.primaryGoal), {
  message: "secondaryGoals must not include primaryGoal",
  path: ["secondaryGoals"],
});
export type GoalInput = z.infer<typeof goalSchema>;

// Every field optional/nullable — Domain Rule: "optional questions are truly skippable, skipping
// never blocks progression." Never a raw amount (Scope: "sin montos exactos").
export const financialContextSchema = z.object({
  incomePattern: z.enum(TRI_STATE_VALUES).nullable().optional(),
  usesCreditCards: z.enum(TRI_STATE_VALUES).nullable().optional(),
  hasDebtDeclared: z.enum(TRI_STATE_VALUES).nullable().optional(),
  hasRecurringExpensesDeclared: z.enum(TRI_STATE_VALUES).nullable().optional(),
  usesMultipleAccounts: z.enum(TRI_STATE_VALUES).nullable().optional(),
  managementStyle: z.enum(TRI_STATE_VALUES).nullable().optional(),
});
export type FinancialContextInput = z.infer<typeof financialContextSchema>;
