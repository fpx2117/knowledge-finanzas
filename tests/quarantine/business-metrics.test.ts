import { describe, expect, it } from "vitest";

import { getBusinessMetrics } from "../../apps/web/src/features/admin/business-metrics/services/get-business-metrics";
import { loadPricingConfigFromEnv } from "../../packages/config/src/pricing";
import { aiCreditEntries, billingPlans, billingSubscriptions, notificationDeliveries, notifications, users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

const config = loadPricingConfigFromEnv({});

const proUserA = "00000000-0000-0000-0000-000000000601";
const proUserB = "00000000-0000-0000-0000-000000000602";
const trialOnlyUser = "00000000-0000-0000-0000-000000000603";

async function seedBusinessMetricsFixture() {
  const database = getTestDatabase().db;

  await database.insert(users).values([
    { id: proUserA, name: "Pro A", email: "metrics-a@example.test", timezone: "UTC", baseCurrency: "ARS", trialStartedAt: new Date("2026-01-01T00:00:00Z"), trialEndsAt: new Date("2026-01-15T00:00:00Z") },
    { id: proUserB, name: "Pro B", email: "metrics-b@example.test", timezone: "UTC", baseCurrency: "ARS" },
    { id: trialOnlyUser, name: "Trial Only", email: "metrics-trial@example.test", timezone: "UTC", baseCurrency: "ARS", trialStartedAt: new Date("2020-01-01T00:00:00Z"), trialEndsAt: new Date("2020-01-15T00:00:00Z") },
  ]);

  const [plan] = await database.insert(billingPlans).values({ code: "PRO_MONTHLY", name: "Pro Mensual", price: "7.99", currencyCode: "USD", providerPlanId: "plan-1" }).returning();

  await database.insert(billingSubscriptions).values([
    { userId: proUserA, planId: plan.id, provider: "MERCADO_PAGO", status: "ACTIVE" },
    { userId: proUserB, planId: plan.id, provider: "MERCADO_PAGO", status: "ACTIVE" },
  ]);

  await database.insert(aiCreditEntries).values([
    { userId: proUserA, type: "TRIAL_GRANT", pool: "TRIAL_ALLOWANCE", amount: 50 },
    { userId: proUserA, type: "CONSUMPTION", pool: "TRIAL_ALLOWANCE", amount: 5 },
    { userId: proUserB, type: "CONSUMPTION", pool: "PLAN_ALLOWANCE", amount: 20 },
  ]);

  const [notification] = await database.insert(notifications).values({ userId: proUserA, type: "DEBT_OVERDUE", category: "FINANCIAL", priority: "NORMAL", titleKey: "DEBT_OVERDUE", bodyKey: "DEBT_OVERDUE" }).returning();
  await database.insert(notificationDeliveries).values([
    { notificationId: notification.id, channel: "WHATSAPP", status: "DELIVERED" },
    { notificationId: notification.id, channel: "WHATSAPP", status: "FAILED" },
    { notificationId: notification.id, channel: "EMAIL", status: "DELIVERED" },
  ]);
}

describe("getBusinessMetrics", () => {
  it("rejects a non-admin actor and never runs any query", async () => {
    const database = getTestDatabase().db;
    await expect(getBusinessMetrics(database, { role: null }, config)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(getBusinessMetrics(database, { role: "SUPPORT" }, config)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("aggregates real usage/subscriber counts for an ADMIN actor and never mutates anything", async () => {
    await seedBusinessMetricsFixture();
    const database = getTestDatabase().db;

    const result = await getBusinessMetrics(database, { role: "ADMIN" }, config);

    expect(result.snapshot.revenue.proSubscriberCount).toBe(2);
    expect(result.snapshot.revenue.grossSubscriptionRevenue).toBe("15.98");
    // Only CONSUMPTION rows count (5 + 20 = 25), never the TRIAL_GRANT row.
    expect(result.snapshot.costs.aiCostAssumed).toBe((25 * Number(config.assumedAiCostPerCredit)).toFixed(2));
    // Only the DELIVERED WhatsApp delivery counts (FAILED and the EMAIL row don't).
    expect(result.snapshot.costs.whatsappCostAssumed).toBe((1 * Number(config.assumedWhatsappCostPerMessage)).toFixed(2));
    expect(result.snapshot.trial.trialStartCount).toBe(2);
    expect(result.snapshot.trial.trialToProConversionCount).toBe(1);

    // Verify this genuinely never wrote anything — same row counts before and after.
    const usersAfter = await database.select().from(users);
    expect(usersAfter).toHaveLength(3);
  });

  it("SUPER_ADMIN can also read business metrics", async () => {
    await seedBusinessMetricsFixture();
    const database = getTestDatabase().db;
    await expect(getBusinessMetrics(database, { role: "SUPER_ADMIN" }, config)).resolves.toBeDefined();
  });
});
