/**
 * `pnpm kai:report` — KAI health from `kai_interactions` (spec §25).
 *
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs packages/db/scripts/kai-report.ts
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs packages/db/scripts/kai-report.ts --days 7
 *
 * Prints KAI_LOCAL_RESOLUTION_RATE, breakdown by intent + source, and the recent phrasings
 * KAI couldn't resolve deterministically ("intents faltantes").
 */
import { createDatabaseClient } from "../src/client";
import { createKaiInteractionRepository } from "../src/repositories/kai-interactions";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const daysArg = process.argv.indexOf("--days");
const days = daysArg > -1 ? Number(process.argv[daysArg + 1]) : 30;

const { db, client } = createDatabaseClient(databaseUrl);
const repo = createKaiInteractionRepository(db);

async function main() {
  const to = new Date();
  const from = new Date(to.getTime() - days * 86_400_000);
  const range = { from, to };

  const [stats, byIntent, unresolved, byReason, byFeedback] = await Promise.all([
    repo.resolutionStats(range),
    repo.countByIntent(range),
    repo.recentUnresolved(range, 40),
    repo.countByReasonForLlm(range),
    repo.countFeedbackByIntent(range),
  ]);

  console.log(`\n=== KAI report — últimos ${days} días ===\n`);
  console.log(`Interacciones: ${stats.total}   ·   local: ${stats.local}   ·   LLM: ${stats.llm}`);
  console.log(`KAI_LOCAL_RESOLUTION_RATE: ${(stats.localResolutionRate * 100).toFixed(1)}%   (objetivo ≥ 80% → 90%)\n`);

  console.log("Por intent / fuente:");
  for (const row of byIntent) {
    console.log(`  ${String(row.intentId).padEnd(26)} ${String(row.resolutionSource).padEnd(11)} ${String(row.count).padStart(5)}`);
  }

  if (byReason.length > 0) {
    console.log("\nPor qué se usó LLM:");
    for (const row of byReason) {
      console.log(`  ${String(row.reason).padEnd(16)} ${String(row.count).padStart(5)}`);
    }
  }

  if (byFeedback.length > 0) {
    console.log("\nFeedback 👍/👎 por intent — un 👎 en un intent determinístico es un handler/template a revisar:");
    for (const row of byFeedback) {
      console.log(`  ${String(row.intentId).padEnd(26)} 👍 ${String(row.up).padStart(3)}   👎 ${String(row.down).padStart(3)}`);
    }
  }

  console.log(`\nFrases sin resolver (últimas ${unresolved.length}) — candidatas a intent nuevo:`);
  for (const row of unresolved) {
    console.log(`  · ${row.text}`);
  }
  console.log();
}

main()
  .then(() => client.end())
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
