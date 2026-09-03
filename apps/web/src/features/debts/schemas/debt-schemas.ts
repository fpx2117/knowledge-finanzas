import { z } from "zod";

import { currencyCodeSchema, idSchema, localDateSchema, moneyInputSchema } from "@know-finanzas/validation";

export const debtTypeSchema = z.enum([
  "PERSONAL_LOAN",
  "PURCHASE_INSTALLMENTS",
  "MONEY_OWED_TO_PERSON",
  "SERVICE_DEBT",
  "OTHER",
]);

export const debtFrequencySchema = z.enum(["MONTHLY", "WEEKLY", "BIWEEKLY"]);

export const createDebtSchema = z
  .object({
    name: z.string().trim().min(1, "Ingresá un nombre").max(160),
    creditor: z.string().trim().max(160).optional(),
    type: debtTypeSchema,
    currencyCode: currencyCodeSchema,
    originalAmount: moneyInputSchema,
    startDate: localDateSchema,
    installmentCount: z.coerce.number().int().min(1, "Mínimo 1 cuota").max(120),
    frequency: debtFrequencySchema,
    notes: z.string().trim().max(2000).optional(),
  })
  .strict();

export const recordPaymentSchema = z
  .object({
    debtId: idSchema,
    accountId: idSchema,
    amount: moneyInputSchema,
    paidAt: localDateSchema.optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .strict();

export const cancelDebtSchema = z.object({ debtId: idSchema }).strict();

export type CreateDebtInput = z.infer<typeof createDebtSchema>;
