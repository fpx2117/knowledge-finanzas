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
  /**
   * Horario en el que KAI no interrumpe con proactivos no-críticos (spec §9 "quiet hours"), en
   * hora local del usuario. `start` > `end` significa que cruza medianoche (23 → 8 = 23,0,1,…,7).
   * P0 (crítico) nunca se sofoca por esto — igual que con el cap.
   */
  quietHours?: { start: number; end: number };
};

export const DEFAULT_KAI_FREQUENCY_CAP: KaiFrequencyCap = {
  maxPerWindow: 3,
  minGapMinutes: 90,
  quietHours: { start: 23, end: 8 },
};

export type SelectProactiveResult =
  | { message: KaiProactiveMessage; reason: "shown" }
  | { message: null; reason: "no-candidates" | "all-resolved" | "cap-reached" | "cooldown" | "quiet-hours" | "muted-or-snoozed" };

function isQuietHour(hour: number | undefined, quietHours: KaiFrequencyCap["quietHours"]): boolean {
  if (hour === undefined || !quietHours) return false;
  const { start, end } = quietHours;
  return start > end ? hour >= start || hour < end : hour >= start && hour < end;
}

/**
 * Priority queue + frequency cap (spec §8/§9). Given today's candidates and the user's delivery
 * state, returns the single message to show now — or null with the reason. Pure: the caller
 * persists the "shown" side effect.
 *
 * `localHour` is the user's current local hour (0–23), used only for the quiet-hours check; omit
 * it (or the cap's `quietHours`) to skip that check entirely.
 */
export function selectProactive(
  candidates: KaiProactiveMessage[],
  state: KaiDeliveryState,
  now: Date,
  cap: KaiFrequencyCap = DEFAULT_KAI_FREQUENCY_CAP,
  localHour?: number,
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

  // P0 (crítico) siempre pasa — nunca se sofoca por el cap ni por quiet hours.
  if (top.priority <= 0) return { message: top, reason: "shown" };

  if (isQuietHour(localHour, cap.quietHours)) return { message: null, reason: "quiet-hours" };

  if (state.shownInWindow >= cap.maxPerWindow) return { message: null, reason: "cap-reached" };

  if (state.lastShownAt) {
    const gapMs = now.getTime() - new Date(state.lastShownAt).getTime();
    if (gapMs < cap.minGapMinutes * 60_000) return { message: null, reason: "cooldown" };
  }

  return { message: top, reason: "shown" };
}
