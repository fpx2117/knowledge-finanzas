"use server";

import { randomUUID } from "node:crypto";

import { kaiInteractionRepository } from "@know-finanzas/db";
import { explainInsight, runWithGenerationContext } from "@know-finanzas/ai";
import { env } from "@know-finanzas/config";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { aiProvider } from "@/lib/ai/execute-ai-capability.instance";
import { createInsightService } from "@/features/insights/services/insight-service";
import { getKaiAccess, type KaiAccess } from "../lib/kai-points.instance";
import { createKaiBudgetGuard } from "../lib/kai-budget-guard.instance";

const insightService = createInsightService();

export type KaiExplainInsightResult =
  | { ok: true; explanation: string; caveats: string | null; access: KaiAccess | null }
  | { ok: false; error: { code: string; message: string }; access: KaiAccess | null };

/**
 * WP-KAI-LLM-EXPLAIN (spec §17): "Explicame el detalle" on a KAI_INSIGHT card, without leaving
 * the chat. Reuses the exact same `insight-explanation` capability the /insights page's
 * "Explicar" button calls — same prompt, same guardrails (it only restates the already-computed
 * evidence, never invents a number) — but charged in **KAI points**, not AI credits.
 *
 * That's a deliberate decision, not an oversight: KAI has a single meter (spec §19 — "1 point
 * deterministic, 5 an LLM analysis"), and letting one of its own buttons quietly spend the old
 * AI-credit pool instead would reintroduce the two-meter confusion the KAI redesign was meant to
 * remove. So this bypasses `executeAICapability`'s credit reservation and instead goes through
 * the same KAI-points gate + USD budget guard as every other KAI LLM call, and records its own
 * `kai_interactions` row (weight 5 — restating one already-detected insight is not the "complex
 * reasoning" WP-KAI-LLM-COMPLEX prices at 10).
 */
export async function kaiExplainInsightAction(insightId: string): Promise<KaiExplainInsightResult> {
  const user = await requireCurrentUser();
  const now = new Date();

  const access = await getKaiAccess(user.id, user.timezone, now).catch(() => null);
  if (access && !access.unlimited && (access.remaining ?? 1) <= 0) {
    return {
      ok: false,
      error: { code: "KAI_POINTS_EXHAUSTED", message: "Llegaste al límite de consultas de KAI de este mes. Con PRO son ilimitadas." },
      access,
    };
  }

  if (!env.AI_ENABLED) {
    return { ok: false, error: { code: "AI_DISABLED", message: "El análisis con IA no está disponible en este momento." }, access };
  }

  try {
    await createKaiBudgetGuard(user.id, () => now)();
  } catch (error) {
    return {
      ok: false,
      error: { code: "AI_USAGE_LIMIT_REACHED", message: error instanceof Error ? error.message : "Alcanzaste el límite de análisis con IA por ahora." },
      access,
    };
  }

  const insight = await insightService.getDetail(user, insightId).catch(() => null);
  if (!insight) {
    return { ok: false, error: { code: "NOT_FOUND", message: "No encontré ese insight." }, access };
  }

  const startedAt = Date.now();
  try {
    const operationId = `kai-explain-insight:${insightId}:${randomUUID()}`;
    const result = await runWithGenerationContext(
      { userId: user.id, capability: "insight.explain", operationId, creditsCharged: 0 },
      () => explainInsight(aiProvider, { family: insight.family, title: insight.title, body: insight.body, evidence: insight.evidence }),
    );

    let recorded = true;
    try {
      await kaiInteractionRepository.record({
        userId: user.id,
        intentId: "EXPLAIN_INSIGHT",
        resolutionSource: "LLM",
        weight: 5,
        llmUsed: true,
        aiCostUsd: 0,
        latencyMs: Date.now() - startedAt,
        responseType: "KAI_TEXT",
        screenContext: null,
        reasonForLlm: null,
      });
    } catch (error) {
      recorded = false;
      console.error("[kai] no se pudo registrar la interacción de explicar insight", error);
    }

    const nextAccess = recorded ? await getKaiAccess(user.id, user.timezone, now).catch(() => access) : access;
    return { ok: true, explanation: result.explanation, caveats: result.caveats ?? null, access: nextAccess };
  } catch {
    return {
      ok: false,
      error: { code: "INTERNAL_ERROR", message: "Tuve un problema al explicar este insight. Probá de nuevo en un momento." },
      access,
    };
  }
}
