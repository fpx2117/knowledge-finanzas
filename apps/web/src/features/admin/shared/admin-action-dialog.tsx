"use client";

import { useActionState, useState, type ReactNode } from "react";
import { AdminReasonField } from "./admin-reason-field";

export type AdminActionState = { ok: true } | { ok: false; error: { code: string; message: string } };

// Every mutating admin surface in TASK-060 uses this one dialog — Security Requirement: "every
// action re-validates role server-side"; this component never assumes success and never hides
// the confirm step, it only calls whatever Server Action the caller supplies.
export function AdminActionDialog({
  triggerLabel,
  confirmLabel,
  description,
  action,
  hiddenFields,
  withReason = false,
  danger = false,
  extraFields,
}: {
  triggerLabel: string;
  confirmLabel: string;
  description: string;
  action: (state: AdminActionState | null, formData: FormData) => Promise<AdminActionState>;
  hiddenFields?: Record<string, string>;
  withReason?: boolean;
  danger?: boolean;
  extraFields?: ReactNode;
}) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(action, null);

  if (!confirming) {
    return (
      <button className={danger ? "text-button danger" : "secondary-button"} type="button" onClick={() => setConfirming(true)}>
        {triggerLabel}
      </button>
    );
  }

  return (
    <div className="admin-action-dialog">
      <p className="card-helper">{description}</p>
      <form action={formAction}>
        {hiddenFields && Object.entries(hiddenFields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
        {extraFields}
        {withReason && <AdminReasonField />}
        {state?.ok === false && (
          <div className="form-alert" role="alert">
            <strong>{state.error.message}</strong>
          </div>
        )}
        <button className="primary-button" type="submit" disabled={pending}>{pending ? "Procesando..." : confirmLabel}</button>
        <button className="secondary-button" type="button" onClick={() => setConfirming(false)} disabled={pending}>Cancelar</button>
      </form>
    </div>
  );
}
