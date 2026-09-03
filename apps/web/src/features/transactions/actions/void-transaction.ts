"use server";

import { revalidatePath } from "next/cache";

import { accountRepository, categoryRepository, transactionRepository } from "@know-finanzas/db";

import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { createTransactionService } from "../services/transaction-service";
import { voidTransactionSchema } from "../schemas/transaction-schemas";

const service = createTransactionService({
  accounts: accountRepository,
  categories: categoryRepository,
  transactions: transactionRepository,
});

export type VoidTransactionState = { ok: true } | { ok: false; error: ReturnType<typeof mapErrorToUi> };

export async function voidTransactionAction(
  _previousState: VoidTransactionState | null,
  formData: FormData,
): Promise<VoidTransactionState> {
  try {
    const user = await requireCurrentUser();
    const { transactionId } = voidTransactionSchema.parse({ transactionId: formData.get("transactionId") });
    await service.voidTransaction(user.id, transactionId);
    revalidatePath("/transactions");
    revalidatePath(`/transactions/${transactionId}`);
    revalidatePath("/accounts");
    revalidatePath("/dashboard");
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
  return { ok: true };
}
