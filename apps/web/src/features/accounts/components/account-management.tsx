"use client";

import { useState } from "react";

import { archiveAccountAction } from "../actions/archive-account";
import { updateAccountMetadataAction } from "../actions/update-account-metadata";

export function AccountManagement({ accountId, name, archived }: { accountId: string; name: string; archived: boolean }) {
  const [editing, setEditing] = useState(false);

  return (
    <section className="management-card" aria-labelledby="management-title">
      <div>
        <p className="card-label" id="management-title">Administrar cuenta</p>
        <p className="card-helper">El saldo inicial y la fecha de apertura son parte de la historia y no se editan.</p>
      </div>
      {!archived && (editing ? (
        <form className="metadata-form" action={async (formData) => { await updateAccountMetadataAction(formData); }}>
          <label htmlFor="account-name">Nombre</label>
          <input id="account-name" name="name" defaultValue={name} required maxLength={120} />
          <input type="hidden" name="accountId" value={accountId} />
          <div className="metadata-actions"><button className="primary-button" type="submit">Guardar nombre</button><button className="secondary-button" type="button" onClick={() => setEditing(false)}>Cancelar</button></div>
        </form>
      ) : (
        <div className="metadata-actions"><button className="secondary-button" type="button" onClick={() => setEditing(true)}>Editar nombre</button><ArchiveButton accountId={accountId} /></div>
      ))}
      {archived && <p className="status-note">Esta cuenta está archivada y conserva su historial.</p>}
    </section>
  );
}

function ArchiveButton({ accountId }: { accountId: string }) {
  const [confirmed, setConfirmed] = useState(false);

  if (confirmed) {
    return <form action={async (formData) => { await archiveAccountAction(formData); }}><input type="hidden" name="accountId" value={accountId} /><button className="primary-button" type="submit">Confirmar archivo</button><button className="secondary-button" type="button" onClick={() => setConfirmed(false)}>Cancelar</button></form>;
  }

  return <button className="secondary-button" type="button" onClick={() => setConfirmed(true)}>Archivar cuenta</button>;
}
