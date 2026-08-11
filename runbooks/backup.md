# Runbook: Backup & Recovery Objectives

**Owner:** whoever holds the Railway project credentials (see `runbooks/README.md`).

## Scope

PostgreSQL is the only tier backed up here — it holds all canonical financial/billing state
(Domain Rule). Redis (once it exists) and any AI telemetry are explicitly excluded: both are
rebuildable/non-critical, never the source of truth for anything financial.

## Objectives (launch baseline)

- **RPO (Recovery Point Objective): ≤ 1 hour.** At most 1 hour of committed writes can be lost in
  a worst-case recovery.
- **RTO (Recovery Time Objective): ≤ 4 hours.** From "recovery decision made" to "the app is
  serving correct data again."

These are the launch baseline from this task's Scope, not independently re-derived here — treat
them as provisional until explicitly reviewed/approved for the actual production workload and
Railway plan in use. Whoever approves them should update this line with the date and their name.

## Primary mechanism: Railway's managed Postgres backups

Railway's managed PostgreSQL offering includes automated backups on paid plans, with a retention
window and (on some plans) point-in-time recovery (PITR) — the exact frequency, retention length,
and PITR availability depend on the specific plan in use. **Action required once the production
Railway project exists:** confirm in the Railway dashboard, for the actual plan selected, what
backup frequency/retention/PITR window is provided, and record it here:

- Backup frequency: _(fill in once confirmed against the live Railway plan)_
- Retention window: _(fill in)_
- PITR available: _(fill in — yes/no, and the window if yes)_
- Encryption at rest / in transit: Railway's managed Postgres is expected to encrypt both by
  default; confirm against Railway's current documentation for the plan in use rather than assuming.

## What happens if the Railway project is deleted

Railway-managed backups are tied to the project. **A deleted project may take its backups with
it**, depending on plan and how the deletion happens — this is the single biggest risk this backup
strategy needs to defend against, since "the platform itself is gone" is exactly the scenario a
platform-only backup can't protect against.

Mitigation: the supplementary `pg_dump`-based backup (below) is *off-platform* — store its output
somewhere that survives a Railway project deletion (an S3-compatible bucket; this repo already has
`S3_ENDPOINT`/`S3_BUCKET`/`S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY` reserved in
`packages/config`, currently unused — wiring an automated upload of `db:backup`'s output there is
the natural next step once a real bucket exists, tracked as a follow-up, not built as part of this
task).

## Supplementary off-platform backup: `pnpm db:backup`

`packages/db/scripts/backup.mjs` (invoked via `pnpm db:backup`, requires `DATABASE_URL` and the
PostgreSQL client tools — `pg_dump`/`pg_restore` — on `PATH`) produces a `pg_restore`-format
archive via `pg_dump --format=custom --no-owner --no-privileges`. This is a real, working backup
mechanism (see `tests/integration/backup-artifact-readability.test.ts`, which runs it for real in
CI), not just documentation — but running it manually/periodically is not itself a substitute for
Railway's own automated backups; it's specifically the off-platform copy that survives a deleted
Railway project.

```
DATABASE_URL=<production or a restricted read replica> BACKUP_OUTPUT_DIR=./backups pnpm db:backup
```

Verify a produced archive is structurally readable (never requires a second database):

```
pnpm db:restore <path-to-backup>.dump --list
```

A full restore into a target database (used by TASK-043's restore-validation drill):

```
pnpm db:restore <path-to-backup>.dump --target-database-url <scratch-database-url>
```

## Backup freshness/failure monitoring

- **Railway's own automated backups:** monitored via the Railway dashboard directly — there is no
  code-level integration here (Railway doesn't currently expose a backup-status API this app could
  poll). Action required: check the dashboard on a fixed cadence (weekly, until something better
  exists) and note the date of the most recent successful backup somewhere durable (this file, an
  internal doc, whatever the team's actual process is).
- **The supplementary `pg_dump` backup:** whoever/whatever runs it (currently a manual step — no
  scheduler/worker exists yet to automate this, matching `runbooks/worker-jobs.md`) should confirm
  the script exited `0` and the archive is non-trivially sized before considering a backup run
  complete.

## Access policy

Backup files (wherever they end up stored) get the same restricted access as production database
credentials — least privilege, never broader. **Production data is not routinely downloaded to
developer machines**: local development and CI both use `TEST_DATABASE_URL`-isolated, locally-
seeded data (see `tests/support/test-database.ts`'s own safety check rejecting any URL containing
"prod"/"production"/"live") — never a copy of real user data. If a production backup ever
genuinely needs to be inspected for debugging, do it against a restricted, temporary environment,
never a laptop.

## Reconstructible ledger relationships (Financial Invariant)

`pg_dump --format=custom` captures full referential structure (foreign keys, all rows across all
tables) — a restore reconstructs the complete relational graph (accounts → transactions → debt
payments → allocations, etc.) exactly as it existed at dump time, never a partial/denormalized
snapshot that could silently drop a relationship. TASK-043's restore-validation drill is what
proves this end to end (dump → restore into a scratch database → verify balances/relationships
reconcile), building on the `pnpm db:restore ... --target-database-url` capability introduced here.
