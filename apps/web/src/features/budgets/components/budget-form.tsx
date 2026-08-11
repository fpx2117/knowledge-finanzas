"use client";

import Link from "next/link";
import { useActionState } from "react";

import { createBudgetAction } from "../actions/create-budget";

type CategoryOption = { id: string; name: string };

export function BudgetForm({ categories }: { categories: CategoryOption[] }) {
  const [state, formAction, pending] = useActionState(createBudgetAction, null);
  const fieldErrors = state?.ok === false ? state.error.fieldErrors ?? {} : {};

  return (
    <form className="budget-form" action={formAction}>
      {state?.ok === false && (
        <div className="form-alert" role="alert">
          <strong>{state.error.message}</strong>
        </div>
      )}

      <div className="field-group">
        <label htmlFor="budget-category">Categoría</label>
        <select id="budget-category" name="categoryId" required aria-invalid={Boolean(fieldErrors.categoryId)}>
          <option value="" disabled defaultValue="">Seleccioná una categoría</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        {fieldErrors.categoryId && <p className="field-error">{fieldErrors.categoryId[0]}</p>}
        {categories.length === 0 && <p className="field-error">Primero creá una categoría de gasto activa.</p>}
      </div>

      <div className="form-grid">
        <div className="field-group">
          <label htmlFor="budget-currency">Moneda</label>
          <select id="budget-currency" name="currencyCode" defaultValue="ARS" required>
            <option value="ARS">ARS · Peso argentino</option>
            <option value="USD">USD · Dólar estadounidense</option>
            <option value="EUR">EUR · Euro</option>
          </select>
        </div>
        <div className="field-group">
          <label htmlFor="budget-limit">Límite mensual</label>
          <input id="budget-limit" name="limitAmount" type="text" inputMode="decimal" placeholder="0.00" required aria-invalid={Boolean(fieldErrors.limitAmount)} />
          {fieldErrors.limitAmount && <p className="field-error">{fieldErrors.limitAmount[0]}</p>}
        </div>
      </div>

      <div className="field-group">
        <label htmlFor="budget-name">Nombre <span className="optional-label">(opcional)</span></label>
        <input id="budget-name" name="name" type="text" placeholder="Ej. Presupuesto de alimentos" />
      </div>

      <div className="form-actions">
        <Link className="secondary-button" href="/budgets">Cancelar</Link>
        <button className="primary-button" type="submit" disabled={pending || categories.length === 0}>{pending ? "Creando presupuesto..." : "Crear presupuesto"}</button>
      </div>
    </form>
  );
}
