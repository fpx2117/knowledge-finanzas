import { redirect } from "next/navigation";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { onboardingService } from "@/lib/onboarding/onboarding-service.instance";
import { analyticsService, isInternalAccount } from "@/lib/analytics/analytics-service.instance";
import { ONBOARDING_VERSION } from "@/features/onboarding/schemas/onboarding-schemas";
import { stepPath } from "@/features/onboarding/lib/step-path";

// The one entry point every "start onboarding" path funnels through — always lands the user at
// their exact current step (Acceptance Criterion: "resumes at that exact step, not from the
// beginning"). Idempotent to call repeatedly (startOnboarding no-ops for an already
// IN_PROGRESS/COMPLETED user), so this page is also what resuming later hits again.
export default async function OnboardingEntryPage() {
  const user = await requireCurrentUser();
  const wasAlreadyStarted = (await onboardingService.getOnboardingState(user.id)).status !== "NOT_STARTED";

  const state = await onboardingService.startOnboarding(user.id);

  if (!wasAlreadyStarted) {
    await analyticsService(
      "onboarding_started",
      { version: ONBOARDING_VERSION },
      { eventId: `onboarding_started:${user.id}`, userId: user.id, internal: isInternalAccount(user.email) },
    );
  }

  redirect(stepPath(state.currentStep));
}
