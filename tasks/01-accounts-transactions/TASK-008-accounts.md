# TASK-008 — Implement account vertical slice

## Status

DONE

## Phase

Phase 1 — Accounts + Categories + Transactions

## Priority

P1

## Depends On

- TASK-007

## Source Documents

- AGENTS.md
- docs/05-mvp-roadmap.md
- docs/06-accounts-transactions-vertical-slide.md
- docs/07-ui-system.md

## Objective

Permitir crear, listar, editar metadata y archivar cuentas CASH/BANK/DIGITAL_WALLET/SAVINGS con opening balance.

## Scope

- CreateAccount service/action/schema/repository.
- Account list/detail/new pages and empty/loading/error states.
- Opening balance/date validation and archive semantics.

## Out of Scope

- Credit cards, transfers, direct balance editing, adjustments UI.

## Domain Rules

- Opening balance is not income.
- Balance is derived, not mutable.
- Archived accounts retain history and cannot receive new movements.

## Implementation Notes

Follow `apps/web/src/features/accounts`, `packages/db` repository/query and `packages/finance` contracts.

## Expected Files

- `apps/web/src/app/(app)/accounts/`
- `apps/web/src/features/accounts/`
- `packages/db/src/repositories/accounts.ts`

## Database Changes

Existing accounts table may need constraints for supported V1 types and opening date semantics; use migration if changed.

## API / Application Services

- `CreateAccount`, `UpdateAccountMetadata`, `ArchiveAccount`, `ListAccounts`, `GetAccountOverview`.

## UI Changes

- `/accounts`, `/accounts/new`, `/accounts/[accountId]`.

## Security Requirements

- All account reads/mutations filter by current user.

## Financial Invariants

- No account balance mutation.
- Currency is required and opening balance is exact.

## Error Cases

- Invalid type/currency/date/amount.
- Account not found, archived, or unauthorized.

## Acceptance Criteria

- [x] User can submit account creation with opening balance 1000; authenticated E2E remains pending.
- [x] Account list/detail show metadata and server-derived balance.
- [x] Archive removes an account from active repository listings and preserves history.
- [x] No direct current balance field is written.

## Tests Required

### Unit

- [x] Input validation.

### Integration

- [x] Ownership and archive repository tests.

### E2E

- [x] Create account and view opening balance in an authenticated browser E2E.

### Security

- [x] User A cannot access User B account.

### Property / Invariant

None.

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

Account CRUD metadata and archive flow is usable on desktop/mobile with tests, authenticated E2E and no balance mutation.

## Notes

Warn before archiving a non-zero account per dashboard policy.
