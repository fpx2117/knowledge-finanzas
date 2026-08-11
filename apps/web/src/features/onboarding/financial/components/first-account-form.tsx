"use client";

import { useActionState } from "react";

import { createFirstAccountAction, type CreateFirstAccountActionState } from "../actions/create-first-account";

const initialState: CreateFirstAccountActionState | null = null;

export function FirstAccountForm() {
  const [state, action, pending] = useActionState(createFirstAccountAction, initialState);
  const fieldErrors = state?.ok === false ? state.error.fieldErrors ?? {} : {};

  return (
    <form action={action} className="account-form">
      {state?.ok === false && (
        <div className="form-alert" role="alert">
          <strong>{state.error.message}</strong>
        </div>
      )}

      <div className="field-group">
        <label htmlFor="name">Nombre de la cuenta</label>
        <input id="name" name="name" type="text" placeholder="Ej. Banco principal" required aria-invalid={Boolean(fieldErrors.name)} />
        {fieldErrors.name && <p className="field-error">{fieldErrors.name[0]}</p>}
      </div>

      <div className="form-grid">
        <div className="field-group">
          <label htmlFor="type">Tipo</label>
          <select id="type" name="type" defaultValue="BANK" required>
            <option value="BANK">Banco</option>
            <option value="CASH">Efectivo</option>
            <option value="DIGITAL_WALLET">Billetera digital</option>
            <option value="SAVINGS">Ahorro</option>
          </select>
        </div>
        <div className="field-group">
          <label htmlFor="currencyCode">Moneda</label>
          <select id="currencyCode" name="currencyCode" defaultValue="ARS" required>
            <option value="ARS">ARS · Peso argentino</option>
            <option value="USD">USD · Dólar estadounidense</option>
            <option value="EUR">EUR · Euro</option>
          </select>
        </div>
      </div>

      <div className="form-grid">
        <div className="field-group">
          <label htmlFor="openingBalance">Saldo inicial</label>
          <input id="openingBalance" name="openingBalance" type="text" inputMode="decimal" placeholder="0.00" defaultValue="0" required />
          {fieldErrors.openingBalance && <p className="field-error">{fieldErrors.openingBalance[0]}</p>}
        </div>
        <div className="field-group">
          <label htmlFor="openingDate">Fecha de apertura</label>
          <input id="openingDate" name="openingDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
          {fieldErrors.openingDate && <p className="field-error">{fieldErrors.openingDate[0]}</p>}
        </div>
      </div>

      <div className="form-actions">
        <button className="primary-button" type="submit" disabled={pending}>{pending ? "Creando cuenta..." : "Crear mi primera cuenta"}</button>
      </div>
    </form>
  );
}
