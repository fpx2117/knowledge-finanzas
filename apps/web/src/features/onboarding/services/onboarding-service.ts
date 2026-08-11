import {
  basicProfileSchema, financialContextSchema, goalSchema, nextOnboardingStep,
  ONBOARDING_STEPS, ONBOARDING_VERSION,
  type BasicProfileInput, type FinancialContextInput, type GoalInput, type OnboardingStatus, type OnboardingStep,
} from "../schemas/onboarding-schemas";

export type OnboardingState = { status: OnboardingStatus; currentStep: OnboardingStep };

export type OnboardingRepository = {
  findForUser(userId: string): Promise<{ status: string; currentStep: string; startedAt: Date | null; completedAt: Date | null } | undefined>;
  upsertForUser(userId: string, input: { version: string; status: string; currentStep: string; startedAt?: Date | null; completedAt?: Date | null }): Promise<unknown>;
};

export type FinancialProfileRepository = {
  upsertForUser(userId: string, input: {
    primaryGoal?: string | null; secondaryGoals?: string[];
    incomePattern?: string | null; usesCreditCards?: string | null; hasDebtDeclared?: string | null;
    hasRecurringExpensesDeclared?: string | null; usesMultipleAccounts?: string | null; managementStyle?: string | null;
  }): Promise<unknown>;
};

export type UserProfileRepository = {
  updateBasicProfile(userId: string, input: { name?: string; country?: string | null; timezone?: string; baseCurrency?: string; language?: string | null }): Promise<unknown>;
};

// Falls back to the first step for anything not currently a valid step (Error Case: "resume with
// an unknown/removed step falls back to the nearest valid step") — e.g. a stored step from a
// since-removed onboarding:v1 revision.
function normalizeStep(step: string): OnboardingStep {
  return (ONBOARDING_STEPS as readonly string[]).includes(step) ? (step as OnboardingStep) : ONBOARDING_STEPS[0];
}

export function createOnboardingService(dependencies: {
  onboarding: OnboardingRepository;
  financialProfiles: FinancialProfileRepository;
  users: UserProfileRepository;
  now?: () => Date;
}) {
  const now = dependencies.now ?? (() => new Date());

  async function getOnboardingState(userId: string): Promise<OnboardingState> {
    const row = await dependencies.onboarding.findForUser(userId);
    if (!row) return { status: "NOT_STARTED", currentStep: ONBOARDING_STEPS[0] };
    return { status: row.status as OnboardingStatus, currentStep: normalizeStep(row.currentStep) };
  }

  // Idempotent — a second call for a user already IN_PROGRESS/COMPLETED just returns their
  // current state unchanged, exactly the resume behavior (Acceptance Criterion: "resumes at that
  // exact step, not from the beginning").
  async function startOnboarding(userId: string): Promise<OnboardingState> {
    const existing = await dependencies.onboarding.findForUser(userId);
    if (existing) return { status: existing.status as OnboardingStatus, currentStep: normalizeStep(existing.currentStep) };

    await dependencies.onboarding.upsertForUser(userId, {
      version: ONBOARDING_VERSION,
      status: "IN_PROGRESS",
      currentStep: ONBOARDING_STEPS[0],
      startedAt: now(),
    });
    return { status: "IN_PROGRESS", currentStep: ONBOARDING_STEPS[0] };
  }

  async function advance(userId: string, fromStep: OnboardingStep): Promise<OnboardingState> {
    const target = nextOnboardingStep(fromStep) ?? fromStep;
    await dependencies.onboarding.upsertForUser(userId, { version: ONBOARDING_VERSION, status: "IN_PROGRESS", currentStep: target });
    return { status: "IN_PROGRESS", currentStep: target };
  }

  // Only ever writes account configuration (name/country/timezone/currency/language) — Financial
  // Invariant: onboarding never creates/modifies/hides Account/Transaction/Debt/Budget records.
  async function saveBasicProfile(userId: string, input: BasicProfileInput): Promise<OnboardingState> {
    const parsed = basicProfileSchema.parse(input);
    await dependencies.users.updateBasicProfile(userId, {
      name: parsed.displayName,
      country: parsed.country,
      timezone: parsed.timezone,
      baseCurrency: parsed.currencyCode,
      language: parsed.language ?? null,
    });
    return advance(userId, "BASIC_PROFILE");
  }

  async function saveGoal(userId: string, input: GoalInput): Promise<OnboardingState> {
    const parsed = goalSchema.parse(input);
    await dependencies.financialProfiles.upsertForUser(userId, {
      primaryGoal: parsed.primaryGoal,
      secondaryGoals: parsed.secondaryGoals ?? [],
    });
    return advance(userId, "GOAL");
  }

  // Every field is optional/nullable and this never rejects an all-empty submission (Domain
  // Rule: "optional questions are truly skippable").
  async function saveFinancialContext(userId: string, input: FinancialContextInput): Promise<OnboardingState> {
    const parsed = financialContextSchema.parse(input);
    await dependencies.financialProfiles.upsertForUser(userId, {
      incomePattern: parsed.incomePattern ?? null,
      usesCreditCards: parsed.usesCreditCards ?? null,
      hasDebtDeclared: parsed.hasDebtDeclared ?? null,
      hasRecurringExpensesDeclared: parsed.hasRecurringExpensesDeclared ?? null,
      usesMultipleAccounts: parsed.usesMultipleAccounts ?? null,
      managementStyle: parsed.managementStyle ?? null,
    });
    return advance(userId, "FINANCIAL_CONTEXT");
  }

  // Statistical profile / privacy consent steps never write through this service at all — they
  // call TASK-062's SaveStatisticalProfile/UpdateAnalyticsConsent directly (Implementation Notes:
  // "do not duplicate their persistence logic"); this only advances the onboarding step pointer
  // once the UI screen for either has been shown and dismissed (filled in or skipped).
  async function skipOrCompleteStep(userId: string, step: OnboardingStep): Promise<OnboardingState> {
    return advance(userId, step);
  }

  // Never grants product access as a side effect (Financial Invariant) — only flips
  // status/completedAt. `productAccessState` remains whatever it already was; TASK-064 owns
  // the only code path that can ever change it via an explicit user choice.
  async function completeOnboarding(userId: string): Promise<OnboardingState> {
    await dependencies.onboarding.upsertForUser(userId, {
      version: ONBOARDING_VERSION,
      status: "COMPLETED",
      currentStep: ONBOARDING_STEPS[ONBOARDING_STEPS.length - 1],
      completedAt: now(),
    });
    return { status: "COMPLETED", currentStep: ONBOARDING_STEPS[ONBOARDING_STEPS.length - 1] };
  }

  return { getOnboardingState, startOnboarding, saveBasicProfile, saveGoal, saveFinancialContext, skipOrCompleteStep, completeOnboarding };
}
