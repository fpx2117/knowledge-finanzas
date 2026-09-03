import { categoryRepository } from "@know-finanzas/db";

import { FormPage } from "@/components/shared/form-page";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { BudgetForm } from "@/features/budgets/components/budget-form";

export default async function NewBudgetPage() {
  const user = await requireCurrentUser();
  const categories = await categoryRepository.listForUser(user.id, { type: "EXPENSE" });

  return (
    <FormPage
      backHref="/budgets"
      backLabel="Volver a presupuestos"
      eyebrow="Nuevo presupuesto"
      title="Poné un límite mensual"
      description="Elegí una categoría de gasto y cuánto querés destinarle por mes."
    >
      <BudgetForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} baseCurrency={user.baseCurrency} />
    </FormPage>
  );
}
