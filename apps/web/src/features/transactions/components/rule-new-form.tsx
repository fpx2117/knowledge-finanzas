"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Field, fieldControlClass } from "@/components/shared/form-field";
import { MoneyAmount } from "@/components/financial/money-amount";
import { formatShortDate } from "@/lib/format";
import {
  createClassificationRuleAction,
  previewClassificationRuleAction,
  type RuleFormState,
  type RulePreviewState,
} from "../actions/classification-rule-actions";

const initialCreate: RuleFormState | null = null;
const initialPreview: RulePreviewState | null = null;

const RETRO_LABEL: Record<string, string> = {
  NONE: "Solo nuevos movimientos",
  LAST_30: "También los últimos 30 días",
  LAST_90: "También los últimos 90 días",
  ALL: "También todo el histórico",
};

export function RuleNewForm({ categories }: { categories: Array<{ id: string; name: string; type: "INCOME" | "EXPENSE" }> }) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [createState, createAction, creating] = useActionState(createClassificationRuleAction, initialCreate);
  const [previewState, previewAction, previewing] = useActionState(previewClassificationRuleAction, initialPreview);
  const [retro, setRetro] = useState("NONE");

  if (createState?.ok) {
    formRef.current?.reset();
    router.refresh();
  }
  const errors = createState?.ok === false ? createState.error.fieldErrors ?? {} : {};
  const preview = previewState?.ok ? previewState.preview : null;

  return (
    <form ref={formRef} className="flex flex-col gap-4">
      {createState?.ok === false && !createState.error.fieldErrors ? (
        <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-small text-[var(--negative)]">
          {createState.error.message}
        </p>
      ) : null}
      {createState?.ok && createState.applied > 0 ? (
        <p role="status" className="rounded-md bg-success-soft px-3 py-2 text-small text-[var(--success)]">
          Regla creada. Se recategorizaron {createState.applied} movimientos anteriores.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Cuando" htmlFor="rule-matcher">
          <select id="rule-matcher" name="matcher" className={fieldControlClass} defaultValue="MERCHANT">
            <option value="MERCHANT">el comercio</option>
            <option value="DESCRIPTION">la descripción</option>
          </select>
        </Field>
        <Field label="…" htmlFor="rule-mode">
          <select id="rule-mode" name="mode" className={fieldControlClass} defaultValue="CONTAINS">
            <option value="CONTAINS">contiene</option>
            <option value="STARTS_WITH">empieza con</option>
            <option value="EQUALS">es exactamente</option>
          </select>
        </Field>
      </div>
      <Field label="Texto" htmlFor="rule-pattern" error={errors.pattern?.[0]}>
        <input id="rule-pattern" name="pattern" type="text" required minLength={2} maxLength={120} placeholder="Ej. YPF" className={fieldControlClass} />
      </Field>
      <Field label="Entonces la categoría es" htmlFor="rule-category" error={errors.categoryId?.[0] && "Elegí una categoría."}>
        <select id="rule-category" name="categoryId" required className={fieldControlClass} defaultValue="">
          <option value="" disabled>Elegí una categoría…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.type === "EXPENSE" ? "gasto" : "ingreso"})
            </option>
          ))}
        </select>
      </Field>

      {/* §6.9 — aplicación retroactiva, elección explícita */}
      <Field label="Aplicar" htmlFor="rule-retro">
        <select id="rule-retro" name="retroactive" value={retro} onChange={(e) => setRetro(e.target.value)} className={fieldControlClass}>
          {Object.entries(RETRO_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </Field>

      {previewState?.ok === false ? (
        <p role="alert" className="text-small text-[var(--negative)]">{previewState.error.message}</p>
      ) : null}

      {preview ? (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface-secondary p-3 text-small">
          <p className="font-medium text-foreground">
            {preview.wouldChange === 0
              ? "Ninguna transacción cambiaría de categoría."
              : `Esta regla recategorizaría ${preview.wouldChange} ${preview.wouldChange === 1 ? "movimiento" : "movimientos"}`}
            {preview.window !== "NONE" && preview.wouldChange > 0 ? ` (${RETRO_LABEL[preview.window].toLowerCase()})` : ""}
            .
          </p>
          {preview.protectedByManual > 0 ? (
            <p className="text-caption text-muted-foreground">
              {preview.protectedByManual} {preview.protectedByManual === 1 ? "movimiento tiene" : "movimientos tienen"} una categoría que
              elegiste a mano — la regla no los toca.
            </p>
          ) : null}
          {preview.sample.length > 0 ? (
            <ul className="flex flex-col divide-y divide-border">
              {preview.sample.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between gap-3 py-1.5 first:pt-0 last:pb-0">
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-small text-foreground">{tx.label}</span>
                    <span className="text-caption text-muted-foreground">{formatShortDate(tx.occurredOn)}</span>
                  </span>
                  <MoneyAmount amount={tx.amount} currency={tx.currencyCode} variant="compact" className="shrink-0 text-caption" />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          variant="outline"
          formAction={previewAction}
          name="window"
          value={retro === "NONE" ? "LAST_90" : retro}
          disabled={previewing}
        >
          {previewing ? "Calculando…" : "Previsualizar"}
        </Button>
        <Button type="submit" formAction={createAction} disabled={creating}>
          {creating ? "Guardando…" : retro === "NONE" ? "Guardar regla" : "Guardar y aplicar"}
        </Button>
      </div>
    </form>
  );
}
