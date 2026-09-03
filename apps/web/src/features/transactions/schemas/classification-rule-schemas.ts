import { z } from "zod";

import { idSchema } from "@know-finanzas/validation";

export const createClassificationRuleSchema = z
  .object({
    matcher: z.enum(["MERCHANT", "DESCRIPTION"]),
    mode: z.enum(["CONTAINS", "EQUALS", "STARTS_WITH"]),
    pattern: z.string().trim().min(2, "Escribí al menos 2 caracteres").max(120),
    categoryId: idSchema,
  })
  .strict();

export type CreateClassificationRuleInput = z.infer<typeof createClassificationRuleSchema>;
