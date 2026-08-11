#!/usr/bin/env node
// TASK-042/043: restores (or, with --list, just lists the table of contents of) a backup produced
// by backup.mjs. `--list` never connects to any database — it only reads the archive's own header,
// which is exactly what TASK-042's "backup artifact readability smoke" test needs: proof the
// archive is structurally valid, without needing a second database to restore into. A real restore
// (TASK-043's drill) additionally needs --target-database-url.
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const listOnly = args.includes("--list");
const file = args.find((arg) => !arg.startsWith("--"));
const targetIndex = args.indexOf("--target-database-url");
const targetDatabaseUrl = targetIndex >= 0 ? args[targetIndex + 1] : undefined;

if (!file) {
  console.error("Usage: restore.mjs <backup-file> [--list | --target-database-url <url>]");
  process.exit(1);
}

if (!listOnly && !targetDatabaseUrl) {
  console.error("Provide either --list (structural check only) or --target-database-url <url> (real restore).");
  process.exit(1);
}

const pgArgs = listOnly
  ? ["--list", file]
  : ["--clean", "--if-exists", "--no-owner", "--no-privileges", `--dbname=${targetDatabaseUrl}`, file];

const result = spawnSync("pg_restore", pgArgs, { stdio: "inherit" });

if (result.error) {
  console.error(`pg_restore could not be run: ${result.error.message}`);
  console.error("Install the PostgreSQL client tools and ensure pg_restore is on PATH.");
  process.exit(1);
}

if (result.status !== 0) {
  console.error(`pg_restore exited with status ${result.status}`);
  process.exit(result.status ?? 1);
}
