# TASK-004 — Establish Drizzle migrations and financial schema baseline

## Status

DONE

## Phase

Phase 0 — Repository / Foundation

## Priority

P0

## Depends On

- TASK-001
- TASK-002

## Source Documents

- AGENTS.md
- docs/02-database-schema.md
- docs/06-accounts-transactions-vertical-slide.md
- docs/18-production-readiness.md

## Objective

Mantener un schema Drizzle migrable para identidad y el primer ledger, sin balances mutables.

## Scope

- Existing users, accounts, categories and transactions.
- NUMERIC amounts, UUIDs, date/timestamp types, ownership FKs, positive amount checks and indexes.
- Generated migration files.

## Out of Scope

- Future domain tables.

## Domain Rules

- PostgreSQL is canonical truth.
- Financial history uses restrict/archive/void semantics.

## Implementation Notes

Review schema before each future migration; do not edit applied SQL by hand.

## Expected Files

- `packages/db/src/schema.ts`
- `packages/db/drizzle.config.ts`
- `packages/db/drizzle/*.sql`

## Database Changes

- Existing initial tables, enums, checks, FKs and indexes.

## API / Application Services

None.

## UI Changes

None.

## Security Requirements

- Explicit user ownership and `ON DELETE RESTRICT` for financial entities.

## Financial Invariants

- Amounts positive magnitudes.
- No `current_balance` source-of-truth column.

## Error Cases

- Migration against incompatible schema.
- Constraint violation.

## Acceptance Criteria

- [x] Schema is represented in Drizzle.
- [x] Initial migrations exist.
- [x] NUMERIC is used for monetary fields.
- [ ] Clean database migration is exercised in CI by TASK-041.

## Tests Required

### Unit

None.

### Integration

- [x] Migration smoke has been executed locally.

### E2E

None.

### Security

- [ ] Cross-user constraints/queries covered by feature tasks.

### Property / Invariant

None.

## Verification Commands

- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm lint`
- `pnpm typecheck`

## Definition of Done

Baseline schema remains reproducible from migrations and is extended only through reviewed migrations.

## Notes

Future slices must add migrations, never mutate production manually.
