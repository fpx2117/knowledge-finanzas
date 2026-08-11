import { describe, expect, it } from "vitest";
import { buildProMonthlyPlanSeed, PRO_MONTHLY_PLAN_CODE } from "@know-finanzas/billing";
import { createBillingPlanRepository } from "../../packages/db/src/repositories/billing-plans";
import { createBillingSubscriptionRepository } from "../../packages/db/src/repositories/billing-subscriptions";
import { billingPeriods, users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

const userA = "00000000-0000-0000-0000-000000000001";
const userB = "00000000-0000-0000-0000-000000000002";
const periodStart = new Date("2026-01-01T00:00:00Z");
const periodEnd = new Date("2026-02-01T00:00:00Z");

async function seedUsers() {
  const database = getTestDatabase().db;
  await database.insert(users).values([
    { id: userA, name: "User A", email: "billing-a@example.test", timezone: "UTC", baseCurrency: "ARS" },
    { id: userB, name: "User B", email: "billing-b@example.test", timezone: "UTC", baseCurrency: "ARS" },
  ]);
}

async function seedActivePlan() {
  const database = getTestDatabase().db;
  const plans = createBillingPlanRepository(database);
  const seed = buildProMonthlyPlanSeed({ price: "7.99", currencyCode: "USD" });
  return plans.upsertByCode(seed);
}

describe("billing repositories", () => {
  it("upserts the PRO_MONTHLY plan idempotently and exposes it only while active", async () => {
    const database = getTestDatabase().db;
    const plans = createBillingPlanRepository(database);

    const first = await plans.upsertByCode(buildProMonthlyPlanSeed({ price: "7.99", currencyCode: "USD" }));
    const second = await plans.upsertByCode(buildProMonthlyPlanSeed({ price: "9.99", currencyCode: "USD" }));

    expect(first.code).toBe(PRO_MONTHLY_PLAN_CODE);
    expect(second.id).toBe(first.id);
    expect(second.price).toBe("9.990000");
    await expect(plans.findActiveByCode(PRO_MONTHLY_PLAN_CODE)).resolves.toMatchObject({ id: first.id, active: true });

    await plans.upsertByCode({ ...buildProMonthlyPlanSeed({ price: "9.99", currencyCode: "USD" }), active: false });
    await expect(plans.findActiveByCode(PRO_MONTHLY_PLAN_CODE)).resolves.toBeUndefined();
    await expect(plans.findByCode(PRO_MONTHLY_PLAN_CODE)).resolves.toMatchObject({ active: false });
  });

  it("enforces at most one effective (PENDING/ACTIVE/PAST_DUE) subscription per user", async () => {
    await seedUsers();
    const plan = await seedActivePlan();
    const database = getTestDatabase().db;
    const subscriptions = createBillingSubscriptionRepository(database);

    const first = await subscriptions.create({ userId: userA, planId: plan.id, provider: "MERCADO_PAGO", providerSubscriptionId: null, status: "PENDING", currentPeriodStart: null, currentPeriodEnd: null });
    expect(first.status).toBe("PENDING");

    await expect(subscriptions.create({ userId: userA, planId: plan.id, provider: "MERCADO_PAGO", providerSubscriptionId: null, status: "ACTIVE", currentPeriodStart: periodStart, currentPeriodEnd: periodEnd }))
      .rejects.toThrow();

    // A different user is unaffected by user A's effective subscription.
    const otherUser = await subscriptions.create({ userId: userB, planId: plan.id, provider: "MERCADO_PAGO", providerSubscriptionId: null, status: "PENDING", currentPeriodStart: null, currentPeriodEnd: null });
    expect(otherUser.userId).toBe(userB);
  });

  it("allows a new effective subscription once the prior one is no longer effective", async () => {
    await seedUsers();
    const plan = await seedActivePlan();
    const database = getTestDatabase().db;
    const subscriptions = createBillingSubscriptionRepository(database);

    await subscriptions.create({ userId: userA, planId: plan.id, provider: "MERCADO_PAGO", providerSubscriptionId: "mp-sub-1", status: "CANCELLED", currentPeriodStart: periodStart, currentPeriodEnd: periodEnd });

    const reactivated = await subscriptions.create({ userId: userA, planId: plan.id, provider: "MERCADO_PAGO", providerSubscriptionId: "mp-sub-2", status: "ACTIVE", currentPeriodStart: periodStart, currentPeriodEnd: periodEnd });
    expect(reactivated.status).toBe("ACTIVE");
  });

  it("rejects a duplicate non-null provider subscription id", async () => {
    await seedUsers();
    const plan = await seedActivePlan();
    const database = getTestDatabase().db;
    const subscriptions = createBillingSubscriptionRepository(database);

    await subscriptions.create({ userId: userA, planId: plan.id, provider: "MERCADO_PAGO", providerSubscriptionId: "mp-shared", status: "CANCELLED", currentPeriodStart: periodStart, currentPeriodEnd: periodEnd });

    await expect(subscriptions.create({ userId: userB, planId: plan.id, provider: "MERCADO_PAGO", providerSubscriptionId: "mp-shared", status: "PENDING", currentPeriodStart: null, currentPeriodEnd: null }))
      .rejects.toThrow();
  });

  it("scopes findEffectiveForUser and findByIdForUser to the requesting user", async () => {
    await seedUsers();
    const plan = await seedActivePlan();
    const database = getTestDatabase().db;
    const subscriptions = createBillingSubscriptionRepository(database);
    const created = await subscriptions.create({ userId: userA, planId: plan.id, provider: "MERCADO_PAGO", providerSubscriptionId: null, status: "ACTIVE", currentPeriodStart: periodStart, currentPeriodEnd: periodEnd });

    await expect(subscriptions.findEffectiveForUser(userA)).resolves.toMatchObject({ id: created.id });
    await expect(subscriptions.findEffectiveForUser(userB)).resolves.toBeUndefined();
    await expect(subscriptions.findByIdForUser(created.id, userB)).resolves.toBeUndefined();
    await expect(subscriptions.findByIdForUser(created.id, userA)).resolves.toMatchObject({ id: created.id });
  });

  it("enforces one billing_periods row per subscription/start/end range", async () => {
    await seedUsers();
    const plan = await seedActivePlan();
    const database = getTestDatabase().db;
    const subscriptions = createBillingSubscriptionRepository(database);
    const subscription = await subscriptions.create({ userId: userA, planId: plan.id, provider: "MERCADO_PAGO", providerSubscriptionId: null, status: "ACTIVE", currentPeriodStart: new Date("2026-01-01T00:00:00Z"), currentPeriodEnd: new Date("2026-02-01T00:00:00Z") });

    const range = { startsAt: new Date("2026-01-01T00:00:00Z"), endsAt: new Date("2026-02-01T00:00:00Z") };
    await database.insert(billingPeriods).values({ subscriptionId: subscription.id, ...range, status: "ACTIVE" });

    await expect(database.insert(billingPeriods).values({ subscriptionId: subscription.id, ...range, status: "ACTIVE" })).rejects.toThrow();
  });
});
