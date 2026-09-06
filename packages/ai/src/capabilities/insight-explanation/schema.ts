import { z } from "zod";

export const insightExplanationSchema = z.object({
  // A plainer-language restatement of the insight, grounded strictly on the evidence package.
  explanation: z.string().min(1).max(1500),
  // Anything the evidence doesn't cover — surfaced instead of guessed (spec 09 §9.4).
  caveats: z.string().max(400).optional(),
});

export type InsightExplanation = z.infer<typeof insightExplanationSchema>;
