# TASK-018 — Implement installment generation and preview

## Status

DONE

## Phase

Phase 3 — Debts + Installments + Payments

## Priority

P0

## Depends On

- TASK-006
- TASK-017

## Source Documents

- docs/03-money-debt-engine.md
- docs/05-mvp-roadmap.md
- docs/12-debts-installments-payments-slice.md
- AGENTS.md

## Objective

Generar cuotas exactas o aceptar cuotas manuales con preview revisable antes de persistir.

## Scope

- Monthly/weekly/biweekly dates, anchor-day and leap-year policy.
- Exact amount division with last remainder.
- Generated/manual preview validation and atomic create orchestration contract.

## Out of Scope

- Advanced amortization, variable rates and principal prepayment.

## Domain Rules

- Sum installments equals total payable.
- Monthly 31st preserves anchor day across short months.
- Preview is not persisted until confirmation.

## Implementation Notes

Pure functions in `packages/finance/src/debt/`; date utilities come from TASK-006.

## Expected Files

- `packages/finance/src/debt/generate-installments.ts`
- `packages/finance/src/debt/installment-dates.ts`
- `apps/web/src/features/debts/`

## Database Changes

None beyond TASK-017.

## API / Application Services

- `PreviewDebtInstallments`, input for `CreateDebt`.

## UI Changes

- Debt setup/review preview.

## Security Requirements

- Preview data is scoped to authenticated user before confirm.

## Financial Invariants

- Exact total equality; all amounts/date/counts valid.

## Error Cases

- Invalid frequency/date/count/manual sequence/amount sum.

## Acceptance Criteria

- [x] 1200/12 produces 12 exact installments.
- [x] 100/3 produces deterministic remainder.
- [x] Jan 31 → Feb last day → Mar 31 and leap years pass.
- [x] User can edit preview dates/amounts before confirmation.

## Tests Required

### Unit

- [x] Frequencies, rounding, dates and manual validation.

### Integration

None.

### E2E

- [x] Preview/review interaction before future confirmation persistence.

### Security

None beyond shared ownership.

### Property / Invariant

- [x] Sum generated installments equals total payable.

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

Installment generation is deterministic, pure and reviewed before persistence.

## Notes

Do not let an LLM calculate installment amounts.
