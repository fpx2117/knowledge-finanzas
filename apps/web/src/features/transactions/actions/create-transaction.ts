"use server";

import { redirect } from "next/navigation";

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
import { reportActionError } from "@/lib/observability/observe-action";
import { resolveOccurredAtISO } from "@/lib/date";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { emitFinancialEvent } from "@/lib/events/emit-financial-event";
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

export type TransactionActionState =
  | { ok: true }
  | { ok: false; error: ReturnType<typeof mapErrorToUi> }
  | { ok: false; duplicateOf: { description: string; occurredOn: string; amount: string } };

export async function createTransactionAction(
  _previousState: TransactionActionState | null,
  formData: FormData,
): Promise<TransactionActionState> {
  const type = formData.get("type") === "INCOME" ? "INCOME" : "EXPENSE";
  let userId: string | null = null;
  try {
    const user = await requireCurrentUser();
    userId = user.id;
    // `merchant` only belongs to the expense schema — both schemas are `.strict()`, so passing a
    // `merchant` key (even `undefined`) into the income parse is an unrecognized-key ZodError.
    const raw = {
      accountId: formData.get("accountId"),
      amount: formData.get("amount"),
      description: formData.get("description"),
      categoryId: formData.get("categoryId") || undefined,
      occurredAt: resolveOccurredAtISO(String(formData.get("occurredAt")), user.timezone),
      notes: formData.get("notes") || undefined,
      commandId: formData.get("commandId") || undefined,
    };

    if (type === "INCOME") {
      const input = createIncomeTransactionSchema.parse(raw);
      if (formData.get("allowDuplicate") !== "1") {
        const dup = await service.findLikelyIncomeDuplicate(user.id, { accountId: input.accountId, amount: input.amount, occurredAt: input.occurredAt });
        if (dup) return { ok: false, duplicateOf: { description: dup.description, occurredOn: dup.occurredOn, amount: dup.amount } };
      }
      await service.createIncomeTransaction(user.id, input, user.timezone);
    } else {
      const input = createExpenseTransactionSchema.parse({ ...raw, merchant: formData.get("merchant") || undefined });
      if (formData.get("allowDuplicate") !== "1") {
        const dup = await service.findLikelyExpenseDuplicate(user.id, { accountId: input.accountId, amount: input.amount, merchant: input.merchant ?? null, occurredAt: input.occurredAt });
        if (dup) return { ok: false, duplicateOf: { description: dup.description, occurredOn: dup.occurredOn, amount: dup.amount } };
      }
      await service.createExpenseTransaction(user.id, input, user.timezone);
    }

    emitFinancialEvent({ type: "transaction.created" });
  } catch (error) {
    reportActionError("transaction.create", userId, error);
    return { ok: false, error: mapErrorToUi(error) };
  }
  redirect("/transactions");
}
