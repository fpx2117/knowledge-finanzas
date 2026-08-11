#!/usr/bin/env -S npx tsx
// TASK-043: `pnpm finance:audit` — a read-only financial integrity validator. Runs against
// whatever DATABASE_URL points at (normally an isolated restore target during a recovery drill,
// never production directly — see runbooks/restore.md), reports findings, and exits non-zero if
// any ERROR-severity finding exists so it can gate a promotion decision in a script/CI job.
import { createDatabaseClient } from "../src/client";
import { runFinanceAudit } from "../src/audit/finance-audit";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("finance:audit requires DATABASE_URL to be set.");
    process.exit(1);
  }

  const client = createDatabaseClient(databaseUrl);
  try {
    const report = await runFinanceAudit(client.db);

    console.log(JSON.stringify(report, null, 2));
    console.log("");
    console.log(`Scanned: ${Object.entries(report.scannedCounts).map(([key, value]) => `${key}=${value}`).join(", ")}`);

    const errorCount = report.findings.filter((finding) => finding.severity === "ERROR").length;
    const warningCount = report.findings.length - errorCount;
    console.log(`Findings: ${errorCount} error(s), ${warningCount} warning(s).`);

    if (errorCount > 0) {
      console.error("Financial integrity audit FAILED — see findings above. Never promote this database.");
      process.exit(1);
    }

    console.log("Financial integrity audit passed.");
  } finally {
    await client.client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
