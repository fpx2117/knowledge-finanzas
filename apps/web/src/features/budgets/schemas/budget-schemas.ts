import { z } from "zod";

import { currencyCodeSchema, idSchema, moneyInputSchema } from "@know-finanzas/validation";

const budgetNameSchema = z.string().trim().max(120).optional();

export const createBudgetSchema = z
  .object({
    categoryId: idSchema,
    name: budgetNameSchema,
    currencyCode: currencyCodeSchema,
    limitAmount: moneyInputSchema,
  })
  .strict();

export const updateBudgetSchema = z
  .object({ budgetId: idSchema, name: budgetNameSchema, limitAmount: moneyInputSchema })
  .strict();

export const archiveBudgetSchema = z.object({ budgetId: idSchema }).strict();

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
