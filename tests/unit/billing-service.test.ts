import { describe, expect, it } from "vitest";
import { createBillingService } from "../../apps/web/src/features/billing/services/billing-service";

const user = { id: "00000000-0000-0000-0000-000000000001", email: "user@example.com" };
const plan = { id: "plan-1", code: "PRO_MONTHLY", name: "Pro Mensual", price: "7.99", currencyCode: "USD", active: true };

function fakePlans(activePlan: typeof plan | null = plan) {
  return { findActiveByCode: async (code: string) => (activePlan && activePlan.code === code ? activePlan : undefined) };
}

function fakeSubscriptions() {
  const records: Array<{ id: string; userId: string; planId: string; status: string; providerSubscriptionId: string | null }> = [];
  let counter = 0;
  return {
    records,
    create: async (input: { userId: string; planId: string; status: string }) => {
      counter += 1;
      const record = { id: `sub-${counter}`, providerSubscriptionId: null, ...input };
      records.push(record);
      return record;
    },
    findEffectiveForUser: async (userId: string) => records.find((item) => item.userId === userId && ["PENDING", "ACTIVE", "PAST_DUE"].includes(item.status)),
    attachProviderReference: async (id: string, input: { providerSubscriptionId: string; status: string }) => {
      const record = records.find((item) => item.id === id);
      if (!record) return undefined;
      record.providerSubscriptionId = input.providerSubscriptionId;
      record.status = input.status;
      return record;
    },
    markFailed: async (id: string) => {
      const record = records.find((item) => item.id === id);
      if (!record) return undefined;
      record.status = "CANCELLED";
      return record;
    },
  };
}

function fakeProvider(result: { providerSubscriptionId: string; status: "PENDING"; checkoutUrl: string } | null, error?: Error) {
  const calls: unknown[] = [];
  return {
    calls,
    createSubscription: async (input: unknown) => {
      calls.push(input);
      if (error) throw error;
      return result!;
    },
    getSubscription: async () => { throw new Error("not implemented in this fake"); },
    getPayment: async () => { throw new Error("not implemented in this fake"); },
  };
}

describe("billing service — startSubscription", () => {
  it("creates a local PENDING subscription before calling the provider, using it as the external reference", async () => {
    const subscriptions = fakeSubscriptions();
    const provider = fakeProvider({ providerSubscriptionId: "mp-1", status: "PENDING", checkoutUrl: "https://mp.example/checkout" });
    const service = createBillingService({ plans: fakePlans(), subscriptions, provider, backUrl: "https://app.example.com/return", billingEnabled: true });

    const result = await service.startSubscription(user, "PRO_MONTHLY");

    expect(subscriptions.records).toHaveLength(1);
    expect(subscriptions.records[0]).toMatchObject({ userId: user.id, status: "PENDING", providerSubscriptionId: "mp-1" });
    expect(provider.calls[0]).toMatchObject({ externalReference: subscriptions.records[0].id, payerEmail: user.email });
    expect(result).toEqual({ subscriptionId: subscriptions.records[0].id, checkoutUrl: "https://mp.example/checkout", status: "PENDING" });
  });

  it("rejects starting a subscription when the user already has an effective one", async () => {
    const subscriptions = fakeSubscriptions();
    subscriptions.records.push({ id: "existing", userId: user.id, planId: plan.id, status: "ACTIVE", providerSubscriptionId: "mp-existing" });
    const provider = fakeProvider({ providerSubscriptionId: "mp-1", status: "PENDING", checkoutUrl: "https://mp.example/checkout" });
    const service = createBillingService({ plans: fakePlans(), subscriptions, provider, backUrl: "https://app.example.com/return", billingEnabled: true });

    await expect(service.startSubscription(user, "PRO_MONTHLY")).rejects.toMatchObject({ code: "BILLING_SUBSCRIPTION_ALREADY_ACTIVE" });
    expect(subscriptions.records).toHaveLength(1);
    expect(provider.calls).toHaveLength(0);
  });

  it("rejects an unknown or inactive plan without touching the provider", async () => {
    const subscriptions = fakeSubscriptions();
    const provider = fakeProvider({ providerSubscriptionId: "mp-1", status: "PENDING", checkoutUrl: "https://mp.example/checkout" });
    const service = createBillingService({ plans: fakePlans(null), subscriptions, provider, backUrl: "https://app.example.com/return", billingEnabled: true });

    await expect(service.startSubscription(user, "PRO_MONTHLY")).rejects.toMatchObject({ code: "BILLING_PLAN_NOT_FOUND" });
    expect(subscriptions.records).toHaveLength(0);
    expect(provider.calls).toHaveLength(0);
  });

  it("rejects starting a subscription while billing is disabled, before creating any local state", async () => {
    const subscriptions = fakeSubscriptions();
    const provider = fakeProvider({ providerSubscriptionId: "mp-1", status: "PENDING", checkoutUrl: "https://mp.example/checkout" });
    const service = createBillingService({ plans: fakePlans(), subscriptions, provider, backUrl: "https://app.example.com/return", billingEnabled: false });

    await expect(service.startSubscription(user, "PRO_MONTHLY")).rejects.toMatchObject({ code: "BILLING_DISABLED" });
    expect(subscriptions.records).toHaveLength(0);
    expect(provider.calls).toHaveLength(0);
  });

  it("releases the local subscription when the provider call fails, so the failure never looks ACTIVE and the user can retry", async () => {
    const subscriptions = fakeSubscriptions();
    const provider = fakeProvider(null, new Error("provider unavailable"));
    const service = createBillingService({ plans: fakePlans(), subscriptions, provider, backUrl: "https://app.example.com/return", billingEnabled: true });

    await expect(service.startSubscription(user, "PRO_MONTHLY")).rejects.toMatchObject({ code: "BILLING_PROVIDER_ERROR" });

    expect(subscriptions.records).toHaveLength(1);
    expect(subscriptions.records[0].status).toBe("CANCELLED");

    // Retrying after the failure succeeds because the failed row is no longer "effective".
    const provider2 = fakeProvider({ providerSubscriptionId: "mp-2", status: "PENDING", checkoutUrl: "https://mp.example/checkout-2" });
    const retryService = createBillingService({ plans: fakePlans(), subscriptions, provider: provider2, backUrl: "https://app.example.com/return", billingEnabled: true });
    const retried = await retryService.startSubscription(user, "PRO_MONTHLY");
    expect(retried.checkoutUrl).toBe("https://mp.example/checkout-2");
    expect(subscriptions.records).toHaveLength(2);
  });
});
