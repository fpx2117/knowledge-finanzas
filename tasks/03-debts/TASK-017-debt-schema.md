# TASK-017 — Implement debt and installment persistence

## Status

DONE

## Phase

Phase 3 — Debts + Installments + Payments

## Priority

P0

## Depends On

- TASK-006
- TASK-007

## Source Documents

- AGENTS.md
- docs/01-domain-model.md
- docs/02-database-schema.md
- docs/12-debts-installments-payments-slice.md

## Objective

Crear tablas y tipos para `Debt`, `DebtInstallment`, `DebtPayment` y `PaymentAllocation` sin guardar remaining como truth.

## Scope

- Debt/installment/payment/allocation schema, enums, FKs, indexes and constraints.
- Direct user ownership and restrict deletes.
- Payment status supports future reversal without exposing it yet.

## Out of Scope

- Credit-card minimum payment, amortization, interest engine and payment reversal UI.

## Domain Rules

- Debt is not one expense transaction.
- Remaining derives from total minus allocations.
- Principal/original amount can differ from total payable.

## Implementation Notes

Use NUMERIC exact fields, unique installment numbers and payment transaction relation.

## Expected Files

- `packages/db/src/schema.ts`
- `packages/db/drizzle/*.sql`
- `packages/finance/src/debt/debt-types.ts`

## Database Changes

- `debts`, `debt_installments`, `debt_payments`, `debt_payment_allocations`, `LIABILITY_PAYMENT` enum/source and indexes.

## API / Application Services

Contracts for TASK-018 through TASK-021.

## UI Changes

None.

## Security Requirements

- Debt, installment, payment, account and allocation ownership checked together.

## Financial Invariants

- Positive totals; non-negative principal/interest/fee; allocations cannot overrun installment.

## Error Cases

- Orphan relation, duplicate installment number, invalid currency/status/amount.

## Acceptance Criteria

- [x] Schema migrates from clean DB.
- [x] All critical FKs/indexes/constraints exist.
- [x] No canonical `remaining_amount` field is required.

## Tests Required

### Unit

- [x] Enum/domain contract.

### Integration

- [x] Constraints and ownership joins.

### E2E

None.

### Security

- [x] Nested ownership rejects foreign debt/installment relations; future payment/account joins remain repository contracts.

### Property / Invariant

- [x] Allocation rows require positive amounts and unique payment/installment pairs; aggregate over-allocation remains a transactional invariant for TASK-020/021.

## Verification Commands

- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

Debt aggregate persistence is ready for deterministic generation and atomic payment writes.

## Notes

Do not implement full credit-card statement model in this task.
