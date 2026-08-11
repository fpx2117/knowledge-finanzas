"use server";

import { redirect } from "next/navigation";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { onboardingService } from "@/lib/onboarding/onboarding-service.instance";
import { analyticsService, isInternalAccount } from "@/lib/analytics/analytics-service.instance";
import { stepPath } from "../lib/step-path";
import type { FinancialGoal } from "../schemas/onboarding-schemas";

export type SaveGoalState = { ok: true } | { ok: false; error: ReturnType<typeof mapErrorToUi> };

export async function saveGoalAction(_previousState: SaveGoalState | null, formData: FormData): Promise<SaveGoalState> {
  let nextStepPath: string;
  try {
    const user = await requireCurrentUser();
    const secondaryGoals = formData.getAll("secondaryGoals").map(String).filter(Boolean) as FinancialGoal[];
    const state = await onboardingService.saveGoal(user.id, {
      primaryGoal: String(formData.get("primaryGoal") ?? "") as FinancialGoal,
      secondaryGoals: secondaryGoals.length > 0 ? secondaryGoals : undefined,
    });
    await analyticsService("onboarding_step_completed", { step: "GOAL" }, { userId: user.id, internal: isInternalAccount(user.email) });
    nextStepPath = stepPath(state.currentStep);
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }

  redirect(nextStepPath);
}
