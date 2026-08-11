"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { budgetRepository, categoryRepository, createBudgetQueries, db } from "@know-finanzas/db";
import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { createBudgetSchema } from "../schemas/budget-schemas";
import { createBudgetService } from "../services/budget-service";
import { productAccessGate } from "@/lib/billing/product-access-gate.instance";

const service = createBudgetService({ budgets: budgetRepository, categories: categoryRepository, budgetQueries: createBudgetQueries(db), gate: productAccessGate });

export type BudgetActionState =
  | { ok: true }
  | { ok: false; error: ReturnType<typeof mapErrorToUi> };

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
