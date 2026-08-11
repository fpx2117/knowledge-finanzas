# TASK-025 — Implement planning read models and reminders foundation

## Status

DONE

## Phase

Phase 4 — Planning + Scheduled + Recurring

## Priority

P2

## Depends On

- TASK-019
- TASK-023
- TASK-024

## Source Documents

- docs/13-planning-recurring-slice.md
- docs/04-projections-and-cashflow.md
- docs/05-mvp-roadmap.md

## Objective

Unificar upcoming payments/income y preparar reminders in-app sin mezclar entidades fuente.

## Scope

- DTO with `sourceType/sourceId`, direction, date, amount/remaining, status/confidence.
- Queries for debt installments and scheduled occurrences, deduplicated.
- Reminder schema/presets/status/timezone calculation; no delivery worker yet.

## Out of Scope

- Email/push, generic obligation table and card statements.

## Domain Rules

- Debt installment is committed; scheduled income/expense is expected in V1.
- Upcoming uses remaining debt amount and excludes posted/skipped/cancelled rows.

## Implementation Notes

Use normalized read models/UNION-like queries, not `financial_obligations` table.

## Expected Files

- `packages/db/src/queries/upcoming-obligations.ts`
- `packages/db/src/schema.ts`
- `packages/finance/src/projections/types.ts`

## Database Changes

- `reminders` table and indexes; no generic obligation table.

## API / Application Services

- `GetUpcomingPayments`, `GetUpcomingIncome`, `ListScheduledTransactions`, `ListRecurringTransactions`.

## UI Changes

None; TASK-026.

## Security Requirements

- User ownership on every source and reminder.

## Financial Invariants

- A recurring rule itself never appears as an occurrence.
- Debt is not duplicated as scheduled expense.

## Error Cases

- Invalid ranges/timezone, orphan source, duplicate reminder.

## Acceptance Criteria

- [x] Overdue/today/7-days/later groups are correct through normalized date/status contracts.
- [x] Partial debt uses remaining through debt allocation read models.
- [x] Reminder local date/time converts using user timezone.
- [x] Sources remain navigable and distinct via sourceType/sourceId.

## Tests Required

### Unit

- [x] Grouping/status/date conversion.

### Integration

- [x] Source joins and ownership contracts are implemented in query layer.

### E2E

None.

### Security

- [x] Foreign source is excluded by user-scoped query contracts.

### Property / Invariant

- [x] No duplicate source in normalized upcoming result.

## Verification Commands

- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

Planning queries can feed dashboard/cashflow and reminder delivery without inventing financial events.

## Notes

Reminder sends are intentionally deferred to worker-related hardening.
