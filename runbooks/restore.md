# Runbook: Restore & Recovery Validation

**Owner:** whoever holds the Railway project credentials (see `runbooks/README.md`).

This is TASK-043's drill: restore a backup into an **isolated** environment, verify schema
compatibility and every financial invariant, and only then decide whether to promote. This never
overwrites production first — production is only ever touched after a human has reviewed a passing
validation report.

## Tooling

- `pnpm db:backup` (TASK-042) — produces a `pg_restore`-format archive.
- `pnpm db:restore <file> --list` — proves an archive is structurally readable, no database needed.
- `pnpm db:restore <file> --target-database-url <url>` — restores into a target database.
- `pnpm finance:audit` — read-only, reports every Financial Invariant violation this task defines
  (paired transfer legs, debt-payment/allocation equality, no overpaid installments, transaction
  ownership/currency consistency, scheduled-transaction posted-link integrity). Never writes
  anything. Exits non-zero if any `ERROR`-severity finding exists.
- `pnpm recovery:validate` — orchestrates the full drill: restore → migration-compatibility check
  → financial audit → row-count sanity, all against `RECOVERY_DATABASE_URL`. Refuses to run at all
  unless that URL's database name clearly identifies it as a recovery/test target (and refuses
  anything that looks like production) — see `assertSafeRecoveryTarget` in
  `packages/db/scripts/recovery-validate.ts`.

## Step by step

1. **Never point any of this at production.** `RECOVERY_DATABASE_URL` must be a fresh, isolated
   database — a new Railway database service, or a scratch database on a non-production instance.
   The tooling enforces this by name (must contain `test`/`recovery`/`restore`/`scratch`/
   `isolated`; must not contain `prod`/`production`/`live`) as a backstop, not a substitute for
   actually using an isolated environment.
2. Obtain the backup file to validate (Railway's own managed backup export, or the output of
   `pnpm db:backup`).
3. Run the full drill:
   ```
   BACKUP_FILE=<path> RECOVERY_DATABASE_URL=<isolated-scratch-url> pnpm recovery:validate
   ```
4. Read the report. Three independent things must all be true to consider promoting:
   - **Restore succeeded** (step 1 of the script) — the archive was structurally valid and applied
     cleanly.
   - **Migration compatibility** (step 2) — the current codebase's migration history applies to
     the restored database as a no-op. A failure here means the backup predates migrations that
     haven't been reconciled, or the schema has diverged in a way the current codebase doesn't
     expect.
   - **Financial integrity audit found zero `ERROR`-severity findings** (step 3) — every documented
     invariant holds.
5. Row-count sanity: the script also fails if the restored `transactions` table is empty — a
   strong signal of an incomplete or wrong restore. If this is a genuinely correct restore of a
   brand-new, still-empty production database, this is a false positive; the operator can still see
   the full report and make the actual promotion call themselves (the script gates automation, not
   human judgment).

## If validation fails

- **Restore step failure:** the archive itself may be corrupt — try `pnpm db:restore <file>
  --list` in isolation to narrow down whether the *archive* or the *target database* is the
  problem.
- **Migration compatibility failure:** do not force-apply migrations against a restored database
  in a way that could destructively alter it to "make it match" — investigate why the backup and
  the current migration history disagree first. Never edit historical migration files to make an
  old backup appear compatible (task's own Notes) — if a real incompatibility exists, it needs a
  new, forward migration, not a rewritten history.
- **Financial audit failure:** each finding names the exact `check`, `entityType`, and `entityId`
  — enough to look up the specific row(s) involved. This never means "the backup is unusable" by
  itself; it means "do not promote without understanding why this specific invariant doesn't hold,"
  which could be a real corruption, or (less likely, but possible) an invariant that's stricter
  than what actually held at backup time for some legitimate historical reason.

## Derived data is recalculated, never restored as truth

Dashboard/cashflow/budget aggregates are never part of what's being validated here (Domain Rule:
"derived dashboard/cashflow/budget data is recalculated, not restored as truth") — they're computed
live from the restored ledger by the app itself once it's pointed at the promoted database, not
something this drill needs to separately verify.

## Access & audit

Access to an isolated restore environment is protected exactly like production (Security
Requirement) — the same credential restrictions, not looser ones just because it's "only a scratch
database." Record who ran a given validation drill and its outcome (pass/fail, and if fail, what
was found) — this is the operator-access audit trail this task's Security Requirements ask for.
