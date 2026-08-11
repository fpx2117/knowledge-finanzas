# TASK-030 — Implement monthly category budgets

## Status

DONE

## Phase

Phase 6 — Budgets

## Priority

P1

## Depends On

- TASK-013
- TASK-009

## Source Documents

- docs/15-budgets-slice.md
- docs/04-projections-and-cashflow.md
- AGENTS.md

## Objective

Crear budgets mensuales por categoría y calcular consumo neto real con exactitud.

## Scope

- `budgets` schema/repository/service and active uniqueness.
- Pure budget engine: spent, remaining, usage and NORMAL/NEAR_LIMIT/EXCEEDED.
- Current user-timezone period and descendant category policy.
- Refund/reporting integration.

## Out of Scope

- Rollover, envelope/reserved funds, shared/weekly/AI budgets and historical versioning.

## Domain Rules

- Budget is not balance, reserve or obligation.
- Only posted consumption minus refunds counts.
- Remaining may be negative; budget does not alter spendable/cashflow.

## Implementation Notes

Use `packages/finance/src/budgets/`; category subtree can resolve in application layer for shallow V1 hierarchy.

## Expected Files

- `packages/db/src/schema.ts`
- `packages/finance/src/budgets/`
- `packages/db/src/queries/budgets.ts`
- `apps/web/src/features/budgets/`

## Database Changes

- `budgets`, monthly period/status, positive limit check, FKs/indexes/active uniqueness.

## API / Application Services

- `CreateBudget`, `UpdateBudget`, `ArchiveBudget`, `GetBudgetDetail`, `GetBudgetOverview`.

## UI Changes

None; TASK-031.

## Security Requirements

- User-owned active expense category and same currency required.

## Financial Invariants

- No FX and no income/transfer/liability payment in spent.

## Error Cases

- Invalid category/type/status/currency/limit, duplicate active budget.

## Acceptance Criteria

- [x] Active monthly budget can be created/edited/archived.
- [x] Spent/remaining/usage use exact values and timezone month.
- [x] 80% threshold is centralized/configurable.
- [x] Parent/descendant and overlap policy is documented and tested.

## Tests Required

### Unit

- [x] Budget formula/status/refund cases.

### Integration

- [x] Query subtree, period and uniqueness.

### E2E

None.

### Security

- [x] Foreign/income/archived category rejected.

### Property / Invariant

- [x] `remaining = limit - spent`, usage can exceed 100%.

## Verification Commands

- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

Budget calculations are deterministic and independent from obligations/reserved money.

## Notes

Use the resolved OQ-002 policy: parent budgets include descendants, and parent/child overlap is allowed as independent comparisons.
