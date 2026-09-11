import { assistantChat, runWithGenerationContext } from "@know-finanzas/ai";
import { env } from "@know-finanzas/config";

import { aiProvider } from "@/lib/ai/execute-ai-capability.instance";
import { productAccessGate } from "@/lib/billing/product-access-gate.instance";
import { buildAssistantSnapshot } from "./assistant-snapshot";
import type { CurrentUser } from "@/lib/auth/require-current-user";
import type { KaiLlmFallback } from "@know-finanzas/kai";

/**
 * The last resort of the KAI pipeline (spec §17). Only reached when nothing deterministic
 * matched and the KAI-points check + USD budget guard allowed it.
 *
 * It does NOT touch the AI credit pool: KAI has one meter, KAI points (the LLM path costs 5).
 * We still wrap the call in a generation context so `ai_generation_events` records the real
 * USD cost — that feeds the per-user / global USD budget guard.
 *
 * The minimum context sent to the model is the pre-computed finance snapshot
 * (`buildAssistantSnapshot`), never raw transactions (spec §18).
 */
export function createKaiLlmFallback(user: CurrentUser, operationId: string): KaiLlmFallback {
  return async ({ message, history, complexity }) => {
    if (!env.AI_ENABLED) {
      throw new Error("El análisis con IA no está disponible en este momento. Puedo responder igual con tus datos.");
    }
    const access = await productAccessGate.getAccessState(user.id).catch(() => "FREE" as const);
    if (access === "NO_ACCESS") {
      throw new Error("Necesitás una cuenta activa para usar el análisis con IA.");
    }

    const snapshot = await buildAssistantSnapshot(user.id, user.timezone, user.baseCurrency);
    // FREE/EXPIRED stay on the fast model regardless of complexity — cost control for the tier
    // that isn't paying for KAI points. Otherwise: a genuine reasoning question (spec §17
    // WP-KAI-LLM-COMPLEX, weighted 10 points instead of 5) gets the REASONING model — but only
    // when one is actually configured; AI_MODEL_REASONING is optional (unset in a fresh deploy
    // until someone picks a model for it), and resolveModel() throws AI_MODEL_UNAVAILABLE for an
    // unconfigured role rather than degrading, so an unset env var must never reach it.
    const role =
      access === "FREE" || access === "EXPIRED_READ_ONLY"
        ? ("FAST" as const)
        : complexity === "complex" && env.AI_MODEL_REASONING
          ? ("REASONING" as const)
          : undefined;

    const { reply } = await runWithGenerationContext(
      { userId: user.id, capability: "assistant.query.kai", operationId, creditsCharged: 0 },
      () => assistantChat(aiProvider, { snapshot, history: history.map((t) => ({ role: t.role, content: t.content })), message }, { role }),
    );

    // Real USD cost lives in `ai_generation_events` (written by the telemetry provider) and
    // drives the budget guard; the KAI audit row tracks points, not dollars.
    return { response: { type: "KAI_TEXT", state: "NEUTRAL", body: reply }, aiCostUsd: 0 };
  };
}
