# TASK-019 — Implement debt lifecycle and obligation queries

## Status

DONE

## Phase

Phase 3 — Debts + Installments + Payments

## Priority

P1

## Depends On

- TASK-017
- TASK-018

## Source Documents

- docs/03-money-debt-engine.md
- docs/04-projections-and-cashflow.md
- docs/12-debts-installments-payments-slice.md
- docs/07-ui-system.md

## Objective

Persistir deudas confirmadas, derivar estados y exponer cuotas próximas/vencidas con remaining exacto.

## Scope

- `CreateDebt`, list/detail and controlled edits/cancel.
- Installment/debt effective status derivation by user timezone.
- Upcoming debt query ordered overdue/today/date.

## Out of Scope

- Payment creation, scheduled expenses and card statements.

## Domain Rules

- PAID when all non-cancelled remaining is zero.
- OVERDUE when remaining > 0 and due date before user today.
- Cancellation preserves paid history and cancels future unpaid installments.

## Implementation Notes

Stored status is a projection; queries recalculate effective status when needed.

## Expected Files

- `packages/finance/src/debt/installment-status.ts`
- `packages/finance/src/debt/debt-status.ts`
- `packages/db/src/queries/debt-summary.ts`
- `apps/web/src/features/debts/`

## Database Changes

None beyond TASK-017.

## API / Application Services

- `CreateDebt`, `GetDebtDetail`, `ListDebts`, `CancelDebt`.

## UI Changes

- Debt list/detail and installment status views.

## Security Requirements

- All debt queries include `userId` ownership.

## Financial Invariants

- Remaining = total - allocation sum; upcoming uses remaining, not original total.

## Error Cases

- Cancelled/paid state invalid action, foreign debt, invalid dates.

## Acceptance Criteria

- [x] Generated/manual debt persists atomically.
- [x] Statuses handle partial, paid, overdue and due-today correctly.
- [x] Cancellation preserves paid installments.
- [x] Upcoming query returns remaining and user-timezone groups.

## Tests Required

### Unit

- [x] Status matrix and debt derivation.

### Integration

- [x] Create/cancel/query ownership.

### E2E

- [x] Create debt and inspect detail.

### Security

- [x] Foreign debt is not disclosed.

### Property / Invariant

- [x] Debt remaining never negative.

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

The app can answer how much is owed and which installments are due without payments yet.

## Notes

No payment edit/delete/reversal action is exposed in V1, as resolved by OQ-006.
