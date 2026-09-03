"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, fieldControlClass } from "@/components/shared/form-field";
import { getTodayInTimezone } from "@/lib/date";
import { createAccountAction, type AccountActionState } from "../actions/create-account";

const initialState: AccountActionState | null = null;

const CURRENCIES = [
  ["ARS", "Peso argentino"],
  ["USD", "Dólar estadounidense"],
  ["EUR", "Euro"],
  ["BRL", "Real brasileño"],
  ["CLP", "Peso chileno"],
  ["MXN", "Peso mexicano"],
  ["UYU", "Peso uruguayo"],
] as const;

export function AccountForm({ timezone }: { timezone: string }) {
  const [state, action, pending] = useActionState(createAccountAction, initialState);
  const fieldErrors = state?.ok === false ? state.error.fieldErrors ?? {} : {};

  return (
    <form action={action} className="flex flex-col gap-5">
      {state?.ok === false ? (
        <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-small text-[var(--negative)]">
          {state.error.message}
        </p>
      ) : null}

      <Field label="Nombre de la cuenta" htmlFor="name" error={fieldErrors.name?.[0]}>
        <input id="name" name="name" type="text" required placeholder="Ej. Banco principal" className={fieldControlClass} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Tipo" htmlFor="type">
          <select id="type" name="type" defaultValue="BANK" required className={fieldControlClass}>
            <option value="BANK">Banco</option>
            <option value="CASH">Efectivo</option>
            <option value="DIGITAL_WALLET">Billetera digital</option>
            <option value="SAVINGS">Ahorro</option>
          </select>
        </Field>
        <Field label="Moneda" htmlFor="currencyCode" error={fieldErrors.currencyCode?.[0]}>
          <select id="currencyCode" name="currencyCode" defaultValue="ARS" required className={fieldControlClass}>
            {CURRENCIES.map(([code, name]) => (
              <option key={code} value={code}>
                {code} · {name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Saldo inicial"
          htmlFor="openingBalance"
          help="No se registra como un ingreso."
          error={fieldErrors.openingBalance?.[0]}
        >
          <input id="openingBalance" name="openingBalance" type="text" inputMode="decimal" defaultValue="0" required className={fieldControlClass} />
        </Field>
        <Field label="Fecha de apertura" htmlFor="openingDate" error={fieldErrors.openingDate?.[0]}>
          <input id="openingDate" name="openingDate" type="date" defaultValue={getTodayInTimezone(timezone)} required className={fieldControlClass} />
        </Field>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button variant="outline" render={<Link href="/accounts">Cancelar</Link>} />
        <Button type="submit" disabled={pending}>
          {pending ? "Creando cuenta…" : "Crear cuenta"}
        </Button>
      </div>
    </form>
  );
}
