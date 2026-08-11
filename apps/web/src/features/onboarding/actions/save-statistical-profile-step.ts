"use server";

import { redirect } from "next/navigation";

import type { SaveStatisticalProfileInput } from "@know-finanzas/privacy";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { saveStatisticalProfile } from "@/lib/privacy/statistical-profile.instance";
import { onboardingService } from "@/lib/onboarding/onboarding-service.instance";
import { analyticsService, isInternalAccount } from "@/lib/analytics/analytics-service.instance";
import { stepPath } from "../lib/step-path";

export type SaveStatisticalProfileStepState = { ok: true } | { ok: false; error: ReturnType<typeof mapErrorToUi> };

function fieldOrNull(formData: FormData, name: string): string | null {
  const value = formData.get(name);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

// Calls TASK-062's SaveStatisticalProfile directly (Implementation Notes: "do not duplicate
// their persistence logic") — this action only additionally advances the onboarding step.
export async function saveStatisticalProfileStepAction(_previousState: SaveStatisticalProfileStepState | null, formData: FormData): Promise<SaveStatisticalProfileStepState> {
  let nextStepPath: string;
  try {
    const user = await requireCurrentUser();
    const input = {
      ageRange: fieldOrNull(formData, "ageRange"),
      employmentStatus: fieldOrNull(formData, "employmentStatus"),
      incomeRange: fieldOrNull(formData, "incomeRange"),
      householdSizeRange: fieldOrNull(formData, "householdSizeRange"),
      regionCode: fieldOrNull(formData, "regionCode"),
    } as SaveStatisticalProfileInput;
    await saveStatisticalProfile(user.id, input);
    const state = await onboardingService.skipOrCompleteStep(user.id, "STATISTICAL_PROFILE");
    await analyticsService("onboarding_step_completed", { step: "STATISTICAL_PROFILE" }, { userId: user.id, internal: isInternalAccount(user.email) });
    nextStepPath = stepPath(state.currentStep);
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }

  redirect(nextStepPath);
}
