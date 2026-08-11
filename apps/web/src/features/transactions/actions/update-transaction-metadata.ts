"use server";
import { revalidatePath } from "next/cache";
import { accountRepository, categoryRepository, transactionRepository } from "@know-finanzas/db";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { updateTransactionSchema } from "../schemas/transaction-schemas";
import { createTransactionService } from "../services/transaction-service";
import { productAccessGate } from "@/lib/billing/product-access-gate.instance";
const service = createTransactionService({ accounts: accountRepository, categories: categoryRepository, transactions: transactionRepository, gate: productAccessGate });
export async function updateTransactionMetadataAction(formData: FormData) {
  try { const user = await requireCurrentUser(); const input = updateTransactionSchema.parse({ transactionId: formData.get("transactionId"), description: formData.get("description"), merchant: formData.get("merchant") || undefined, categoryId: formData.get("categoryId") || undefined, notes: formData.get("notes") || undefined }); await service.updateTransactionMetadata(user.id, input); revalidatePath("/transactions"); revalidatePath(`/transactions/${input.transactionId}`); revalidatePath("/budgets"); revalidatePath("/dashboard"); return { ok: true as const }; } catch (error) { return { ok: false as const, error: mapErrorToUi(error) }; }
}
