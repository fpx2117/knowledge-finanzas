import { BillingError } from "../errors";
import { computeTrialEndsAt } from "../plans/trial-policy";

export type StartTrialUsersRepository = {
  findAccessInputById(userId: string): Promise<{ trialStartedAt?: Date | null } | undefined>;
  startTrialIfNeverStarted(userId: string, input: { trialStartedAt: Date; trialEndsAt: Date }): Promise<{ trialStartedAt: Date; trialEndsAt: Date; wasJustStarted: boolean }>;
};

export type StartTrialSubscriptionsRepository = {
  // Any status — used only for trial-eligibility ("never had a confirmed Pro subscription", "no
  // checkout currently pending"), never to resolve current access.
  listForUser(userId: string): Promise<Array<{ status: string }>>;
};

export type StartTrialPromotionsRepository = {
  hasAnyGrantForUser(userId: string): Promise<boolean>;
};

// Reuses TASK-052's grantTrialCredits, which is already idempotent per user — safe to call again
// if a concurrent request already started the trial.
export type GrantTrialCredits = (input: { userId: string; trialEndsAt: Date | null }) => Promise<unknown>;

// Domain Rule (TASK-064): "Trial Start = Explicit User Choice" — a user is eligible only if they
// have never had a trial, never had a subscription reach a provider-confirmed status (i.e. any
// status other than PENDING), and never had a promotional grant of any status. A currently PENDING
// checkout is a separate, narrower block (BILLING_SUBSCRIPTION_PENDING) so the caller can surface a
// clearer message than plain ineligibility.
export function isEligibleForTrial(input: { trialStartedAt: Date | null | undefined; subscriptions: Array<{ status: string }>; everHadPromotionGrant: boolean }): boolean {
  if (input.trialStartedAt) return false;
  if (input.everHadPromotionGrant) return false;
  return !input.subscriptions.some((subscription) => subscription.status !== "PENDING");
}

export function createStartTrial(dependencies: {
  users: StartTrialUsersRepository;
  subscriptions: StartTrialSubscriptionsRepository;
  promotions: StartTrialPromotionsRepository;
  grantTrialCredits: GrantTrialCredits;
  trialDurationDays: number;
  now?: () => Date;
}) {
  const now = dependencies.now ?? (() => new Date());

  return async function startTrial(input: { userId: string }) {
    const [user, subscriptions, everHadPromotionGrant] = await Promise.all([
      dependencies.users.findAccessInputById(input.userId),
      dependencies.subscriptions.listForUser(input.userId),
      dependencies.promotions.hasAnyGrantForUser(input.userId),
    ]);

    if (subscriptions.some((subscription) => subscription.status === "PENDING")) throw new BillingError("BILLING_SUBSCRIPTION_PENDING");
    if (!isEligibleForTrial({ trialStartedAt: user?.trialStartedAt, subscriptions, everHadPromotionGrant })) {
      throw new BillingError("BILLING_TRIAL_NOT_ELIGIBLE");
    }

    const trialStartedAt = now();
    const trialEndsAt = computeTrialEndsAt(trialStartedAt, dependencies.trialDurationDays);
    const result = await dependencies.users.startTrialIfNeverStarted(input.userId, { trialStartedAt, trialEndsAt });

    // Idempotent regardless of whether this call or a concurrent one actually won the race — the
    // credit grant is keyed per-user, not per-call.
    await dependencies.grantTrialCredits({ userId: input.userId, trialEndsAt: result.trialEndsAt });

    return { trialStartedAt: result.trialStartedAt, trialEndsAt: result.trialEndsAt, wasJustStarted: result.wasJustStarted };
  };
}
