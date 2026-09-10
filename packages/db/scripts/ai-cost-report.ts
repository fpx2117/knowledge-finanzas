/**
 * `pnpm ai:cost-report` — real AI spend from ai_generation_events.
 *
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs packages/db/scripts/ai-cost-report.ts
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs packages/db/scripts/ai-cost-report.ts --from 2026-09-01 --to 2026-10-01
 *
 * Defaults to the current calendar month (UTC). Prints totals + breakdowns by user, capability
 * and model. Costs are the provider's own reported USD (OpenRouter `usage.cost`).
 */
import { createDatabaseClient } from "../src/client";
import { createAIGenerationEventRepository } from "../src/repositories/ai-generation-events";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}
const { db, client } = createDatabaseClient(databaseUrl);

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const now = new Date();
const from = arg("--from") ? new Date(arg("--from")!) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
const to = arg("--to") ? new Date(arg("--to")!) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

const usd = (v: string | number) => `$${Number(v).toFixed(6)}`;

async function main() {
  const events = createAIGenerationEventRepository(db);
  const range = { from, to };

  console.log(`AI cost report — ${from.toISOString().slice(0, 10)} to ${to.toISOString().slice(0, 10)}\n`);

  const total = await events.sumTotal(range);
  console.log("TOTAL:", { calls: total.calls, costUsd: usd(total.costUsd), inputTokens: total.inputTokens, outputTokens: total.outputTokens, creditsCharged: total.creditsCharged });

  const byUser = await events.sumByUser(range);
  console.log("\nby user:");
  console.table(byUser.map((r) => ({ email: r.email, calls: r.calls, costUsd: usd(r.costUsd), inTok: r.inputTokens, outTok: r.outputTokens, credits: r.creditsCharged })));

  const byCapability = await events.sumByCapability(range);
  console.log("\nby capability:");
  console.table(byCapability.map((r) => ({ capability: r.capability, calls: r.calls, costUsd: usd(r.costUsd), credits: r.creditsCharged })));

  const byModel = await events.sumByModel(range);
  console.log("\nby model:");
  console.table(byModel.map((r) => ({ model: r.resolvedModel, calls: r.calls, costUsd: usd(r.costUsd) })));
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
