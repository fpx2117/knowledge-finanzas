export type CommercialOverviewMetrics = {
  activePro: number;
  activeTrials: number;
  expiredReadOnly: number;
  promoPro: number;
  mrr: { amount: string; currencyCode: string } | null;
  pastDue: number;
  refundsPending: number;
  failedWebhooks: number;
};

export type CommercialOverviewRepository = {
  countActiveSubscriptions(): Promise<number>;
  countPastDueSubscriptions(): Promise<number>;
  sumActiveMonthlyRevenue(): Promise<{ amount: string; currencyCode: string } | null>;
  countActivePromotionalGrantsExcludingUsers(excludedUserIds: string[]): Promise<number>;
  countActiveTrialUsersExcluding(now: Date, excludedUserIds: string[]): Promise<number>;
  countTotalUsers(): Promise<number>;
  listUserIdsWithActiveSubscription(): Promise<string[]>;
  listUserIdsWithActivePromotionalGrant(): Promise<string[]>;
  countPendingRefunds(): Promise<number>;
  countFailedWebhooks(): Promise<number>;
};

// Exception-queue-first overview (Scope: "prioritizing actionable exception queues over vanity
// charts"). Buckets follow ProductAccessResolver's own priority (PAID_SUBSCRIPTION > PROMOTION >
// TRIAL > NONE) so Active Pro / Promo Pro / Active Trials / Expired Read-Only are mutually
// exclusive and sum to the total user count — a user with both a subscription and a promotional
// grant is counted once, under Active Pro, matching how their access actually resolves.
export function createGetCommercialOverviewMetrics(dependencies: { repository: CommercialOverviewRepository; now?: () => Date }) {
  const now = dependencies.now ?? (() => new Date());

  return async function getCommercialOverviewMetrics(): Promise<CommercialOverviewMetrics> {
    const [activePro, pastDue, mrr, subscriberIds, refundsPending, failedWebhooks, totalUsers] = await Promise.all([
      dependencies.repository.countActiveSubscriptions(),
      dependencies.repository.countPastDueSubscriptions(),
      dependencies.repository.sumActiveMonthlyRevenue(),
      dependencies.repository.listUserIdsWithActiveSubscription(),
      dependencies.repository.countPendingRefunds(),
      dependencies.repository.countFailedWebhooks(),
      dependencies.repository.countTotalUsers(),
    ]);

    const promoPro = await dependencies.repository.countActivePromotionalGrantsExcludingUsers(subscriberIds);
    const promoGrantUserIds = await dependencies.repository.listUserIdsWithActivePromotionalGrant();
    const activeTrials = await dependencies.repository.countActiveTrialUsersExcluding(now(), [...subscriberIds, ...promoGrantUserIds]);

    const expiredReadOnly = Math.max(0, totalUsers - activePro - promoPro - activeTrials);

    return { activePro, activeTrials, expiredReadOnly, promoPro, mrr, pastDue, refundsPending, failedWebhooks };
  };
}
