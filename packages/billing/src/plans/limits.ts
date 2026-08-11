import type { ProductAccessState } from "../domain/billing-types";

export const UNLIMITED = "UNLIMITED" as const;
export type LimitValue = number | typeof UNLIMITED;

export type LimitKey = "ai.credits" | "whatsapp.allowance";

export type LimitConfig = {
  trialAiCreditsTotal: number;
  trialWhatsAppTotal: number;
  proAiCreditsPerPeriod: number;
  proWhatsAppPerPeriod: number;
};

// Core financial resources (accounts, transactions, debts, budgets, scheduled/recurring rules)
// are intentionally unlimited for both TRIAL and PRO (docs/10.1-subscription-plans-and-limits.md
// §10, §20) — only AI credits and WhatsApp allowance are finite, provider-cost-bound resources.
export function resolveLimit(state: ProductAccessState, key: LimitKey, config: LimitConfig): LimitValue {
  if (state === "EXPIRED_READ_ONLY" || state === "NO_ACCESS") return 0;

  if (key === "ai.credits") return state === "TRIAL" ? config.trialAiCreditsTotal : config.proAiCreditsPerPeriod;
  return state === "TRIAL" ? config.trialWhatsAppTotal : config.proWhatsAppPerPeriod;
}

export function computeRemaining(limit: LimitValue, used: number): LimitValue {
  if (limit === UNLIMITED) return UNLIMITED;
  return Math.max(0, limit - used);
}

export function isLimitReached(limit: LimitValue, used: number): boolean {
  if (limit === UNLIMITED) return false;
  return used >= limit;
}
