import { z } from "zod";

import {
  currencyCodeSchema,
  idSchema,
  localDateSchema,
  openingBalanceInputSchema,
} from "@know-finanzas/validation";

export const accountTypeSchema = z.enum([
  "CASH",
  "BANK",
  "DIGITAL_WALLET",
  "SAVINGS",
]);

export const createAccountSchema = z.object({
  name: z.string().trim().min(1, "Ingresá un nombre").max(120),
  type: accountTypeSchema,
  currencyCode: currencyCodeSchema,
  openingBalance: openingBalanceInputSchema,
  openingDate: localDateSchema,
}).strict();

export const updateAccountMetadataSchema = z.object({
  accountId: idSchema,
  name: z.string().trim().min(1, "Ingresá un nombre").max(120),
}).strict();

export const archiveAccountSchema = z.object({
  accountId: idSchema,
}).strict();

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
