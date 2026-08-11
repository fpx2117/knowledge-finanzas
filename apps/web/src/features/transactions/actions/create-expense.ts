"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { accountRepository, categoryRepository, transactionRepository } from "@know-finanzas/db";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { createExpenseTransactionSchema } from "../schemas/transaction-schemas";
import { createTransactionService } from "../services/transaction-service";
import { productAccessGate } from "@/lib/billing/product-access-gate.instance";
import { analyticsService, isInternalAccount } from "@/lib/analytics/analytics-service.instance";
import { bucketAmount } from "@know-finanzas/analytics";
import { checkAndEmitActivation } from "@/lib/analytics/check-and-emit-activation";
const service = createTransactionService({ accounts: accountRepository, categories: categoryRepository, transactions: transactionRepository, gate: productAccessGate });
export async function createExpenseAction(_previousState: unknown, formData: FormData) {
  try {
    const user = await requireCurrentUser(); const raw = { accountId: formData.get("accountId"), amount: formData.get("amount"), description: formData.get("description"), merchant: formData.get("merchant") || undefined, categoryId: formData.get("categoryId") || undefined, occurredAt: `${String(formData.get("occurredAt"))}T12:00:00Z`, notes: formData.get("notes") || undefined }; const input = createExpenseTransactionSchema.parse(raw);
    const transaction = await service.createExpenseTransaction(user.id, input, user.timezone) as { id: string; currencyCode: string };
    const internal = isInternalAccount(user.email);
    await analyticsService("transaction_created", { type: "EXPENSE", amountBucket: bucketAmount(Number(input.amount)), currencyCode: transaction.currencyCode }, { eventId: `transaction_created:${transaction.id}`, userId: user.id, internal });
    await checkAndEmitActivation(user.id);
    revalidatePath("/transactions"); revalidatePath("/accounts"); revalidatePath("/budgets"); revalidatePath("/dashboard");
  } catch (error) { return { ok: false as const, error: mapErrorToUi(error) }; }
  redirect("/transactions");
}
