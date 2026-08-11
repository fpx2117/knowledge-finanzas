import { describe, expect, it, vi } from "vitest";
import { createGetCommercialOverviewMetrics } from "../../apps/web/src/features/admin/overview/services/get-commercial-overview-metrics";

function fakeRepository(overrides: Partial<{
  activeSubscriptions: number;
  pastDue: number;
  mrr: { amount: string; currencyCode: string } | null;
  subscriberIds: string[];
  promoPro: number;
  promoGrantUserIds: string[];
  activeTrials: number;
  totalUsers: number;
  refundsPending: number;
  failedWebhooks: number;
}> = {}) {
  return {
    countActiveSubscriptions: vi.fn(async () => overrides.activeSubscriptions ?? 0),
    countPastDueSubscriptions: vi.fn(async () => overrides.pastDue ?? 0),
    sumActiveMonthlyRevenue: vi.fn(async () => overrides.mrr ?? null),
    listUserIdsWithActiveSubscription: vi.fn(async () => overrides.subscriberIds ?? []),
    countActivePromotionalGrantsExcludingUsers: vi.fn(async () => overrides.promoPro ?? 0),
    listUserIdsWithActivePromotionalGrant: vi.fn(async () => overrides.promoGrantUserIds ?? []),
    countActiveTrialUsersExcluding: vi.fn(async () => overrides.activeTrials ?? 0),
    countTotalUsers: vi.fn(async () => overrides.totalUsers ?? 0),
    countPendingRefunds: vi.fn(async () => overrides.refundsPending ?? 0),
    countFailedWebhooks: vi.fn(async () => overrides.failedWebhooks ?? 0),
  };
}

describe("createGetCommercialOverviewMetrics", () => {
  it("composes every bucket from the injected repository", async () => {
    const repository = fakeRepository({ activeSubscriptions: 10, pastDue: 2, mrr: { amount: "79.90", currencyCode: "USD" }, promoPro: 3, activeTrials: 5, totalUsers: 20, refundsPending: 1, failedWebhooks: 4 });
    const getMetrics = createGetCommercialOverviewMetrics({ repository });

    const metrics = await getMetrics();

    expect(metrics).toMatchObject({ activePro: 10, pastDue: 2, mrr: { amount: "79.90", currencyCode: "USD" }, promoPro: 3, activeTrials: 5, refundsPending: 1, failedWebhooks: 4 });
  });

  it("computes expiredReadOnly as the remainder after Active Pro / Promo Pro / Active Trials", async () => {
    const repository = fakeRepository({ activeSubscriptions: 10, promoPro: 3, activeTrials: 5, totalUsers: 20 });
    const getMetrics = createGetCommercialOverviewMetrics({ repository });

    const metrics = await getMetrics();

    expect(metrics.expiredReadOnly).toBe(2); // 20 - 10 - 3 - 5
  });

  it("never lets expiredReadOnly go negative even if the bucket counts overlap unexpectedly", async () => {
    const repository = fakeRepository({ activeSubscriptions: 15, promoPro: 5, activeTrials: 5, totalUsers: 20 });
    const getMetrics = createGetCommercialOverviewMetrics({ repository });

    const metrics = await getMetrics();

    expect(metrics.expiredReadOnly).toBe(0);
  });

  it("excludes subscribers when counting active promotional grants and trial users, matching ProductAccessResolver's priority", async () => {
    const repository = fakeRepository({ subscriberIds: ["u1", "u2"] });
    const getMetrics = createGetCommercialOverviewMetrics({ repository });

    await getMetrics();

    expect(repository.countActivePromotionalGrantsExcludingUsers).toHaveBeenCalledWith(["u1", "u2"]);
  });

  it("reports null MRR when there are no active subscriptions, rather than 0", async () => {
    const repository = fakeRepository({ mrr: null });
    const getMetrics = createGetCommercialOverviewMetrics({ repository });

    const metrics = await getMetrics();

    expect(metrics.mrr).toBeNull();
  });
});
