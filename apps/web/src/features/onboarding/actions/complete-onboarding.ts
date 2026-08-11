"use server";

import { redirect } from "next/navigation";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { onboardingService } from "@/lib/onboarding/onboarding-service.instance";
import { analyticsService, isInternalAccount } from "@/lib/analytics/analytics-service.instance";
import { ONBOARDING_VERSION } from "../schemas/onboarding-schemas";

// PRIVACY_CONSENT is the last onboarding step — reaching it (whether the consent screen was
// filled in or skipped) always ends in COMPLETED. Never grants product access as a side effect
// (Financial Invariant) — productAccessState is untouched here entirely; TASK-064 owns the only
// path that can change it, via an explicit user choice this function never makes on their behalf.
export async function completeOnboardingAction() {
  const user = await requireCurrentUser();
  await onboardingService.completeOnboarding(user.id);
  await analyticsService(
    "onboarding_completed",
    { version: ONBOARDING_VERSION },
    { eventId: `onboarding_completed:${user.id}`, userId: user.id, internal: isInternalAccount(user.email) },
  );
  // TASK-064 (access selection) doesn't exist yet — go straight to the dashboard, matching
  // today's existing post-signup behavior (scope decision, see TASK-063's Notes).
  redirect("/dashboard");
}
