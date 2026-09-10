import type { ProductAccessState } from "../domain/billing-types";
import { computeRemaining, resolveLimit, type LimitConfig, type LimitValue } from "../plans/limits";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type UsageSnapshot = { used: number; limit: LimitValue; remaining: LimitValue } | null;

export type ProductAccessSummary =
  | { state: "FREE"; ai: UsageSnapshot; whatsapp: UsageSnapshot }
  | { state: "TRIAL"; trial: { daysRemaining: number }; ai: UsageSnapshot; whatsapp: UsageSnapshot }
  | { state: "PRO"; billing: { renewsAt: Date | null }; ai: UsageSnapshot; whatsapp: UsageSnapshot }
  | { state: "EXPIRED_READ_ONLY"; canReactivate: true; historicalDataAccessible: true };

// Usage counts (aiUsed/whatsAppUsed) are optional and injected by the caller: the AI credit
// ledger (TASK-052) and WhatsApp allowance tracking (notifications phase) are separate bounded
// contexts this package does not own. When not supplied, the summary reports the configured
// limit without fabricating a used/remaining count.
export function buildProductAccessSummary(input: {
  now: Date;
  state: ProductAccessState;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  limitConfig: LimitConfig;
  aiUsed?: number | null;
  whatsAppUsed?: number | null;
}): ProductAccessSummary {
  const ai = buildUsageSnapshot(resolveLimit(input.state, "ai.credits", input.limitConfig), input.aiUsed);
  const whatsapp = buildUsageSnapshot(resolveLimit(input.state, "whatsapp.allowance", input.limitConfig), input.whatsAppUsed);

  if (input.state === "TRIAL") {
    const daysRemaining = input.trialEndsAt
      ? Math.max(0, Math.ceil((input.trialEndsAt.getTime() - input.now.getTime()) / MS_PER_DAY))
      : 0;
    return { state: "TRIAL", trial: { daysRemaining }, ai, whatsapp };
  }

  if (input.state === "PRO") {
    return { state: "PRO", billing: { renewsAt: input.currentPeriodEnd }, ai, whatsapp };
  }

  if (input.state === "FREE") {
    return { state: "FREE", ai, whatsapp };
  }

  return { state: "EXPIRED_READ_ONLY", canReactivate: true, historicalDataAccessible: true };
}

function buildUsageSnapshot(limit: LimitValue, used: number | null | undefined): UsageSnapshot {
  if (used === null || used === undefined) return null;
  return { used, limit, remaining: computeRemaining(limit, used) };
}
