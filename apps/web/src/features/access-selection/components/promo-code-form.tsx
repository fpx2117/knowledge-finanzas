"use client";

import { useActionState } from "react";

import { redeemAccessPromoAction } from "../actions/redeem-access-promo";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(iso));
}

export function PromoCodeForm() {
  const [state, formAction, pending] = useActionState(redeemAccessPromoAction, null);

  if (state?.ok === true) {
    return (
      <section className="detail-card" role="status">
        <p className="card-label">Código aplicado</p>
        <p className="detail-value">Tenés acceso Pro promocional hasta el {formatDate(state.endsAt)}.</p>
        <a className="primary-button" href="/onboarding/financial-onboarding">Continuar</a>
      </section>
    );
  }

  return (
    <details className="detail-card">
      <summary className="card-label">¿Tenés un código?</summary>
      <form action={formAction}>
        <div className="field-group">
          <label htmlFor="access-promo-code">Código promocional</label>
          <input id="access-promo-code" name="code" type="text" placeholder="CODIGO2026" maxLength={32} autoComplete="off" required disabled={pending} />
        </div>
        <button className="secondary-button" type="submit" disabled={pending}>
          {pending ? "Aplicando..." : "Aplicar código"}
        </button>
      </form>
      {state?.ok === false && (
        <div className="form-alert" role="alert">
          <strong>{state.error.message}</strong>
        </div>
      )}
    </details>
  );
}
