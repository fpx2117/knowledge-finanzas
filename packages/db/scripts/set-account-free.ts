/**
 * One-off admin helper: force an account onto the permanent FREE tier.
 *
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs packages/db/scripts/set-account-free.ts <email>
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs packages/db/scripts/set-account-free.ts <email> --apply
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs packages/db/scripts/set-account-free.ts --list
 *
 * "FREE" = no effective subscription, no active promotional grant, no active trial. With those
 * cleared, resolveProductAccess resolves the account to FREE (packages/billing).
 */
import { sql } from "drizzle-orm";

import { createDatabaseClient } from "../src/client";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}
const { db, client } = createDatabaseClient(databaseUrl);

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const list = args.includes("--list");
const email = args.find((a) => !a.startsWith("--"));

async function rows(query: ReturnType<typeof sql>): Promise<any[]> {
  const result: any = await db.execute(query);
  return Array.isArray(result) ? result : (result.rows ?? []);
}

async function main() {
  if (list) {
    const all = await rows(sql`select id, email, trial_ends_at, created_at from users order by created_at desc limit 50`);
    console.table(all);
    return;
  }

  if (!email) {
    console.error("usage: set-account-free.ts <email> [--apply]   |   set-account-free.ts --list");
    process.exit(1);
  }

  const [user] = await rows(sql`select id, email, trial_started_at, trial_ends_at from users where lower(email) = lower(${email})`);
  if (!user) {
    console.error(`no user found for ${email}. Run with --list to see existing accounts.`);
    process.exit(1);
  }
  console.log("user:", user);

  const subs = await rows(sql`select id, status, provider_subscription_id from billing_subscriptions where user_id = ${user.id}`);
  const promos = await rows(sql`select id, status, ends_at from promotional_access_grants where user_id = ${user.id}`);
  console.log("subscriptions:", subs);
  console.log("promotions:", promos);

  const activeSubs = subs.filter((s) => ["PENDING", "ACTIVE", "PAST_DUE", "PAUSED"].includes(s.status));
  const activePromos = promos.filter((p) => p.status === "ACTIVE");
  const trialActive = user.trial_ends_at && new Date(user.trial_ends_at) > new Date();

  console.log("\nwould change:");
  console.log(`  - cancel ${activeSubs.length} subscription(s): ${activeSubs.map((s) => s.id).join(", ") || "(none)"}`);
  console.log(`  - revoke ${activePromos.length} promotional grant(s): ${activePromos.map((p) => p.id).join(", ") || "(none)"}`);
  console.log(`  - expire trial: ${trialActive ? "yes (trial currently active)" : "no (already inactive)"}`);

  if (!apply) {
    console.log("\ndry run — re-run with --apply to make the changes.");
    return;
  }

  const now = new Date();
  await db.transaction(async (tx) => {
    if (activeSubs.length > 0) {
      await tx.execute(sql`
        update billing_subscriptions
        set status = 'CANCELLED', cancelled_at = ${now.toISOString()}, cancellation_reason_comment = 'admin: set account to FREE', updated_at = ${now.toISOString()}
        where user_id = ${user.id} and status in ('PENDING','ACTIVE','PAST_DUE','PAUSED')
      `);
    }
    if (activePromos.length > 0) {
      await tx.execute(sql`
        update promotional_access_grants
        set status = 'REVOKED', revoked_at = ${now.toISOString()}, revocation_reason = 'admin: set account to FREE', updated_at = ${now.toISOString()}
        where user_id = ${user.id} and status = 'ACTIVE'
      `);
    }
    if (trialActive) {
      await tx.execute(sql`update users set trial_ends_at = ${now.toISOString()}, updated_at = ${now.toISOString()} where id = ${user.id}`);
    }

    // Seed the current month's FREE AI allowance so the assistant is usable right away (it is
    // otherwise granted lazily on the first AI call). Idempotent via the partial unique index on
    // (user_id, reference_id) WHERE type = 'PLAN_GRANT'.
    const amount = Number(process.env.FREE_AI_CREDITS_PER_PERIOD ?? 15);
    const periodKey = `free:${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    const expiresAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    if (amount > 0) {
      await tx.execute(sql`
        insert into ai_credit_entries (user_id, type, pool, amount, reference_id, period_key, expires_at)
        values (${user.id}, 'PLAN_GRANT', 'PLAN_ALLOWANCE', ${amount}, ${periodKey}, ${periodKey}, ${expiresAt.toISOString()})
        on conflict do nothing
      `);
    }
  });

  console.log("\napplied. account is now on the FREE tier (with this month's AI allowance seeded).");
}

main()
  .then(async () => {
    await client.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(error);
    await client.end().catch(() => {});
    process.exit(1);
  });
