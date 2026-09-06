import type { AIProvider } from "../../provider";
import {
  buildInsightExplanationPrompt,
  INSIGHT_EXPLANATION_PROMPT_VERSION,
  type InsightExplanationInput,
} from "./prompt";
import { insightExplanationSchema, type InsightExplanation } from "./schema";

/**
 * spec 09 §20 — a single structured-output call that restates an already-materialised insight.
 * The finance engine / detector computed everything; this only rewords it. One call, no tools,
 * no loop; the caller supplies the evidence and falls back to the deterministic body on failure.
 */
export async function explainInsight(provider: AIProvider, input: InsightExplanationInput): Promise<InsightExplanation> {
  const result = await provider.generateStructured({
    role: "FAST",
    capability: "insight.explain",
    promptVersion: INSIGHT_EXPLANATION_PROMPT_VERSION,
    prompt: buildInsightExplanationPrompt(input),
    schema: insightExplanationSchema,
    schemaName: "insight_explanation",
  });
  return result.data;
}
