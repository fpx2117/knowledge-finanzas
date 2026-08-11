# TASK-014 — Implement transfer schema and deterministic rules

## Status

DONE

## Phase

Phase 2 — Transfers

## Priority

P0

## Depends On

- TASK-011

## Source Documents

- AGENTS.md
- docs/03-money-debt-engine.md
- docs/11-transfers-vertical-slice.md
- docs/02-database-schema.md

## Objective

Modelar transferencias propias como agregado con dos legs vinculadas.

## Scope

- `transfers` table and `TRANSFER_IN/TRANSFER_OUT` transaction types/source.
- Pure `validateTransfer` rules.
- Same-user, active-account, different-account, same-currency V1 constraints.

## Out of Scope

- Cross-currency, fees, external/scheduled/recurring transfers.

## Domain Rules

- Transfer is neither income nor expense and preserves consolidated assets.
- Amount is positive and equal on both legs.

## Implementation Notes

Use `transactions.transfer_id` as canonical leg link; protect one leg per transfer/type.

## Expected Files

- `packages/db/src/schema.ts`
- `packages/finance/src/transfers/`
- `packages/db/drizzle/*.sql`

## Database Changes

- `transfers`, enum values/source, `transactions.transfer_id`, FKs, checks and indexes.

## API / Application Services

- Transfer validation contract for TASK-015.

## UI Changes

None.

## Security Requirements

- Both accounts must be owned by current user.

## Financial Invariants

- Exactly one OUT and one IN, same amount/currency.

## Error Cases

- Same account, foreign account, archived account, currency mismatch, invalid date/amount.

## Acceptance Criteria

- [x] Migration is reviewed and reproducible.
- [x] Pure validation returns normalized error codes.
- [x] DB prevents invalid amount/self-reference and supports paired lookup.

## Tests Required

### Unit

- [x] Same-account/currency/date validation.

### Integration

- [x] Constraints and paired leg lookup.

### E2E

None.

### Security

- [x] Foreign account relation rejected.

### Property / Invariant

- [x] Leg amounts/currencies equal.

## Verification Commands

- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

Transfer aggregate and rules exist without any balance mutation shortcut.

## Notes

Migration must modify PostgreSQL enums through reviewed SQL.
