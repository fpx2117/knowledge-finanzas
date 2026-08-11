"use server";

import { redirect } from "next/navigation";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { CURRENT_POLICY_VERSION, updateAnalyticsConsent } from "@/lib/privacy/analytics-consent.instance";
import { onboardingService } from "@/lib/onboarding/onboarding-service.instance";
import { analyticsService, isInternalAccount } from "@/lib/analytics/analytics-service.instance";
import { ONBOARDING_VERSION } from "../schemas/onboarding-schemas";

export type SavePrivacyConsentStepState = { ok: true } | { ok: false; error: ReturnType<typeof mapErrorToUi> };

// Calls TASK-062's UpdateAnalyticsConsent directly (Implementation Notes) — only grants a purpose
// the user explicitly checked; an unchecked box is left at its default (no consent), never
// written as an explicit WITHDRAW (nothing to withdraw from). This is also the last onboarding
// step, so a successful submit completes onboarding in the same action.
export async function savePrivacyConsentStepAction(_previousState: SavePrivacyConsentStepState | null, formData: FormData): Promise<SavePrivacyConsentStepState> {
  try {
    const user = await requireCurrentUser();

    if (formData.get("productAnalytics") === "on") {
      await updateAnalyticsConsent({ userId: user.id, purpose: "PRODUCT_ANALYTICS", action: "GRANT", policyVersion: CURRENT_POLICY_VERSION });
    }
    if (formData.get("externalAggregatedStatistics") === "on") {
      await updateAnalyticsConsent({ userId: user.id, purpose: "EXTERNAL_AGGREGATED_STATISTICS", action: "GRANT", policyVersion: CURRENT_POLICY_VERSION });
    }

    await onboardingService.completeOnboarding(user.id);
    await analyticsService(
      "onboarding_completed",
      { version: ONBOARDING_VERSION },
      { eventId: `onboarding_completed:${user.id}`, userId: user.id, internal: isInternalAccount(user.email) },
    );
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }

  redirect("/dashboard");
}
