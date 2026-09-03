"use client";

import { useActionState, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Field, fieldControlClass } from "@/components/shared/form-field";
import { createClassificationRuleAction, type RuleFormState } from "../actions/classification-rule-actions";

const initial: RuleFormState | null = null;

export function RuleNewForm({ categories }: { categories: Array<{ id: string; name: string; type: "INCOME" | "EXPENSE" }> }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(createClassificationRuleAction, initial);

  if (state?.ok) formRef.current?.reset();
  const errors = state?.ok === false ? state.error.fieldErrors ?? {} : {};

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4">
      {state?.ok === false && !state.error.fieldErrors ? (
        <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-small text-[var(--negative)]">
          {state.error.message}
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
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Agregar regla"}
      </Button>
    </form>
  );
}
