# TASK-010 — Implement income and expense ledger writes

## Status

DONE

## Phase

Phase 1 — Accounts + Categories + Transactions

## Priority

P1

## Depends On

- TASK-008
- TASK-009

## Source Documents

- AGENTS.md
- docs/03-money-debt-engine.md
- docs/06-accounts-transactions-vertical-slide.md
- docs/07-ui-system.md
- docs/19-security-privacy.md

## Objective

Implementar `CreateIncomeTransaction`, `CreateExpenseTransaction`, edición metadata y void de movimientos posted.

## Scope

- Zod input schemas with money strings.
- Application services, repositories and server actions.
- Transaction list/detail/filter/pagination and create forms.
- Posted/voided status and `occurredAt` rules.

## Out of Scope

- Transfers, refunds, liabilities, scheduled events and card purchases.

## Domain Rules

- Amount positive; type provides direction.
- Manual transactions are POSTED and never future-dated.
- Account/category/currency/opening date must be compatible.

## Implementation Notes

Keep actions thin: authenticate, Zod parse, service call, error mapping, revalidation.

## Expected Files

- `apps/web/src/features/transactions/`
- `apps/web/src/app/(app)/transactions/`
- `packages/db/src/repositories/transactions.ts`
- `packages/finance/src/transactions/`

## Database Changes

Existing transaction enums/schema may need indexes or source values via migration.

## API / Application Services

- `CreateIncomeTransaction`, `CreateExpenseTransaction`, `UpdateTransactionMetadata`, `VoidTransaction`, `ListTransactions`.

## UI Changes

- `/transactions`, `/transactions/[transactionId]`, quick expense/income entry.

## Security Requirements

- Ownership of account, category and transaction checked in same server operation.

## Financial Invariants

- Only POSTED movements affect balance; VOIDED never does.
- No `accounts.current_balance` update.

## Error Cases

- Invalid amount/date, currency mismatch, archived account/category, incompatible category, already voided.

## Acceptance Criteria

- [x] Income and expense forms persist positive magnitudes.
- [x] Future posted dates are rejected or routed to planning.
- [x] List supports date/account/category/type filters and pagination in the UI.
- [x] Void is confirmed in the UI and removes movement from derived balance.

## Tests Required

### Unit

- [x] Transaction classification and date rules.

### Integration

- [x] Repository filters, ordering and void state.

### E2E

- [x] Create income and expense from UI.

### Security

- [x] Foreign account/category/transaction rejected by service/repository ownership checks.

### Property / Invariant

- [ ] Positive amount and posted-only balance inputs.

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

The core ledger can record and void income/expense with exact, owned, explainable data.

## Notes

Keep original descriptions; future normalized fields belong to later AI/import work.
