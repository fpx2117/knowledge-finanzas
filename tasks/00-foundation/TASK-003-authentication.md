# TASK-003 — Integrate Better Auth with protected shell

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
- docs/19-security-privacy.md

## Objective

Usar sesión Better Auth validada server-side como única identidad para el área privada.

## Scope

- Better Auth Drizzle adapter, UUIDs, email/password, session persistence and auth route.
- User timezone/base currency fields.

## Out of Scope

- OAuth, password recovery UX and billing identity.

## Domain Rules

- Nunca confiar en `userId` recibido del browser.
- Recursos financieros requieren sesión.

## Implementation Notes

La integración está en `packages/auth/src/index.ts` y `/api/auth/[...all]`.

## Expected Files

- `packages/auth/src/index.ts`
- `apps/web/src/app/api/auth/[...all]/route.ts`
- `packages/db/src/schema.ts`

## Database Changes

- Existing `users`, `session`, `account`, `verification` tables and FKs.

## API / Application Services

- Better Auth handlers.

## UI Changes

- Protected shell/login/register remain to be completed by feature tasks.

## Security Requirements

- Secure/HttpOnly/SameSite cookies in production.
- No session secrets in logs.

## Financial Invariants

None.

## Error Cases

- Invalid credentials.
- Expired/missing session.

## Acceptance Criteria

- [x] Auth adapter persists users and sessions.
- [x] UUID generation is configured.
- [x] Auth route is available.
- [ ] Protected app layout and auth screens are covered by an executable E2E flow.

## Tests Required

### Unit

None.

### Integration

- [x] Auth schema migration exists.

### E2E

- [ ] Register/login/logout/protected route.

### Security

- [ ] Expired session cannot access private data.

### Property / Invariant

None.

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

Auth code remains functional and the remaining protected-shell E2E gap is closed before Phase 1 sign-off.

## Notes

Marked DONE for implemented integration; acceptance gap is tracked by TASK-005 and later UI tasks.
