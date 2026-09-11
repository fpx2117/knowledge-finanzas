import type { KaiChartData } from "./kai-response";
import type { KaiVisualState } from "./kai-visual-state";

/**
 * A message KAI shows *without* the user asking (spec §7). Rendered as a floating alert card
 * with the mascot in the matching state. Deterministic — built from rules over the user's
 * finance snapshot, never an LLM.
 */
/** Message family — used for "no mostrarme este tipo de aviso" (spec §9) and telemetry. */
export type KaiProactiveKind =
  | "budget-exceeded"
  | "budget-near-limit"
  | "obligation-due"
  | "category-spike"
  | "subscription-due"
  | "subscription-price-change"
  | "large-transaction"
  | "goal-milestone"
  | "savings-up"
  | "month-review";

export type KaiProactiveMessage = {
  /** Stable per message kind + subject + period — dedup + "no repetir lo descartado" (spec §8/§9). */
  id: string;
  kind: KaiProactiveKind;
  state: KaiVisualState;
  /** es-AR label shown in the state pill ("Positivo", "Analítico", "Alerta"). */
  stateLabel: string;
  title: string;
  body: string;
  /** Optional inline bar breakdown (as in the "Analítico" card). */
  data?: KaiChartData;
  primary: KaiProactiveAction;
  secondary?: KaiProactiveAction;
  /** Small footer line ("Resumen mensual · progreso positivo"). */
  meta: string;
  /** P0 (crítico) … P5 (consejo). Lower = more urgent. */
  priority: number;
  /** After this many hours the message is stale and won't be shown. null = no expiry. */
  expiresInHours: number | null;
};

export type KaiProactiveAction = {
  label: string;
  /** Internal route to open. */
  route: string;
};
