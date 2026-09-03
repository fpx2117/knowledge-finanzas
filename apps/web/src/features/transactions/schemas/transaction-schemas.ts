import { z } from "zod";

import { idSchema, moneyInputSchema } from "@know-finanzas/validation";

const base = {
  accountId: idSchema,
  amount: moneyInputSchema,
  description: z.string().trim().min(1, "Ingresá una descripción").max(240),
  categoryId: idSchema.optional(),
  occurredAt: z.string().datetime({ offset: true }),
  notes: z.string().trim().max(2000).optional(),
};

export const createIncomeTransactionSchema = z.object(base).strict();
export const createExpenseTransactionSchema = z
  .object({ ...base, merchant: z.string().trim().max(160).optional(), merchantId: idSchema.optional() })
  .strict();
export const voidTransactionSchema = z.object({ transactionId: idSchema }).strict();

export type CreateIncomeInput = z.infer<typeof createIncomeTransactionSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseTransactionSchema>;
