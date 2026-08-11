import type { AICreditRepositoryPort } from "./credit-service";

export type GrantTrialCreditsInput = { userId: string; trialEndsAt: Date | null };

// Called once per user, typically at signup (docs/08.1-ai-credits-and-usage.md §48): trial credits
// expire with the trial itself and never roll into a Pro period. Idempotent via the DB's
// one-TRIAL_GRANT-per-user partial unique index — safe to call more than once for the same user.
export function createGrantTrialCredits(repo: AICreditRepositoryPort, trialCreditsTotal: number) {
  return async function grantTrialCredits(input: GrantTrialCreditsInput) {
    return repo.grantTrialCredits({ userId: input.userId, amount: trialCreditsTotal, expiresAt: input.trialEndsAt });
  };
}
