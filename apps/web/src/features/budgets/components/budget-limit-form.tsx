"use client";

import { useActionState, useState } from "react";

import { archiveBudgetAction } from "../actions/archive-budget";
import { updateBudgetAction } from "../actions/update-budget";

type Budget = { id: string; limitAmount: string; currencyCode: string; name: string | null; status: "ACTIVE" | "ARCHIVED" };

export function BudgetLimitForm({ budget }: { budget: Budget }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [updateState, updateAction, updatePending] = useActionState(updateBudgetAction, null);
  const [archiveState, archiveAction, archivePending] = useActionState(archiveBudgetAction, null);

  if (budget.status === "ARCHIVED") {
    return <p className="status-note">Este presupuesto está archivado.</p>;
  }

  if (editing) {
    return (
      <form className="metadata-form" action={updateAction} onSubmit={() => setEditing(false)}>
        <input type="hidden" name="budgetId" value={budget.id} />
        <label htmlFor="budget-edit-limit">Nuevo límite mensual ({budget.currencyCode})</label>
        <input id="budget-edit-limit" name="limitAmount" type="text" inputMode="decimal" defaultValue={budget.limitAmount} required />
        <input type="hidden" name="name" value={budget.name ?? ""} />
        <button className="secondary-button" type="submit" disabled={updatePending}>{updatePending ? "Guardando..." : "Guardar"}</button>
        <button className="text-button" type="button" onClick={() => setEditing(false)}>Cancelar</button>
        {updateState?.ok === false && <p className="field-error">{updateState.error.message}</p>}
      </form>
    );
  }

  return (
    <div className="metadata-actions">
      <button className="text-button" type="button" onClick={() => setEditing(true)}>Editar límite</button>
      {confirming ? (
        <form action={archiveAction}>
          <input type="hidden" name="budgetId" value={budget.id} />
          <button className="text-button danger" type="submit" disabled={archivePending}>{archivePending ? "Archivando..." : "Confirmar archivo"}</button>
          <button className="text-button" type="button" onClick={() => setConfirming(false)}>Cancelar</button>
        </form>
      ) : (
        <button className="text-button danger" type="button" onClick={() => setConfirming(true)}>Archivar</button>
      )}
      {archiveState?.ok === false && <p className="field-error">{archiveState.error.message}</p>}
    </div>
  );
}
