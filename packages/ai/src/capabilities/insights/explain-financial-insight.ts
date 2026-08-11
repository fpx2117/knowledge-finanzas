import type { ContextBuilder } from "../../context/context-builder";
import type { AIProvider } from "../../provider";
import { buildInsightPrompt, INSIGHT_CAPABILITY_TOOLS, INSIGHT_PROMPT_VERSION, type InsightCapability } from "./prompt";
import { financialInsightSchema, type FinancialInsight } from "./schema";

export type ExplainFinancialInsightInput = { userId: string; capability: InsightCapability; question?: string };

// Ties the context builder (deterministic, tool-grounded data) to a single structured-output
// call. Finance engine numbers are never recomputed by the model — it only ever explains what
// the tools already computed (docs task-038 Domain Rules: "Finance engine computes every number;
// AI only explains supplied results").
export async function explainFinancialInsight(
  dependencies: { provider: AIProvider; contextBuilder: ContextBuilder },
  input: ExplainFinancialInsightInput,
): Promise<FinancialInsight> {
  const toolNames = INSIGHT_CAPABILITY_TOOLS[input.capability];
  const context = await dependencies.contextBuilder.buildContext(input.userId, toolNames);

  const result = await dependencies.provider.generateStructured({
    role: "BALANCED",
    capability: input.capability,
    promptVersion: INSIGHT_PROMPT_VERSION,
    prompt: buildInsightPrompt({ capability: input.capability, question: input.question, context }),
    schema: financialInsightSchema,
    schemaName: "financial_insight",
  });

  return result.data;
}
