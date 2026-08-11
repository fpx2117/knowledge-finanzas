"use client";

import { useActionState, useState } from "react";
import { createCategoryAction } from "../actions/create-category";

type Parent = { id: string; name: string; type: "INCOME" | "EXPENSE" };

export function CategoryForm({ parents }: { parents: Parent[] }) {
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [state, action, pending] = useActionState(createCategoryAction, null);
  const errors = state?.ok === false ? state.error.fieldErrors ?? {} : {};
  const compatibleParents = parents.filter((parent) => parent.type === type);

  return <form className="category-form" action={action}>
    {state?.ok === false && <div className="form-alert" role="alert"><strong>{state.error.message}</strong></div>}
    <div className="field-group"><label htmlFor="category-name">Nombre</label><input id="category-name" name="name" placeholder="Ej. Alimentación" required aria-invalid={Boolean(errors.name)} />{errors.name && <p className="field-error">{errors.name[0]}</p>}</div>
    <fieldset className="category-type-fieldset"><legend>Tipo</legend><div className="type-options"><label><input type="radio" name="type" value="EXPENSE" checked={type === "EXPENSE"} onChange={() => setType("EXPENSE")} /> Gasto</label><label><input type="radio" name="type" value="INCOME" checked={type === "INCOME"} onChange={() => setType("INCOME")} /> Ingreso</label></div></fieldset>
    <div className="field-group"><label htmlFor="category-parent">Categoría padre <span className="optional-label">(opcional)</span></label><select id="category-parent" name="parentId" defaultValue=""><option value="">Sin categoría padre</option>{compatibleParents.map((parent) => <option key={parent.id} value={parent.id}>{parent.name}</option>)}</select><p className="field-help">Solo se muestran padres activos del mismo tipo.</p></div>
    <button className="primary-button" type="submit" disabled={pending}>{pending ? "Creando categoría..." : "Crear categoría"}</button>
  </form>;
}
