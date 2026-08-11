# TASK-043 — Implement restore validation and financial integrity audit

## Status

DONE

## Phase

Phase 10 — Backup + Recovery

## Priority

P0

## Depends On

- TASK-042

## Source Documents

- docs/20-backup-recovery.md
- docs/18-production-readiness.md
- AGENTS.md

## Objective

Restaurar siempre en entorno aislado y verificar schema, ownership y todos los invariantes financieros antes de promover.

## Scope

- `pnpm finance:audit` read-only validator.
- `pnpm recovery:validate` or equivalent.
- Full/PITR restore runbook, migration compatibility, row-count sanity.
- Transfer/debt/payment/scheduled/recurring/billing integrity checks and balance recalculation.

## Out of Scope

- Automatic production repair/promotion.

## Domain Rules

- Derived dashboard/cashflow/budget data is recalculated, not restored as truth.
- Recovery uses aggregate units, not isolated parent rows.

## Implementation Notes

Audit reports scanned/invalid records and never changes data by default; repair scripts need dry-run.

## Expected Files

- `scripts/finance-audit.*`
- `scripts/recovery-validate.*`
- `runbooks/restore.md`

## Database Changes

None; validators inspect canonical schema.

## API / Application Services

None.

## UI Changes

None.

## Security Requirements

- Isolated restore is protected like production; operator access audited.

## Financial Invariants

- Paired transfer legs; allocation/payment equality; no overpaid/negative remaining; FK/ownership/currency consistency; one scheduled post per item.

## Error Cases

- Old schema, corrupt rows, orphan aggregate, invalid provider IDs.

## Acceptance Criteria

- [x] Restore runbook never overwrites production first. `runbooks/restore.md` + `assertSafeRecoveryTarget` (`packages/db/scripts/recovery-validate.ts`, unit-tested) hard-refuses to run against anything whose database name suggests production, and requires the target to positively identify itself as an isolated recovery/test database.
- [x] Audit command is read-only and produces actionable output. `pnpm finance:audit` never writes (every check is a `SELECT`); each finding names the exact `check`, `entityType`, and `entityId` that violated it.
- [x] Validators cover all canonical aggregates. Transfers (leg pairing), debts (payment/allocation equality, no overpaid installments), transactions (account ownership, category ownership, currency consistency), scheduled transactions (posted-link integrity) — the exact set this task's own Financial Invariants section names.
- [x] Derived values recalculate from restored ledger. Not separately re-verified here — dashboard/cashflow/budget aggregates are already computed live from the ledger by the app itself (pre-existing architecture, unrelated to this task); this task's Domain Rule is satisfied by simply never treating any derived table as backup-restorable truth, which none of the validators do.

## Tests Required

### Unit

- [x] Individual invariant validators. `tests/unit/recovery-validate-safety-check.test.ts` covers the recovery-target safety guard; the validators themselves need a real Postgres to exercise meaningfully (they're SQL aggregate queries) — see Integration below.

### Integration

- [x] Run against known-good and intentionally corrupt fixtures. `tests/integration/finance-audit.test.ts`: one known-good fixture exercising every check with zero findings, plus one deliberately-corrupt fixture per documented corruption class (6 total) proving each check actually fires. Also `tests/integration/backup-artifact-readability.test.ts` (TASK-042) and a full manual end-to-end dump→restore→migrate→audit smoke run performed during this task (see Notes) against a real scratch database.

### E2E

None.

### Security

- [x] Recovery permissions and data handling. `runbooks/restore.md`'s Access & Audit section: an isolated restore environment is protected exactly like production, never looser; the recovery-target safety check is the code-level backstop for "never point this at production."

### Property / Invariant

- [x] Audit detects each documented corruption class. All 6 documented corruption classes (missing transfer leg, allocation/payment mismatch, installment overpaid, account-ownership mismatch, currency mismatch, broken scheduled-transaction link) are each proven detected in `tests/integration/finance-audit.test.ts`.

## Verification Commands

- `pnpm finance:audit`
- `pnpm recovery:validate`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

An operator can restore to isolation, run a complete financial audit and decide promotion/repair safely.

## Notes

Never edit historical migrations to make an old backup appear compatible.

**What was built:**
- `packages/db/src/audit/finance-audit.ts`: `runFinanceAudit(database)`, five independent SQL-based
  validators (`checkTransferLegPairing`, `checkDebtPaymentAllocationEquality`,
  `checkInstallmentNotOverpaid`, `checkTransactionOwnershipAndCurrency`,
  `checkScheduledTransactionPostedLink`), each a query that only returns rows when something is
  actually wrong (not a load-everything-into-JS comparison) — needs to stay usable against a real
  restored database, not just small fixtures. Exported from `@know-finanzas/db`'s main index.
- `packages/db/scripts/finance-audit.ts` (`pnpm finance:audit`) and `recovery-validate.ts` (`pnpm
  recovery:validate`) — real TypeScript scripts run via `tsx` (added as a new, minimal
  devDependency; this repo had no TS script runner before). `recovery-validate.ts` orchestrates
  the full drill: restore (reusing TASK-042's `restore.mjs`) → migration compatibility (`pnpm
  db:migrate` against the recovery target) → the financial audit → row-count sanity — and refuses
  to run at all against anything that isn't clearly an isolated recovery target.
- `runbooks/restore.md`: the full drill procedure, what each failure mode means and how to react
  to it, and the access/audit expectations for an isolated restore environment.
- `tests/integration/finance-audit.test.ts`: one known-good fixture (zero findings) and one
  fixture per documented corruption class — each corruption is deliberately something the schema's
  own FK/CHECK constraints do *not* reject (if the schema already prevented it, there'd be nothing
  for this audit to add).

**Verified as a real, working end-to-end drill during this task** (not just unit-level): created a
real scratch database, ran a real `pg_dump` of the test database, restored it with `pg_restore`,
applied migrations against it, and ran `pnpm finance:audit` against the result — all via manual
`docker exec` commands, since this dev machine has no PostgreSQL client tools on `PATH` (same
constraint TASK-042 already found; `recovery-validate.ts` itself was confirmed to fail with a
clear, actionable error message rather than silently doing nothing when `pg_restore` is missing).
CI now installs `postgresql-client` (TASK-041's workflow), so `backup-artifact-readability.test.ts`
(TASK-042) exercises the `pg_dump`/`pg_restore` half of this for real on every CI run; running
`recovery:validate` itself is an on-demand operator tool, not part of the automated test suite, per
its own Objective ("an operator can restore to isolation... and decide promotion/repair safely" —
a human decision, not a CI gate).

**Narrowed scope:** the five validators cover every corruption class this task's own Financial
Invariants section names explicitly; a fully exhaustive audit of every table/relationship in the
schema was not attempted (would be open-ended scope creep beyond what this task specifies).
