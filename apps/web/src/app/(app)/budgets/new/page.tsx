import Link from "next/link";
import { categoryRepository } from "@know-finanzas/db";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { createCategoryService } from "@/features/categories/services/category-service";
import { BudgetForm } from "@/features/budgets/components/budget-form";

export default async function NewBudgetPage() {
  const user = await requireCurrentUser();
  const categories = await createCategoryService({ categories: categoryRepository }).listCategories(user.id, { type: "EXPENSE" });

  return (
    <>
      <Link className="back-link" href="/budgets">← Volver a presupuestos</Link>
      <div className="form-page-header">
        <p className="eyebrow">Nuevo presupuesto</p>
        <h1>Definí un límite mensual.</h1>
        <p className="lede">El presupuesto compara tu consumo neto de la categoría contra el límite que definas cada mes.</p>
      </div>
      <BudgetForm categories={categories} />
    </>
  );
}
