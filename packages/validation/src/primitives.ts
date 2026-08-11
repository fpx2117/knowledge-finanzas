import { z } from "zod";

export const idSchema = z.string().uuid();

export const currencyCodeSchema = z
  .string()
  .length(3)
  .regex(/^[A-Z]{3}$/, "Currency must use an uppercase ISO-style code");

export const moneyInputSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,6})?$/, "Amount must be a decimal string")
  .refine((value) => !/^0+(\.0+)?$/.test(value), {
    message: "Amount must be greater than zero",
  });

export const openingBalanceInputSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,6})?$/, "Amount must be a decimal string");

export const localDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format");

// Accepts raw user input (any case/whitespace) and normalizes it the same way
// normalizePromotionCode (@know-finanzas/promotions) does, so a form can validate + normalize in
// one pass before the code ever reaches the application layer.
export const promotionCodeInputSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9-]{4,32}$/, "Code must be 4-32 characters using only A-Z, 0-9 and -");
