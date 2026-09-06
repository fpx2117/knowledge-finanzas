import { z } from "zod";

import { currencyCodeSchema, idSchema, localDateSchema, moneyInputSchema } from "@know-finanzas/validation";

export const GOAL_CATEGORIES = [
  "EMERGENCY_FUND",
  "TRAVEL",
  "VEHICLE",
  "HOME",
  "EDUCATION",
  "PURCHASE",
  "INVESTMENT",
  "OTHER",
] as const;

export const goalCategorySchema = z.enum(GOAL_CATEGORIES);

const nameSchema = z.string().trim().min(1, "Poné un nombre").max(120);
const notesSchema = z.string().trim().max(500).optional();
const nonNegativeAmountSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,6})?$/, "Monto inválido")
  .optional();

export const createGoalSchema = z
  .object({
    name: nameSchema,
    category: goalCategorySchema,
    currencyCode: currencyCodeSchema,
    targetAmount: moneyInputSchema,
    initialAmount: nonNegativeAmountSchema,
    targetDate: localDateSchema.optional(),
    notes: notesSchema,
  })
  .strict();

export const updateGoalSchema = z
  .object({
    goalId: idSchema,
    name: nameSchema,
    category: goalCategorySchema,
    targetAmount: moneyInputSchema,
    targetDate: localDateSchema.optional(),
    notes: notesSchema,
  })
  .strict();

export const contributeGoalSchema = z.object({ goalId: idSchema, amount: moneyInputSchema, note: notesSchema }).strict();

export const withdrawGoalSchema = z.object({ goalId: idSchema, amount: moneyInputSchema, note: notesSchema }).strict();

export const archiveGoalSchema = z.object({ goalId: idSchema }).strict();

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
