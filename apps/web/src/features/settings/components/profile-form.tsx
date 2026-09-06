"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Field, fieldControlClass } from "@/components/shared/form-field";
import { updateProfileAction, type SettingsActionState } from "../actions/settings-actions";

const initial: SettingsActionState | null = null;

const TIMEZONE_LABELS: Array<[string, string]> = [
  ["America/Argentina/Buenos_Aires", "Argentina (Buenos Aires)"],
  ["America/Sao_Paulo", "Brasil (São Paulo)"],
  ["America/Santiago", "Chile (Santiago)"],
  ["America/Montevideo", "Uruguay (Montevideo)"],
  ["America/Bogota", "Colombia (Bogotá)"],
  ["America/Mexico_City", "México (Ciudad de México)"],
  ["America/New_York", "EE. UU. (Nueva York)"],
  ["Europe/Madrid", "España (Madrid)"],
  ["UTC", "UTC"],
];

const CURRENCIES = ["ARS", "USD", "EUR", "BRL", "CLP", "UYU", "MXN", "COP"];

export function ProfileForm({
  defaults,
}: {
  defaults: { name: string; email: string; country: string | null; timezone: string; baseCurrency: string; language: string | null };
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(updateProfileAction, initial);
  if (state?.ok) router.refresh();
  const errors = state?.ok === false ? state.error.fieldErrors ?? {} : {};

  return (
    <form action={action} className="flex flex-col gap-4">
      {state?.ok === false && !state.error.fieldErrors ? (
        <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-small text-[var(--negative)]">{state.error.message}</p>
      ) : null}
      {state?.ok ? (
        <p role="status" className="rounded-md bg-success-soft px-3 py-2 text-small text-[var(--success)]">Perfil actualizado.</p>
      ) : null}

      <Field label="Nombre visible" htmlFor="name" error={errors.name?.[0]}>
        <input id="name" name="name" type="text" required maxLength={120} defaultValue={defaults.name} className={fieldControlClass} />
      </Field>

      <Field label="Email de la cuenta" htmlFor="email">
        <input id="email" type="email" value={defaults.email} readOnly disabled className={`${fieldControlClass} opacity-60`} />
        <p className="mt-1 text-caption text-muted-foreground">El email es tu dato de acceso. Para cambiarlo, escribinos a soporte.</p>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="País" htmlFor="country">
          <select id="country" name="country" defaultValue={defaults.country ?? "AR"} className={fieldControlClass}>
            <option value="AR">Argentina</option>
            <option value="BR">Brasil</option>
            <option value="CL">Chile</option>
            <option value="UY">Uruguay</option>
            <option value="CO">Colombia</option>
            <option value="MX">México</option>
            <option value="ES">España</option>
            <option value="US">Estados Unidos</option>
          </select>
        </Field>
        <Field label="Idioma" htmlFor="language">
          <select id="language" name="language" defaultValue={defaults.language ?? "es"} className={fieldControlClass}>
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </Field>
      </div>

      <Field label="Zona horaria" htmlFor="timezone">
        <select id="timezone" name="timezone" defaultValue={defaults.timezone} className={fieldControlClass}>
          {TIMEZONE_LABELS.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <p className="mt-1 text-caption text-muted-foreground">
          Se usa para los horarios visibles y los recordatorios. No cambia la fecha de tus movimientos ya registrados.
        </p>
      </Field>

      <Field label="Moneda base de presentación" htmlFor="baseCurrency" error={errors.baseCurrency?.[0]}>
        <select id="baseCurrency" name="baseCurrency" defaultValue={defaults.baseCurrency} className={fieldControlClass}>
          {CURRENCIES.map((code) => (
            <option key={code} value={code}>{code}</option>
          ))}
        </select>
        <p className="mt-1 text-caption text-muted-foreground">
          Es sólo la moneda en la que se muestran los totales generales. <strong>No convierte</strong> el saldo de tus cuentas ni
          combina monedas distintas.
        </p>
      </Field>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Guardando…" : "Guardar cambios"}
      </Button>
    </form>
  );
}
