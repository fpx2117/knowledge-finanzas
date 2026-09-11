"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Field, fieldControlClass } from "@/components/shared/form-field";
import { cn } from "@/lib/utils";
import { GOAL_CATEGORY_META, GOAL_CATEGORY_ORDER } from "../goal-meta";
import { createGoalAction, updateGoalAction, type GoalActionState } from "../actions/goal-actions";

const initialState: GoalActionState | null = null;

const CURRENCIES = ["ARS", "USD", "EUR", "BRL", "CLP", "MXN", "UYU"] as const;

type GoalDefaults = {
  id: string;
  name: string;
  category: string;
  currencyCode: string;
  targetAmount: string;
  targetDate: string | null;
  notes: string | null;
};

export function GoalForm({ baseCurrency, goal }: { baseCurrency: string; goal?: GoalDefaults }) {
  const router = useRouter();
  const isEdit = Boolean(goal);
  const [state, action, pending] = useActionState(isEdit ? updateGoalAction : createGoalAction, initialState);
  const fieldErrors = state?.ok === false ? state.error.fieldErrors ?? {} : {};

  if (isEdit && state?.ok) {
    router.push(`/goals/${goal!.id}`);
    router.refresh();
    window.dispatchEvent(new CustomEvent("kai:refresh-proactive"));
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      {goal ? <input type="hidden" name="goalId" value={goal.id} /> : null}

      {state?.ok === false ? (
        <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-small text-[var(--negative)]">
          {state.error.message}
        </p>
      ) : null}

      <Field label="Nombre de la meta" htmlFor="name" error={fieldErrors.name?.[0]}>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={120}
          defaultValue={goal?.name}
          placeholder="Ej. Vacaciones 2027"
          className={fieldControlClass}
        />
      </Field>

      <Field label="Categoría" htmlFor="category" error={fieldErrors.category?.[0]}>
        <select id="category" name="category" required className={fieldControlClass} defaultValue={goal?.category ?? "OTHER"}>
          {GOAL_CATEGORY_ORDER.map((key) => (
            <option key={key} value={key}>
              {GOAL_CATEGORY_META[key].label}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Monto objetivo" htmlFor="targetAmount" error={fieldErrors.targetAmount?.[0]}>
          <input
            id="targetAmount"
            name="targetAmount"
            type="text"
            inputMode="decimal"
            required
            defaultValue={goal?.targetAmount}
            placeholder="0.00"
            className={fieldControlClass}
          />
        </Field>
        {isEdit ? (
          <Field label="Moneda" htmlFor="currencyDisplay">
            <input id="currencyDisplay" type="text" value={goal!.currencyCode} disabled className={fieldControlClass} />
          </Field>
        ) : (
          <Field label="Moneda" htmlFor="currencyCode" error={fieldErrors.currencyCode?.[0]}>
            <select id="currencyCode" name="currencyCode" required className={fieldControlClass} defaultValue={baseCurrency}>
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {!isEdit ? (
          <Field
            label="Ya tengo ahorrado"
            htmlFor="initialAmount"
            help="Opcional — cuánto llevás juntado para esta meta."
            error={fieldErrors.initialAmount?.[0]}
          >
            <input id="initialAmount" name="initialAmount" type="text" inputMode="decimal" placeholder="0.00" className={fieldControlClass} />
          </Field>
        ) : null}
        <Field label="Fecha objetivo" htmlFor="targetDate" help="Opcional." error={fieldErrors.targetDate?.[0]}>
          <input id="targetDate" name="targetDate" type="date" defaultValue={goal?.targetDate ?? undefined} className={fieldControlClass} />
        </Field>
      </div>

      <Field label="Notas" htmlFor="notes" help="Opcional." error={fieldErrors.notes?.[0]}>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={500}
          defaultValue={goal?.notes ?? undefined}
          className={cn(fieldControlClass, "h-auto min-h-20 py-2 leading-normal")}
        />
      </Field>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button variant="outline" render={<Link href={goal ? `/goals/${goal.id}` : "/goals"}>Cancelar</Link>} />
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear meta"}
        </Button>
      </div>
    </form>
  );
}
