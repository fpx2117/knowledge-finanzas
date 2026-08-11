import { z } from "zod";
import type { AnalyticsEventDefinition } from "./types";

const onboardingStartedProperties = z.object({
  version: z.string().max(32),
}).strict();

const onboardingStepProperties = z.object({
  step: z.string().max(64),
}).strict();

const onboardingStepSkippedProperties = z.object({
  step: z.string().max(64),
}).strict();

const onboardingCompletedProperties = z.object({
  version: z.string().max(32),
}).strict();

export const onboardingEvents: AnalyticsEventDefinition[] = [
  { name: "onboarding_started", schema: onboardingStartedProperties, critical: true, version: 1 },
  { name: "onboarding_step_viewed", schema: onboardingStepProperties, critical: false, version: 1 },
  { name: "onboarding_step_completed", schema: onboardingStepProperties, critical: false, version: 1 },
  { name: "onboarding_step_skipped", schema: onboardingStepSkippedProperties, critical: false, version: 1 },
  { name: "onboarding_completed", schema: onboardingCompletedProperties, critical: true, version: 1 },
];
