"use client";

import { useActionState } from "react";

import { startTrialAction } from "../actions/start-trial";

export function TrialCtaForm() {
  const [state, formAction, pending] = useActionState(startTrialAction, null);

  return (
    <form action={formAction}>
      <button className="primary-button" type="submit" disabled={pending}>
        {pending ? "Iniciando..." : "Comenzar prueba gratuita"}
      </button>
      {state?.ok === false && (
        <div className="form-alert" role="alert">
          <strong>{state.error.message}</strong>
        </div>
      )}
    </form>
  );
}
