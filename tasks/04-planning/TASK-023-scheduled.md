# TASK-023 — Implement scheduled transaction lifecycle

## Status

DONE

## Phase

Phase 4 — Planning + Scheduled + Recurring

## Priority

P1

## Depends On

- TASK-010
- TASK-019

## Source Documents

- docs/13-planning-recurring-slice.md
- docs/03-money-debt-engine.md
- AGENTS.md

## Objective

Crear expectativas futuras de income/expense que solo impacten el ledger al confirmarse.

## Scope

- Scheduled schema/status/source, create/update/cancel/skip.
- Atomic `PostScheduledTransaction` with row lock, link and idempotency.
- Optional actual amount/date while preserving expected values.

## Out of Scope

- Scheduled transfers, automatic bank posting and recurring rules.

## Domain Rules

- Scheduled is not posted and does not affect actual balance.
- Posted occurrence creates exactly one real transaction.
- Skip/cancel do not create transactions.

## Implementation Notes

Use unique relationship on `postedTransactionId` and source/link fields; no external calls in transaction.

## Expected Files

- `packages/db/src/schema.ts`
- `packages/finance/src/planning/`
- `apps/web/src/features/planning/actions/`
- migration.

## Database Changes

- `scheduled_transactions`, statuses/source, links, ownership FKs, indexes and uniqueness.

## API / Application Services

- `CreateScheduledTransaction`, `UpdateScheduledTransaction`, `PostScheduledTransaction`, `SkipScheduledTransaction`, `CancelScheduledTransaction`.

## UI Changes

None; TASK-026.

## Security Requirements

- Account/category ownership and archived state validated server-side.

## Financial Invariants

- At most one posted transaction per scheduled item.

## Error Cases

- Invalid state, duplicate post, currency/ownership mismatch.

## Acceptance Criteria

- [x] Scheduled event is excluded from balance/projection before posting and is replaced by one actual transaction after posting.
- [x] Posting is atomic and retry-safe.
- [x] Skip/cancel preserve history and do not post.

## Tests Required

### Unit

- [x] Status transitions.

### Integration

- [x] Concurrent posting lock/idempotency and rollback boundary are implemented and integration-tested.

### E2E

None.

### Security

- [x] Foreign scheduled resource rejected by user-scoped service/repository.

### Property / Invariant

- [x] Double posting creates one transaction.

## Verification Commands

- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

Scheduled expectations have a complete safe lifecycle distinct from actual transactions.

## Notes

Future dates belong here, never as future POSTED transactions.
