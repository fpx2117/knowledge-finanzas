# TASK-007 — Establish application errors and ownership helpers

## Status

DONE

## Phase

Phase 0 — Repository / Foundation

## Priority

P0

## Depends On

- TASK-003
- TASK-004
- TASK-006

## Source Documents

- AGENTS.md
- docs/06-accounts-transactions-vertical-slide.md
- docs/19-security-privacy.md

## Objective

Definir errores normalizados y consultas ownership-first para que cada service/action pueda rechazar recursos ajenos sin filtrar existencia.

## Scope

- Application error codes and safe UI mapping boundary.
- Authenticated user context helper.
- Repository methods `findByIdForUser` and nested ownership checks.
- Zod validation package/boundary.

## Out of Scope

- Implementar entidades feature-specific.

## Domain Rules

- Auth is not authorization.
- Private IDs are queried with `id + userId`.
- Another user's resource maps to not-found semantics.

## Implementation Notes

Create `packages/validation` and shared error contracts only if needed; keep business rules in services, not actions.

## Expected Files

- `packages/validation/`
- `packages/shared/` or `apps/web/src/lib/errors/`
- `packages/db/src/repositories/`
- `apps/web/src/features/*/schemas/`

## Database Changes

None.

## API / Application Services

- `requireCurrentUser`
- ownership query conventions
- domain/application error mapper

## UI Changes

None.

## Security Requirements

- No client `userId` authority.
- No raw SQL/ORM/provider errors to browser.

## Financial Invariants

- Cross-user relations never persist.

## Error Cases

- Unauthenticated request.
- Invalid input.
- Missing/non-owned resource.
- Cross-resource ownership mismatch.

## Acceptance Criteria

- [x] Every implemented private query convention includes user ownership.
- [x] Initial error codes are stable and mapped safely.
- [x] Shared Zod primitives parse untrusted identifiers, currency codes and money strings.
- [x] Two-user ownership isolation tests exist.

## Tests Required

### Unit

- [x] Error mapping and validation.

### Integration

- [x] Owned/not-owned repository lookups against PostgreSQL with an isolated migrated test database.

### E2E

None.

### Security

- [x] User A cannot read another user's persisted resource; mutation coverage belongs to the application services that introduce writes.

### Property / Invariant

None.

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

New feature services have a reusable authenticated context, ownership-first repository API and safe normalized errors. Cross-resource mutation validation remains part of the feature services that introduce those mutations.

## Notes

Do not create a generic `BaseRepository<T>` that hides financial invariants. Repository integration tests use `TEST_DATABASE_URL`, migrations and serialized cleanup.
