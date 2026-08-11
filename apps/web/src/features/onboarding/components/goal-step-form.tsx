"use client";

import { useActionState } from "react";
import { FINANCIAL_GOALS } from "../schemas/onboarding-schemas";
import { saveGoalAction, type SaveGoalState } from "../actions/save-goal";

const GOAL_LABEL: Record<string, string> = {
  CONTROL_SPENDING: "Controlar mis gastos",
  ORGANIZE_FINANCES: "Organizar mis finanzas",
  PAY_OFF_DEBT: "Pagar deudas",
  SAVE_MORE: "Ahorrar más",
  BUILD_EMERGENCY_FUND: "Armar un fondo de emergencia",
  PLAN_EXPENSES: "Planificar gastos futuros",
  TRACK_RECURRING_EXPENSES: "Seguir mis gastos recurrentes",
  UNDERSTAND_CASHFLOW: "Entender mi flujo de caja",
  OTHER: "Otro",
};

export function GoalStepForm() {
  const [state, formAction, pending] = useActionState<SaveGoalState | null, FormData>(saveGoalAction, null);

  return (
    <form action={formAction}>
      <div className="field-group">
        <label htmlFor="onboarding-primary-goal">Tu objetivo principal</label>
        <select id="onboarding-primary-goal" name="primaryGoal" required>
          {FINANCIAL_GOALS.map((goal) => <option key={goal} value={goal}>{GOAL_LABEL[goal]}</option>)}
        </select>
      </div>
      <fieldset className="field-group">
        <legend>Objetivos secundarios <span className="optional-label">(opcional, hasta 2)</span></legend>
        {FINANCIAL_GOALS.map((goal) => (
          <label key={goal} style={{ display: "block" }}>
            <input type="checkbox" name="secondaryGoals" value={goal} /> {GOAL_LABEL[goal]}
          </label>
        ))}
      </fieldset>

      {state?.ok === false && (
        <div className="form-alert" role="alert">
          <strong>{state.error.message}</strong>
        </div>
      )}

      <button className="primary-button" type="submit" disabled={pending}>
        {pending ? "Guardando..." : "Continuar"}
      </button>
    </form>
  );
}
