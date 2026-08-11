"use server";

import { redirect } from "next/navigation";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { onboardingService } from "@/lib/onboarding/onboarding-service.instance";
import { analyticsService, isInternalAccount } from "@/lib/analytics/analytics-service.instance";
import { stepPath } from "../lib/step-path";

export type SaveBasicProfileState = { ok: true } | { ok: false; error: ReturnType<typeof mapErrorToUi> };

export async function saveBasicProfileAction(_previousState: SaveBasicProfileState | null, formData: FormData): Promise<SaveBasicProfileState> {
  let user;
  let nextStepPath: string;
  try {
    user = await requireCurrentUser();
    const state = await onboardingService.saveBasicProfile(user.id, {
      displayName: String(formData.get("displayName") ?? "").trim() || undefined,
      country: String(formData.get("country") ?? "").trim().toUpperCase(),
      currencyCode: String(formData.get("currencyCode") ?? "").trim().toUpperCase(),
      timezone: String(formData.get("timezone") ?? "").trim(),
      language: String(formData.get("language") ?? "").trim() || undefined,
    });
    await analyticsService(
      "onboarding_step_completed",
      { step: "BASIC_PROFILE" },
      { userId: user.id, internal: isInternalAccount(user.email) },
    );
    nextStepPath = stepPath(state.currentStep);
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }

  redirect(nextStepPath);
}
