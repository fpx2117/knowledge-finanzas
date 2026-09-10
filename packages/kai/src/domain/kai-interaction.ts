import type { KaiResponseType } from "./kai-response";

/**
 * Where a KAI answer came from (spec §24 "Principio de auditoría"). Recorded on every
 * interaction so we can measure `KAI_LOCAL_RESOLUTION_RATE` (spec §25).
 *
 * - STATIC      — a Level-0 canned response (help / navigation / FAQ / plan).
 * - DATABASE    — a deterministic intent handler that read PostgreSQL.
 * - CALCULATOR  — a deterministic handler whose answer needed a finance calculation.
 * - RULE_ENGINE — produced by the insight / rule layer.
 * - TEMPLATE    — a pure template with no query or calculation.
 * - CACHE       — served from a cached deterministic result.
 * - LLM         — fell through to the OpenRouter fallback.
 */
export type KaiResolutionSource =
  | "STATIC"
  | "DATABASE"
  | "CALCULATOR"
  | "RULE_ENGINE"
  | "TEMPLATE"
  | "CACHE"
  | "LLM";

/**
 * KAI points each resolution source costs (monetización). A deterministic answer is cheap
 * (1); the LLM fallback is the scarce, PRO-differentiated path (5). FREE has a monthly
 * allowance of these; TRIAL/PRO are unlimited.
 */
export const KAI_POINT_WEIGHTS: Record<KaiResolutionSource, number> = {
  STATIC: 1,
  DATABASE: 1,
  CALCULATOR: 1,
  RULE_ENGINE: 1,
  TEMPLATE: 1,
  CACHE: 1,
  LLM: 5,
};

export type KaiInteractionAudit = {
  intentId: string;
  resolutionSource: KaiResolutionSource;
  /** KAI points consumed — see KAI_POINT_WEIGHTS. */
  weight: number;
  llmUsed: boolean;
  aiCostUsd: number;
  latencyMs: number;
  responseType: KaiResponseType;
  screenContext: string | null;
};

/** A deterministic answer never touches the LLM and costs 1 KAI point. */
export function deterministicAudit(
  intentId: string,
  source: Exclude<KaiResolutionSource, "LLM">,
  responseType: KaiResponseType,
  screenContext: string | null,
  latencyMs: number,
): KaiInteractionAudit {
  return {
    intentId,
    resolutionSource: source,
    weight: KAI_POINT_WEIGHTS[source],
    llmUsed: false,
    aiCostUsd: 0,
    latencyMs,
    responseType,
    screenContext,
  };
}
