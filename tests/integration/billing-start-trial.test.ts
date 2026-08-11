import { describe, expect, it } from "vitest";

import { createStartTrial } from "../../packages/billing/src/trial/start-trial";
import { createGrantTrialCredits } from "../../packages/ai/src/credits/grant-trial-credits";
import { createAICreditRepository } from "../../packages/db/src/repositories/ai-credits";
import { createUserRepository } from "../../packages/db/src/repositories/users";
import { createBillingSubscriptionRepository } from "../../packages/db/src/repositories/billing-subscriptions";
import { createBillingPlanRepository } from "../../packages/db/src/repositories/billing-plans";
import { createPromotionRepository } from "../../packages/db/src/repositories/promotions";
import { buildProMonthlyPlanSeed } from "../../packages/billing/src/plans/catalog";
import { users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

const userA = "00000000-0000-0000-0000-000000000201";

async function seedUser() {
  const database = getTestDatabase().db;
  await database.insert(users).values({ id: userA, name: "User A", email: "start-trial@example.test", timezone: "UTC", baseCurrency: "ARS" });
}

function buildStartTrial() {
  const database = getTestDatabase().db;
  const grantTrialCredits = createGrantTrialCredits(createAICreditRepository(database), 50);
  return createStartTrial({
    users: createUserRepository(database),
    subscriptions: createBillingSubscriptionRepository(database),
    promotions: createPromotionRepository(database),
    grantTrialCredits,
    trialDurationDays: 14,
    now: () => new Date("2026-06-01T00:00:00Z"),
  });
}

describe("StartTrial (real Postgres)", () => {
  it("sets trial dates and grants exactly one AI credit entry for a brand-new user", async () => {
    await seedUser();
    const startTrial = buildStartTrial();

    const result = await startTrial({ userId: userA });

    expect(result.wasJustStarted).toBe(true);
    expect(result.trialEndsAt.toISOString()).toBe("2026-06-15T00:00:00.000Z");

    const database = getTestDatabase().db;
    const [row] = await database.select().from(users);
    expect(row.trialStartedAt?.toISOString()).toBe("2026-06-01T00:00:00.000Z");

    const credits = createAICreditRepository(database);
    await expect(credits.getAvailableBalances(userA)).resolves.toMatchObject({ TRIAL_ALLOWANCE: 50 });
  });

  it("double-submit produces exactly one trial and one AI credit grant (idempotency)", async () => {
    await seedUser();
    const startTrial = buildStartTrial();

    const [first, second] = await Promise.all([startTrial({ userId: userA }), startTrial({ userId: userA })]);

    expect(first.trialStartedAt.toISOString()).toBe(second.trialStartedAt.toISOString());
    expect([first.wasJustStarted, second.wasJustStarted].filter(Boolean)).toHaveLength(1);

    const database = getTestDatabase().db;
    const credits = createAICreditRepository(database);
    await expect(credits.getAvailableBalances(userA)).resolves.toMatchObject({ TRIAL_ALLOWANCE: 50 });
  });

  it("rejects a second explicit call once a trial is already active, without granting more credits", async () => {
    await seedUser();
    const startTrial = buildStartTrial();

    await startTrial({ userId: userA });
    await expect(startTrial({ userId: userA })).rejects.toMatchObject({ code: "BILLING_TRIAL_NOT_ELIGIBLE" });

    const database = getTestDatabase().db;
    const credits = createAICreditRepository(database);
    await expect(credits.getAvailableBalances(userA)).resolves.toMatchObject({ TRIAL_ALLOWANCE: 50 });
  });

  it("rejects starting a trial while a Pro checkout is actively pending", async () => {
    await seedUser();
    const database = getTestDatabase().db;
    const plan = await createBillingPlanRepository(database).upsertByCode(buildProMonthlyPlanSeed({ price: "7.99", currencyCode: "USD" }));
    await createBillingSubscriptionRepository(database).create({
      userId: userA,
      planId: plan.id,
      provider: "MERCADO_PAGO",
      providerSubscriptionId: null,
      status: "PENDING",
      currentPeriodStart: null,
      currentPeriodEnd: null,
    });

    const startTrial = buildStartTrial();
    await expect(startTrial({ userId: userA })).rejects.toMatchObject({ code: "BILLING_SUBSCRIPTION_PENDING" });

    const [row] = await database.select().from(users);
    expect(row.trialStartedAt).toBeNull();
  });

  it("rejects starting a trial for a user who previously had a confirmed (non-PENDING) subscription", async () => {
    await seedUser();
    const database = getTestDatabase().db;
    const plan = await createBillingPlanRepository(database).upsertByCode(buildProMonthlyPlanSeed({ price: "7.99", currencyCode: "USD" }));
    await createBillingSubscriptionRepository(database).create({
      userId: userA,
      planId: plan.id,
      provider: "MERCADO_PAGO",
      providerSubscriptionId: "mp-1",
      status: "CANCELLED",
      currentPeriodStart: null,
      currentPeriodEnd: null,
    });

    const startTrial = buildStartTrial();
    await expect(startTrial({ userId: userA })).rejects.toMatchObject({ code: "BILLING_TRIAL_NOT_ELIGIBLE" });
  });
});
