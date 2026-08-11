import { categoryRepository } from "@know-finanzas/db";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { createCategoryService } from "@/features/categories/services/category-service";
import { CategoryForm } from "@/features/categories/components/category-form";
import { CategoryRow } from "@/features/categories/components/category-row";

const service = createCategoryService({ categories: categoryRepository });

export default async function CategoriesSettingsPage() {
  const user = await requireCurrentUser();
  const [categories, parents] = await Promise.all([
    service.listCategories(user.id, { includeArchived: true }),
    service.listCategories(user.id),
  ]);
  const active = categories.filter((category) => category.status === "ACTIVE");
  const archived = categories.filter((category) => category.status === "ARCHIVED");

  return <><div className="settings-kicker"><span>Configuración</span><span aria-hidden="true">/</span><span>Categorías</span></div><header className="page-header"><div><p className="eyebrow">Clasificá mejor</p><h1>Categorías</h1><p className="lede">Administrá las categorías que usás para entender tus movimientos.</p></div></header><div className="categories-layout"><section><div className="section-heading"><h2>Categorías activas</h2><span>{active.length}</span></div>{active.length === 0 ? <div className="category-empty" role="status"><h3>Todavía no tenés categorías.</h3><p>Creá categorías de gastos e ingresos para clasificar tus movimientos.</p></div> : <ul className="category-list">{active.map((category) => <CategoryRow category={category} key={category.id} />)}</ul>}{archived.length > 0 && <><div className="section-heading archived-heading"><h2>Archivadas</h2><span>{archived.length}</span></div><ul className="category-list archived-list">{archived.map((category) => <CategoryRow category={category} key={category.id} />)}</ul></>}</section><aside><p className="card-label">Nueva categoría</p><CategoryForm parents={parents} /></aside></div></>;
}
