"use client";

import { useActionState } from "react";
import type { UpdateAnalyticsConsentState } from "../actions/update-consent";

function formatDate(value: Date | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric" }).format(value);
}

// Deliberately symmetric: the grant and withdraw buttons are the same visual weight (both
// "secondary-button") — Security Requirement: "no oversized accept button, no hidden decline."
export function ConsentToggle({
  title,
  description,
  granted,
  grantedAt,
  policyVersion,
  onGrant,
  onWithdraw,
}: {
  title: string;
  description: string;
  granted: boolean;
  grantedAt: Date | null;
  policyVersion: string;
  onGrant: () => Promise<UpdateAnalyticsConsentState>;
  onWithdraw: () => Promise<UpdateAnalyticsConsentState>;
}) {
  const [grantState, grantAction, grantPending] = useActionState<UpdateAnalyticsConsentState | null, FormData>(() => onGrant(), null);
  const [withdrawState, withdrawAction, withdrawPending] = useActionState<UpdateAnalyticsConsentState | null, FormData>(() => onWithdraw(), null);

  const state = granted ? withdrawState : grantState;

  return (
    <div className="detail-card">
      <p className="card-label">{title}</p>
      <p className="card-helper">{description}</p>
      <p className="card-helper">
        Estado: <strong>{granted ? "Otorgado" : "No otorgado"}</strong>
        {granted && grantedAt && <> · desde el {formatDate(grantedAt)}</>}
        {" "}· versión de política {policyVersion}
      </p>
      {state?.ok === false && (
        <div className="form-alert" role="alert">
          <strong>{state.error.message}</strong>
        </div>
      )}
      {granted ? (
        <form action={withdrawAction}>
          <button className="secondary-button" type="submit" disabled={withdrawPending}>
            {withdrawPending ? "Retirando..." : "Retirar consentimiento"}
          </button>
        </form>
      ) : (
        <form action={grantAction}>
          <button className="secondary-button" type="submit" disabled={grantPending}>
            {grantPending ? "Otorgando..." : "Otorgar consentimiento"}
          </button>
        </form>
      )}
    </div>
  );
}
