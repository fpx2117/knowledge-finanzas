"use server";

import { randomUUID } from "node:crypto";

import { z } from "zod";

import { kaiInteractionRepository } from "@know-finanzas/db";
import {
  resolveKaiInteraction,
  resolveScreenContext,
  type KaiFollowup,
  type KaiResponse,
} from "@know-finanzas/kai";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { KAI_HISTORY_LIMIT, MAX_KAI_MESSAGE_LENGTH } from "../lib/constants";
import { buildKaiPorts } from "../lib/kai-ports.instance";
import { createKaiBudgetGuard } from "../lib/kai-budget-guard.instance";
import { createKaiLlmFallback } from "../lib/kai-llm-fallback.instance";
import { getKaiAccess, type KaiAccess } from "../lib/kai-points.instance";

const turnSchema = z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(4000) });

const inputSchema = z.object({
  message: z.string().trim().max(MAX_KAI_MESSAGE_LENGTH).default(""),
  history: z.array(turnSchema).max(40).default([]),
  pathname: z.string().max(512).optional(),
  quickActionIntentId: z.string().max(64).optional(),
  lastIntentId: z.string().max(64).optional(),
});

export type KaiActionResult =
  | { ok: true; response: KaiResponse; followups: KaiFollowup[]; intentId: string; interactionId: string | null; access: KaiAccess | null }
  | { ok: false; error: { code: string; message: string }; access: KaiAccess | null };

export async function sendKaiMessageAction(input: {
  message: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  pathname?: string;
  quickActionIntentId?: string;
  lastIntentId?: string;
}): Promise<KaiActionResult> {
  const user = await requireCurrentUser();
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success || (!parsed.data.message && !parsed.data.quickActionIntentId)) {
    return {
      ok: false,
      error: { code: "INVALID_INPUT", message: "Escribí una pregunta (máximo 500 caracteres)." },
      access: await getKaiAccess(user.id, user.timezone).catch(() => null),
    };
  }

  const { message, history, pathname, quickActionIntentId, lastIntentId } = parsed.data;
  const now = new Date();
  const operationId = randomUUID();
  const screenContext = resolveScreenContext(pathname);

  // KAI-points gate (monetización). FREE has a monthly allowance; TRIAL/PRO are unlimited.
  // Once a FREE user hits 0 the whole assistant is blocked with an upgrade prompt — that wall
  // is the point. A single LLM answer may push the balance slightly negative (5 pts when 2
  // were left); that's an accepted one-time overage, not a loophole.
  const access = await getKaiAccess(user.id, user.timezone, now).catch(() => null);
  if (access && !access.unlimited && (access.remaining ?? 1) <= 0) {
    return {
      ok: false,
      error: {
        code: "KAI_POINTS_EXHAUSTED",
        message: "Llegaste al límite de consultas de KAI de este mes. Con PRO son ilimitadas.",
      },
      access,
    };
  }

  try {
    const { response, audit, followups } = await resolveKaiInteraction({
      message,
      screenContext,
      quickActionIntentId,
      lastIntentId,
      history: history.slice(-KAI_HISTORY_LIMIT),
      ports: buildKaiPorts(user, now),
      llmFallback: createKaiLlmFallback(user, operationId),
      budgetGuard: createKaiBudgetGuard(user.id, () => now),
      now,
      timezone: user.timezone,
      baseCurrency: user.baseCurrency,
    });

    // Audit every interaction (spec §24) + consume KAI points. Must be awaited *before*
    // re-reading the balance, otherwise the returned `access` reflects the pre-insert count
    // and the meter never moves. A failure here (e.g. migrations not applied) is logged, not
    // swallowed silently — the answer still returns.
    let recorded = true;
    let interactionId: string | null = null;
    try {
      interactionId = await kaiInteractionRepository.record({
        userId: user.id,
        intentId: audit.intentId,
        resolutionSource: audit.resolutionSource,
        weight: audit.weight,
        llmUsed: audit.llmUsed,
        aiCostUsd: audit.aiCostUsd,
        latencyMs: audit.latencyMs,
        responseType: audit.responseType,
        screenContext: audit.screenContext,
        // Keep the phrasing only when we couldn't resolve it deterministically — to close the gap.
        unresolvedText:
          (audit.resolutionSource === "LLM" || audit.intentId === "UNRESOLVED") && message
            ? message.slice(0, 120)
            : null,
        reasonForLlm: audit.reasonForLlm ?? null,
      });
    } catch (error) {
      recorded = false;
      console.error("[kai] no se pudo registrar la interacción (¿migraciones sin aplicar? pnpm db:migrate)", error);
    }

    const nextAccess = recorded
      ? await getKaiAccess(user.id, user.timezone, now).catch(() => access)
      : access;
    return { ok: true, response, followups, intentId: audit.intentId, interactionId, access: nextAccess };
  } catch {
    return {
      ok: false,
      error: { code: "INTERNAL_ERROR", message: "Tuve un problema al procesar tu pregunta. Probá de nuevo." },
      access: await getKaiAccess(user.id, user.timezone, now).catch(() => access),
    };
  }
}

export async function getKaiAccessAction(): Promise<KaiAccess> {
  const user = await requireCurrentUser();
  return getKaiAccess(user.id, user.timezone);
}

/**
 * WP-KAI-FEEDBACK-PERSIST (spec §12/§25): the 👍/👎 the user tapped on an answer. Best-effort —
 * a failure here never surfaces to the user, the thumb already flipped in the UI regardless.
 */
export async function kaiRateInteractionAction(interactionId: string, feedback: "up" | "down"): Promise<void> {
  const user = await requireCurrentUser();
  await kaiInteractionRepository.setFeedback(interactionId, user.id, feedback).catch((error) => {
    console.error("[kai] no se pudo guardar el feedback", error);
  });
}
