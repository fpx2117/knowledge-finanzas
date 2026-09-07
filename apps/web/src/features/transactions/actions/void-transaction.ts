"use server";

import { accountRepository, categoryRepository, transactionRepository } from "@know-finanzas/db";

import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { reportActionError } from "@/lib/observability/observe-action";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { emitFinancialEvent } from "@/lib/events/emit-financial-event";
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
  let userId: string | null = null;
  try {
    const user = await requireCurrentUser();
    userId = user.id;
    const { transactionId } = voidTransactionSchema.parse({ transactionId: formData.get("transactionId") });
    await service.voidTransaction(user.id, transactionId);
    emitFinancialEvent({ type: "transaction.voided", entityPaths: [`/transactions/${transactionId}`] });
  } catch (error) {
    reportActionError("transaction.void", userId, error);
    return { ok: false, error: mapErrorToUi(error) };
  }
  return { ok: true };
}
