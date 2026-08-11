import { z } from "zod";

// The model never returns a real categoryId — only a candidate token from the list the server
// sent it (docs/17-ai-categorization-slice.md §52-56) — reduces hallucinated UUIDs/copy mistakes
// to a simple "is this token in the list we sent" check.
export const transactionCategorizationSchema = z.object({
  candidate: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  reason: z.string().max(240).optional(),
});

export type RawTransactionCategorization = z.infer<typeof transactionCategorizationSchema>;
