"use client";

import { useActionState } from "react";
import { adminCreatePromotionCodeAction } from "../actions/manage-code";

export function CreatePromotionCodeForm() {
  const [state, formAction, pending] = useActionState(adminCreatePromotionCodeAction, null);

  return (
    <section className="detail-card" style={{ marginTop: 24 }}>
      <p className="card-label">Crear código</p>
      <form action={formAction}>
        <div className="field-group"><label htmlFor="code">Código</label><input id="code" name="code" required minLength={4} maxLength={32} disabled={pending} /></div>
        <div className="field-group"><label htmlFor="name">Nombre</label><input id="name" name="name" required disabled={pending} /></div>
        <div className="field-group"><label htmlFor="durationValue">Duración (días)</label><input id="durationValue" name="durationValue" type="number" min={1} required disabled={pending} /></div>
        <div className="field-group"><label htmlFor="maxRedemptions">Máximo global (vacío = ilimitado)</label><input id="maxRedemptions" name="maxRedemptions" type="number" min={1} disabled={pending} /></div>
        <div className="field-group"><label htmlFor="aiCreditsPerPeriod">Créditos IA por período</label><input id="aiCreditsPerPeriod" name="aiCreditsPerPeriod" type="number" min={0} defaultValue={0} disabled={pending} /></div>
        <div className="field-group"><label htmlFor="whatsappMessagesPerPeriod">Mensajes WhatsApp por período</label><input id="whatsappMessagesPerPeriod" name="whatsappMessagesPerPeriod" type="number" min={0} defaultValue={0} disabled={pending} /></div>
        {state?.ok === false && <div className="form-alert" role="alert"><strong>{state.error.message}</strong></div>}
        <button className="primary-button" type="submit" disabled={pending}>{pending ? "Creando..." : "Crear código"}</button>
      </form>
    </section>
  );
}
