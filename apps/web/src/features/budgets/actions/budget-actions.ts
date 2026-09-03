"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { budgetRepository, categoryRepository, createBudgetQueries, db } from "@know-finanzas/db";

import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { createBudgetService } from "../services/budget-service";
import { archiveBudgetSchema, createBudgetSchema, updateBudgetSchema } from "../schemas/budget-schemas";

const service = createBudgetService({
  budgets: budgetRepository,
  categories: categoryRepository,
  budgetQueries: createBudgetQueries(db),
});

export type BudgetActionState = { ok: true } | { ok: false; error: ReturnType<typeof mapErrorToUi> };

export async function createBudgetAction(
  _previousState: BudgetActionState | null,
  formData: FormData,
): Promise<BudgetActionState> {
  try {
    const user = await requireCurrentUser();
    const input = createBudgetSchema.parse({
      categoryId: formData.get("categoryId"),
      name: formData.get("name") || undefined,
      currencyCode: formData.get("currencyCode"),
      limitAmount: formData.get("limitAmount"),
    });
    await service.createBudget(user, input);
    revalidatePath("/budgets");
    revalidatePath("/dashboard");
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
  redirect("/budgets");
}

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
    await service.updateBudget(user, input);
    revalidatePath("/budgets");
    revalidatePath(`/budgets/${input.budgetId}`);
    revalidatePath("/dashboard");
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
  return { ok: true };
}

export async function archiveBudgetAction(
  _previousState: BudgetActionState | null,
  formData: FormData,
): Promise<BudgetActionState> {
  try {
    const user = await requireCurrentUser();
    const { budgetId } = archiveBudgetSchema.parse({ budgetId: formData.get("budgetId") });
    await service.archiveBudget(user, budgetId);
    revalidatePath("/budgets");
    revalidatePath("/dashboard");
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
  redirect("/budgets");
}
