import type { AICreditRepositoryPort } from "./credit-service";

// Shape matches packages/billing's ProPeriodGrantInput by structure, not import — packages/ai
// stays dependency-free of packages/billing. The real function is assigned directly to billing's
// GrantProPeriodCreditsPort at the apps/web wiring site.
export type ProPeriodGrantInput = {
  userId: string;
  subscriptionId: string;
  billingPeriodId: string;
  periodStart: Date;
  periodEnd: Date;
};

// Called by billing's subscription synchronizer exactly once per newly-created billing period
// (docs/08.1-ai-credits-and-usage.md §147). Idempotent via the DB's one-PLAN_GRANT-per-(user,
// billingPeriodId) partial unique index, so a repeated webhook delivery is a safe no-op.
export function createGrantProPeriodCredits(repo: AICreditRepositoryPort, proCreditsPerPeriod: number) {
  return async function grantProPeriodCredits(input: ProPeriodGrantInput): Promise<void> {
    await repo.grantPlanCredits({
      userId: input.userId,
      amount: proCreditsPerPeriod,
      referenceId: input.billingPeriodId,
      periodKey: input.billingPeriodId,
      expiresAt: input.periodEnd,
    });
  };
}
