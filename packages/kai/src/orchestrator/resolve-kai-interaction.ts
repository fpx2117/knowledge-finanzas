import type { KaiScreenContext } from "../domain/kai-context";
import { KAI_POINT_WEIGHTS, type KaiInteractionAudit } from "../domain/kai-interaction";
import type { KaiResponse } from "../domain/kai-response";
import { UNRESOLVED_INTENT } from "../domain/kai-intent";
import { KAI_HANDLERS } from "../handlers";
import type { KaiDataPorts } from "../handlers/ports";
import { isConfident, resolveIntent } from "../resolver/intent-resolver";
import { normalizeText, resolveDateRange } from "../resolver/normalize";
import { resolveStatic } from "../registry/static-registry";
import { resolveFollowups, type KaiFollowup } from "../registry/followups";

export type KaiHistoryTurn = { role: "user" | "assistant"; content: string };

export type KaiLlmFallbackArgs = {
  message: string;
  history: KaiHistoryTurn[];
  /** Why the deterministic pipeline didn't resolve it — for telemetry (spec §19 reasonForLLM). */
  reason: "unresolved" | "low-confidence" | "handler-error";
};

export type KaiLlmFallback = (args: KaiLlmFallbackArgs) => Promise<{ response: KaiResponse; aiCostUsd: number }>;

export type ResolveKaiInteractionInput = {
  message: string;
  screenContext: KaiScreenContext;
  /** Set when a quick-action chip was tapped — skips text resolution. */
  quickActionIntentId?: string;
  history: KaiHistoryTurn[];
  ports: KaiDataPorts;
  llmFallback: KaiLlmFallback;
  /** Throws when the KAI AI budget is exhausted (spec §19). */
  budgetGuard: () => Promise<void>;
  now: Date;
  timezone: string;
  baseCurrency: string;
};

export type ResolveKaiInteractionResult = {
  response: KaiResponse;
  audit: KaiInteractionAudit;
  /** Clickable next questions offered after the answer (spec §16). */
  followups: KaiFollowup[];
};

function finish(response: KaiResponse, audit: KaiInteractionAudit): ResolveKaiInteractionResult {
  return { response, audit, followups: resolveFollowups(audit.intentId) };
}

/**
 * The KAI resolution pipeline (spec §2). Tries every deterministic layer before the LLM:
 * intent handler → static → (guarded) LLM fallback. Records where the answer came from so we
 * can track `KAI_LOCAL_RESOLUTION_RATE` (spec §25) and attaches follow-up questions.
 */
export async function resolveKaiInteraction(
  input: ResolveKaiInteractionInput,
): Promise<ResolveKaiInteractionResult> {
  const startedAt = Date.now();
  const screen = input.screenContext === "UNKNOWN" ? null : input.screenContext;
  const elapsed = () => Date.now() - startedAt;

  // ── Levels 1–4 — deterministic intent handlers ─────────────────────────────
  // Runs before the static layer: a concrete command ("registrá un gasto en YPF de $30.000")
  // or a specific finance question must win over the generic "cómo registro un gasto" help.
  const resolved = resolveIntent(input.message, input.quickActionIntentId);
  if (isConfident(resolved)) {
    const handler = KAI_HANDLERS[resolved.id];
    const range = resolveDateRange(normalizeText(input.message), input.now, input.timezone);
    try {
      const { response, source } = await handler({
        ports: input.ports,
        params: resolved.params,
        range,
        now: input.now,
        timezone: input.timezone,
        baseCurrency: input.baseCurrency,
      });
      return finish(response, {
        intentId: resolved.id,
        resolutionSource: source,
        weight: KAI_POINT_WEIGHTS[source],
        llmUsed: false,
        aiCostUsd: 0,
        latencyMs: elapsed(),
        responseType: response.type,
        screenContext: screen,
      });
    } catch {
      return runFallback(input, "handler-error", resolved.id, screen, elapsed);
    }
  }

  // ── Level 0 — static / local (help, navigation, FAQ, greetings) ────────────
  if (!input.quickActionIntentId) {
    const staticResponse = resolveStatic(input.message, input.screenContext);
    if (staticResponse) {
      return finish(staticResponse, {
        intentId: "STATIC",
        resolutionSource: "STATIC",
        weight: KAI_POINT_WEIGHTS.STATIC,
        llmUsed: false,
        aiCostUsd: 0,
        latencyMs: elapsed(),
        responseType: staticResponse.type,
        screenContext: screen,
      });
    }
  }

  // ── Level 6 — LLM fallback (last resort) ───────────────────────────────────
  const reason = resolved.id === UNRESOLVED_INTENT ? "unresolved" : "low-confidence";
  return runFallback(input, reason, "UNRESOLVED", screen, elapsed);
}

async function runFallback(
  input: ResolveKaiInteractionInput,
  reason: KaiLlmFallbackArgs["reason"],
  intentId: string,
  screen: string | null,
  elapsed: () => number,
): Promise<ResolveKaiInteractionResult> {
  try {
    await input.budgetGuard();
  } catch (error) {
    return finish(
      {
        type: "KAI_ERROR",
        state: "NEUTRAL",
        body:
          error instanceof Error && error.message
            ? error.message
            : "Ahora mismo no puedo hacer un análisis más profundo. Probá con una pregunta más concreta sobre tus gastos, saldo o vencimientos.",
      },
      {
        intentId,
        resolutionSource: "LLM",
        weight: 0,
        llmUsed: false,
        aiCostUsd: 0,
        latencyMs: elapsed(),
        responseType: "KAI_ERROR",
        screenContext: screen,
      },
    );
  }

  try {
    const { response, aiCostUsd } = await input.llmFallback({
      message: input.message,
      history: input.history,
      reason,
    });
    return finish(response, {
      intentId,
      resolutionSource: "LLM",
      weight: KAI_POINT_WEIGHTS.LLM,
      llmUsed: true,
      aiCostUsd,
      latencyMs: elapsed(),
      responseType: response.type,
      screenContext: screen,
    });
  } catch (error) {
    return finish(
      {
        type: "KAI_ERROR",
        state: "NEUTRAL",
        body:
          error instanceof Error && error.message
            ? error.message
            : "Tuve un problema al procesar tu pregunta. Intentá de nuevo en un momento.",
      },
      {
        intentId,
        resolutionSource: "LLM",
        // The LLM call failed — don't charge KAI points for it.
        weight: 0,
        llmUsed: true,
        aiCostUsd: 0,
        latencyMs: elapsed(),
        responseType: "KAI_ERROR",
        screenContext: screen,
      },
    );
  }
}
