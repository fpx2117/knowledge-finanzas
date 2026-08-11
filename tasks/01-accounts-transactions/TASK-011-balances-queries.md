# TASK-011 — Implement derived account balances and activity queries

## Status

DONE

## Phase

Phase 1 — Accounts + Categories + Transactions

## Priority

P0

## Depends On

- TASK-006
- TASK-010

## Source Documents

- AGENTS.md
- docs/03-money-debt-engine.md
- docs/04-projections-and-cashflow.md
- docs/06-accounts-transactions-vertical-slide.md
- docs/14-dashboard-cashflow-slice.md

## Objective

Calcular balances actuales e históricos desde opening balance + movimientos posted mediante consultas agregadas y finance rules.

## Scope

- Pure asset balance calculator.
- Account balance aggregate query with no N+1.
- Per-account and per-currency liquid totals.
- Recent activity read model.

## Out of Scope

- Spendable, debt, cashflow, FX and net-worth history.

## Domain Rules

- Income plus, expense minus, refund/transfer/liability types prepared for future.
- Voided and future events excluded.
- Cards are not liquid assets.

## Implementation Notes

DB returns decimal strings; finance combines Money. Put query files under `packages/db/src/queries/`.

## Expected Files

- `packages/finance/src/accounts/calculate-balance.ts`
- `packages/db/src/queries/account-balances.ts`
- `packages/db/src/queries/activity.ts`

## Database Changes

Add only indexes proven necessary for aggregate queries.

## API / Application Services

- `GetAccountBalance`, `GetLiquidBalances`, `GetAccountOverview`.

## UI Changes

- Account detail/list consume calculated values.

## Security Requirements

- Every query is scoped by user.

## Financial Invariants

- Balance = opening balance + posted ledger effect.
- Different currencies stay separate.

## Error Cases

- Missing account, unsupported type, malformed DB numeric.

## Acceptance Criteria

- [x] Opening-only account returns opening balance.
- [x] Income/expense and voided example returns 1300.
- [x] Account list uses bounded aggregate queries, not N+1.
- [x] Multi-currency totals are separate.

## Tests Required

### Unit

- [x] Opening, income, expense, multiple and voided cases.

### Integration

- [x] Aggregate query and ownership.

### E2E

None; covered by TASK-012.

### Security

- [x] Query cannot return another user's account.

### Property / Invariant

- [x] Recalculation is deterministic from ledger.

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

All current balances are derived exact values and can be reconstructed without mutable projections.

## Notes

Do not add `current_balance` to accounts.
