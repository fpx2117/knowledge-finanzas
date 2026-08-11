# Runbook: Disaster Recovery

**Owner:** whoever holds the Railway project credentials (see `runbooks/README.md`).

This is the top-level disaster-recovery playbook TASK-044 asks for — it composes
`runbooks/backup.md` (TASK-042) and `runbooks/restore.md` (TASK-043) into per-scenario procedures,
plus records the actual measured drill this task requires (not just backup configuration assumed
to work).

## Domain Rules (apply to every scenario below)

- **A database outage returns safe errors — it never buffers financial writes anywhere else**
  (browser, Redis, memory). This already holds structurally: every write in this codebase goes
  directly through a `database.transaction(...)` call against Postgres — there is no write path
  that queues a financial mutation somewhere else "for later." If Postgres is unreachable, the
  write throws and the user sees an error, full stop.
- **A restore never auto-posts scheduled events.** Restoring a backup only recreates rows exactly
  as they existed at backup time — it never executes application logic (no scheduled-transaction
  posting job runs during a restore; nothing does, since no such job/worker exists yet — see
  `runbooks/worker-jobs.md`). This holds trivially today and stays true once a worker exists, as
  long as the worker is never started against a database mid-restore.

## Scenario: Postgres unavailable / corrupted

Full procedure: `runbooks/restore.md`. Summary: restore into an isolated environment, run
`pnpm recovery:validate`, only promote after it passes.

## Scenario: Redis unavailable / lost

**Not currently applicable in a way that loses data** — `REDIS_URL` is reserved but nothing in this
codebase writes anything financially meaningful to Redis (`runbooks/backup.md`'s Domain Rule:
"Redis/cache/AI telemetry are rebuildable/non-critical tiers"). The in-memory rate limiters
(`packages/observability`, `packages/ai`, `packages/promotions`) reset to empty on any process
restart regardless of Redis — losing Redis today has no different effect than a normal deploy
restart already has. Once Redis is actually wired to something (a real cache, a real job queue),
this section needs: what's cached (and is therefore safe to lose and just recompute), and how
recurring jobs/reminders/reconciliation actually get rebuilt after a queue loss — neither exists
yet (see `runbooks/worker-jobs.md`).

## Scenario: Mercado Pago reconciliation after a DB restore

A restored database's billing state reflects whatever was true at backup time — any Mercado Pago
webhook events that arrived *after* the backup was taken are missing. After promoting a restore:

1. Run the existing reconciliation flow (`createReconcileSubscriptions`, `packages/billing`,
   exposed via `/admin/billing/reconciliation` from TASK-060) — it re-queries Mercado Pago directly
   for every subscription's real current state and reconciles local rows to match, which is exactly
   "billing state reconciles from provider" (this task's own Financial Invariant).
2. Never manually mark a subscription `ACTIVE`/`PAST_DUE`/etc. to "catch up" — always let the
   reconciliation flow's real provider query be the source of truth, per the same Domain Rule
   `runbooks/provider-outage.md` already states ("external outages do not fake financial success" —
   the same principle applies to a restore gap).

## Scenario: Cache invalidation after a restore

No cache layer exists yet (see Redis section above) — nothing to invalidate today. Derived
values (dashboard/cashflow/budget aggregates) are computed live from the ledger on every request,
never cached, so a restore is immediately reflected everywhere with no separate invalidation step.

## Recovery audit trail

Every drill or real recovery should record: who ran it, when, why, which backup file, which exact
commands, and the result (pass/fail, and if fail, what was found) — the same fields
`runbooks/restore.md`'s Access & Audit section already asks for. The drill report below follows
this format; use it as the template for any future drill or real incident.

---

## Drill Report — 2026-08-11

**Operator:** Claude Code session (automated, supervised) — no production system exists yet, so
this drill validates the *tooling and procedure* against real local infrastructure (Docker
Postgres), not a real Railway-to-Railway restore. Data volume and network latency in a real
production restore will differ; this measures the pipeline's own overhead, not what a real RTO
against a much larger, remote database would be.

**Why:** TASK-044 requires a demonstrated, measured drill — not backup configuration assumed to
work. This is that drill, run once as part of implementing this task; the next one should be run
against real Railway infrastructure once it exists, and periodically thereafter (see Cadence
below).

**Source database:** the local integration/E2E test database (`know_finanzas_test`), populated by
a full run of this repo's 28-spec E2E suite immediately beforehand — a real, non-trivial,
multi-user dataset (30 users, 28 accounts, 12 transactions, 3 debts, plus billing/promotion/
referral/notification data across every domain this app has), not a synthetic minimal fixture.

**Backup file:** `pg_dump --format=custom` archive, produced via the exact `backup.mjs` mechanism
(TASK-042), run directly with `pg_dump` inside the Postgres container (this dev machine has no
PostgreSQL client tools on `PATH` — the same constraint TASK-042/043 already documented; the
*commands* are identical to what `pnpm db:backup`/`pnpm db:restore`/`pnpm recovery:validate` run,
just invoked directly since those wrapper scripts require `pg_dump`/`pg_restore` on the host's own
`PATH`).

**Commands run, in order, against a freshly created isolated scratch database
(`know_finanzas_drill_scratch`, dropped again at the end of the drill):**

1. `pg_dump --format=custom --no-owner --no-privileges` of the source database.
2. `pg_restore --clean --if-exists --no-owner --no-privileges` into the scratch database.
3. `pnpm db:migrate` against the scratch database (migration compatibility check).
4. `pnpm finance:audit` against the scratch database (financial integrity audit).
5. `next start` against the scratch database (product/auth smoke): `/api/health/live`,
   `/api/health`, a real `POST /api/auth/sign-in/email` against one of the restored users, and
   `GET /dashboard` with the resulting session.

**Measured durations:**

| Phase | Duration |
| --- | --- |
| Backup (`pg_dump`) | 431 ms |
| Restore (`pg_restore`) | 2,519 ms |
| Migration compatibility (`pnpm db:migrate`) | 1,257 ms |
| Financial integrity audit (`pnpm finance:audit`) | 1,091 ms |
| App boot to healthy (`next start` → `/api/health/live` 200) | ~5 s (includes a fixed startup wait, not a precise measurement) |
| Auth sign-in + authenticated dashboard load | < 1 s combined |
| **Total, backup start → product smoke pass** | **≈ 11 seconds** |

**Compared to target:** RPO/RTO targets (`runbooks/backup.md`) are ≤ 1 hour / ≤ 4 hours — this
local drill's ~11 seconds is not a meaningful comparison against those targets (this is a tiny
dataset on local disk with zero network latency, not a real production-sized restore over the
network against Railway's infrastructure), but it does prove the *procedure itself* has no
structural bottleneck that would consume a meaningful fraction of either budget — the actual RTO
in production will be dominated by data volume and network transfer, not by any step in this
pipeline's own logic.

**Results:**

- ✅ Restore succeeded — `pg_restore` reported no errors, exit code 0.
- ✅ Migration compatibility — `pnpm db:migrate` applied cleanly (no pending migrations needed
  applying against the restored schema, confirming it matches the current codebase's migration
  history).
- ✅ Financial integrity audit — **zero findings** across all 5 validators, scanning 1 transfer,
  12 transactions, 2 debt payments, 7 debt installments, and 1 scheduled transaction.
- ✅ Auth smoke — signed in as a real restored user (`referrals-e2e-referrer-...@example.test`)
  via the real `/api/auth/sign-in/email` endpoint; received a real session token and the user's
  real restored profile data (trial dates, referral code, etc.).
- ✅ Product smoke — `GET /dashboard` with that session returned `200`.

**Findings / follow-ups produced by this drill** (Acceptance Criteria: "findings produce runbook,
automation, test, or infrastructure follow-up" — this drill's own execution *is* the follow-up for
several gaps identified while running it):

1. This dev machine has no PostgreSQL client tools on `PATH`, meaning `pnpm db:backup`/
   `pnpm db:restore`/`pnpm recovery:validate` cannot run directly here — only via manually invoking
   `pg_dump`/`pg_restore` inside the Docker container, as this drill did. **Follow-up:** already
   addressed for CI (TASK-041 added a `postgresql-client` install step); still true for this local
   dev machine specifically — install the PostgreSQL client tools locally if running these commands
   directly (not via `docker exec`) becomes a frequent need.
2. No real Railway production infrastructure exists yet — this drill validates the tooling and
   procedure, not real production timing/data-volume behavior. **Follow-up:** re-run this exact
   drill against real Railway infrastructure once a production project exists, and record a new
   Drill Report entry with real numbers before treating the RPO/RTO targets as validated rather than
   provisional.
3. No automated backup-freshness/failure alerting exists yet (`runbooks/backup.md`). **Follow-up:**
   tracked there already, unchanged by this drill.

## Cadence

Schedule periodic drills after launch — at minimum quarterly once the product has real production
data and users, per this task's own Notes. Each drill should produce a new dated entry in this file
following the same report format above.
