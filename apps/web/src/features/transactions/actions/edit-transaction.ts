"use server";

import { accountRepository, categoryMapRepository, categoryRepository, transactionRepository } from "@know-finanzas/db";

import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { emitFinancialEvent } from "@/lib/events/emit-financial-event";
import { createTransactionService } from "../services/transaction-service";
import { editTransactionSchema } from "../schemas/transaction-schemas";

const service = createTransactionService({
  accounts: accountRepository,
  categories: categoryRepository,
  transactions: transactionRepository,
  categoryMap: categoryMapRepository,
});

export type EditTransactionState = { ok: true } | { ok: false; error: ReturnType<typeof mapErrorToUi> };

export async function editTransactionAction(
  _previousState: EditTransactionState | null,
  formData: FormData,
): Promise<EditTransactionState> {
  try {
    const user = await requireCurrentUser();
    const input = editTransactionSchema.parse({
      transactionId: formData.get("transactionId"),
      description: formData.get("description"),
      merchant: formData.get("merchant") || undefined,
      categoryId: formData.get("categoryId") || undefined,
      notes: formData.get("notes") || undefined,
    });
    await service.editTransaction(user.id, input.transactionId, {
      description: input.description,
      merchant: input.merchant,
      categoryId: input.categoryId,
      notes: input.notes,
    });
    emitFinancialEvent({ type: "transaction.updated", entityPaths: [`/transactions/${input.transactionId}`] });
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
  return { ok: true };
}
