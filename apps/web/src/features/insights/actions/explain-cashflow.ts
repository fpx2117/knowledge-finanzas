"use server";

import { randomUUID } from "node:crypto";

import { AIError } from "@know-finanzas/ai";
import { env } from "@know-finanzas/config";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { mapAIActionErrorToUi } from "@/lib/ai/map-ai-error";
import { getFinancialInsight } from "@/lib/ai/insight-service.instance";

export type ExplainCashflowResult =
  | { ok: true; answer: string; sources: string[]; limitations?: string }
  | { ok: false; error: ReturnType<typeof mapAIActionErrorToUi> };

// One contextual "Ask" affordance for this foundation (docs task-038 UI Changes: "contextual Ask
// actions" — a full global assistant entry point is out of scope until product scope expands).
export async function explainCashflowAction(): Promise<ExplainCashflowResult> {
  try {
    if (!env.AI_ENABLED) throw new AIError("AI_DISABLED");

    const user = await requireCurrentUser();
    const insight = await getFinancialInsight({ userId: user.id, capability: "cashflow.explain", operationId: randomUUID() });

    return { ok: true, answer: insight.answer, sources: insight.sources, limitations: insight.limitations };
  } catch (error) {
    return { ok: false, error: mapAIActionErrorToUi(error) };
  }
}
