import { z } from "zod";

import { currencyCodeSchema, idSchema, localDateSchema, openingBalanceInputSchema } from "@know-finanzas/validation";

export const accountTypeSchema = z.enum(["CASH", "BANK", "DIGITAL_WALLET", "SAVINGS"]);

export const createAccountSchema = z
  .object({
    name: z.string().trim().min(1, "Ingresá un nombre").max(120),
    type: accountTypeSchema,
    // Institution registry slug — optional, "" / "all" normalised to undefined by the form.
    institution: z
      .string()
      .trim()
      .max(60)
      .optional()
      .transform((value) => (value && value !== "all" ? value : undefined)),
    currencyCode: currencyCodeSchema,
    isPrimary: z
      .union([z.literal("on"), z.literal("true"), z.literal("1"), z.boolean()])
      .optional()
      .transform((value) => value === true || value === "on" || value === "true" || value === "1"),
    openingBalance: openingBalanceInputSchema,
    openingDate: localDateSchema,
  })
  .strict()
  // §RF — un banco en KnowFinanzas es siempre en pesos (el usuario lleva sus cuentas en ARS;
  // los dólares van a una cuenta de ahorro/inversión).
  .refine((v) => v.type !== "BANK" || v.currencyCode === "ARS", {
    message: "Las cuentas de tipo Banco se llevan en pesos (ARS).",
    path: ["currencyCode"],
  });

export const updateAccountMetadataSchema = z
  .object({ accountId: idSchema, name: z.string().trim().min(1, "Ingresá un nombre").max(120) })
  .strict();

export const archiveAccountSchema = z.object({ accountId: idSchema }).strict();

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type AccountType = z.infer<typeof accountTypeSchema>;
