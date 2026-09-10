import { z } from "zod";

import { currencyCodeSchema, localDateSchema, moneyInputSchema } from "@know-finanzas/validation";

export const createSubscriptionSchema = z
  .object({
    merchantName: z.string().trim().min(1, "Ingresá el nombre").max(120),
    amount: moneyInputSchema,
    currencyCode: currencyCodeSchema,
    frequency: z.enum(["MONTHLY", "YEARLY"]),
    nextChargeOn: localDateSchema,
  })
  .strict();

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
