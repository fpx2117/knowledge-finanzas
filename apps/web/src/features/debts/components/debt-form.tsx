"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, fieldControlClass } from "@/components/shared/form-field";
import { getTodayInTimezone } from "@/lib/date";
import { createDebtAction, type DebtActionState } from "../actions/debt-actions";

const initialState: DebtActionState | null = null;

const TYPES = [
  ["PERSONAL_LOAN", "Préstamo personal"],
  ["PURCHASE_INSTALLMENTS", "Compra en cuotas"],
  ["MONEY_OWED_TO_PERSON", "Plata que debo a alguien"],
  ["SERVICE_DEBT", "Deuda de servicio"],
  ["OTHER", "Otra"],
] as const;

const FREQUENCIES = [
  ["MONTHLY", "Mensual"],
  ["BIWEEKLY", "Quincenal"],
  ["WEEKLY", "Semanal"],
] as const;

const CURRENCIES = ["ARS", "USD", "EUR", "BRL", "CLP", "MXN", "UYU"] as const;

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

export function DebtForm({ timezone, baseCurrency }: { timezone: string; baseCurrency: string }) {
  const [state, action, pending] = useActionState(createDebtAction, initialState);
  const fieldErrors = state?.ok === false ? state.error.fieldErrors ?? {} : {};

  const [amount, setAmount] = useState("");
  const [count, setCount] = useState("1");
  const [currency, setCurrency] = useState(baseCurrency);

  const total = Number(amount.replace(",", "."));
  const n = Math.max(1, Math.floor(Number(count) || 1));
  const perInstallment = total > 0 ? total / n : 0;

  return (
    <form action={action} className="flex flex-col gap-5">
      {state?.ok === false ? (
        <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-small text-[var(--negative)]">
          {state.error.message}
        </p>
      ) : null}

      <Field label="Nombre" htmlFor="name" error={fieldErrors.name?.[0]}>
        <input id="name" name="name" type="text" required placeholder="Ej. Préstamo auto" className={fieldControlClass} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Acreedor" htmlFor="creditor" help="Opcional">
          <input id="creditor" name="creditor" type="text" placeholder="Ej. Banco Galicia" className={fieldControlClass} />
        </Field>
        <Field label="Tipo" htmlFor="type">
          <select id="type" name="type" defaultValue="PERSONAL_LOAN" required className={fieldControlClass}>
            {TYPES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Monto total a pagar" htmlFor="originalAmount" error={fieldErrors.originalAmount?.[0]}>
          <input
            id="originalAmount"
            name="originalAmount"
            type="text"
            inputMode="decimal"
            required
            placeholder="0.00"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className={fieldControlClass}
          />
        </Field>
        <Field label="Moneda" htmlFor="currencyCode">
          <select
            id="currencyCode"
            name="currencyCode"
            required
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            className={fieldControlClass}
          >
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Cantidad de cuotas" htmlFor="installmentCount" error={fieldErrors.installmentCount?.[0]}>
          <input
            id="installmentCount"
            name="installmentCount"
            type="number"
            min={1}
            max={120}
            required
            value={count}
            onChange={(event) => setCount(event.target.value)}
            className={fieldControlClass}
          />
        </Field>
        <Field label="Frecuencia" htmlFor="frequency">
          <select id="frequency" name="frequency" defaultValue="MONTHLY" required className={fieldControlClass}>
            {FREQUENCIES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Fecha de inicio" htmlFor="startDate" error={fieldErrors.startDate?.[0]}>
          <input id="startDate" name="startDate" type="date" required defaultValue={getTodayInTimezone(timezone)} className={fieldControlClass} />
        </Field>
      </div>

      {perInstallment > 0 ? (
        <p className="rounded-md bg-brand-subtle px-3 py-2 text-small text-foreground-secondary">
          {n} {n === 1 ? "cuota" : "cuotas"} de aproximadamente{" "}
          <strong className="text-foreground">{formatMoney(perInstallment, currency)}</strong> sin interés.
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button variant="outline" render={<Link href="/debts">Cancelar</Link>} />
        <Button type="submit" disabled={pending}>
          {pending ? "Creando…" : "Crear obligación"}
        </Button>
      </div>
    </form>
  );
}
