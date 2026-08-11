"use client";

import { useActionState } from "react";

import { redeemPromotionCodeAction } from "../actions/redeem-promotion-code";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(iso));
}

// Only ever posts `code` (Security Requirement: redemption input from the client is limited to
// this field) — duration, allowance and the resulting expiry date all come back from the server
// response and are rendered as-is, never computed here.
export function RedeemPromotionCodeForm() {
  const [state, formAction, pending] = useActionState(redeemPromotionCodeAction, null);

  if (state?.ok === true) {
    return (
      <section className="detail-card" role="status">
        <p className="card-label">Código promocional aplicado</p>
        <p className="detail-value">Tenés acceso Pro promocional hasta el {formatDate(state.endsAt)}.</p>
      </section>
    );
  }

  return (
    <section className="detail-card">
      <p className="card-label">¿Tenés un código promocional?</p>
      <form action={formAction}>
        <div className="field-group">
          <label htmlFor="promotion-code">Código promocional</label>
          <input id="promotion-code" name="code" type="text" placeholder="CODIGO2026" maxLength={32} autoComplete="off" required disabled={pending} />
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
    </section>
  );
}
