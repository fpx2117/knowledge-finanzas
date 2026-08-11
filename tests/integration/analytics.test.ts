import { describe, expect, it } from "vitest";
import { bucketAmount, createAnalyticsService, evaluateActivationV1, type AnalyticsProvider } from "@know-finanzas/analytics";
import { createGetCommercialOverviewMetrics } from "../../apps/web/src/features/admin/overview/services/get-commercial-overview-metrics";
import { createAnalyticsEventRepository } from "../../packages/db/src/repositories/analytics-events";
import { createAccountRepository } from "../../packages/db/src/repositories/accounts";
import { createAdminOverviewRepository } from "../../packages/db/src/repositories/admin-overview";
import { createTransactionRepository } from "../../packages/db/src/repositories/transactions";
import { analyticsEventLog, users } from "../../packages/db/src/schema";
import { eq } from "drizzle-orm";
import { getTestDatabase } from "../support/postgres-test-setup";

const userA = "00000000-0000-0000-0000-000000001001";
const userB = "00000000-0000-0000-0000-000000001002";
const internalUser = "00000000-0000-0000-0000-000000001003";

async function seedUsers() {
  const database = getTestDatabase().db;
  await database.insert(users).values([
    { id: userA, name: "User A", email: "analytics-a@example.test", timezone: "UTC", baseCurrency: "ARS" },
    { id: userB, name: "User B", email: "analytics-b@example.test", timezone: "UTC", baseCurrency: "ARS" },
    { id: internalUser, name: "Internal", email: "internal@example.test", timezone: "UTC", baseCurrency: "ARS" },
  ]);
  return database;
}

describe("analytics pipeline (real Postgres provider)", () => {
  it("deduplicates a critical event by event_id at the store level (duplicate webhook-style redelivery)", async () => {
    const database = await seedUsers();
    const repository = createAnalyticsEventRepository(database);
    const track = createAnalyticsService({ provider: repository, environment: "test" });

    const first = await track("subscription_activated", { planCode: "PRO_MONTHLY" }, { eventId: "sub-activated:sub-1", userId: userA });
    const second = await track("subscription_activated", { planCode: "PRO_MONTHLY" }, { eventId: "sub-activated:sub-1", userId: userA });

    expect(first).toEqual({ recorded: true, deduplicated: false });
    expect(second).toEqual({ recorded: false, deduplicated: true });

    const count = await repository.countDistinctUsersForEvent("subscription_activated");
    expect(count).toBe(1);
  });

  it("a provider outage never prevents the real domain operation it's attached to from succeeding", async () => {
    const database = await seedUsers();
    const accounts = createAccountRepository(database);
    const brokenProvider: AnalyticsProvider = { record: async () => { throw new Error("analytics provider is down"); } };
    const track = createAnalyticsService({ provider: brokenProvider, environment: "test" });

    // Mirrors what apps/web's create-account Server Action does: create the real account first,
    // then attempt to track it — the account creation must be entirely unaffected by the
    // analytics failure that follows it.
    const account = await accounts.create({ userId: userA, name: "Cuenta real", type: "BANK", currencyCode: "ARS", openingBalance: "100", openingDate: "2026-01-01" });
    const result = await track("account_created", { accountType: "BANK", currencyCode: "ARS" }, { eventId: `account_created:${account.id}`, userId: userA });

    expect(account.id).toBeTruthy();
    expect(result).toEqual({ recorded: false, deduplicated: false, reason: "PROVIDER_ERROR" });

    const stillThere = await accounts.findByIdForUser(account.id, userA);
    expect(stillThere?.id).toBe(account.id);
  });

  it("evaluates activation:v1 from real accounts/transactions/view-event data and stays exactly-once", async () => {
    const database = await seedUsers();
    const accounts = createAccountRepository(database);
    const transactions = createTransactionRepository(database);
    const repository = createAnalyticsEventRepository(database);
    const track = createAnalyticsService({ provider: repository, environment: "test" });

    const account = await accounts.create({ userId: userA, name: "Cuenta", type: "BANK", currencyCode: "ARS", openingBalance: "0", openingDate: "2026-01-01" });
    for (let i = 0; i < 5; i += 1) {
      await transactions.create({
        userId: userA, accountId: account.id, categoryId: null, originalTransactionId: null, relatedTransactionId: null, reason: null,
        type: "EXPENSE", amount: "10", currencyCode: "ARS", description: `Gasto ${i}`, merchant: null,
        occurredAt: new Date("2026-01-02T00:00:00Z"), postedAt: new Date("2026-01-02T00:00:00Z"), source: "MANUAL", notes: null,
      });
    }
    await track("dashboard_viewed", {}, { userId: userA });
    await track("cashflow_viewed", {}, { userId: userA });

    const [accountRows, transactionRows, dashboardViewed, cashflowViewed] = await Promise.all([
      accounts.listForUser(userA),
      transactions.listForUser(userA),
      repository.hasEventForUserSince("dashboard_viewed", userA, new Date("2026-01-01T00:00:00Z")),
      repository.hasEventForUserSince("cashflow_viewed", userA, new Date("2026-01-01T00:00:00Z")),
    ]);

    const activated = evaluateActivationV1({
      accountCount: accountRows.length,
      transactionCount: transactionRows.length,
      dashboardViewed,
      cashflowViewed,
      signupAt: new Date("2026-01-01T00:00:00Z"),
      now: new Date("2026-01-03T00:00:00Z"),
    });
    expect(activated).toBe(true);

    const first = await track("user_activated", { activationVersion: "v1" }, { eventId: `user_activated:v1:${userA}`, userId: userA });
    const second = await track("user_activated", { activationVersion: "v1" }, { eventId: `user_activated:v1:${userA}`, userId: userA });
    expect(first).toEqual({ recorded: true, deduplicated: false });
    expect(second).toEqual({ recorded: false, deduplicated: true });

    const activatedCount = await repository.countDistinctUsersForEvent("user_activated");
    expect(activatedCount).toBe(1);
  });

  it("excludes internal accounts from KPI counts while still recording the event", async () => {
    const database = await seedUsers();
    const repository = createAnalyticsEventRepository(database);
    const track = createAnalyticsService({ provider: repository, environment: "test" });

    await track("user_signed_up", {}, { eventId: `user_signed_up:${userA}`, userId: userA, internal: false });
    await track("user_signed_up", {}, { eventId: `user_signed_up:${internalUser}`, userId: internalUser, internal: true });

    const count = await repository.countDistinctUsersForEvent("user_signed_up");
    expect(count).toBe(1);
  });

  it("scopes activation view-event checks per user — user B's dashboard view never satisfies user A's activation window", async () => {
    const database = await seedUsers();
    const repository = createAnalyticsEventRepository(database);
    const track = createAnalyticsService({ provider: repository, environment: "test" });

    await track("dashboard_viewed", {}, { userId: userB });

    const userAHasView = await repository.hasEventForUserSince("dashboard_viewed", userA, new Date("2020-01-01T00:00:00Z"));
    const userBHasView = await repository.hasEventForUserSince("dashboard_viewed", userB, new Date("2020-01-01T00:00:00Z"));
    expect(userAHasView).toBe(false);
    expect(userBHasView).toBe(true);
  });

  it("a transaction_created event for a real transaction never carries the raw amount, merchant or notes", async () => {
    const database = await seedUsers();
    const accounts = createAccountRepository(database);
    const transactions = createTransactionRepository(database);
    const repository = createAnalyticsEventRepository(database);
    const track = createAnalyticsService({ provider: repository, environment: "test" });

    const account = await accounts.create({ userId: userA, name: "Cuenta", type: "BANK", currencyCode: "ARS", openingBalance: "0", openingDate: "2026-01-01" });
    const transaction = await transactions.create({
      userId: userA, accountId: account.id, categoryId: null, type: "EXPENSE", amount: "1234.56", currencyCode: "ARS",
      description: "Compra sensible", merchant: "Farmacia Central", occurredAt: new Date("2026-01-02T00:00:00Z"),
      postedAt: new Date("2026-01-02T00:00:00Z"), source: "MANUAL", notes: "receta médica confidencial",
    });

    // Mirrors exactly what create-expense.ts's Server Action does — never passes the real amount,
    // merchant or notes into the analytics call, only a bucket.
    await track(
      "transaction_created",
      { type: "EXPENSE", amountBucket: bucketAmount(Number(transaction.amount)), currencyCode: transaction.currencyCode },
      { eventId: `transaction_created:${transaction.id}`, userId: userA },
    );

    const [row] = await database.select().from(analyticsEventLog).where(eq(analyticsEventLog.eventId, `transaction_created:${transaction.id}`));
    const stored = JSON.stringify(row.properties);
    expect(stored).not.toContain("1234.56");
    expect(stored).not.toContain("Farmacia Central");
    expect(stored).not.toContain("receta médica confidencial");
    expect(row.properties).toEqual({ type: "EXPENSE", amountBucket: "HIGH", currencyCode: "ARS" });
  });

  it("MRR always comes from real billing tables, never from analytics events — injecting fake subscription_activated events never moves it", async () => {
    const database = await seedUsers();
    const repository = createAnalyticsEventRepository(database);
    const track = createAnalyticsService({ provider: repository, environment: "test" });
    const getCommercialOverviewMetrics = createGetCommercialOverviewMetrics({ repository: createAdminOverviewRepository(database) });

    const beforeMetrics = await getCommercialOverviewMetrics();
    expect(beforeMetrics.mrr).toBeNull();

    // No real billing_subscriptions/billing_plans rows exist for these — a KPI service that
    // (incorrectly) derived MRR from analytics events would report non-zero revenue here.
    await track("subscription_activated", { planCode: "PRO_MONTHLY" }, { eventId: "fake-sub-1", userId: userA });
    await track("subscription_activated", { planCode: "PRO_MONTHLY" }, { eventId: "fake-sub-2", userId: userB });

    const afterMetrics = await getCommercialOverviewMetrics();
    expect(afterMetrics.mrr).toBeNull();
    expect(afterMetrics.activePro).toBe(0);
  });
});
