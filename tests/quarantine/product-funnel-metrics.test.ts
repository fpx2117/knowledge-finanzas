import { describe, expect, it } from "vitest";
import { createAnalyticsService } from "@know-finanzas/analytics";
import { createGetProductFunnelMetrics } from "../../apps/web/src/features/admin/overview/services/get-product-funnel-metrics";
import { createAnalyticsEventRepository } from "../../packages/db/src/repositories/analytics-events";
import { users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

const userA = "00000000-0000-0000-0000-000000001201";
const userB = "00000000-0000-0000-0000-000000001202";
const internalUser = "00000000-0000-0000-0000-000000001203";

async function seedUsers() {
  const database = getTestDatabase().db;
  await database.insert(users).values([
    { id: userA, name: "User A", email: "funnel-a@example.test", timezone: "UTC", baseCurrency: "ARS" },
    { id: userB, name: "User B", email: "funnel-b@example.test", timezone: "UTC", baseCurrency: "ARS" },
    { id: internalUser, name: "Internal", email: "funnel-internal@example.test", timezone: "UTC", baseCurrency: "ARS" },
  ]);
  return database;
}

describe("GetProductFunnelMetrics (real Postgres)", () => {
  it("counts distinct users per funnel stage and excludes internal accounts", async () => {
    const database = await seedUsers();
    const repository = createAnalyticsEventRepository(database);
    const track = createAnalyticsService({ provider: repository, environment: "test" });
    const getProductFunnelMetrics = createGetProductFunnelMetrics({ repository });

    await track("user_signed_up", {}, { eventId: `user_signed_up:${userA}`, userId: userA });
    await track("user_signed_up", {}, { eventId: `user_signed_up:${userB}`, userId: userB });
    await track("user_signed_up", {}, { eventId: `user_signed_up:${internalUser}`, userId: internalUser, internal: true });

    await track("trial_started", { trialEndsAt: new Date("2026-06-15T00:00:00Z").toISOString() }, { eventId: `trial_started:${userA}`, userId: userA });

    await track("user_activated", { activationVersion: "v1" }, { eventId: `user_activated:v1:${userA}`, userId: userA });

    await track("subscription_activated", { planCode: "PRO_MONTHLY" }, { eventId: "sub-activated:sub-a", userId: userA });

    await track("ai_capability_executed", { capability: "transaction.categorize", status: "SUCCESS", costCredits: 1 }, { eventId: "ai:op-1", userId: userA });
    await track("ai_capability_executed", { capability: "transaction.categorize", status: "SUCCESS", costCredits: 1 }, { eventId: "ai:op-2", userId: userB });

    const funnel = await getProductFunnelMetrics();

    expect(funnel.signups).toBe(2);
    expect(funnel.trialStarted).toBe(1);
    expect(funnel.activated).toBe(1);
    expect(funnel.subscriptionActivated).toBe(1);
    expect(funnel.aiAdoption).toBe(2);
    expect(funnel.checkoutStarted).toBe(0);
  });
});
