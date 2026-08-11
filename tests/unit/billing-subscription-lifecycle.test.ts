import { describe, expect, it, vi } from "vitest";
import { createCancelSubscription, createExpirePastDueSubscriptions, createHandlePaymentFailure, createSubscriptionSynchronizer } from "@know-finanzas/billing";

describe("createHandlePaymentFailure", () => {
  function fakeSubscriptions(seed: Array<{ id: string; status: string }>) {
    const records = seed.map((record) => ({ ...record }));
    return {
      records,
      markPastDueIfActive: async (id: string) => {
        const record = records.find((item) => item.id === id);
        if (!record || record.status !== "ACTIVE") return undefined;
        record.status = "PAST_DUE";
        return record;
      },
    };
  }

  it("transitions an ACTIVE subscription to PAST_DUE", async () => {
    const subscriptions = fakeSubscriptions([{ id: "sub-1", status: "ACTIVE" }]);
    const handlePaymentFailure = createHandlePaymentFailure({ subscriptions });

    const result = await handlePaymentFailure("sub-1");

    expect(result).toEqual({ transitioned: true, subscription: { id: "sub-1", status: "PAST_DUE" } });
    expect(subscriptions.records[0].status).toBe("PAST_DUE");
  });

  it("is a no-op for a subscription that is already PAST_DUE", async () => {
    const subscriptions = fakeSubscriptions([{ id: "sub-1", status: "PAST_DUE" }]);
    const handlePaymentFailure = createHandlePaymentFailure({ subscriptions });

    const result = await handlePaymentFailure("sub-1");

    expect(result).toEqual({ transitioned: false, subscription: null });
  });

  it("is a no-op for a CANCELLED subscription (never resurrects a terminal state)", async () => {
    const subscriptions = fakeSubscriptions([{ id: "sub-1", status: "CANCELLED" }]);
    const handlePaymentFailure = createHandlePaymentFailure({ subscriptions });

    const result = await handlePaymentFailure("sub-1");

    expect(result).toEqual({ transitioned: false, subscription: null });
    expect(subscriptions.records[0].status).toBe("CANCELLED");
  });

  it("applying it twice in a row only transitions once (idempotent)", async () => {
    const subscriptions = fakeSubscriptions([{ id: "sub-1", status: "ACTIVE" }]);
    const handlePaymentFailure = createHandlePaymentFailure({ subscriptions });

    const first = await handlePaymentFailure("sub-1");
    const second = await handlePaymentFailure("sub-1");

    expect(first.transitioned).toBe(true);
    expect(second.transitioned).toBe(false);
  });
});

describe("createExpirePastDueSubscriptions", () => {
  function fakeSubscriptions(seed: Array<{ id: string; status: "PAST_DUE"; currentPeriodEnd: Date | null }>) {
    const records = seed.map((record) => ({ ...record }));
    return {
      records,
      listPastDue: async () => records.filter((record) => record.status === "PAST_DUE"),
      markExpiredIfPastDue: async (id: string) => {
        const record = records.find((item) => item.id === id);
        if (!record || record.status !== "PAST_DUE") return undefined;
        (record as { status: string }).status = "EXPIRED";
        return record;
      },
    };
  }

  it("leaves a subscription untouched while still inside the grace window", async () => {
    const periodEnd = new Date("2026-01-10T00:00:00Z");
    const subscriptions = fakeSubscriptions([{ id: "sub-1", status: "PAST_DUE", currentPeriodEnd: periodEnd }]);
    const expire = createExpirePastDueSubscriptions({ subscriptions, graceDays: 5, now: () => new Date("2026-01-13T00:00:00Z") });

    const result = await expire();

    expect(result).toEqual({ expired: 0, results: [{ subscriptionId: "sub-1", expired: false }] });
    expect(subscriptions.records[0].status).toBe("PAST_DUE");
  });

  it("expires a subscription exactly one millisecond past the grace boundary", async () => {
    const periodEnd = new Date("2026-01-10T00:00:00Z");
    const graceEnd = new Date(periodEnd.getTime() + 5 * 24 * 60 * 60 * 1000);
    const subscriptions = fakeSubscriptions([{ id: "sub-1", status: "PAST_DUE", currentPeriodEnd: periodEnd }]);
    const expire = createExpirePastDueSubscriptions({ subscriptions, graceDays: 5, now: () => new Date(graceEnd.getTime() + 1) });

    const result = await expire();

    expect(result).toEqual({ expired: 1, results: [{ subscriptionId: "sub-1", expired: true }] });
    expect(subscriptions.records[0].status).toBe("EXPIRED");
  });

  it("does not expire a subscription exactly at the grace boundary (inclusive)", async () => {
    const periodEnd = new Date("2026-01-10T00:00:00Z");
    const graceEnd = new Date(periodEnd.getTime() + 5 * 24 * 60 * 60 * 1000);
    const subscriptions = fakeSubscriptions([{ id: "sub-1", status: "PAST_DUE", currentPeriodEnd: periodEnd }]);
    const expire = createExpirePastDueSubscriptions({ subscriptions, graceDays: 5, now: () => graceEnd });

    const result = await expire();

    expect(result.expired).toBe(0);
    expect(subscriptions.records[0].status).toBe("PAST_DUE");
  });

  it("treats a subscription with no currentPeriodEnd as never effective (expires it)", async () => {
    const subscriptions = fakeSubscriptions([{ id: "sub-1", status: "PAST_DUE", currentPeriodEnd: null }]);
    const expire = createExpirePastDueSubscriptions({ subscriptions, graceDays: 5, now: () => new Date("2026-01-13T00:00:00Z") });

    const result = await expire();

    expect(result.expired).toBe(1);
  });
});

describe("createCancelSubscription — reason capture", () => {
  function fakeSubscriptionsRepo(seed: Array<{ id: string; userId: string; planId: string; status: string; providerSubscriptionId: string | null }>) {
    const records = seed.map((record) => ({ ...record, cancellationReasonCode: null as string | null, cancellationReasonComment: null as string | null }));
    return {
      records,
      findByIdForUser: async (id: string, userId: string) => records.find((record) => record.id === id && record.userId === userId),
      findById: async (id: string) => records.find((record) => record.id === id),
      findByProviderSubscriptionId: async (providerSubscriptionId: string) => records.find((record) => record.providerSubscriptionId === providerSubscriptionId),
      updateStatusAndPeriod: async (id: string, input: { status: string }) => {
        const record = records.find((item) => item.id === id);
        if (!record) return undefined;
        Object.assign(record, input);
        return record;
      },
      cancelWithoutProvider: async (id: string, reason?: { reasonCode: string | null; reasonComment: string | null }) => {
        const record = records.find((item) => item.id === id);
        if (!record) return undefined;
        record.status = "CANCELLED";
        if (reason) { record.cancellationReasonCode = reason.reasonCode; record.cancellationReasonComment = reason.reasonComment; }
        return record;
      },
      recordCancellationReason: vi.fn(async (id: string, reason: { reasonCode: string | null; reasonComment: string | null }) => {
        const record = records.find((item) => item.id === id);
        if (!record) return undefined;
        record.cancellationReasonCode = reason.reasonCode;
        record.cancellationReasonComment = reason.reasonComment;
        return record;
      }),
    };
  }

  function fakeSynchronizer(subscriptions: ReturnType<typeof fakeSubscriptionsRepo>) {
    return createSubscriptionSynchronizer({ subscriptions, periods: { upsertPeriod: async () => { throw new Error("not expected"); }, listForSubscription: async () => [] }, payments: { upsertByProviderPaymentId: async () => undefined } });
  }

  it("persists the optional reason when cancelling a subscription that never reached the provider", async () => {
    const subscriptions = fakeSubscriptionsRepo([{ id: "sub-1", userId: "user-1", planId: "plan-1", status: "PENDING", providerSubscriptionId: null }]);
    const cancel = createCancelSubscription({ subscriptions, provider: { cancelSubscription: vi.fn() }, synchronizer: fakeSynchronizer(subscriptions) });

    await cancel({ userId: "user-1", subscriptionId: "sub-1", reason: { reasonCode: "TOO_EXPENSIVE", reasonComment: "Too pricey for me" } });

    expect(subscriptions.records[0]).toMatchObject({ status: "CANCELLED", cancellationReasonCode: "TOO_EXPENSIVE", cancellationReasonComment: "Too pricey for me" });
  });

  it("persists the optional reason when cancelling a provider-backed subscription", async () => {
    const subscriptions = fakeSubscriptionsRepo([{ id: "sub-1", userId: "user-1", planId: "plan-1", status: "ACTIVE", providerSubscriptionId: "mp-1" }]);
    const cancelSubscription = vi.fn().mockResolvedValue({ providerSubscriptionId: "mp-1", externalReference: null, status: "CANCELLED", currentPeriodStart: null, currentPeriodEnd: null });
    const cancel = createCancelSubscription({ subscriptions, provider: { cancelSubscription }, synchronizer: fakeSynchronizer(subscriptions) });

    await cancel({ userId: "user-1", subscriptionId: "sub-1", reason: { reasonCode: "OTHER", reasonComment: null } });

    expect(subscriptions.recordCancellationReason).toHaveBeenCalledWith("sub-1", { reasonCode: "OTHER", reasonComment: null });
    expect(subscriptions.records[0]).toMatchObject({ status: "CANCELLED", cancellationReasonCode: "OTHER" });
  });

  it("never blocks cancellation and skips reason persistence when no reason is given", async () => {
    const subscriptions = fakeSubscriptionsRepo([{ id: "sub-1", userId: "user-1", planId: "plan-1", status: "ACTIVE", providerSubscriptionId: "mp-1" }]);
    const cancelSubscription = vi.fn().mockResolvedValue({ providerSubscriptionId: "mp-1", externalReference: null, status: "CANCELLED", currentPeriodStart: null, currentPeriodEnd: null });
    const cancel = createCancelSubscription({ subscriptions, provider: { cancelSubscription }, synchronizer: fakeSynchronizer(subscriptions) });

    const result = await cancel({ userId: "user-1", subscriptionId: "sub-1" });

    expect(result.subscription).toMatchObject({ status: "CANCELLED" });
    expect(subscriptions.recordCancellationReason).not.toHaveBeenCalled();
  });
});
