"use client";

import { useActionState, useEffect, useState } from "react";
import { saveBasicProfileAction, type SaveBasicProfileState } from "../actions/save-basic-profile";

const COMMON_CURRENCIES = ["ARS", "USD", "EUR", "MXN", "CLP", "COP", "BRL"];

export function BasicProfileStepForm() {
  const [state, formAction, pending] = useActionState<SaveBasicProfileState | null, FormData>(saveBasicProfileAction, null);
  // Auto-detected, then confirmable/editable — Scope: "timezone IANA autodetectada+confirmada."
  const [timezone, setTimezone] = useState("");

  useEffect(() => {
    try {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch {
      setTimezone("UTC");
    }
  }, []);

  return (
    <form action={formAction}>
      <div className="field-group">
        <label htmlFor="onboarding-display-name">Nombre a mostrar <span className="optional-label">(opcional)</span></label>
        <input id="onboarding-display-name" name="displayName" type="text" maxLength={120} />
      </div>
      <div className="field-group">
        <label htmlFor="onboarding-country">País (código de 2 letras)</label>
        <input id="onboarding-country" name="country" type="text" maxLength={2} placeholder="AR" required />
      </div>
      <div className="field-group">
        <label htmlFor="onboarding-currency">Moneda principal</label>
        <select id="onboarding-currency" name="currencyCode" defaultValue="ARS" required>
          {COMMON_CURRENCIES.map((code) => <option key={code} value={code}>{code}</option>)}
        </select>
      </div>
      <div className="field-group">
        <label htmlFor="onboarding-timezone">Zona horaria</label>
        <input id="onboarding-timezone" name="timezone" type="text" value={timezone} onChange={(event) => setTimezone(event.target.value)} required />
        <p className="card-helper">Detectada automáticamente. Confirmala o corregila si hace falta.</p>
      </div>
      <div className="field-group">
        <label htmlFor="onboarding-language">Idioma <span className="optional-label">(opcional)</span></label>
        <select id="onboarding-language" name="language" defaultValue="es">
          <option value="es">Español</option>
          <option value="en">English</option>
          <option value="pt">Português</option>
        </select>
      </div>

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
