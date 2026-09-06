import { explainInsight, type InsightExplanation } from "@know-finanzas/ai";

import { aiProvider, executeAICapability } from "./execute-ai-capability.instance";

// spec 09 §20 — the AI only restates an already-materialised insight. Every safety invariant
// (access, entitlement, credit reserve/commit, rate limit, telemetry) runs inside
// executeAICapability; this module just supplies the evidence and the execute() payload.
export async function explainInsightWithAI(input: {
  userId: string;
  operationId: string;
  insight: { family: string; title: string; body: string; evidence: unknown };
}): Promise<InsightExplanation> {
  return executeAICapability({
    userId: input.userId,
    capability: "insight.explain",
    operationId: input.operationId,
    execute: () => explainInsight(aiProvider, input.insight),
  });
}
