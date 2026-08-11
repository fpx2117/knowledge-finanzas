# TASK-013 — Add refund and adjustment ledger semantics

## Status

DONE

## Phase

Phase 1 — Accounts + Categories + Transactions

## Priority

P2

## Depends On

- TASK-010
- TASK-011

## Source Documents

- AGENTS.md
- docs/03-money-debt-engine.md
- docs/04-projections-and-cashflow.md
- docs/14-dashboard-cashflow-slice.md
- docs/15-budgets-slice.md

## Objective

Agregar eventos explícitos para reembolsos y correcciones sin convertirlos en income ordinario ni editar saldos silenciosamente.

## Scope

- Apply ADR-001: use explicit `ADJUSTMENT_IN` and `ADJUSTMENT_OUT` types before schema implementation.
- Refund linked to original transaction with max refundable amount.
- Explicit adjustment direction/reason and optional related transaction.
- Balance, monthly reporting and budget classification.

## Out of Scope

- Automated bank reconciliation and complex reversals.

## Domain Rules

- Refund reduces net consumption and increases account balance; not ordinary income.
- Adjustment always has direction and reason.
- No refund over original refundable amount.

## Implementation Notes

Prefer explicit transaction types and links; use atomic writes and reporting classifier shared by dashboard/budgets.

## Expected Files

- `packages/db/src/schema.ts`
- `packages/finance/src/transactions/`
- `apps/web/src/features/transactions/`
- migration under `packages/db/drizzle/`

## Database Changes

- Refund link/metadata, adjustment direction/type, constraints and indexes.

## API / Application Services

- `CreateRefund`, `CreateAdjustment`.

## UI Changes

- Explicit correction/refund actions and explainable labels.

## Security Requirements

- Original transaction and account must belong to current user.

## Financial Invariants

- Refund total <= refundable original.
- Adjustment changes balance only through ledger event.

## Error Cases

- Ineligible/orphan/over refund, ambiguous adjustment direction, currency mismatch.

## Acceptance Criteria

- [x] Refund changes balance and net spending correctly.
- [x] Refund is excluded from ordinary income.
- [x] Adjustment cannot be directionless or reasonless.
- [x] Balance/reporting use the shared ledger economic classification contract; budget consumption will reuse it when budgets are introduced.

## Tests Required

### Unit

- [x] Refund and adjustment classification.

### Integration

- [x] Atomic link/constraint tests.

### E2E

None.

### Security

- [x] Cross-user original/refund rejected.

### Property / Invariant

- [x] Refund cannot exceed refundable amount.

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

Refunds and corrections are explicit, reconstructible and consumed consistently by balance, reporting and budget engines.

## Notes

This task is intentionally P2 because the first slice only requires income/expense.
