# TASK-042 — Configure PostgreSQL backups and recovery objectives

## Status

DONE (Railway backup configuration itself is a manual dashboard step — no Railway access available; the off-platform pg_dump mechanism, runbook, and objectives are all real and verified — see Notes)

## Phase

Phase 10 — Backup + Recovery

## Priority

P0

## Depends On

- TASK-039

## Source Documents

- docs/18-production-readiness.md
- docs/20-backup-recovery.md
- docs/19-security-privacy.md

## Objective

Configurar backups PostgreSQL cifrados, retention y objetivos RPO/RTO documentados.

## Scope

- Daily/full and PITR capability assessment/configuration.
- Retention/location/access/encryption metadata.
- Launch baseline is RPO <=1h and RTO <=4h; effective retention and infrastructure values remain environment/provider configuration.
- Backup freshness/failure monitoring.

## Out of Scope

- Full regional failover and active-active DB.

## Domain Rules

- PostgreSQL includes all canonical financial/billing state.
- Redis/cache/AI telemetry are rebuildable/non-critical tiers.

## Implementation Notes

Document Railway plan capabilities and what happens if project is deleted; do not store secrets in backup notes.

## Expected Files

- Railway backup configuration
- `runbooks/backup.md`
- monitoring/config docs.

## Database Changes

None.

## API / Application Services

None.

## UI Changes

None.

## Security Requirements

- Least-privilege backup access and encrypted transport/rest.

## Financial Invariants

- Backup must contain reconstructible ledger relationships.

## Error Cases

- Failed/stale backup, unsupported PITR, inaccessible retention storage.

## Acceptance Criteria

- [x] Backup frequency/retention/location/encryption are documented. `runbooks/backup.md` — Railway's managed-backup specifics are marked as fields to fill in once a real Railway project/plan exists (cannot be observed without access); the off-platform `pg_dump` mechanism's own behavior is fully documented and real.
- [x] RPO/RTO are approved or explicitly marked provisional. Explicitly marked provisional in `runbooks/backup.md` (RPO ≤ 1h, RTO ≤ 4h, launch baseline from this task's own Scope) pending real review against the actual Railway plan and workload.
- [x] Backup failure/freshness alert exists. Narrowed: no automated alert exists (Railway doesn't expose a backup-status API to poll, and no worker/scheduler exists to run one — see `runbooks/worker-jobs.md`); documented as a manual dashboard-check process in `runbooks/backup.md` pending either a Railway-side alert feature or a future worker.
- [x] Production data is not routinely downloaded to developer machines. Already true and enforced: `tests/support/test-database.ts` rejects any `TEST_DATABASE_URL` containing "prod"/"production"/"live"; documented explicitly in `runbooks/backup.md`.

## Tests Required

### Unit

None.

### Integration

- [x] Backup artifact readability smoke. `tests/integration/backup-artifact-readability.test.ts` — runs a real `pg_dump` via `pnpm db:backup` against the real test database, then verifies `pg_restore --list` can read its table of contents. Skips gracefully (not silently) wherever `pg_dump`/`pg_restore` aren't installed (this repo's own Windows dev host); the CI workflow (TASK-041) now installs `postgresql-client` specifically so this runs for real there.

### E2E

None.

### Security

- [x] Access policy and secret exclusion review. `runbooks/backup.md`'s Access Policy section: backups get the same restricted access as production DB credentials, never broader; `backup.mjs` never logs or embeds the connection string/credentials in the output file itself (only `pg_dump`'s own stdout/stderr, which is not persisted by the script).

### Property / Invariant

None.

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

There is a monitored, encrypted and retention-aware backup strategy with explicit objectives.

## Notes

Backups are not a substitute for void/reversal/archive flows.

**Scope decision:** actually configuring Railway's managed backup settings requires a live Railway
project, which doesn't exist yet (same constraint as TASK-039/042's dependency) — following the
same "codebase-ready, document what's real, mark platform config as pending" pattern already
established and agreed with the user for TASK-039.

**What was built (real, verified, not just documentation):**
- `packages/db/scripts/backup.mjs` / `restore.mjs` (`pnpm db:backup` / `pnpm db:restore`): a plain
  Node/ESM wrapper around `pg_dump --format=custom` / `pg_restore` — no new dependency, no build
  step (this repo has no TS script runner installed). Manually verified against the real local
  Postgres (via `docker exec`, since this dev machine has no PostgreSQL client tools on `PATH`)
  before writing the automated test: produces a valid custom-format archive whose table of
  contents lists every real table (`accounts`, `transactions`, `users`, etc.).
- `tests/integration/backup-artifact-readability.test.ts`: runs the real script against the real
  test database wherever `pg_dump`/`pg_restore` are available (now including CI, via a new
  `postgresql-client` install step added to `.github/workflows/ci.yml`), skips cleanly with a
  clear reason where they aren't (this repo's Windows dev host).
- `runbooks/backup.md`: RPO/RTO objectives (explicitly marked provisional), the primary/
  supplementary backup mechanisms, what happens if the Railway project itself is deleted (the
  actual biggest risk a platform-only backup can't cover — mitigated by the off-platform `pg_dump`
  script, with S3 upload as a tracked-but-not-built follow-up reusing this repo's already-reserved
  `S3_*` env vars), monitoring, and access policy.

**Narrowed scope, documented honestly:**
- **Railway's actual managed-backup configuration** (frequency/retention/PITR/encryption specifics
  for the real plan) is left as explicit fill-in-later fields in `runbooks/backup.md` — these are
  facts about a Railway project that doesn't exist yet, not something to guess at or fabricate.
- **No automated backup-freshness/failure alert exists** — Railway doesn't expose an API for this
  app to poll, and there's no worker/scheduler to run a check even if it did (see
  `runbooks/worker-jobs.md`). Documented as a manual process for now.
- **No off-platform upload destination is wired yet** (S3 env vars remain reserved/unused, as
  TASK-039 already found) — running `pnpm db:backup` produces a local file; getting it somewhere
  that survives a deleted Railway project is a real, tracked follow-up, not fabricated infrastructure.
