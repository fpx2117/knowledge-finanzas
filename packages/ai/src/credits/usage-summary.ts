import type { AICreditRepositoryPort } from "./credit-service";
import type { AIProductAccessState } from "./credit-policy";

// Read model (docs/08.1-ai-credits-and-usage.md §48-50): "access required" (expired) and
// "credits exhausted" (entitled but 0 balance) are distinct states, never conflated as "0/300" —
// the `state` discriminant is what the UI branches on, not a bare number.
export type AIUsageSummary =
  | { state: "ACCESS_REQUIRED" }
  | { state: "FREE"; available: number; total: number; renewsAt: Date | null }
  | { state: "TRIAL"; available: number; total: number; expiresAt: Date | null }
  | { state: "PRO"; available: number; total: number; renewsAt: Date | null };

export type GetAIUsageSummaryInput = {
  userId: string;
  access: AIProductAccessState;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
};

export function createGetAIUsageSummary(
  repo: Pick<AICreditRepositoryPort, "getAvailableBalances">,
  config: { freeCreditsPerPeriod: number; trialCreditsTotal: number; proCreditsPerPeriod: number },
  now: () => Date = () => new Date(),
) {
  return async function getAIUsageSummary(input: GetAIUsageSummaryInput): Promise<AIUsageSummary> {
    if (input.access === "EXPIRED_READ_ONLY" || input.access === "NO_ACCESS") return { state: "ACCESS_REQUIRED" };

    const balances = await repo.getAvailableBalances(input.userId);

    if (input.access === "FREE") {
      const d = now();
      const renewsAt = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
      return { state: "FREE", available: balances.PLAN_ALLOWANCE, total: config.freeCreditsPerPeriod, renewsAt };
    }

    if (input.access === "TRIAL") {
      return { state: "TRIAL", available: balances.TRIAL_ALLOWANCE, total: config.trialCreditsTotal, expiresAt: input.trialEndsAt };
    }

    return {
      state: "PRO",
      available: balances.PLAN_ALLOWANCE + balances.PURCHASED,
      total: config.proCreditsPerPeriod,
      renewsAt: input.currentPeriodEnd,
    };
  };
}
