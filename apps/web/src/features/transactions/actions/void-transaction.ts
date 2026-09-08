"use server";

import { accountRepository, categoryRepository, transactionRepository } from "@know-finanzas/db";

import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { reportActionError } from "@/lib/observability/observe-action";
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
  let userId: string | null = null;
  try {
    const user = await requireCurrentUser();
    userId = user.id;
    const { transactionId } = voidTransactionSchema.parse({ transactionId: formData.get("transactionId") });
    await service.voidTransaction(user.id, transactionId);
    // No emitFinancialEvent: este action se envía desde un <form> del ConfirmDialog en
    // /transactions/[id]; bajo Next 15.5 revalidatePath() en la respuesta del action cuelga la
    // transición de useActionState de forma intermitente (más probable con más rutas o bajo
    // carga). `TransactionActions` hace router.refresh() al terminar — busta el Router Cache
    // entero y toda página (app) es dinámica.
  } catch (error) {
    reportActionError("transaction.void", userId, error);
    return { ok: false, error: mapErrorToUi(error) };
  }
  return { ok: true };
}
