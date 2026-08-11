"use client";

import { useActionState } from "react";
import { savePrivacyConsentStepAction, type SavePrivacyConsentStepState } from "../actions/save-privacy-consent-step";
import { completeOnboardingAction } from "../actions/complete-onboarding";

// Both checkboxes default unchecked — never pre-checked (no dark patterns). "Continuar sin
// aceptar" and "Guardar y continuar" carry equal visual weight; declining consent here has
// exactly the same effect on onboarding completion as granting it.
export function PrivacyConsentStepForm() {
  const [state, formAction, pending] = useActionState<SavePrivacyConsentStepState | null, FormData>(savePrivacyConsentStepAction, null);

  return (
    <>
      <form action={formAction}>
        <label style={{ display: "block" }}>
          <input type="checkbox" name="productAnalytics" /> Analítica de producto — nos ayuda a entender cómo se usa la app.
        </label>
        <label style={{ display: "block" }}>
          <input type="checkbox" name="externalAggregatedStatistics" /> Estadísticas agregadas externas — habilita, a futuro, que tus datos ya
          anonimizados junto con los de otros usuarios puedan usarse para estadísticas de mercado.
        </label>

        {state?.ok === false && (
          <div className="form-alert" role="alert">
            <strong>{state.error.message}</strong>
          </div>
        )}

        <div className="header-actions">
          <button className="primary-button" type="submit" disabled={pending}>
            {pending ? "Guardando..." : "Guardar y continuar"}
          </button>
        </div>
      </form>
      <form action={completeOnboardingAction}>
        <button className="text-button" type="submit">Continuar sin aceptar</button>
      </form>
    </>
  );
}
