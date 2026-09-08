"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Field, fieldControlClass } from "@/components/shared/form-field";
import { createCategoryAction, type CategoryFormState } from "../actions/category-actions";

const initial: CategoryFormState | null = null;

export function CategoryNewForm({ defaultType = "EXPENSE" }: { defaultType?: "INCOME" | "EXPENSE" }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(createCategoryAction, initial);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);
  const errors = state?.ok === false ? state.error.fieldErrors ?? {} : {};

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4">
      {state?.ok === false && !state.error.fieldErrors ? (
        <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-small text-[var(--negative)]">
          {state.error.message}
        </p>
      ) : null}
      <Field label="Nombre" htmlFor="new-name" error={errors.name?.[0] && "Ya tenés una categoría con ese nombre."}>
        <input id="new-name" name="name" type="text" required maxLength={60} placeholder="Ej. Mascotas" className={fieldControlClass} />
      </Field>
      <Field label="Tipo" htmlFor="new-type">
        <select id="new-type" name="type" className={fieldControlClass} defaultValue={defaultType}>
          <option value="EXPENSE">Gasto</option>
          <option value="INCOME">Ingreso</option>
        </select>
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Creando…" : "Agregar categoría"}
      </Button>
    </form>
  );
}
