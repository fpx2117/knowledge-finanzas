import { z } from "zod";

import { idSchema } from "@know-finanzas/validation";

const ruleShapeSchema = z.object({
  matcher: z.enum(["MERCHANT", "DESCRIPTION"]),
  mode: z.enum(["CONTAINS", "EQUALS", "STARTS_WITH"]),
  pattern: z.string().trim().min(2, "Escribí al menos 2 caracteres").max(120),
  categoryId: idSchema,
});

export const retroactiveWindowSchema = z.enum(["NONE", "LAST_30", "LAST_90", "ALL"]);

export const createClassificationRuleSchema = ruleShapeSchema
  .extend({ retroactive: retroactiveWindowSchema.default("NONE") })
  .strict();

export const previewClassificationRuleSchema = ruleShapeSchema
  .extend({ window: retroactiveWindowSchema.default("LAST_90") })
  .strict();

export type CreateClassificationRuleInput = z.infer<typeof ruleShapeSchema>;
export type RetroactiveWindowValue = z.infer<typeof retroactiveWindowSchema>;
