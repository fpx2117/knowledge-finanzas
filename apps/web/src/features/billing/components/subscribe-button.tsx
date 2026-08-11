"use client";

import { useActionState } from "react";

import { startSubscriptionAction } from "../actions/start-subscription";

export function SubscribeButton() {
  const [state, formAction, pending] = useActionState(startSubscriptionAction, null);

  return (
    <form action={formAction}>
      {state?.ok === false && (
        <div className="form-alert" role="alert">
          <strong>{state.error.message}</strong>
        </div>
      )}
      <button className="primary-button" type="submit" disabled={pending}>
        {pending ? "Redirigiendo..." : "Suscribirme a Pro"}
      </button>
    </form>
  );
}
