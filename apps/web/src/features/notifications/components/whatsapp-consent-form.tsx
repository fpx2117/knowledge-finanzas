"use client";

import { useActionState } from "react";
import { whatsappOptInAction, whatsappOptOutAction } from "../actions/whatsapp-consent";

export function WhatsappConsentForm({ optedIn }: { optedIn: boolean }) {
  const [state, formAction, pending] = useActionState(whatsappOptInAction, null);

  if (optedIn) {
    return (
      <form action={whatsappOptOutAction}>
        <p className="card-helper">Recibís avisos de WhatsApp en el número que registraste.</p>
        <button className="text-button" type="submit">Desactivar WhatsApp</button>
      </form>
    );
  }

  return (
    <form action={formAction}>
      <div className="field-group">
        <label htmlFor="whatsapp-phone">Número (formato internacional)</label>
        <input id="whatsapp-phone" name="phoneNumber" placeholder="+5491122334455" />
      </div>
      {state?.ok === false && (
        <div className="form-alert" role="alert">
          <strong>{state.error.message}</strong>
        </div>
      )}
      <button className="secondary-button" type="submit" disabled={pending}>
        {pending ? "Activando..." : "Activar WhatsApp"}
      </button>
    </form>
  );
}
