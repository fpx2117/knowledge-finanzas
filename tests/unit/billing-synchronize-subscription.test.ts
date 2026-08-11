import { describe, expect, it, vi } from "vitest";
import { createSubscriptionSynchronizer } from "@know-finanzas/billing";

const periodStart = new Date("2026-01-01T00:00:00Z");
const periodEnd = new Date("2026-02-01T00:00:00Z");

function fakeSubscriptions(seed: Array<{ id: string; userId: string; planId: string; status: string; providerSubscriptionId: string | null }>) {
  const records = [...seed];
  return {
    records,
    findById: async (id: string) => records.find((item) => item.id === id),
    findByProviderSubscriptionId: async (providerSubscriptionId: string) => records.find((item) => item.providerSubscriptionId === providerSubscriptionId),
    updateStatusAndPeriod: async (id: string, input: { status: string; providerSubscriptionId: string }) => {
      const record = records.find((item) => item.id === id);
      if (!record) return undefined;
      Object.assign(record, input);
      return record;
    },
  };
}

function fakePeriods() {
  const records: Array<{ id: string; subscriptionId: string; startsAt: Date; endsAt: Date }> = [];
  let counter = 0;
  return {
    records,
    upsertPeriod: async (input: { subscriptionId: string; startsAt: Date; endsAt: Date }) => {
      const existing = records.find((item) => item.subscriptionId === input.subscriptionId && item.startsAt.getTime() === input.startsAt.getTime() && item.endsAt.getTime() === input.endsAt.getTime());
      if (existing) return { period: existing, created: false };
      counter += 1;
      const period = { id: `period-${counter}`, subscriptionId: input.subscriptionId, startsAt: input.startsAt, endsAt: input.endsAt };
      records.push(period);
      return { period, created: true };
    },
    listForSubscription: async (subscriptionId: string) => records.filter((item) => item.subscriptionId === subscriptionId),
  };
}

function fakePayments() {
  const records: unknown[] = [];
  return {
    records,
    upsertByProviderPaymentId: async (input: unknown) => {
      records.push(input);
      return input;
    },
  };
}

describe("SynchronizeSubscription", () => {
  it("resolves the local subscription by provider id and updates its status", async () => {
    const subscriptions = fakeSubscriptions([{ id: "local-1", userId: "user-1", planId: "plan-1", status: "PENDING", providerSubscriptionId: "mp-1" }]);
    const synchronizer = createSubscriptionSynchronizer({ subscriptions, periods: fakePeriods(), payments: fakePayments() });

    const result = await synchronizer.synchronizeSubscription({ providerSubscriptionId: "mp-1", externalReference: null, status: "PAUSED", currentPeriodStart: null, currentPeriodEnd: null });

    expect(result.subscription).toMatchObject({ status: "PAUSED" });
    expect(result.period).toBeNull();
  });

  it("falls back to the local-first external reference when the provider id is not yet attached", async () => {
    const subscriptions = fakeSubscriptions([{ id: "local-1", userId: "user-1", planId: "plan-1", status: "PENDING", providerSubscriptionId: null }]);
    const synchronizer = createSubscriptionSynchronizer({ subscriptions, periods: fakePeriods(), payments: fakePayments() });

    const result = await synchronizer.synchronizeSubscription({ providerSubscriptionId: "mp-1", externalReference: "local-1", status: "PENDING", currentPeriodStart: null, currentPeriodEnd: null });

    expect(result.subscription).toMatchObject({ id: "local-1", providerSubscriptionId: "mp-1" });
  });

  it("throws BILLING_SUBSCRIPTION_NOT_FOUND when neither lookup resolves a local row", async () => {
    const synchronizer = createSubscriptionSynchronizer({ subscriptions: fakeSubscriptions([]), periods: fakePeriods(), payments: fakePayments() });

    await expect(synchronizer.synchronizeSubscription({ providerSubscriptionId: "mp-unknown", externalReference: null, status: "ACTIVE", currentPeriodStart: null, currentPeriodEnd: null }))
      .rejects.toMatchObject({ code: "BILLING_SUBSCRIPTION_NOT_FOUND" });
  });

  it("upserts a confirmed period exactly once and fires the grant/allowance ports only on first creation", async () => {
    const subscriptions = fakeSubscriptions([{ id: "local-1", userId: "user-1", planId: "plan-1", status: "PENDING", providerSubscriptionId: "mp-1" }]);
    const periods = fakePeriods();
    const grantProPeriodCredits = vi.fn().mockResolvedValue(undefined);
    const startProWhatsAppAllowance = vi.fn().mockResolvedValue(undefined);
    const synchronizer = createSubscriptionSynchronizer({ subscriptions, periods, payments: fakePayments(), grantProPeriodCredits, startProWhatsAppAllowance });

    const snapshot = { providerSubscriptionId: "mp-1", externalReference: null, status: "ACTIVE" as const, currentPeriodStart: periodStart, currentPeriodEnd: periodEnd };
    const first = await synchronizer.synchronizeSubscription(snapshot);
    const second = await synchronizer.synchronizeSubscription(snapshot);

    expect(first.periodCreated).toBe(true);
    expect(second.periodCreated).toBe(false);
    expect(periods.records).toHaveLength(1);
    expect(grantProPeriodCredits).toHaveBeenCalledTimes(1);
    expect(startProWhatsAppAllowance).toHaveBeenCalledTimes(1);
  });

  it("does not upsert a period or call the ports when the subscription is not ACTIVE", async () => {
    const subscriptions = fakeSubscriptions([{ id: "local-1", userId: "user-1", planId: "plan-1", status: "PENDING", providerSubscriptionId: "mp-1" }]);
    const periods = fakePeriods();
    const grantProPeriodCredits = vi.fn();
    const synchronizer = createSubscriptionSynchronizer({ subscriptions, periods, payments: fakePayments(), grantProPeriodCredits });

    await synchronizer.synchronizeSubscription({ providerSubscriptionId: "mp-1", externalReference: null, status: "PAST_DUE", currentPeriodStart: periodStart, currentPeriodEnd: periodEnd });

    expect(periods.records).toHaveLength(0);
    expect(grantProPeriodCredits).not.toHaveBeenCalled();
  });

  it("associates a payment with its subscription and confirmed period via external reference", async () => {
    const subscriptions = fakeSubscriptions([{ id: "local-1", userId: "user-1", planId: "plan-1", status: "ACTIVE", providerSubscriptionId: "mp-1" }]);
    const periods = fakePeriods();
    const payments = fakePayments();
    const synchronizer = createSubscriptionSynchronizer({ subscriptions, periods, payments });
    await synchronizer.synchronizeSubscription({ providerSubscriptionId: "mp-1", externalReference: null, status: "ACTIVE", currentPeriodStart: periodStart, currentPeriodEnd: periodEnd });

    await synchronizer.synchronizePayment({ providerPaymentId: "pay-1", externalReference: "local-1", status: "APPROVED", grossAmount: "7.99", currencyCode: "USD", providerFee: "0.55", netAmount: "7.44", paidAt: new Date("2026-01-15T00:00:00Z") });

    expect(payments.records).toEqual([{ userId: "user-1", subscriptionId: "local-1", billingPeriodId: "period-1", providerPaymentId: "pay-1", status: "APPROVED", grossAmount: "7.99", currencyCode: "USD", providerFee: "0.55", netAmount: "7.44", paidAt: new Date("2026-01-15T00:00:00Z") }]);
  });

  it("rejects a payment with no external reference to correlate instead of guessing", async () => {
    const synchronizer = createSubscriptionSynchronizer({ subscriptions: fakeSubscriptions([]), periods: fakePeriods(), payments: fakePayments() });

    await expect(synchronizer.synchronizePayment({ providerPaymentId: "pay-1", externalReference: null, status: "APPROVED", grossAmount: "7.99", currencyCode: "USD", providerFee: null, netAmount: null, paidAt: null }))
      .rejects.toMatchObject({ code: "BILLING_RECONCILIATION_FAILED" });
  });
});
