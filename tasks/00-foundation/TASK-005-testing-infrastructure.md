# TASK-005 — Establish automated test infrastructure

## Status

DONE

## Phase

Phase 0 — Repository / Foundation

## Priority

P0

## Depends On

- TASK-001

## Source Documents

- AGENTS.md
- docs/05-mvp-roadmap.md
- docs/06-accounts-transactions-vertical-slide.md
- docs/18-production-readiness.md

## Objective

Reemplazar el placeholder de tests por unit, integration, application y E2E ejecutables con datos aislados.

## Scope

- Elegir y configurar runner compatible con TypeScript/Next.
- Scripts root/package, fixtures, test DB lifecycle and test env.
- Helpers for auth sessions and database cleanup.
- Mock boundary for external providers.

## Out of Scope

- Implementar tests de cada feature futura.

## Domain Rules

- Finance tests must use exact amounts and timezone fixtures.
- External calls are mocked in normal CI.

## Implementation Notes

No test runner existe; no asumir que el actual `pnpm test` verifica nada.

## Expected Files

- `package.json`
- `apps/web/package.json`
- `tests/` or package-local test directories
- test configuration files

## Database Changes

None; test database setup only.

## API / Application Services

- Test helpers for server actions/services.

## UI Changes

None.

## Security Requirements

- Tests never use production credentials/data.
- Ownership fixtures must create at least two users.

## Financial Invariants

- Tests must be able to assert atomicity and exact arithmetic.

## Error Cases

- Missing test DB.
- Leaked external network request.
- Test order/data contamination.

## Acceptance Criteria

- [x] `pnpm test` executes real tests and fails on assertion failure.
- [x] Unit and integration projects are configured.
- [x] Test DB/fixtures are isolated and repeatable.
- [x] External providers have mock contracts.

## Tests Required

### Unit

- [x] Runner smoke test.

### Integration

- [x] Fixture and PostgreSQL migration smoke tests run against an isolated `TEST_DATABASE_URL`.

### E2E

- [x] Browser strategy documented for later critical flows.

### Security

- [x] Two-user fixture proves isolation helper works.

### Property / Invariant

- [x] Property test capability is available through Vitest; domain properties will be added with TASK-006.

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

CI can run deterministic real tests from a clean checkout without live Mercado Pago/OpenRouter calls.

## Notes

Vitest and Playwright are configured as the smallest runners that fit the pnpm/Next stack. PostgreSQL integration setup applies migrations, cleans test tables and fails fast when the test database is unavailable.
