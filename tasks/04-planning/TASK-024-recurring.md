# TASK-024 — Implement recurrence rules and idempotent occurrence generation

## Status

DONE

## Phase

Phase 4 — Planning + Scheduled + Recurring

## Priority

P1

## Depends On

- TASK-006
- TASK-023

## Source Documents

- docs/13-planning-recurring-slice.md
- docs/03-money-debt-engine.md
- docs/18-production-readiness.md

## Objective

Representar reglas recurrentes y materializar ocurrencias hasta 90 días sin duplicados.

## Scope

- Recurring schema, weekly/biweekly/monthly/quarterly/yearly rules.
- Pure date generation with anchor/leap policy.
- Create/update/pause/resume/cancel and `GenerateRecurringOccurrences`.
- Unique `(recurring_transaction_id, scheduled_date)`.

## Out of Scope

- Cron/worker deployment, custom expressions, recurring transfers and AI prediction.

## Domain Rules

- Rule is not a transaction and never changes balance directly.
- Past posted occurrences never change when rule changes.
- Pause stops new rows; cancellation policy applies to future unposted rows.

## Implementation Notes

Generate on create/edit/page access until worker exists; later job can catch up idempotently.

## Expected Files

- `packages/finance/src/recurrence/`
- `packages/db/src/schema.ts`
- `apps/web/src/features/planning/actions/`

## Database Changes

- `recurring_transactions`, relation/status/frequency fields, unique occurrence constraint and indexes.

## API / Application Services

- `CreateRecurringTransaction`, `UpdateRecurringTransaction`, `PauseRecurringTransaction`, `ResumeRecurringTransaction`, `CancelRecurringTransaction`, `GenerateRecurringOccurrences`.

## UI Changes

None; TASK-026.

## Security Requirements

- All rules and generated rows are user-owned.

## Financial Invariants

- Same rule/date produces one scheduled occurrence.

## Error Cases

- Invalid date range/frequency, paused/cancelled rule, duplicate generation.

## Acceptance Criteria

- [x] Generation is bounded to 90 days.
- [x] Running generator twice yields same rows.
- [x] Monthly/yearly edge dates are deterministic.
- [x] Rule edits do not mutate posted history.

## Tests Required

### Unit

- [x] Frequency/date generation.

### Integration

- [x] Unique occurrence and state transitions.

### E2E

None.

### Security

- [x] Cross-user rule cannot be generated/read.

### Property / Invariant

- [x] Idempotent generation.

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

Recurring rules safely produce scheduled expectations and preserve historical truth.

## Notes

Do not deploy a worker solely for this task.
