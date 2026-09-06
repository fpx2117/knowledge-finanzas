import { describe, expect, it } from "vitest";
import { buildProMonthlyPlanSeed, PRO_MONTHLY_PLAN_CODE, type BillingProvider } from "@know-finanzas/billing";
import { createBillingService } from "../../apps/web/src/features/billing/services/billing-service";
import { createBillingPlanRepository } from "../../packages/db/src/repositories/billing-plans";
import { createBillingSubscriptionRepository } from "../../packages/db/src/repositories/billing-subscriptions";
import { users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

const userA = "00000000-0000-0000-0000-000000000001";

async function seedUserAndPlan() {
  const database = getTestDatabase().db;
  await database.insert(users).values({ id: userA, name: "User A", email: "start-sub@example.test", timezone: "UTC", baseCurrency: "ARS" });
  return createBillingPlanRepository(database).upsertByCode(buildProMonthlyPlanSeed({ price: "7.99", currencyCode: "USD" }));
}

function stubProvider(response: { providerSubscriptionId: string; status: "PENDING"; checkoutUrl: string } | null, error?: Error): BillingProvider {
  return {
    async createSubscription() {
      if (error) throw error;
      return response!;
    },
    async getSubscription() {
      throw new Error("not implemented in this stub");
    },
    async getPayment() {
      throw new Error("not implemented in this stub");
    },
  };
}

describe("StartSubscription (billing-service + real repositories)", () => {
  it("persists a local-first PENDING subscription and attaches the provider reference on success", async () => {
    await seedUserAndPlan();
    const database = getTestDatabase().db;
    const subscriptionsRepo = createBillingSubscriptionRepository(database);
    const service = createBillingService({
      plans: createBillingPlanRepository(database),
      subscriptions: subscriptionsRepo,
      provider: stubProvider({ providerSubscriptionId: "mp-abc", status: "PENDING", checkoutUrl: "https://mp.example/checkout" }),
      backUrl: "https://app.example.com/billing/return",
      billingEnabled: true,
    });

    const result = await service.startSubscription({ id: userA, email: "start-sub@example.test" }, PRO_MONTHLY_PLAN_CODE);

    expect(result.checkoutUrl).toBe("https://mp.example/checkout");
    const persisted = await subscriptionsRepo.findEffectiveForUser(userA);
    expect(persisted).toMatchObject({ id: result.subscriptionId, status: "PENDING", providerSubscriptionId: "mp-abc" });
  });

  it("does not create a duplicate effective subscription on a repeated start while one is already pending", async () => {
    await seedUserAndPlan();
    const database = getTestDatabase().db;
    const subscriptionsRepo = createBillingSubscriptionRepository(database);
    const service = createBillingService({
      plans: createBillingPlanRepository(database),
      subscriptions: subscriptionsRepo,
      provider: stubProvider({ providerSubscriptionId: "mp-1", status: "PENDING", checkoutUrl: "https://mp.example/checkout-1" }),
      backUrl: "https://app.example.com/billing/return",
      billingEnabled: true,
    });

    await service.startSubscription({ id: userA, email: "start-sub@example.test" }, PRO_MONTHLY_PLAN_CODE);
    await expect(service.startSubscription({ id: userA, email: "start-sub@example.test" }, PRO_MONTHLY_PLAN_CODE))
      .rejects.toMatchObject({ code: "BILLING_SUBSCRIPTION_ALREADY_ACTIVE" });

    const all = await subscriptionsRepo.listForUser(userA);
    expect(all).toHaveLength(1);
  });

  it("releases the local row on provider failure so a subsequent start is not blocked", async () => {
    await seedUserAndPlan();
    const database = getTestDatabase().db;
    const subscriptionsRepo = createBillingSubscriptionRepository(database);

    const failingService = createBillingService({
      plans: createBillingPlanRepository(database),
      subscriptions: subscriptionsRepo,
      provider: stubProvider(null, new Error("mp unavailable")),
      backUrl: "https://app.example.com/billing/return",
      billingEnabled: true,
    });
    await expect(failingService.startSubscription({ id: userA, email: "start-sub@example.test" }, PRO_MONTHLY_PLAN_CODE))
      .rejects.toMatchObject({ code: "BILLING_PROVIDER_ERROR" });
    await expect(subscriptionsRepo.findEffectiveForUser(userA)).resolves.toBeUndefined();

    const retryService = createBillingService({
      plans: createBillingPlanRepository(database),
      subscriptions: subscriptionsRepo,
      provider: stubProvider({ providerSubscriptionId: "mp-retry", status: "PENDING", checkoutUrl: "https://mp.example/checkout-retry" }),
      backUrl: "https://app.example.com/billing/return",
      billingEnabled: true,
    });
    const retried = await retryService.startSubscription({ id: userA, email: "start-sub@example.test" }, PRO_MONTHLY_PLAN_CODE);
    expect(retried.checkoutUrl).toBe("https://mp.example/checkout-retry");

    const all = await subscriptionsRepo.listForUser(userA);
    expect(all).toHaveLength(2);
    expect(all.filter((item) => item.status === "PENDING")).toHaveLength(1);
  });
});
