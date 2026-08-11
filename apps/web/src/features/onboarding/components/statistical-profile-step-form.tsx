"use client";

import { useActionState } from "react";
import { AGE_RANGES, EMPLOYMENT_STATUSES, HOUSEHOLD_SIZE_RANGES, INCOME_RANGES } from "@know-finanzas/privacy";
import { saveStatisticalProfileStepAction, type SaveStatisticalProfileStepState } from "../actions/save-statistical-profile-step";
import { skipOnboardingStepAction } from "../actions/skip-step";

const advanceBySkipping = skipOnboardingStepAction.bind(null, "STATISTICAL_PROFILE");

// Thin UI wrapper that calls TASK-062's SaveStatisticalProfile directly — every field defaults to
// unanswered, and the whole step is skippable via a second, equally-weighted form (no dark
// patterns: skip and continue are the same visual weight).
export function StatisticalProfileStepForm() {
  const [state, formAction, pending] = useActionState<SaveStatisticalProfileStepState | null, FormData>(saveStatisticalProfileStepAction, null);

  return (
    <>
      <form action={formAction}>
        <div className="field-group">
          <label htmlFor="onboarding-age-range">Rango de edad</label>
          <select id="onboarding-age-range" name="ageRange" defaultValue="">
            <option value="">Sin responder</option>
            {AGE_RANGES.filter((value) => value !== "PREFER_NOT_TO_SAY").map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>
        <div className="field-group">
          <label htmlFor="onboarding-employment-status">Situación laboral</label>
          <select id="onboarding-employment-status" name="employmentStatus" defaultValue="">
            <option value="">Sin responder</option>
            {EMPLOYMENT_STATUSES.filter((value) => value !== "PREFER_NOT_TO_SAY").map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>
        <div className="field-group">
          <label htmlFor="onboarding-income-range">Rango de ingresos</label>
          <select id="onboarding-income-range" name="incomeRange" defaultValue="">
            <option value="">Sin responder</option>
            {INCOME_RANGES.filter((value) => value !== "PREFER_NOT_TO_SAY").map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>
        <div className="field-group">
          <label htmlFor="onboarding-household-size">Tamaño del hogar</label>
          <select id="onboarding-household-size" name="householdSizeRange" defaultValue="">
            <option value="">Sin responder</option>
            {HOUSEHOLD_SIZE_RANGES.filter((value) => value !== "PREFER_NOT_TO_SAY").map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>
        <div className="field-group">
          <label htmlFor="onboarding-region-code">País (código de 2 letras)</label>
          <input id="onboarding-region-code" name="regionCode" type="text" maxLength={2} placeholder="AR" />
        </div>

        {state?.ok === false && (
          <div className="form-alert" role="alert">
            <strong>{state.error.message}</strong>
          </div>
        )}

        <div className="header-actions">
          <button className="primary-button" type="submit" disabled={pending}>
            {pending ? "Guardando..." : "Continuar"}
          </button>
        </div>
      </form>
      <form action={advanceBySkipping}>
        <button className="text-button" type="submit">Ahora no</button>
      </form>
    </>
  );
}
