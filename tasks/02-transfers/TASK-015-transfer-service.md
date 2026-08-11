# TASK-015 — Implement atomic transfer application service

## Status

DONE

## Phase

Phase 2 — Transfers

## Priority

P0

## Depends On

- TASK-014

## Source Documents

- AGENTS.md
- docs/11-transfers-vertical-slice.md
- docs/19-security-privacy.md

## Objective

Implementar `CreateTransfer` con persistencia atómica de agregado y dos movimientos.

## Scope

- Auth, Zod, ownership, active/currency/date validation.
- Transaction-scoped repository and DB transaction.
- Optional negative-balance warning without universal blocking.

## Out of Scope

- Idempotency keys mandatory, FX and fees.

## Domain Rules

- Roll back all records if either leg fails.
- Internal transfer excluded from income/expense totals.

## Implementation Notes

Create transfer ID, insert shell/legs and finalize links inside one DB transaction.

## Expected Files

- `apps/web/src/features/transfers/actions/create-transfer.ts`
- `apps/web/src/features/transfers/schemas/`
- `packages/db/src/repositories/transfers.ts`
- application service module.

## Database Changes

None beyond TASK-014.

## API / Application Services

- `CreateTransfer`.

## UI Changes

None; TASK-016 consumes it.

## Security Requirements

- Query both accounts with user filter; never trust client user ID.

## Financial Invariants

- No partial transfer.
- Total assets unchanged in same currency.

## Error Cases

- Ownership/state/currency/date/amount failures; second-leg persistence failure.

## Acceptance Criteria

- [x] Creates one transfer and exactly two legs atomically.
- [x] Failure rolls back shell and both legs.
- [x] Revalidates dashboard/accounts/transactions.

## Tests Required

### Unit

- [x] Service input/error mapping.

### Integration

- [x] Atomic creation and rollback.

### E2E

None.

### Security

- [x] User A cannot transfer to User B account.

### Property / Invariant

- [x] Consolidated assets and monthly income/expense unchanged by the transfer legs.

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

Concurrent-safe enough for V1 and no request can leave a half-created transfer.

## Notes

External calls are forbidden inside the financial DB transaction.
