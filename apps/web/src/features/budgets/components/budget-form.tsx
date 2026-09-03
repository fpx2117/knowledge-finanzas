"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, fieldControlClass } from "@/components/shared/form-field";
import { GenerateCategoriesButton } from "@/features/categories/components/generate-categories-button";
import { createBudgetAction, type BudgetActionState } from "../actions/budget-actions";

type CategoryOption = { id: string; name: string };

const initialState: BudgetActionState | null = null;

const CURRENCIES = ["ARS", "USD", "EUR", "BRL", "CLP", "MXN", "UYU"] as const;

export function BudgetForm({ categories, baseCurrency }: { categories: CategoryOption[]; baseCurrency: string }) {
  const [state, action, pending] = useActionState(createBudgetAction, initialState);
  const fieldErrors = state?.ok === false ? state.error.fieldErrors ?? {} : {};

  return (
    <form action={action} className="flex flex-col gap-5">
      {state?.ok === false ? (
        <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-small text-[var(--negative)]">
          {state.error.message}
        </p>
      ) : null}

      {categories.length === 0 ? (
        <div className="flex flex-col items-start gap-2.5 rounded-md bg-warning-soft px-3 py-3 text-small text-[var(--warning)]">
          <span>Necesitás al menos una categoría de gasto para armar un presupuesto.</span>
          <GenerateCategoriesButton />
        </div>
      ) : null}

      <Field label="Categoría" htmlFor="categoryId" error={fieldErrors.categoryId?.[0]}>
        <select id="categoryId" name="categoryId" required className={fieldControlClass} defaultValue={categories[0]?.id}>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Límite mensual" htmlFor="limitAmount" error={fieldErrors.limitAmount?.[0]}>
          <input id="limitAmount" name="limitAmount" type="text" inputMode="decimal" required placeholder="0.00" className={fieldControlClass} />
        </Field>
        <Field label="Moneda" htmlFor="currencyCode" error={fieldErrors.currencyCode?.[0]}>
          <select id="currencyCode" name="currencyCode" required className={fieldControlClass} defaultValue={baseCurrency}>
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Nombre" htmlFor="name" help="Opcional — por defecto usa el nombre de la categoría." error={fieldErrors.name?.[0]}>
        <input id="name" name="name" type="text" className={fieldControlClass} placeholder="Ej. Comida fuera de casa" />
      </Field>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button variant="outline" render={<Link href="/budgets">Cancelar</Link>} />
        <Button type="submit" disabled={pending || categories.length === 0}>
          {pending ? "Creando…" : "Crear presupuesto"}
        </Button>
      </div>
    </form>
  );
}
