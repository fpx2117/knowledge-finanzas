"use server";

import { redirect } from "next/navigation";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { onboardingService } from "@/lib/onboarding/onboarding-service.instance";
import { analyticsService, isInternalAccount } from "@/lib/analytics/analytics-service.instance";
import { stepPath } from "../lib/step-path";
import type { TriState } from "../schemas/onboarding-schemas";

export type SaveFinancialContextState = { ok: true } | { ok: false; error: ReturnType<typeof mapErrorToUi> };

function triStateOrNull(formData: FormData, name: string): TriState | null {
  const value = formData.get(name);
  return typeof value === "string" && value ? (value as TriState) : null;
}

// Every question is optional (Domain Rule) — an entirely empty submission is a normal, valid,
// full-step skip, not an error.
export async function saveFinancialContextAction(_previousState: SaveFinancialContextState | null, formData: FormData): Promise<SaveFinancialContextState> {
  let nextStepPath: string;
  let skippedEntirely = false;
  let user;
  try {
    user = await requireCurrentUser();
    const input = {
      incomePattern: triStateOrNull(formData, "incomePattern"),
      usesCreditCards: triStateOrNull(formData, "usesCreditCards"),
      hasDebtDeclared: triStateOrNull(formData, "hasDebtDeclared"),
      hasRecurringExpensesDeclared: triStateOrNull(formData, "hasRecurringExpensesDeclared"),
      usesMultipleAccounts: triStateOrNull(formData, "usesMultipleAccounts"),
      managementStyle: triStateOrNull(formData, "managementStyle"),
    };
    skippedEntirely = Object.values(input).every((value) => value === null);
    const state = await onboardingService.saveFinancialContext(user.id, input);
    nextStepPath = stepPath(state.currentStep);
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }

  await analyticsService(
    skippedEntirely ? "onboarding_step_skipped" : "onboarding_step_completed",
    { step: "FINANCIAL_CONTEXT" },
    { userId: user.id, internal: isInternalAccount(user.email) },
  );

  redirect(nextStepPath);
}
