# TASK-028 — Implement spendable money and cashflow engines

## Status

DONE

## Phase

Phase 5 — Dashboard + Cashflow

## Priority

P0

## Depends On

- TASK-006
- TASK-027

## Source Documents

- docs/03-money-debt-engine.md
- docs/04-projections-and-cashflow.md
- docs/14-dashboard-cashflow-slice.md
- AGENTS.md

## Objective

Implementar funciones puras para `Spendable Money` conservador y proyección de cashflow de 30 días por moneda.

## Scope

- `calculateSpendable` with liquid - reserved(0) - debt obligations due in horizon.
- `calculateCashflow` with scheduled income/expense + remaining debt events.
- Daily grouping, end-of-day balance, projected end/minimum/shortfall/date.

## Out of Scope

- Future income in spendable, FX, ML forecasts and advice.

## Domain Rules

- Spendable is estimate and may be negative.
- Future income affects projection, not current spendable.
- Same-day intraday order is not inferred.

## Implementation Notes

Place pure modules in `packages/finance/src/projections/`; output explainable source-tagged DTOs.

## Expected Files

- `packages/finance/src/projections/spendable-money.ts`
- `packages/finance/src/projections/cashflow.ts`
- tests under finance package.

## Database Changes

None.

## API / Application Services

- Pure engine contracts consumed by dashboard service.

## UI Changes

None; TASK-029.

## Security Requirements

- Inputs must already be ownership-filtered; engine cannot accept hidden foreign data.

## Financial Invariants

- Projection never mutates canonical data.
- `minimumProjectedBalance < 0` yields shortfall and first negative date.

## Error Cases

- Mixed currencies, invalid horizon, malformed event amounts.

## Acceptance Criteria

- [x] Spendable breakdown explains liquid/committed/result.
- [x] 30-day inclusive horizon is defined and tested.
- [x] End-of-day same-date events are grouped.
- [x] Empty future events preserve current balance.

## Tests Required

### Unit

- [x] Spendable and projection examples.

### Integration

None.

### E2E

None.

### Security

None.

### Property / Invariant

- [x] Pure/rebuildable and currency-separated results.

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

Projection metrics are deterministic, explainable and independent of UI/DB mutations.

## Notes

No automatic financial advice is generated.
