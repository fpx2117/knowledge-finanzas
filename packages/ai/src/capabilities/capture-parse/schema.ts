import { z } from "zod";

const nullableText = (max: number) => z.string().trim().min(1).max(max).nullable();
const positiveAmount = z
  .string()
  .regex(/^(?:0|[1-9]\d{0,13})(?:\.\d{1,2})?$/)
  .refine((amount) => !/^0(?:\.0{1,2})?$/.test(amount));

export const captureParseSchema = z.object({
  type: z.enum(["EXPENSE", "INCOME", "TRANSFER"]),
  amount: positiveAmount.nullable(),
  description: z.string().trim().min(1).max(120),
  merchantText: nullableText(80),
  institutionText: nullableText(80),
  confidence: z.number().min(0).max(1),
  ambiguities: z.array(z.string().trim().min(1).max(120)).max(4),
}).strict().superRefine((draft, context) => {
  if (draft.amount === null && draft.ambiguities.length === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["ambiguities"],
      message: "A missing amount must be reported as ambiguous.",
    });
  }
});

export type CaptureParseResult = z.infer<typeof captureParseSchema>;
