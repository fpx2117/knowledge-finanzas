"use client";

import { useActionState } from "react";

import { startProCheckoutAction } from "../actions/start-pro-checkout";

export function ProCheckoutForm() {
  const [state, formAction, pending] = useActionState(startProCheckoutAction, null);

  return (
    <form action={formAction}>
      <button className="secondary-button" type="submit" disabled={pending}>
        {pending ? "Redirigiendo..." : "Comenzar con Pro"}
      </button>
      {state?.ok === false && (
        <div className="form-alert" role="alert">
          <strong>{state.error.message}</strong>
        </div>
      )}
    </form>
  );
}
