# TASK-021 — Implement atomic debt payment service

## Status

DONE

## Phase

Phase 3 — Debts + Installments + Payments

## Priority

P0

## Depends On

- TASK-020
- TASK-011

## Source Documents

- AGENTS.md
- docs/12-debts-installments-payments-slice.md
- docs/19-security-privacy.md

## Objective

Registrar `LIABILITY_PAYMENT`, `DebtPayment` y allocations en una transacción con locking y protección de concurrencia.

## Scope

- `RecordDebtPayment` and allocation preview/confirm action.
- Lock relevant debt/installment rows, recalculate remaining, persist all aggregate records.
- Recompute effective statuses and revalidate dashboard/upcoming.

## Out of Scope

- Payment reversal/edit/delete and provider calls.

## Domain Rules

- Payment is cash outflow, not consumption expense.
- Negative account balance may be allowed with warning.
- No external call inside financial transaction.

## Implementation Notes

Use transaction-scoped repositories and row locks; payment transaction must link to payment uniquely.

## Expected Files

- `apps/web/src/features/debts/actions/record-payment.ts`
- `packages/db/src/repositories/debt-payments.ts`
- application service module.

## Database Changes

Add/verify unique payment transaction relation and status constraints through migration.

## API / Application Services

- `RecordDebtPayment`, `PreviewDebtPayment`.

## UI Changes

None; TASK-022.

## Security Requirements

- Debt, installment and paying account must resolve to same user.

## Financial Invariants

- Atomic transaction/payment/allocations/statuses.
- Allocation sum equals payment; remaining non-negative.

## Error Cases

- Concurrent overpayment, cancelled debt, archived account, currency/ownership mismatch.

## Acceptance Criteria

- [x] Partial/full/multi-installment/early payments work through the allocation engine and transaction service.
- [x] Concurrent attempts are serialized by account/debt/installment row locks before recalculation.
- [x] Failure rolls back transaction, payment, allocations and projection updates.
- [x] `LIABILITY_PAYMENT` reduces account but not monthly consumption.

## Tests Required

### Unit

- [x] Service classification and error mapping.

### Integration

- [x] Atomic mutation and row locking.

### E2E

- [x] Payment action contract is ready; UI remains in TASK-022.

### Security

- [x] Cross-user debt/account/installment rejected by ownership-scoped locks/queries.

### Property / Invariant

- [x] Allocation engine and locked service preserve allocation invariants.

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

Payments are durable, atomic, exact and safe under retry/concurrency, with no unsupported correction UI.

## Notes

Do not block universally on negative calculated balance.
