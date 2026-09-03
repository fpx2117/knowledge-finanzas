import { z } from "zod";

import { idSchema, moneyInputSchema } from "@know-finanzas/validation";

export const createTransferSchema = z
  .object({
    fromAccountId: idSchema,
    toAccountId: idSchema,
    amount: moneyInputSchema,
    occurredAt: z.string().datetime({ offset: true }),
    notes: z.string().trim().max(1000).optional(),
  })
  .strict();

export const voidTransferSchema = z.object({ transferId: idSchema }).strict();

export type CreateTransferInput = z.infer<typeof createTransferSchema>;
