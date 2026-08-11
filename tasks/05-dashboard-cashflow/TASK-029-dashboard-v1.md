# TASK-029 — Implement Dashboard V1, explainability and cashflow UI

## Status

DONE

## Phase

Phase 5 — Dashboard + Cashflow

## Priority

P1

## Depends On

- TASK-028
- TASK-013

## Source Documents

- docs/14-dashboard-cashflow-slice.md
- docs/04-projections-and-cashflow.md
- docs/07-ui-system.md

## Objective

Convertir read models/engines en dashboard completo con saldo, deuda, upcoming, spendable y cashflow explicables.

## Scope

- Specialized read services orchestrated by `GetDashboardSummary`.
- Cards/timeline for liquid, debt, upcoming, spendable, monthly and 30-day projection.
- Drill-down breakdowns, confidence/status labels, mobile layout and safe partial/error states.

## Out of Scope

- Budgets card until TASK-031, FX, charts as sole explanation, net-worth history.

## Domain Rules

- Balance, spendable, cashflow and net worth remain distinct.
- Overdue included in commitments; scheduled income does not raise today spendable.

## Implementation Notes

Use shared `MoneyAmount`, `FinancialMetricCard`, `StatusBadge`; components receive calculated DTOs.

## Expected Files

- `apps/web/src/features/dashboard/`
- `packages/finance/src/projections/dashboard.ts`
- `apps/web/src/app/(app)/dashboard/`

## Database Changes

None; on-demand reads preferred.

## API / Application Services

- `GetLiquidBalances`, `GetMonthlySummary`, `GetDebtSummary`, `GetUpcomingObligations`, `GetSpendableMoney`, `GetCashflowProjection`, `GetDashboardSummary`.

## UI Changes

- Dashboard V1 cards/timeline/details and navigation.

## Security Requirements

- Dashboard read model is user-scoped and safe on query failure.

## Financial Invariants

- All displayed breakdowns sum to their totals.
- Currency sections never combine ARS/USD.

## Error Cases

- No accounts/debt/events, query failure, negative spendable/shortfall.

## Acceptance Criteria

- [x] User can answer what has/owes/due/spendable/projected from one view.
- [x] Every important number has source breakdown.
- [x] Projection labels say estimated/projected.
- [x] Mobile and loading/error/empty states work.

## Tests Required

### Unit

- [x] Dashboard DTO orchestration.

### Integration

- [x] Read services and revalidation after mutations.

### E2E

- [x] Dashboard reflects transaction, payment and scheduled changes.

### Security

- [x] User isolation.

### Property / Invariant

- [x] Breakdown equals headline totals.

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

Dashboard V1 is a consistent read model, not a second financial source of truth.

## Notes

Avoid materialized current-balance/spendable columns in V1.

Closed out the remaining gap: `dashboard-service.ts` was dropping `refundTotal`/`adjustmentInTotal`/`adjustmentOutTotal`/`liabilityPaymentTotal` when computing account balances (only income/expense were passed to `calculateAssetAccountBalance`), so debt payments never reduced the dashboard's liquid balance/debt summary; fixed and covered by a unit regression test. Also fixed two revalidation gaps found while testing (`create-income.ts` and `recurring-actions.ts` transitions were not revalidating `/dashboard`), and a pre-existing `cleanTestDatabase` truncate list missing the notification tables (was breaking every integration test that truncates `users`). E2E assertions poll with `toPass` after a mutation because cross-connection read visibility on the local Postgres container has a short (~1-3s) lag under this environment.
