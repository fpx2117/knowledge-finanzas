"use server";

import { redirect } from "next/navigation";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { onboardingService } from "@/lib/onboarding/onboarding-service.instance";
import { analyticsService, isInternalAccount } from "@/lib/analytics/analytics-service.instance";
import { stepPath } from "../lib/step-path";

// WELCOME has no data to save or skip — clicking "Comenzar" is a genuine step completion, not an
// optional-question skip (unlike skip-step.ts, which is for STATISTICAL_PROFILE's "ahora no").
export async function advanceWelcomeStepAction() {
  const user = await requireCurrentUser();
  const state = await onboardingService.skipOrCompleteStep(user.id, "WELCOME");
  await analyticsService("onboarding_step_completed", { step: "WELCOME" }, { userId: user.id, internal: isInternalAccount(user.email) });
  redirect(stepPath(state.currentStep));
}
