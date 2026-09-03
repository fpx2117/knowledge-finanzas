"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  accountRepository,
  categoryMapRepository,
  categoryRepository,
  classificationRuleRepository,
  merchantRepository,
  merchantUserDefaultRepository,
  transactionRepository,
} from "@know-finanzas/db";

import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { createTransactionService } from "../services/transaction-service";
import { createExpenseTransactionSchema, createIncomeTransactionSchema } from "../schemas/transaction-schemas";

const service = createTransactionService({
  accounts: accountRepository,
  categories: categoryRepository,
  transactions: transactionRepository,
  merchants: merchantRepository,
  categoryMap: categoryMapRepository,
  merchantDefaults: merchantUserDefaultRepository,
  classificationRules: classificationRuleRepository,
});

export type TransactionActionState = { ok: true } | { ok: false; error: ReturnType<typeof mapErrorToUi> };

export async function createTransactionAction(
  _previousState: TransactionActionState | null,
  formData: FormData,
): Promise<TransactionActionState> {
  const type = formData.get("type") === "INCOME" ? "INCOME" : "EXPENSE";
  try {
    const user = await requireCurrentUser();
    const raw = {
      accountId: formData.get("accountId"),
      amount: formData.get("amount"),
      description: formData.get("description"),
      categoryId: formData.get("categoryId") || undefined,
      merchant: formData.get("merchant") || undefined,
      occurredAt: `${String(formData.get("occurredAt"))}T12:00:00Z`,
      notes: formData.get("notes") || undefined,
    };

    if (type === "INCOME") {
      const input = createIncomeTransactionSchema.parse(raw);
      await service.createIncomeTransaction(user.id, input, user.timezone);
    } else {
      const input = createExpenseTransactionSchema.parse(raw);
      await service.createExpenseTransaction(user.id, input, user.timezone);
    }

    revalidatePath("/transactions");
    revalidatePath("/accounts");
    revalidatePath("/budgets");
    revalidatePath("/dashboard");
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
  redirect("/transactions");
}
