"use client";

import { useActionState } from "react";

import { refreshSubscriptionAction } from "../actions/refresh-subscription";

export function RefreshSubscriptionButton({ subscriptionId }: { subscriptionId: string }) {
  const [state, formAction, pending] = useActionState(refreshSubscriptionAction, null);

  return (
    <form action={formAction}>
      <input type="hidden" name="subscriptionId" value={subscriptionId} />
      {state?.ok === false && (
        <div className="form-alert" role="alert">
          <strong>{state.error.message}</strong>
        </div>
      )}
      <button className="text-button" type="submit" disabled={pending}>
        {pending ? "Actualizando..." : "Actualizar estado"}
      </button>
    </form>
  );
}
