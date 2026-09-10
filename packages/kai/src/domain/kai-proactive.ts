import type { KaiChartData } from "./kai-response";
import type { KaiVisualState } from "./kai-visual-state";

/**
 * A message KAI shows *without* the user asking (spec §7). Rendered as a floating alert card
 * with the mascot in the matching state. Deterministic — built from rules over the user's
 * finance snapshot, never an LLM.
 */
export type KaiProactiveMessage = {
  /** Stable per message kind + period — used for dedup and "no repetir lo descartado" (spec §8/§9). */
  id: string;
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
};

export type KaiProactiveAction = {
  label: string;
  /** Internal route to open. */
  route: string;
};
