"use server";

import { revalidatePath } from "next/cache";

import { budgetRepository, categoryRepository, createBudgetQueries, db } from "@know-finanzas/db";
import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { archiveBudgetSchema } from "../schemas/budget-schemas";
import { createBudgetService } from "../services/budget-service";
import type { BudgetActionState } from "./create-budget";

const service = createBudgetService({ budgets: budgetRepository, categories: categoryRepository, budgetQueries: createBudgetQueries(db) });

export async function archiveBudgetAction(_previousState: BudgetActionState | null, formData: FormData): Promise<BudgetActionState> {
  try {
    const user = await requireCurrentUser();
    const input = archiveBudgetSchema.parse({ budgetId: formData.get("budgetId") });
    await service.archiveBudget(user, input.budgetId);
    revalidatePath("/budgets");
    revalidatePath(`/budgets/${input.budgetId}`);
    revalidatePath("/dashboard");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: mapErrorToUi(error) };
  }
}
