# TASK-022 — Implement debts, installments and payment UI

## Status

DONE

## Phase

Phase 3 — Debts + Installments + Payments

## Priority

P1

## Depends On

- TASK-019
- TASK-021

## Source Documents

- docs/12-debts-installments-payments-slice.md
- docs/07-ui-system.md
- AGENTS.md

## Objective

Exponer deuda, cuotas, pagos y estados en interfaces claras y mobile-first.

## Scope

- `/debts`, `/debts/new`, `/debts/[debtId]`.
- Four-step debt form and installment preview.
- Payment form with oldest-first/manual allocation preview.
- Overdue/partial/negative-balance warnings and confirmations.

## Out of Scope

- Payment reversal, cards, advanced amortization.

## Domain Rules

- UI displays remaining, not original total, for obligations.
- Debt payment label is not generic expense.

## Implementation Notes

Use shared MoneyInput, StatusBadge, ConfirmDialog; never calculate statuses in React.

## Expected Files

- `apps/web/src/app/(app)/debts/`
- `apps/web/src/features/debts/components/`
- `apps/web/src/features/debts/actions/`

## Database Changes

None.

## API / Application Services

- Existing debt/payment services.

## UI Changes

- Full debt and installment lifecycle UI, accessible labels, loading/empty/error states.

## Security Requirements

- Detail/actions use owned IDs and safe not-found messages.

## Financial Invariants

- Displayed payment allocation total equals submitted payment.

## Error Cases

- Overpayment, invalid allocation, cancelled/paid installment, provider/db failure.

## Acceptance Criteria

- [x] User can create generated/manual debt and review installments.
- [x] User can make partial/full/early/multi payments through FIFO/manual allocation UI.
- [x] Status, remaining and overdue labels are rendered from server-derived values.
- [x] No payment deletion/edit action is exposed.

## Tests Required

### Unit

- [x] Component state/formatting contracts.

### Integration

- [x] Form actions map domain errors safely.

### E2E

- [x] Create debt → review/pay from detail flow is covered by E2E.

### Security

- [x] User isolation uses owned debt/account IDs in server service.

### Property / Invariant

- [x] UI preview totals are generated from the shared allocation engine.

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

The user can understand and pay obligations without financial ambiguity or unsafe corrections.

## Notes

Use Spanish product vocabulary while keeping domain error codes stable.
