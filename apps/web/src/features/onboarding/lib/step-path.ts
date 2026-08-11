import { ONBOARDING_STEPS, type OnboardingStep } from "../schemas/onboarding-schemas";

const STEP_SLUGS: Record<OnboardingStep, string> = {
  WELCOME: "welcome",
  BASIC_PROFILE: "basic-profile",
  GOAL: "goal",
  FINANCIAL_CONTEXT: "financial-context",
  STATISTICAL_PROFILE: "statistical-profile",
  PRIVACY_CONSENT: "privacy-consent",
};

const SLUG_TO_STEP = Object.fromEntries(Object.entries(STEP_SLUGS).map(([step, slug]) => [slug, step])) as Record<string, OnboardingStep>;

export function stepPath(step: OnboardingStep): string {
  return `/onboarding/${STEP_SLUGS[step]}`;
}

export function stepFromSlug(slug: string): OnboardingStep | undefined {
  return SLUG_TO_STEP[slug];
}

export { ONBOARDING_STEPS };
