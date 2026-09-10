import type { KaiProactiveMessage } from "../domain/kai-proactive";

/**
 * What the user has already done with proactive messages — from the `kai_notifications` table.
 */
export type KaiDeliveryState = {
  /** dedupKeys the user dismissed or acted on. Never show again (this period). */
  resolvedDedupKeys: string[];
  /** Snoozed messages, hidden until `until` (ISO). */
  snoozed: { dedupKey: string; until: string }[];
  /** Message kinds the user muted ("no mostrarme este tipo"). */
  mutedKinds: string[];
  /** How many cards were shown in the current frequency window (e.g. today). */
  shownInWindow: number;
  /** ISO of the last card shown, or null. */
  lastShownAt: string | null;
};

export type KaiFrequencyCap = {
  /** Máx proactivos por ventana (spec §9: 3/día). */
  maxPerWindow: number;
  /** Minutos mínimos entre dos cards (spec §9: "1 cada X minutos"). */
  minGapMinutes: number;
};

export const DEFAULT_KAI_FREQUENCY_CAP: KaiFrequencyCap = { maxPerWindow: 3, minGapMinutes: 90 };

export type SelectProactiveResult =
  | { message: KaiProactiveMessage; reason: "shown" }
  | { message: null; reason: "no-candidates" | "all-resolved" | "cap-reached" | "cooldown" | "muted-or-snoozed" };

/**
 * Priority queue + frequency cap (spec §8/§9). Given today's candidates and the user's delivery
 * state, returns the single message to show now — or null with the reason. Pure: the caller
 * persists the "shown" side effect.
 */
export function selectProactive(
  candidates: KaiProactiveMessage[],
  state: KaiDeliveryState,
  now: Date,
  cap: KaiFrequencyCap = DEFAULT_KAI_FREQUENCY_CAP,
): SelectProactiveResult {
  if (candidates.length === 0) return { message: null, reason: "no-candidates" };

  const resolved = new Set(state.resolvedDedupKeys);
  const muted = new Set(state.mutedKinds);
  const snoozedActive = new Set(
    state.snoozed.filter((s) => new Date(s.until) > now).map((s) => s.dedupKey),
  );

  const eligible = candidates
    .filter((c) => !resolved.has(c.id) && !muted.has(c.kind) && !snoozedActive.has(c.id))
    .sort((a, b) => a.priority - b.priority);

  if (eligible.length === 0) {
    // Distinguish "nothing new" from "everything muted/snoozed" for telemetry.
    const anyBlocked = candidates.some((c) => muted.has(c.kind) || snoozedActive.has(c.id));
    return { message: null, reason: anyBlocked ? "muted-or-snoozed" : "all-resolved" };
  }

  const top = eligible[0];

  // P0 (crítico) siempre pasa — nunca se sofoca por el cap.
  if (top.priority <= 0) return { message: top, reason: "shown" };

  if (state.shownInWindow >= cap.maxPerWindow) return { message: null, reason: "cap-reached" };

  if (state.lastShownAt) {
    const gapMs = now.getTime() - new Date(state.lastShownAt).getTime();
    if (gapMs < cap.minGapMinutes * 60_000) return { message: null, reason: "cooldown" };
  }

  return { message: top, reason: "shown" };
}
