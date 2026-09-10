"use server";

import { randomUUID } from "node:crypto";

import { z } from "zod";

import { kaiInteractionRepository } from "@know-finanzas/db";
import { resolveKaiInteraction, resolveScreenContext, type KaiResponse } from "@know-finanzas/kai";

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
});

export type KaiActionResult =
  | { ok: true; response: KaiResponse; access: KaiAccess | null }
  | { ok: false; error: { code: string; message: string }; access: KaiAccess | null };

export async function sendKaiMessageAction(input: {
  message: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  pathname?: string;
  quickActionIntentId?: string;
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

  const { message, history, pathname, quickActionIntentId } = parsed.data;
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
    const { response, audit } = await resolveKaiInteraction({
      message,
      screenContext,
      quickActionIntentId,
      history: history.slice(-KAI_HISTORY_LIMIT),
      ports: buildKaiPorts(user, now),
      llmFallback: createKaiLlmFallback(user, operationId),
      budgetGuard: createKaiBudgetGuard(user.id, () => now),
      now,
      timezone: user.timezone,
      baseCurrency: user.baseCurrency,
    });

    // Audit every interaction (spec §24) + consume KAI points — best-effort, never blocks.
    void kaiInteractionRepository
      .record({
        userId: user.id,
        intentId: audit.intentId,
        resolutionSource: audit.resolutionSource,
        weight: audit.weight,
        llmUsed: audit.llmUsed,
        aiCostUsd: audit.aiCostUsd,
        latencyMs: audit.latencyMs,
        responseType: audit.responseType,
        screenContext: audit.screenContext,
      })
      .catch(() => {});

    return { ok: true, response, access: await getKaiAccess(user.id, user.timezone, now).catch(() => access) };
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
