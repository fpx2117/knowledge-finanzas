# TASK-020 — Implement payment allocation engine

## Status

DONE

## Phase

Phase 3 — Debts + Installments + Payments

## Priority

P0

## Depends On

- TASK-018
- TASK-019

## Source Documents

- docs/03-money-debt-engine.md
- docs/12-debts-installments-payments-slice.md
- AGENTS.md

## Objective

Calcular allocations manuales y `OLDEST_DUE_FIRST` sin overpayment ni inconsistencia.

## Scope

- Pure allocation input/output and remaining calculations.
- Sort by due date then installment number.
- Manual allocation validation and preview DTO.

## Out of Scope

- Persistence/locking and UI submission (TASK-021/022).

## Domain Rules

- Allocation > 0 and <= installment remaining.
- Sum allocations = payment amount.
- Future installments can be paid early.

## Implementation Notes

No DB access in pure engine; all amounts are Money of same currency.

## Expected Files

- `packages/finance/src/debt/allocate-payment.ts`
- `packages/finance/src/debt/index.ts`

## Database Changes

None.

## API / Application Services

- Allocation preview contract for payment service.

## UI Changes

None.

## Security Requirements

- Service caller must verify installments belong to selected debt/user.

## Financial Invariants

- No allocation to PAID/CANCELLED; no payment over total outstanding.

## Error Cases

- Empty/manual mismatch, over installment, over debt, currency mismatch.

## Acceptance Criteria

- [x] 250 allocates 100/100/50 oldest-first.
- [x] Manual allocations sum exactly to payment.
- [x] Future installments are eligible.
- [x] Overpayment is rejected deterministically.

## Tests Required

### Unit

- [x] Oldest-first, manual and invalid cases.

### Integration

None.

### E2E

None.

### Security

None beyond service contract.

### Property / Invariant

- [x] Allocation sum equals payment and never exceeds remaining.

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

Payment allocation is pure, exact and safe to call inside a locked DB transaction.

## Notes

Use error `PAYMENT_EXCEEDS_DEBT_REMAINING` for overpayment.
