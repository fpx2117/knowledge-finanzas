#!/usr/bin/env node
// TASK-042: a `pg_dump`-based off-platform backup — supplementary to Railway's own managed
// automated backups (the primary line of defense; see runbooks/backup.md), and the exact
// mechanism `restore-smoke.mjs` (TASK-042) and the restore-validation drill (TASK-043) exercise.
// Plain Node/ESM, no TS build step, no extra dependency — this repo has no script runner (tsx/
// ts-node) installed, and pg_dump/pg_restore are external binaries this can only ever shell out
// to regardless of the language it's written in.
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("db:backup requires DATABASE_URL to be set.");
  process.exit(1);
}

const outputDir = process.env.BACKUP_OUTPUT_DIR ?? path.resolve(process.cwd(), "backups");
mkdirSync(outputDir, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const outputFile = path.join(outputDir, `backup-${timestamp}.dump`);

// --format=custom produces a compressed, pg_restore-only archive (not plain SQL) — the standard
// choice for anything meant to be restored with pg_restore rather than piped into psql.
// --no-owner/--no-privileges: a restore target's role layout is never guaranteed to match the
// source's, and ownership/grants are infrastructure config, not financial data.
const result = spawnSync("pg_dump", ["--format=custom", "--no-owner", "--no-privileges", `--file=${outputFile}`, databaseUrl], { stdio: "inherit" });

if (result.error) {
  console.error(`pg_dump could not be run: ${result.error.message}`);
  console.error("Install the PostgreSQL client tools (postgresql-client on Debian/Ubuntu, postgresql on Homebrew) and ensure pg_dump is on PATH.");
  process.exit(1);
}

if (result.status !== 0) {
  console.error(`pg_dump exited with status ${result.status}`);
  process.exit(result.status ?? 1);
}

console.log(`Backup written to ${outputFile}`);
