"use client";

import { useActionState, useState } from "react";

import { cancelSubscriptionAction } from "../actions/cancel-subscription";

const REASON_OPTIONS = [
  { value: "TOO_EXPENSIVE", label: "Es muy caro" },
  { value: "NOT_USING_ENOUGH", label: "No lo estoy usando lo suficiente" },
  { value: "MISSING_FEATURE", label: "Le falta algo que necesito" },
  { value: "SWITCHING", label: "Voy a usar otra herramienta" },
  { value: "OTHER", label: "Otro motivo" },
];

export function CancelSubscriptionDialog({ subscriptionId }: { subscriptionId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(cancelSubscriptionAction, null);

  if (!confirming) {
    return (
      <button className="secondary-button" type="button" onClick={() => setConfirming(true)}>
        Cancelar suscripción
      </button>
    );
  }

  return (
    <section className="management-card">
      <div>
        <p className="card-label">Cancelar suscripción</p>
        <p className="card-helper">
          Tu acceso Pro termina de inmediato al confirmar: perdés los créditos de IA y el cupo de WhatsApp restantes, y tus funciones vuelven al plan gratuito. No es reversible cancelando de nuevo — para volver a tener Pro vas a necesitar suscribirte otra vez. Tus cuentas, movimientos, deudas, presupuestos y planificación siguen disponibles para leer sin cambios.
        </p>
      </div>

      <form action={formAction}>
        <input type="hidden" name="subscriptionId" value={subscriptionId} />

        <div className="field-group">
          <label htmlFor="cancel-reason">Motivo (opcional)</label>
          <select id="cancel-reason" name="reasonCode" defaultValue="">
            <option value="">Prefiero no decir</option>
            {REASON_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <label htmlFor="cancel-comment">Comentario (opcional)</label>
          <textarea id="cancel-comment" name="reasonComment" maxLength={500} rows={3} />
        </div>

        {state?.ok === false && (
          <div className="form-alert" role="alert">
            <strong>{state.error.message}</strong>
          </div>
        )}

        <button className="primary-button" type="submit" disabled={pending}>
          {pending ? "Cancelando..." : "Confirmar cancelación"}
        </button>
        <button className="secondary-button" type="button" onClick={() => setConfirming(false)} disabled={pending}>
          Volver
        </button>
      </form>
    </section>
  );
}
