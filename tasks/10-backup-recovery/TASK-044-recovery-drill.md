# TASK-044 — Execute recovery drill and document disaster procedures

## Status

DONE

## Phase

Phase 10 — Backup + Recovery

## Priority

P0

## Depends On

- TASK-043

## Source Documents

- docs/20-backup-recovery.md
- docs/18-production-readiness.md
- docs/19-security-privacy.md

## Objective

Demostrar con un ejercicio medido que el sistema puede recuperar ledger, auth, planning y billing sin inventar movimientos.

## Scope

- At least one pre-launch full restore drill and periodic schedule.
- Measure restore/validate/service-ready durations and recoverable timestamp.
- Rebuild recurring jobs/reminders/reconciliation after Redis loss.
- Reconcile Mercado Pago after DB restore; invalidate caches.
- Document Postgres/Redis/worker/provider/outage scenarios.

## Out of Scope

- Active-active regional failover and legal incident response.

## Domain Rules

- DB outage returns safe errors; never buffers financial writes in browser/Redis.
- Restore does not auto-post scheduled events.

## Implementation Notes

Keep recovery audit trail: who/when/why/backup/commands/result. Use sanitized datasets for developer debugging.

## Expected Files

- `runbooks/disaster-recovery.md`
- drill reports/automation
- worker rebuild scripts when worker exists.

## Database Changes

None.

## API / Application Services

- Recovery/reconciliation procedures only.

## UI Changes

None.

## Security Requirements

- Only authorized operators restore/download/repair; real data isolated.

## Financial Invariants

- Post-drill audit passes; billing state reconciles from provider; derived views rebuild.

## Error Cases

- Backup too old, migration mismatch, provider drift, stale reminders/jobs.

## Acceptance Criteria

- [x] Full restore drill completes in isolated DB. Executed 2026-08-11 against a freshly created `know_finanzas_drill_scratch` database — see the Drill Report in `runbooks/disaster-recovery.md`.
- [x] Integrity audit and product/auth smoke pass. `pnpm finance:audit` against the restored database: zero findings across 1 transfer/12 transactions/2 debt payments/7 installments/1 scheduled transaction. Product/auth smoke: a real sign-in against a restored user succeeded and returned a real session; `GET /dashboard` with that session returned `200`.
- [x] Actual RPO/RTO are measured and compared to target. Measured: backup 431ms, restore 2,519ms, migration check 1,257ms, audit 1,091ms, app-boot ~5s, smoke <1s — total ≈11s. Compared honestly against the ≤1h/≤4h targets in the Drill Report: not a meaningful comparison at this data volume/local-infra scale, but confirms no structural bottleneck in the procedure itself (see Notes for why a real Railway drill is still needed before treating RPO/RTO as validated).
- [x] Findings produce runbook, automation, test or infrastructure follow-up. Three findings recorded in the Drill Report, each with its own follow-up (local PATH gap already addressed for CI in TASK-041; no real Railway infra yet — re-run drill once it exists; no automated backup-freshness alert — already tracked in `runbooks/backup.md`).

## Tests Required

### Unit

None.

### Integration

- [x] Recovery scripts against isolated environment. `tests/integration/finance-audit.test.ts` (TASK-043) plus this task's own live manual drill run (not an automated test — a real, one-time, dated execution, matching this task's actual Objective of *demonstrating* recovery rather than just testing the scripts in isolation again).

### E2E

- [x] Auth/product smoke after restore. Performed live during the drill: real `POST /api/auth/sign-in/email` against a restored user, real session cookie, real authenticated `GET /dashboard` returning `200`. Not automated as a repeatable E2E spec (would require orchestrating a real backup/restore cycle inside the Playwright harness, a meaningfully larger undertaking than this task's own drill-demonstration Objective calls for) — see Notes.

### Security

- [x] Recovery access/audit trail review. `runbooks/disaster-recovery.md`'s Drill Report records operator/when/why/backup file/exact commands/result — the audit-trail format `runbooks/restore.md` (TASK-043) already asks for, applied here for real.

### Property / Invariant

- [x] Full financial audit after drill. Zero findings, recorded in the Drill Report (see above).

## Verification Commands

- `pnpm finance:audit`
- `pnpm recovery:validate`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

Recovery is demonstrated, measured and documented rather than assumed from backup configuration alone.

## Notes

Schedule periodic drills after launch, at least quarterly once the product matures.

**What was built:** `runbooks/disaster-recovery.md` — a per-scenario playbook (Postgres restore,
Redis loss, Mercado Pago post-restore reconciliation, cache invalidation) plus a dated Drill Report
section documenting the actual drill executed for this task, in the audit-trail format
`runbooks/restore.md` already specifies (who/when/why/backup/commands/result).

**The drill was real, not simulated in the abstract:** it ran the full 28-spec E2E suite first to
populate the test database with genuine multi-domain data (30 users, 28 accounts, 12 transactions,
3 debts, plus billing/promotion/referral/notification rows), backed it up with a real `pg_dump`,
restored it into a freshly created isolated scratch database, ran the real migration-compatibility
check and `pnpm finance:audit` (zero findings), then booted the actual Next.js app against the
restored database and performed a real authenticated sign-in and dashboard load — not a mocked or
described version of any of these steps.

**Scope decision, consistent with TASK-039/042/043:** no real Railway production project exists,
so this drill measures the tooling/procedure's own overhead against real local Docker
infrastructure, not real production-scale timing. The Drill Report says this explicitly rather than
implying the measured ~11 seconds validates the ≤1h/≤4h RPO/RTO targets — it doesn't, and the report
says so. What it does prove: the full pipeline (backup → restore → migrate → audit → app boot →
auth → product smoke) works correctly end-to-end with zero manual data-fixing required at any step,
which is the actual thing this task asks to be *demonstrated* rather than assumed.

**Narrowed scope:** the auth/product smoke was performed live (real commands, real results, fully
recorded) but not turned into a repeatable, automated E2E spec — doing so would mean orchestrating
a real `pg_dump`/`pg_restore` cycle from inside the Playwright test harness itself, a meaningfully
larger undertaking than this task's own Objective ("demonstrate with a measured exercise") calls
for. The next real drill (against actual Railway infrastructure, or the next scheduled periodic
one) should follow the same manual procedure recorded here and add a new dated entry to
`runbooks/disaster-recovery.md`.
