import { createContextBuilder, explainFinancialInsight, type InsightCapability } from "@know-finanzas/ai";
import { financeToolRegistry } from "./finance-tools.instance";
import { aiProvider } from "./openrouter-provider.instance";
import { executeAICapability } from "./execute-ai-capability.instance";

const contextBuilder = createContextBuilder(financeToolRegistry);

// One assistant/insight turn uses the shared capability-based credit operation (docs task-038
// Scope) — identical wiring to the categorization capability (TASK-037), just a different
// execute() payload.
export async function getFinancialInsight(input: { userId: string; capability: InsightCapability; question?: string; operationId: string }) {
  return executeAICapability({
    userId: input.userId,
    capability: input.capability,
    operationId: input.operationId,
    execute: () => explainFinancialInsight({ provider: aiProvider, contextBuilder }, { userId: input.userId, capability: input.capability, question: input.question }),
  });
}
