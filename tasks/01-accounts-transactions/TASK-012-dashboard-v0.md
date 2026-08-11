# TASK-012 — Implement Dashboard V0 and first vertical E2E

## Status

DONE

## Phase

Phase 1 — Accounts + Categories + Transactions

## Priority

P1

## Depends On

- TASK-011

## Source Documents

- AGENTS.md
- docs/05-mvp-roadmap.md
- docs/06-accounts-transactions-vertical-slide.md
- docs/07-ui-system.md
- docs/14-dashboard-cashflow-slice.md

## Objective

Reemplazar placeholders del shell por Dashboard V0 real: balances líquidos, income/expenses del mes y recientes.

## Scope

- `GetDashboardSummary` V0 and timezone-aware month range.
- Multi-currency cards, recent five movements and actionable empty states.
- Loading/error states, responsive shell and shared money formatter.
- Critical E2E flow from registration through balance 1300.

## Out of Scope

- Debt, spendable, upcoming obligations, budgets and cashflow cards.

## Domain Rules

- Monthly metrics include POSTED movements in user's month only.
- Transfers/liability payments are excluded from consumption when later added.

## Implementation Notes

Use read model + finance calculation; UI does not compute balances. Existing `apps/web/src/app/page.tsx` is only a visual placeholder.

## Expected Files

- `apps/web/src/app/(app)/dashboard/`
- `apps/web/src/features/dashboard/`
- `packages/db/src/queries/dashboard.ts`
- shared `MoneyAmount` formatter.

## Database Changes

None unless query indexes require reviewed migration.

## API / Application Services

- `GetDashboardSummary`.

## UI Changes

- `/dashboard`, app navigation, metric cards, recent transactions and empty states.

## Security Requirements

- Dashboard only reads current user's data.

## Financial Invariants

- No fake cross-currency total.
- No debt/spendable/cashflow placeholders before their sources exist.

## Error Cases

- No accounts, no activity, query failure, unauthorized access.

## Acceptance Criteria

- [x] Register → account 1000 → income 500 → expense 200 shows 1300.
- [x] Monthly cards use user timezone.
- [x] Multi-currency totals are separated.
- [x] Empty/loading/error/mobile states are usable.

## Tests Required

### Unit

- [x] Dashboard aggregation semantics.

### Integration

- [x] Dashboard query ownership and month boundaries.

### E2E

- [x] Critical vertical flow.

### Security

- [x] User isolation through dashboard queries.

### Property / Invariant

- [x] Breakdown totals equal displayed totals.

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

First vertical slice acceptance in `AGENTS.md` is demonstrably complete.

## Notes

This is the first milestone before transfers/debts.
