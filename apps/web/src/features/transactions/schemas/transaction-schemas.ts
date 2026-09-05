import { z } from "zod";

import { idSchema, moneyInputSchema } from "@know-finanzas/validation";

const base = {
  accountId: idSchema,
  amount: moneyInputSchema,
  description: z.string().trim().min(1, "Ingresá una descripción").max(240),
  categoryId: idSchema.optional(),
  occurredAt: z.string().datetime({ offset: true }),
  notes: z.string().trim().max(2000).optional(),
  /** Idempotency key for a retried submit (spec 14 §38). */
  commandId: idSchema.optional(),
};

export const createIncomeTransactionSchema = z.object(base).strict();
export const createExpenseTransactionSchema = z
  .object({ ...base, merchant: z.string().trim().max(160).optional(), merchantId: idSchema.optional() })
  .strict();
export const voidTransactionSchema = z.object({ transactionId: idSchema }).strict();

// CM-02: bounded edit — description/merchant/category/notes only (never amount/date/account/type).
export const editTransactionSchema = z
  .object({
    transactionId: idSchema,
    description: z.string().trim().min(1, "Ingresá una descripción").max(240),
    merchant: z.string().trim().max(160).optional(),
    categoryId: idSchema.optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .strict();

export type CreateIncomeInput = z.infer<typeof createIncomeTransactionSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseTransactionSchema>;
