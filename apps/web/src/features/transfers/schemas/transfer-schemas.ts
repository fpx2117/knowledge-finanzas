import { z } from "zod";
import { idSchema } from "@know-finanzas/validation";

export const createTransferSchema = z.object({
  fromAccountId: idSchema,
  toAccountId: idSchema,
  amount: z.string().trim().regex(/^\d+(\.\d{1,6})?$/, "Amount must be a decimal string"),
  occurredAt: z.string().datetime({ offset: true }),
  notes: z.string().trim().max(1000).optional(),
}).strict();
