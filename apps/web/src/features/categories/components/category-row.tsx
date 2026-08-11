"use client";

import { useState } from "react";
import { archiveCategoryAction } from "../actions/archive-category";
import { updateCategoryAction } from "../actions/update-category";

export function CategoryRow({ category }: { category: { id: string; name: string; type: string; parentId: string | null; status: string } }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  return <li className="category-row"><div className="category-row-main"><span className={`category-dot ${category.type.toLowerCase()}`} aria-hidden="true" /><div><strong>{category.name}</strong><p>{category.parentId ? "Subcategoría" : "Categoría principal"} · {category.type === "EXPENSE" ? "Gasto" : "Ingreso"}</p></div><span className="status-badge">{category.status === "ACTIVE" ? "Activa" : "Archivada"}</span></div>{category.status === "ACTIVE" && <div className="category-actions">{editing ? <form action={async (formData) => { await updateCategoryAction(formData); }}><input type="hidden" name="categoryId" value={category.id} /><label className="sr-only" htmlFor={`rename-${category.id}`}>Nuevo nombre para {category.name}</label><input id={`rename-${category.id}`} name="name" defaultValue={category.name} required /><input type="hidden" name="parentId" value={category.parentId ?? ""} /><button className="secondary-button" type="submit">Guardar</button><button className="text-button" type="button" onClick={() => setEditing(false)}>Cancelar</button></form> : <><button className="text-button" type="button" onClick={() => setEditing(true)}>Renombrar</button>{confirming ? <form action={async (formData) => { await archiveCategoryAction(formData); }}><input type="hidden" name="categoryId" value={category.id} /><button className="text-button danger" type="submit">Confirmar archivo</button><button className="text-button" type="button" onClick={() => setConfirming(false)}>Cancelar</button></form> : <button className="text-button danger" type="button" onClick={() => setConfirming(true)}>Archivar</button>}</>}</div>}</li>;
}
