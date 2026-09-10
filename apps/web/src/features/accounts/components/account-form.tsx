"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, fieldControlClass } from "@/components/shared/form-field";
import { InstitutionSelect } from "@/components/financial/institution-select";
import { getTodayInTimezone } from "@/lib/date";
import { cn } from "@/lib/utils";
import { createAccountAction, type AccountActionState } from "../actions/create-account";
import type { AccountType } from "../schemas/account-schemas";

const initialState: AccountActionState | null = null;

// Which institution kinds make sense per account type.
const INSTITUTION_KINDS: Partial<Record<AccountType, ("BANK" | "WALLET" | "BROKER")[]>> = {
  BANK: ["BANK"],
  SAVINGS: ["BANK", "BROKER"],
  DIGITAL_WALLET: ["WALLET"],
};

const CURRENCIES = [
  ["ARS", "Peso argentino"],
  ["USD", "Dólar estadounidense"],
  ["EUR", "Euro"],
  ["BRL", "Real brasileño"],
  ["CLP", "Peso chileno"],
  ["MXN", "Peso mexicano"],
  ["UYU", "Peso uruguayo"],
] as const;

export function AccountForm({ timezone, isFirstAccount = false }: { timezone: string; isFirstAccount?: boolean }) {
  const [state, action, pending] = useActionState(createAccountAction, initialState);
  const fieldErrors = state?.ok === false ? state.error.fieldErrors ?? {} : {};
  const [type, setType] = useState<AccountType>("BANK");
  const [currency, setCurrency] = useState("ARS");
  const [institution, setInstitution] = useState<string | null>(null);
  const institutionKinds = INSTITUTION_KINDS[type];
  // Un banco en KnowFinanzas se lleva siempre en pesos (los dólares van a una cuenta de ahorro).
  const currencyLocked = type === "BANK";
  const effectiveCurrency = currencyLocked ? "ARS" : currency;

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
          <select
            id="type"
            name="type"
            value={type}
            onChange={(event) => {
              setType(event.target.value as AccountType);
              setInstitution(null);
            }}
            required
            className={fieldControlClass}
          >
            <option value="BANK">Banco</option>
            <option value="CASH">Efectivo</option>
            <option value="DIGITAL_WALLET">Billetera digital</option>
            <option value="SAVINGS">Ahorro</option>
          </select>
        </Field>
        <Field
          label="Moneda"
          htmlFor="currencyCode"
          help={currencyLocked ? "Los bancos se llevan en pesos." : undefined}
          error={fieldErrors.currencyCode?.[0]}
        >
          <select
            id="currencyCode"
            name="currencyCode"
            value={effectiveCurrency}
            onChange={(event) => setCurrency(event.target.value)}
            required
            className={cn(fieldControlClass, currencyLocked && "opacity-70")}
          >
            {(currencyLocked ? CURRENCIES.filter(([code]) => code === "ARS") : CURRENCIES).map(([code, name]) => (
              <option key={code} value={code}>
                {code} · {name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {institutionKinds ? (
        <Field
          label={type === "DIGITAL_WALLET" ? "Billetera" : "Banco / entidad"}
          htmlFor="institution"
          help="Se usa para el logo y para agrupar tus cuentas. Opcional."
        >
          <input type="hidden" name="institution" value={institution ?? ""} />
          <InstitutionSelect
            value={institution}
            onValueChange={setInstitution}
            kinds={institutionKinds}
            placeholder="Elegí una entidad (opcional)"
            className="w-full"
          />
        </Field>
      ) : null}

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

      {isFirstAccount ? (
        <input type="hidden" name="isPrimary" value="on" />
      ) : (
        <label className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
          <input type="checkbox" name="isPrimary" defaultChecked={false} className="mt-0.5 size-4 accent-[var(--brand)]" />
          <span className="flex flex-col">
            <span className="text-small font-medium text-foreground">Cuenta principal</span>
            <span className="text-caption text-muted-foreground">
              Se pre-selecciona al registrar movimientos y se destaca en el menú. Reemplaza a la actual.
            </span>
          </span>
        </label>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button variant="outline" render={<Link href="/accounts">Cancelar</Link>} />
        <Button type="submit" disabled={pending}>
          {pending ? "Creando cuenta…" : "Crear cuenta"}
        </Button>
      </div>
    </form>
  );
}
