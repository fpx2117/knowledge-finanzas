// This package never writes to promotional_access_grants or the AI credit ledger directly — it
// only calls these ports. Live wiring (composing packages/promotions' GrantPromotionalProAccess /
// PromotionService.extendGrant, and packages/ai's credit ledger) belongs to the apps/web layer that
// consumes this package, matching the "ports without live wiring" precedent from TASK-053.
export type GrantReferralPromotionalDaysInput = {
  userId: string;
  days: number;
  referenceId: string;
};

export type GrantReferralPromotionalDaysResult =
  | { ok: true; grantReferenceId: string }
  | { ok: false; errorCode: string };

export type GrantReferralPromotionalDaysPort = (
  input: GrantReferralPromotionalDaysInput,
) => Promise<GrantReferralPromotionalDaysResult>;

export type GrantReferralAiCreditsInput = {
  userId: string;
  amount: number;
  referenceId: string;
};

export type GrantReferralAiCreditsResult = { ok: true; grantReferenceId: string } | { ok: false; errorCode: string };

export type GrantReferralAiCreditsPort = (input: GrantReferralAiCreditsInput) => Promise<GrantReferralAiCreditsResult>;

export const noopGrantReferralPromotionalDays: GrantReferralPromotionalDaysPort = async () => ({
  ok: false,
  errorCode: "PORT_NOT_WIRED",
});

export const noopGrantReferralAiCredits: GrantReferralAiCreditsPort = async () => ({
  ok: false,
  errorCode: "PORT_NOT_WIRED",
});
