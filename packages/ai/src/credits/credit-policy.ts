// Mirrors packages/billing's ProductAccessState by shape, not by import — packages/ai stays
// dependency-free of packages/billing (same bounded-context boundary as packages/db).
export type AIProductAccessState = "NO_ACCESS" | "TRIAL" | "PRO" | "EXPIRED_READ_ONLY";

export type AICreditPool = "TRIAL_ALLOWANCE" | "PLAN_ALLOWANCE" | "PURCHASED";

// Pool consumption order (docs/08.1-ai-credits-and-usage.md §5, §21-22): trial credits never roll
// into Pro, and EXPIRED_READ_ONLY/NO_ACCESS have no usable pool — AI must never call the
// provider for either.
export function resolvePoolOrder(access: AIProductAccessState): readonly AICreditPool[] {
  switch (access) {
    case "TRIAL":
      return ["TRIAL_ALLOWANCE"];
    case "PRO":
      return ["PLAN_ALLOWANCE", "PURCHASED"];
    case "EXPIRED_READ_ONLY":
    case "NO_ACCESS":
      return [];
  }
}
