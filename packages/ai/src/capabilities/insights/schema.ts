import { z } from "zod";

export const financialInsightSchema = z.object({
  answer: z.string().min(1).max(2000),
  // Names of the tool results this answer actually drew from (docs task-038: "citations/source
  // labels, linked source entities") — lets the UI show what grounded the statement.
  sources: z.array(z.string()).max(10),
  limitations: z.string().max(500).optional(),
});

export type FinancialInsight = z.infer<typeof financialInsightSchema>;
