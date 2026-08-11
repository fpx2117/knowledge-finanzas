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
export const createExpenseTransactionSchema = z.object({ ...base, merchant: z.string().trim().max(160).optional() }).strict();
export const transactionListSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  accountId: idSchema.optional(),
  categoryId: idSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
}).strict();

export const updateTransactionSchema = z.object({ transactionId: idSchema, description: z.string().trim().min(1).max(240), categoryId: idSchema.optional(), notes: z.string().trim().max(2000).optional(), merchant: z.string().trim().max(160).optional() }).strict();
export const voidTransactionSchema = z.object({ transactionId: idSchema }).strict();
export const createRefundSchema = z.object({ accountId: idSchema, originalTransactionId: idSchema, amount: moneyInputSchema, occurredAt: z.string().datetime({ offset: true }), notes: z.string().trim().max(2000).optional() }).strict();
export const createAdjustmentSchema = z.object({ accountId: idSchema, type: z.enum(["ADJUSTMENT_IN", "ADJUSTMENT_OUT"]), amount: moneyInputSchema, reason: z.string().trim().min(1).max(500), occurredAt: z.string().datetime({ offset: true }), relatedTransactionId: idSchema.optional(), notes: z.string().trim().max(2000).optional() }).strict();
