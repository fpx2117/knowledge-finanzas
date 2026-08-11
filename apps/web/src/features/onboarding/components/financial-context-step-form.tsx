"use client";

import { useActionState } from "react";
import { saveFinancialContextAction, type SaveFinancialContextState } from "../actions/save-financial-context";

const QUESTIONS: Array<{ name: string; label: string }> = [
  { name: "incomePattern", label: "¿Tenés un ingreso regular (sueldo fijo mensual)?" },
  { name: "usesCreditCards", label: "¿Usás tarjetas de crédito?" },
  { name: "hasDebtDeclared", label: "¿Tenés deudas actualmente?" },
  { name: "hasRecurringExpensesDeclared", label: "¿Tenés gastos recurrentes (suscripciones, alquiler, etc.)?" },
  { name: "usesMultipleAccounts", label: "¿Usás más de una cuenta bancaria?" },
  { name: "managementStyle", label: "¿Llevás un registro detallado de tus gastos?" },
];

// Every question defaults to nothing selected — never pre-checked toward Sí or No (no dark
// patterns), and the whole step can be submitted completely empty (Domain Rule: "optional
// questions are truly skippable"). Never asks for an amount.
export function FinancialContextStepForm() {
  const [state, formAction, pending] = useActionState<SaveFinancialContextState | null, FormData>(saveFinancialContextAction, null);

  return (
    <form action={formAction}>
      {QUESTIONS.map((question) => (
        <fieldset className="field-group" key={question.name}>
          <legend>{question.label}</legend>
          <label><input type="radio" name={question.name} value="YES" /> Sí</label>{" "}
          <label><input type="radio" name={question.name} value="NO" /> No</label>{" "}
          <label><input type="radio" name={question.name} value="PREFER_NOT_TO_SAY" /> Prefiero no responder</label>
        </fieldset>
      ))}

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
