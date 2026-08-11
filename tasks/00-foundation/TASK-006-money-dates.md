# TASK-006 — Implement exact Money and financial date primitives

## Status

DONE

## Phase

Phase 0 — Repository / Foundation

## Priority

P0

## Depends On

- TASK-002
- TASK-005

## Source Documents

- AGENTS.md
- docs/03-money-debt-engine.md
- docs/06-accounts-transactions-vertical-slide.md
- docs/12-debts-installments-payments-slice.md
- docs/13-planning-recurring-slice.md

## Objective

Crear `packages/finance` con Money/Decimal exactos, currency metadata, rounding central y fechas financieras timezone-safe.

## Scope

- Money value object with currency equality checks and positive input parsing.
- Currency decimal places and `HALF_UP` default.
- Installment remainder helper where last installment receives remainder.
- LocalDate and user-timezone month/today range helpers.

## Out of Scope

- FX conversion, card interest and projections.

## Domain Rules

- No canonical money arithmetic with JavaScript `number`.
- Different currencies never combine implicitly.
- `DATE` concepts stay local dates; event timestamps stay timezone-aware.

## Implementation Notes

Create `packages/finance/src/money/` and shared date utilities. DB NUMERIC values enter as strings/decimal, not `Number()`.

## Expected Files

- `packages/finance/package.json`
- `packages/finance/src/money/money.ts`
- `packages/finance/src/money/currency.ts`
- `packages/finance/src/money/rounding.ts`
- `packages/finance/src/dates/`

## Database Changes

None.

## API / Application Services

- Public finance exports for Money, parsing, rounding and financial date ranges.

## UI Changes

None.

## Security Requirements

- Reject malformed decimal strings before domain entry.

## Financial Invariants

- `sum(split(total)) === total`.
- Currency mismatch is explicit error.

## Error Cases

- Zero/negative amount where positive required.
- Invalid decimal, currency or local date.
- Cross-currency arithmetic.

## Acceptance Criteria

- [x] Exact add/subtract/compare operations exist.
- [x] Rounding is centralized and tested.
- [x] `100 / 3` produces `33.33, 33.33, 33.34` for 2-decimal currency.
- [x] User timezone determines month boundaries and today.

## Tests Required

### Unit

- [x] Arithmetic, mismatch, parsing, formatting and large values.

### Integration

None.

### E2E

None.

### Security

- [x] Inputs cannot silently coerce to floating point.

### Property / Invariant

- [x] Installment parts always sum to original.

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

All financial tasks can consume one exact, tested Money/date contract without local rounding or timezone logic.

## Notes

This is the root dependency for every financial engine.
