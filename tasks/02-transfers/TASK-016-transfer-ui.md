# TASK-016 — Implement transfer history, voiding and UI

## Status

DONE

## Phase

Phase 2 — Transfers

## Priority

P1

## Depends On

- TASK-015

## Source Documents

- AGENTS.md
- docs/11-transfers-vertical-slice.md
- docs/07-ui-system.md

## Objective

Permitir crear, visualizar y anular transferencias sin duplicar su representación global.

## Scope

- Transfer form/quick action, account selectors, preview and negative warning.
- Global `TransferRow` collapsed; account detail shows relevant leg.
- `VoidTransfer` atomically voids transfer and both legs.

## Out of Scope

- Free-form transfer editing, future transfers and cross-currency.

## Domain Rules

- One leg cannot be voided alone.
- Transfer labels must not say income/expense.

## Implementation Notes

Use `FinancialActivityItem` discriminated union rather than forcing all data into `TransactionRow`.

## Expected Files

- `apps/web/src/features/transfers/`
- `apps/web/src/app/(app)/accounts/`
- `apps/web/src/features/transactions/components/TransferRow.tsx`

## Database Changes

None.

## API / Application Services

- `VoidTransfer`, `ListGlobalActivity`, `ListAccountTransactions`.

## UI Changes

- Transfer form, detail/history, confirm dialog, mobile flow and empty state.

## Security Requirements

- Ownership and not-found semantics on transfer detail/void.

## Financial Invariants

- Void restores both account balances and leaves income/expenses/net assets unchanged.

## Error Cases

- One-account-only setup, already voided, archived account, unauthorized transfer.

## Acceptance Criteria

- [x] Bank 1000 → Cash 200 yields 800/300 and total 1100.
- [x] Global list shows one logical row; account detail shows one leg.
- [x] Void returns balances to original atomically.
- [x] Mobile/accessibility labels are complete.

## Tests Required

### Unit

- [x] Activity item mapping.

### Integration

- [x] Void atomicity.

### E2E

- [x] Create and void transfer flow.

### Security

- [x] Cross-user detail/void is not disclosed.

### Property / Invariant

- [x] Assets preserved before/after create and after void.

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

Transfer is understandable in UI and correct in every ledger/reporting view.

## Notes

Do not add a generic `applyAccountDelta` helper.
