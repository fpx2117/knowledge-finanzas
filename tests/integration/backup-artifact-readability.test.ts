import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

// TASK-042's "backup artifact readability smoke": pg_dump/pg_restore are external binaries this
// can only ever shell out to, and they aren't installed on every machine that runs this test
// suite (notably: this repo's own Windows dev environment) — skip with a clear reason rather than
// failing everywhere they're absent. Wherever they ARE present (CI, a Railway shell), this
// exercises the real mechanism end to end: produce a real backup with backup.mjs, then prove
// pg_restore can read its table of contents without needing a second database to restore into.
function commandAvailable(command: string): boolean {
  const result = spawnSync(command, ["--version"]);
  return result.error === undefined;
}

const hasPgTools = commandAvailable("pg_dump") && commandAvailable("pg_restore");

describe.skipIf(!hasPgTools)("backup artifact readability (pg_dump + pg_restore)", () => {
  it("produces a backup file that pg_restore can list the table of contents of", async () => {
    const outputDir = mkdtempSync(path.join(tmpdir(), "know-finanzas-backup-smoke-"));
    try {
      const backupResult = spawnSync("node", [path.resolve(__dirname, "../../packages/db/scripts/backup.mjs")], {
        env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL, BACKUP_OUTPUT_DIR: outputDir },
        stdio: "pipe",
        encoding: "utf-8",
      });
      expect(backupResult.status, backupResult.stderr).toBe(0);

      const files = readdirSync(outputDir);
      expect(files).toHaveLength(1);
      const backupFile = path.join(outputDir, files[0]);

      const listResult = spawnSync("node", [path.resolve(__dirname, "../../packages/db/scripts/restore.mjs"), backupFile, "--list"], {
        stdio: "pipe",
        encoding: "utf-8",
      });
      expect(listResult.status, listResult.stderr).toBe(0);
      // A real table of contents lists every table in the schema — spot-check a few
      // canonical financial tables to confirm this isn't an empty/corrupt archive.
      expect(listResult.stdout).toContain("TABLE DATA public accounts");
      expect(listResult.stdout).toContain("TABLE DATA public transactions");
      expect(listResult.stdout).toContain("TABLE DATA public users");
    } finally {
      rmSync(outputDir, { recursive: true, force: true });
    }
  });
});
