# TASK-027 — Implement projection inputs and unified upcoming obligations

## Status

DONE

## Phase

Phase 5 — Dashboard + Cashflow

## Priority

P1

## Depends On

- TASK-019
- TASK-023
- TASK-024

## Source Documents

- docs/04-projections-and-cashflow.md
- docs/14-dashboard-cashflow-slice.md
- docs/03-money-debt-engine.md

## Objective

Preparar queries agregadas, por usuario/moneda/timezone, para spendable y cashflow sin tablas derivadas prematuras.

## Scope

- Account balance, monthly, debt, upcoming and cashflow input queries.
- Normalize scheduled occurrences and debt installments as source-tagged events.
- Include only active liquid accounts and remaining obligations.

## Out of Scope

- FX, snapshots, scenario planning and generic persisted obligations.

## Domain Rules

- Posted/current data differs from expected/committed/projected.
- Recurring rules are never read directly as cashflow events.

## Implementation Notes

Implement bounded aggregate query set under `packages/db/src/queries/`; calculate meaning in finance.

## Expected Files

- `packages/db/src/queries/{account-balances,monthly-summary,debt-summary,upcoming-obligations,cashflow-inputs,dashboard}.ts`
- `packages/finance/src/projections/types.ts`

## Database Changes

Indexes only if query plans demonstrate need.

## API / Application Services

- Read contracts for TASK-028/029.

## UI Changes

None.

## Security Requirements

- User/timezone scope applied before aggregation.

## Financial Invariants

- Different currencies never aggregate together.
- Partial debt contributes remaining only.

## Error Cases

- Missing source, inconsistent currency, invalid date horizon.

## Acceptance Criteria

- [x] Query inputs are ownership/date/status filtered.
- [x] Source IDs/types survive normalization.
- [x] No N+1 for balances/debt/upcoming.

## Tests Required

### Unit

- [x] DTO normalization.

### Integration

- [x] Aggregate query fixtures and query plan sanity.

### E2E

None.

### Security

- [x] No foreign source enters read model.

### Property / Invariant

- [x] Source deduplication is deterministic.

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

Projection engines receive complete, exact, source-traceable inputs without business semantics hidden in SQL.

## Notes

Reserved funds are zero until a dedicated model exists.
