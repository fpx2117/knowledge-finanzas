/**
 * KAI's four visual states (spec §5). The state is always computed from rules/events —
 * never chosen by an LLM. The floating assistant maps each to an accent colour token
 * (`--color-kai-*`), an avatar image and a micro-animation; the geometry/identity stay
 * constant.
 */
export type KaiVisualState = "NEUTRAL" | "ANALYTICAL" | "ALERT" | "POSITIVE";

export const KAI_VISUAL_STATES: readonly KaiVisualState[] = [
  "NEUTRAL",
  "ANALYTICAL",
  "ALERT",
  "POSITIVE",
] as const;
