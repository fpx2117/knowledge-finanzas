"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { accountRepository, categoryRepository, transactionRepository } from "@know-finanzas/db";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { voidTransactionSchema } from "../schemas/transaction-schemas";
import { createTransactionService } from "../services/transaction-service";
const service = createTransactionService({ accounts: accountRepository, categories: categoryRepository, transactions: transactionRepository });
export async function voidTransactionAction(_previous: unknown, formData: FormData) {
  try { const user = await requireCurrentUser(); const input = voidTransactionSchema.parse({ transactionId: formData.get("transactionId") }); await service.voidTransaction(user.id, input.transactionId); revalidatePath("/transactions"); revalidatePath(`/transactions/${input.transactionId}`); revalidatePath("/accounts"); revalidatePath("/budgets"); revalidatePath("/dashboard"); } catch (error) { return { ok: false as const, error: mapErrorToUi(error) }; }
  redirect("/transactions");
}
