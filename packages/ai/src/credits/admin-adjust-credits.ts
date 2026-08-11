export type AdminAdjustCreditsRepository = {
  adjustBalance(input: { userId: string; pool: "TRIAL_ALLOWANCE" | "PLAN_ALLOWANCE" | "PURCHASED"; amount: number; direction: "CREDIT" | "DEBIT"; reason: string; adminUserId: string }): Promise<
    { ok: true; entry: { id: string } } | { ok: false; available: number }
  >;
};

export type AdminAdjustCreditsResult = { ok: true; entryId: string } | { ok: false; available: number };

// Domain Rule (TASK-060): "AI Adjustment = Ledger Entry" — this is the only way an admin action
// changes a user's AI credit balance; there is no direct balance-column mutation anywhere in this
// package. The negative-balance guard lives inside the repository's own transaction (serialized
// per-user via an advisory lock), not here, so a concurrent debit can never race past it.
export function createAdminAdjustCredits(dependencies: { repository: AdminAdjustCreditsRepository }) {
  return async function adminAdjustCredits(input: {
    userId: string;
    pool: "TRIAL_ALLOWANCE" | "PLAN_ALLOWANCE" | "PURCHASED";
    amount: number;
    direction: "CREDIT" | "DEBIT";
    reason: string;
    adminUserId: string;
  }): Promise<AdminAdjustCreditsResult> {
    const result = await dependencies.repository.adjustBalance(input);
    if (!result.ok) return { ok: false, available: result.available };
    return { ok: true, entryId: result.entry.id };
  };
}
