# TASK-001 — Bootstrap monorepo and local runtime

## Status

DONE

## Phase

Phase 0 — Repository / Foundation

## Priority

P0

## Depends On

- None

## Source Documents

- AGENTS.md
- docs/05-mvp-roadmap.md
- docs/18-production-readiness.md

## Objective

Mantener un workspace pnpm ejecutable con app web, PostgreSQL local, Docker Compose y endpoint de salud.

## Scope

- Workspace pnpm, app Next.js, paquetes config/db/auth y Compose local.
- Scripts `dev`, `build`, `lint`, `typecheck`, `test`, `db:generate` y `db:migrate`.
- Endpoint `apps/web/src/app/api/health/route.ts`.

## Out of Scope

- CRUD financiero, worker, Redis, billing y AI.

## Domain Rules

- Mantener modular monolith y PostgreSQL como source of truth.

## Implementation Notes

El bootstrap ya existe. Solo corregirlo si verificaciones posteriores descubren una regresión.

## Expected Files

- `package.json`
- `pnpm-workspace.yaml`
- `docker-compose.yml`
- `apps/web/`
- `packages/config/`
- `packages/db/`
- `packages/auth/`

## Database Changes

None beyond existing initial migrations.

## API / Application Services

- Existing `/api/health` route.

## UI Changes

- Existing initial shell only.

## Security Requirements

- No secrets committed; DB remains server-side.

## Financial Invariants

None.

## Error Cases

- Missing local environment or unavailable PostgreSQL must fail clearly.

## Acceptance Criteria

- [x] `pnpm install` completes.
- [x] `docker compose up -d` starts local PostgreSQL.
- [x] `pnpm db:migrate` has a configured path.
- [x] Web app and health route exist.

## Tests Required

### Unit

None.

### Integration

- [x] Local DB connection/migration smoke.

### E2E

None.

### Security

- [x] Secrets excluded from tracked files.

### Property / Invariant

None.

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

El baseline existente sigue levantando y ningún cambio posterior rompe sus scripts.

## Notes

README now reflects that Auth and migrations already exist; the financial vertical remains pending.
