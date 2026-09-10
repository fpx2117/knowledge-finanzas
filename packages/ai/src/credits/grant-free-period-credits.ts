import type { AICreditRepositoryPort } from "./credit-service";

// The FREE tier's monthly AI allowance. Reuses the PLAN_ALLOWANCE pool (no new pool / no schema
// change): each grant is keyed by calendar month via `referenceId = "free:YYYY-MM"`, so the DB's
// partial unique index `ai_credit_entries_plan_grant_unique` on (user_id, reference_id) WHERE
// type = 'PLAN_GRANT' makes "one FREE grant per user per month" automatic — a repeated call in the
// same month is a safe no-op (grantPlanCredits does onConflictDoNothing).
//
// Credits expire at the start of the next month; `getAvailableBalances` excludes expired PLAN
// grants, so an unused allowance never rolls over.
export function freePeriodKey(now: Date): string {
  return `free:${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function freePeriodExpiry(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

export function createGrantFreePeriodCredits(
  repo: Pick<AICreditRepositoryPort, "grantPlanCredits" | "expireLapsedFreeCredits">,
  freeCreditsPerPeriod: number,
  now: () => Date = () => new Date(),
) {
  return async function grantFreePeriodCredits(input: { userId: string }): Promise<void> {
    if (freeCreditsPerPeriod <= 0) return;
    const at = now();
    // Sweep any previous month's unused remainder first so allowances never accumulate.
    await repo.expireLapsedFreeCredits?.(input.userId, at);
    const periodKey = freePeriodKey(at);
    await repo.grantPlanCredits({
      userId: input.userId,
      amount: freeCreditsPerPeriod,
      referenceId: periodKey,
      periodKey,
      expiresAt: freePeriodExpiry(at),
    });
  };
}
