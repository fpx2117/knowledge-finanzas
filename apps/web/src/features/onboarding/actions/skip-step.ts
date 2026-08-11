"use server";

import { redirect } from "next/navigation";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { onboardingService } from "@/lib/onboarding/onboarding-service.instance";
import { analyticsService, isInternalAccount } from "@/lib/analytics/analytics-service.instance";
import { stepPath } from "../lib/step-path";
import type { OnboardingStep } from "../schemas/onboarding-schemas";

// The one action every truly-optional step's "skip"/"ahora no" control posts to — never writes
// any profile data, only advances the step pointer (Domain Rule: "skipping never blocks
// progression").
export async function skipOnboardingStepAction(step: OnboardingStep) {
  const user = await requireCurrentUser();
  const state = await onboardingService.skipOrCompleteStep(user.id, step);
  await analyticsService("onboarding_step_skipped", { step }, { userId: user.id, internal: isInternalAccount(user.email) });
  redirect(stepPath(state.currentStep));
}
