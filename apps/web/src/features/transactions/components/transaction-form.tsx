"use client";

import { useActionState, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Field, fieldControlClass } from "@/components/shared/form-field";
import { GenerateCategoriesButton } from "@/features/categories/components/generate-categories-button";
import { cn } from "@/lib/utils";
import { getTodayInTimezone } from "@/lib/date";
import { createTransactionAction, type TransactionActionState } from "../actions/create-transaction";

type Option = { id: string; name: string };
type CategoryOption = Option & { type: "INCOME" | "EXPENSE" };

const initialState: TransactionActionState | null = null;

export function TransactionForm({
  accounts,
  categories,
  timezone,
  defaultType = "EXPENSE",
}: {
  accounts: Option[];
  categories: CategoryOption[];
  timezone: string;
  defaultType?: "INCOME" | "EXPENSE";
}) {
  const [type, setType] = useState<"INCOME" | "EXPENSE">(defaultType);
  // One idempotency key per form instance (spec 14 §38): a timed-out submit that the user
  // retries carries the same value, so the movement is written at most once.
  const [commandId] = useState(() => crypto.randomUUID());
  const [state, action, pending] = useActionState(createTransactionAction, initialState);
  const fieldErrors = state?.ok === false ? state.error.fieldErrors ?? {} : {};

  const categoryOptions = categories.filter((category) => category.type === type);

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="commandId" value={commandId} />

      <div role="tablist" aria-label="Tipo de movimiento" className="grid grid-cols-2 gap-1 rounded-lg bg-secondary p-1">
        {(["EXPENSE", "INCOME"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={type === option}
            onClick={() => setType(option)}
            className={cn(
              "h-9 rounded-md text-small font-medium transition-colors",
              type === option ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option === "EXPENSE" ? "Gasto" : "Ingreso"}
          </button>
        ))}
      </div>

      {state?.ok === false ? (
        <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-small text-[var(--negative)]">
          {state.error.message}
        </p>
      ) : null}

      {accounts.length === 0 ? (
        <p className="rounded-md bg-warning-soft px-3 py-2 text-small text-[var(--warning)]">
          Primero necesitás una cuenta.{" "}
          <Link href="/accounts/new" className="font-medium underline">
            Crear una
          </Link>
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Cuenta" htmlFor="accountId" error={fieldErrors.accountId?.[0]}>
          <select id="accountId" name="accountId" required className={fieldControlClass} defaultValue={accounts[0]?.id}>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Monto" htmlFor="amount" error={fieldErrors.amount?.[0]}>
          <input id="amount" name="amount" type="text" inputMode="decimal" required placeholder="0.00" className={fieldControlClass} />
        </Field>
      </div>

      <Field label="Descripción" htmlFor="description" error={fieldErrors.description?.[0]}>
        <input
          id="description"
          name="description"
          type="text"
          required
          placeholder={type === "EXPENSE" ? "Ej. Supermercado" : "Ej. Sueldo"}
          className={fieldControlClass}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Categoría" htmlFor="categoryId" help="Opcional" error={fieldErrors.categoryId?.[0]}>
          <select id="categoryId" name="categoryId" className={fieldControlClass} defaultValue="">
            <option value="">Sin categoría</option>
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {categoryOptions.length === 0 ? (
            <div className="mt-1.5">
              <GenerateCategoriesButton size="sm" />
            </div>
          ) : null}
        </Field>
        <Field label="Fecha" htmlFor="occurredAt" error={fieldErrors.occurredAt?.[0]}>
          <input id="occurredAt" name="occurredAt" type="date" required defaultValue={getTodayInTimezone(timezone)} className={fieldControlClass} />
        </Field>
      </div>

      {type === "EXPENSE" ? (
        <Field label="Comercio" htmlFor="merchant" help="Opcional" error={fieldErrors.merchant?.[0]}>
          <input id="merchant" name="merchant" type="text" placeholder="Ej. Coto" className={fieldControlClass} />
        </Field>
      ) : null}

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button variant="outline" render={<Link href="/transactions">Cancelar</Link>} />
        <Button type="submit" disabled={pending || accounts.length === 0}>
          {pending ? "Guardando…" : type === "EXPENSE" ? "Registrar gasto" : "Registrar ingreso"}
        </Button>
      </div>
    </form>
  );
}
