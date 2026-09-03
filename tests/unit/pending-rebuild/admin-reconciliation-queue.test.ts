import { describe, expect, it, vi } from "vitest";
import { createGetReconciliationQueue, type ReconciliationQueueRepository } from "../../apps/web/src/features/admin/billing/services/get-reconciliation-queue";

function fakeRepository(overrides: Partial<{
  stalePending: unknown[];
  pastDue: unknown[];
  failedWebhooks: unknown[];
  pendingRefunds: unknown[];
}> = {}): ReconciliationQueueRepository {
  return {
    subscriptions: {
      listStalePending: vi.fn(async () => overrides.stalePending ?? []),
      listPastDue: vi.fn(async () => overrides.pastDue ?? []),
    },
    webhookEvents: { listFailed: vi.fn(async () => overrides.failedWebhooks ?? []) },
    refunds: { listPending: vi.fn(async () => overrides.pendingRefunds ?? []) },
  } as unknown as ReconciliationQueueRepository;
}

describe("createGetReconciliationQueue", () => {
  it("composes all four queues from the injected repository, never anything external", async () => {
    const repository = fakeRepository({ stalePending: [{ id: "s1" }], pastDue: [{ id: "s2" }], failedWebhooks: [{ id: "w1" }], pendingRefunds: [{ id: "r1" }] });
    const getQueue = createGetReconciliationQueue({ repository });

    const queue = await getQueue();

    expect(queue).toEqual({
      stalePendingSubscriptions: [{ id: "s1" }],
      pastDueSubscriptions: [{ id: "s2" }],
      failedWebhooks: [{ id: "w1" }],
      pendingRefunds: [{ id: "r1" }],
    });
  });

  it("returns empty queues when nothing is pending, without throwing", async () => {
    const getQueue = createGetReconciliationQueue({ repository: fakeRepository() });
    const queue = await getQueue();
    expect(queue).toEqual({ stalePendingSubscriptions: [], pastDueSubscriptions: [], failedWebhooks: [], pendingRefunds: [] });
  });

  it("computes the stale-pending cutoff as 24 hours before now and passes only a Date to the repository (no external call, purely a query composition)", async () => {
    const now = new Date("2026-06-15T12:00:00Z");
    const repository = fakeRepository();
    const getQueue = createGetReconciliationQueue({ repository, now: () => now });

    await getQueue();

    const cutoff = (repository.subscriptions.listStalePending as ReturnType<typeof vi.fn>).mock.calls[0][0] as Date;
    expect(cutoff).toEqual(new Date("2026-06-14T12:00:00Z"));
  });

  it("only ever calls the four injected repository methods once each (query composition, not N+1 fan-out)", async () => {
    const repository = fakeRepository();
    const getQueue = createGetReconciliationQueue({ repository });

    await getQueue();

    expect(repository.subscriptions.listStalePending).toHaveBeenCalledTimes(1);
    expect(repository.subscriptions.listPastDue).toHaveBeenCalledTimes(1);
    expect(repository.webhookEvents.listFailed).toHaveBeenCalledTimes(1);
    expect(repository.refunds.listPending).toHaveBeenCalledTimes(1);
  });
});
