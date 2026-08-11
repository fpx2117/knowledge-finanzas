"use server";

import { revalidatePath } from "next/cache";

import { budgetRepository, categoryRepository, createBudgetQueries, db } from "@know-finanzas/db";
import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { updateBudgetSchema } from "../schemas/budget-schemas";
import { createBudgetService } from "../services/budget-service";
import type { BudgetActionState } from "./create-budget";

const service = createBudgetService({ budgets: budgetRepository, categories: categoryRepository, budgetQueries: createBudgetQueries(db) });

export async function updateBudgetAction(
  _previousState: BudgetActionState | null,
  formData: FormData,
): Promise<BudgetActionState> {
  try {
    const user = await requireCurrentUser();
    const input = updateBudgetSchema.parse({
      budgetId: formData.get("budgetId"),
      name: formData.get("name") || undefined,
      limitAmount: formData.get("limitAmount"),
    });

    const budget = await service.updateBudget(user, input);
    revalidatePath("/budgets");
    revalidatePath(`/budgets/${budget.id}`);
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
}
