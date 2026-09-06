"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Field, fieldControlClass } from "@/components/shared/form-field";
import { updatePreferencesAction, type SettingsActionState } from "../actions/settings-actions";
import type { UserPreferences } from "@know-finanzas/db";

const initial: SettingsActionState | null = null;

type Prefs = Omit<UserPreferences, "userId" | "updatedAt">;

function Toggle({ name, label, hint, defaultChecked }: { name: string; label: string; hint?: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-start justify-between gap-3 py-2.5">
      <span className="flex flex-col">
        <span className="text-small font-medium text-foreground">{label}</span>
        {hint ? <span className="text-caption text-muted-foreground">{hint}</span> : null}
      </span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-1 size-4 shrink-0 accent-[var(--brand)]" />
    </label>
  );
}

export function PreferencesForm({ defaults }: { defaults: Prefs }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(updatePreferencesAction, initial);
  if (state?.ok) router.refresh();

  return (
    <form action={action} className="flex flex-col gap-6">
      {state?.ok === false ? (
        <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-small text-[var(--negative)]">{state.error.message}</p>
      ) : null}
      {state?.ok ? (
        <p role="status" className="rounded-md bg-success-soft px-3 py-2 text-small text-[var(--success)]">Preferencias guardadas.</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Apariencia" htmlFor="theme">
          <select id="theme" name="theme" defaultValue={defaults.theme} className={fieldControlClass}>
            <option value="SYSTEM">Seguir el sistema</option>
            <option value="LIGHT">Claro</option>
            <option value="DARK">Oscuro</option>
          </select>
        </Field>
        <Field label="Período por defecto en reportes" htmlFor="defaultReportPeriod">
          <select id="defaultReportPeriod" name="defaultReportPeriod" defaultValue={defaults.defaultReportPeriod} className={fieldControlClass}>
            <option value="THIS_MONTH">Este mes</option>
            <option value="LAST_MONTH">Mes anterior</option>
            <option value="LAST_30_DAYS">Últimos 30 días</option>
          </select>
        </Field>
        <Field label="La semana empieza el" htmlFor="weekStartsOn">
          <select id="weekStartsOn" name="weekStartsOn" defaultValue={String(defaults.weekStartsOn)} className={fieldControlClass}>
            <option value="1">Lunes</option>
            <option value="0">Domingo</option>
          </select>
        </Field>
        <Field label="Al abrir Registrar" htmlFor="captureMode">
          <select id="captureMode" name="captureMode" defaultValue={defaults.captureMode} className={fieldControlClass}>
            <option value="QUICK">Captura rápida</option>
            <option value="FULL">Formulario completo</option>
          </select>
        </Field>
      </div>

      <div className="flex flex-col divide-y divide-border">
        <Toggle name="showCents" label="Mostrar centavos cuando existen" defaultChecked={defaults.showCents} />
        <Toggle name="compactLargeNumbers" label="Compactar miles y millones en widgets chicos" hint="Ej. $1,2 M en vez de $1.200.000" defaultChecked={defaults.compactLargeNumbers} />
        <Toggle name="rememberLastAccount" label="Recordar la última cuenta usada" defaultChecked={defaults.rememberLastAccount} />
        <Toggle name="rememberLastCategory" label="Recordar la última categoría usada" defaultChecked={defaults.rememberLastCategory} />
      </div>

      <p className="text-caption text-muted-foreground">
        Estas preferencias sólo cambian la presentación y el comportamiento. Nunca alteran cómo se calcula tu dinero: una
        transferencia no cuenta como gasto, los ingresos futuros no suman al disponible y las monedas no se combinan.
      </p>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Guardando…" : "Guardar preferencias"}
      </Button>
    </form>
  );
}
