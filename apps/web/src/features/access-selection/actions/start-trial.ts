"use server";

import { redirect } from "next/navigation";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { onboardingService } from "@/lib/onboarding/onboarding-service.instance";
import { startTrial } from "@/lib/billing/start-trial.instance";
import { analyticsService, isInternalAccount } from "@/lib/analytics/analytics-service.instance";
import { mapBillingActionErrorToUi } from "@/features/billing/lib/map-billing-error";

export type StartTrialActionState =
  | { ok: true }
  | { ok: false; error: ReturnType<typeof mapBillingActionErrorToUi> };

// The form has no fields — userId/onboarding status are always resolved server-side (Security
// Requirement), never trusted from the client.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function startTrialAction(_previousState: StartTrialActionState | null, _formData: FormData): Promise<StartTrialActionState> {
  // Outside the try/catch: redirect() throws a special Next.js control-flow signal that must
  // never be swallowed by a generic catch block.
  const user = await requireCurrentUser();
  const onboardingState = await onboardingService.getOnboardingState(user.id);
  if (onboardingState.status !== "COMPLETED") {
    redirect("/onboarding");
  }

  try {
    const internal = isInternalAccount(user.email);
    await analyticsService("trial_selected", {}, { userId: user.id, internal });

    const result = await startTrial({ userId: user.id });

    if (result.wasJustStarted) {
      await analyticsService(
        "trial_started",
        { trialEndsAt: result.trialEndsAt.toISOString() },
        { eventId: `trial_started:${user.id}`, userId: user.id, internal },
      );
      await analyticsService(
        "access_activated",
        { source: "TRIAL" },
        { eventId: `access_activated:${user.id}`, userId: user.id, internal },
      );
    }
  } catch (error) {
    return { ok: false, error: mapBillingActionErrorToUi(error) };
  }

  redirect("/onboarding/financial-onboarding");
}
