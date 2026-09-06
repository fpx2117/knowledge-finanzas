import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";

import * as schema from "../../packages/db/src/schema";

const productionMarkers = ["prod", "production", "live"];

export type TestDatabase = {
  sql: Sql;
  db: ReturnType<typeof drizzle<typeof schema>>;
};

export function getIsolatedTestDatabaseUrl(environment: NodeJS.ProcessEnv) {
  const url = environment.TEST_DATABASE_URL;

  if (!url) {
    return undefined;
  }

  const normalizedUrl = url.toLowerCase();
  if (productionMarkers.some((marker) => normalizedUrl.includes(marker))) {
    throw new Error("TEST_DATABASE_URL must not point to a production database");
  }

  return url;
}

export function requireTestDatabaseUrl(environment: NodeJS.ProcessEnv = process.env) {
  const url = environment.TEST_DATABASE_URL;

  if (!url) {
    throw new Error("Integration tests require TEST_DATABASE_URL");
  }

  if (environment.NODE_ENV !== "test") {
    throw new Error("Integration tests require NODE_ENV=test");
  }

  const parsed = new URL(url);
  const databaseName = decodeURIComponent(parsed.pathname.slice(1)).toLowerCase();
  const normalizedUrl = url.toLowerCase();

  if (productionMarkers.some((marker) => normalizedUrl.includes(marker)) || normalizedUrl.includes("staging")) {
    throw new Error("TEST_DATABASE_URL must not point to production or staging");
  }

  if (!/(^|[-_])test($|[-_])/.test(databaseName)) {
    throw new Error("TEST_DATABASE_URL database name must contain test");
  }

  return url;
}

export function createTestDatabase(url = requireTestDatabaseUrl()): TestDatabase {
  const sql = postgres(url, {
    prepare: false,
    max: 1,
    connect_timeout: 5,
    idle_timeout: 5,
  });

  return { sql, db: drizzle(sql, { schema }) };
}

export async function assertTestDatabaseAvailable(database: TestDatabase) {
  await database.sql`select 1`;
}

export async function migrateTestDatabase(database: TestDatabase) {
  const { migrate } = await import("drizzle-orm/postgres-js/migrator");
  await migrate(database.db, { migrationsFolder: "packages/db/drizzle" });
}

export async function cleanTestDatabase(database: TestDatabase) {
  await database.sql`
    truncate table
      "verification",
      "session",
      "account",
      "transfers",
      "transactions",
      "budget_alerts",
      "budgets",
      "ai_credit_reservations",
      "ai_credit_entries",
      "billing_webhook_events",
      "billing_disputes",
      "billing_refunds",
      "billing_payments",
      "promotion_access_periods",
      "promotional_access_grants",
      "promotion_redemptions",
      "promotion_codes",
      "referral_rewards",
      "referral_attributions",
      "referral_codes",
      "analytics_event_log",
      "analytics_cohort_metrics",
      "analytics_consent_history",
      "analytics_consents",
      "user_statistical_profiles",
      "user_onboarding",
      "user_financial_profiles",
      "audit_log",
      "admin_roles",
      "billing_periods",
      "billing_subscriptions",
      "billing_plans",
      "debt_payment_allocations",
      "debt_payments",
      "debt_installments",
      "debts",
      "scheduled_transactions",
      "recurring_transactions",
      "reminders",
      "insights",
      "goal_allocations",
      "goals",
      "notification_deliveries",
      "notification_preferences",
      "notification_whatsapp_consent",
      "notifications",
      "categories",
      "accounts",
      "users"
    cascade
  `;
}

export async function closeTestDatabase(database: TestDatabase) {
  await database.sql.end({ timeout: 5 });
}
