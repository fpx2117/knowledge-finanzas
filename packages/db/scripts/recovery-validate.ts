#!/usr/bin/env -S npx tsx
// TASK-043: `pnpm recovery:validate` — orchestrates a full restore-and-verify drill into an
// isolated database: restore the backup, apply migrations (schema compatibility check), run the
// read-only financial audit, and report row-count sanity. Never touches production — the target
// database's name is required to look like a recovery/test target, exactly the same safety check
// tests/support/test-database.ts already applies to TEST_DATABASE_URL, for the same reason (Domain
// Rule: "restore always into isolated environment").
import { spawnSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { createDatabaseClient } from "../src/client";
import { runFinanceAudit } from "../src/audit/finance-audit";

const PRODUCTION_MARKERS = ["prod", "production", "live"];
const RECOVERY_MARKERS = ["test", "recovery", "restore", "scratch", "isolated"];

export function assertSafeRecoveryTarget(url: string): void {
  const normalized = url.toLowerCase();
  if (PRODUCTION_MARKERS.some((marker) => normalized.includes(marker))) {
    throw new Error("RECOVERY_DATABASE_URL must not point at a database whose name suggests production.");
  }
  if (!RECOVERY_MARKERS.some((marker) => normalized.includes(marker))) {
    throw new Error(`RECOVERY_DATABASE_URL's database name must clearly identify it as an isolated recovery target (contain one of: ${RECOVERY_MARKERS.join(", ")}).`);
  }
}

function runStep(name: string, command: string, args: string[], env: NodeJS.ProcessEnv) {
  console.log(`\n=== ${name} ===`);
  const result = spawnSync(command, args, { stdio: "inherit", env });
  if (result.error) throw new Error(`${name} could not run: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${name} failed (exit ${result.status})`);
}

async function main() {
  const backupFile = process.env.BACKUP_FILE;
  const recoveryDatabaseUrl = process.env.RECOVERY_DATABASE_URL;

  if (!backupFile) {
    console.error("recovery:validate requires BACKUP_FILE (path to a backup.mjs archive).");
    process.exit(1);
  }
  if (!recoveryDatabaseUrl) {
    console.error("recovery:validate requires RECOVERY_DATABASE_URL (an isolated scratch database — never production).");
    process.exit(1);
  }
  assertSafeRecoveryTarget(recoveryDatabaseUrl);

  const restoreScript = path.resolve(__dirname, "restore.mjs");

  // 1. Restore the backup into the isolated target.
  runStep("Restore", "node", [restoreScript, backupFile, "--target-database-url", recoveryDatabaseUrl], process.env);

  // 2. Migration compatibility: applying the current migration history to the restored database
  // must be a no-op (the backup was produced from a database already on this history) — a failure
  // here means the backup's schema and the current codebase's migrations have diverged.
  runStep("Migration compatibility check", "pnpm", ["--filter", "@know-finanzas/db", "db:migrate"], { ...process.env, DATABASE_URL: recoveryDatabaseUrl });

  // 3. Financial integrity audit (read-only).
  const client = createDatabaseClient(recoveryDatabaseUrl);
  try {
    console.log("\n=== Financial integrity audit ===");
    const report = await runFinanceAudit(client.db);
    console.log(JSON.stringify(report, null, 2));

    const errorCount = report.findings.filter((finding) => finding.severity === "ERROR").length;

    // Row-count sanity: a restore that came back with zero users/accounts/transactions almost
    // certainly restored the wrong file, an empty database, or failed silently partway through —
    // this is the cheapest possible "did this restore actually contain data" signal, distinct from
    // (and in addition to) the structural/referential checks the audit itself runs.
    const emptyCoreTable = Object.entries(report.scannedCounts).find(([key, count]) => ["transactions"].includes(key) && count === 0);
    if (emptyCoreTable) {
      console.error(`Row-count sanity check failed: ${emptyCoreTable[0]} is empty after restore — this looks like an incomplete or wrong restore, not a legitimately empty database.`);
      process.exit(1);
    }

    if (errorCount > 0) {
      console.error("\nRecovery validation FAILED — financial integrity audit found errors. Do not promote this restore.");
      process.exit(1);
    }

    console.log("\nRecovery validation passed: restore succeeded, schema is migration-compatible, and the financial integrity audit found no errors.");
  } finally {
    await client.client.end();
  }
}

// Only runs when this file is executed directly (`tsx recovery-validate.ts` / `pnpm
// recovery:validate`), never when `assertSafeRecoveryTarget` is imported for unit testing.
// pathToFileURL (not a plain `file://` string) is what makes this comparison work on Windows,
// where process.argv[1] is a backslash-separated path, not already a file:// URL.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
