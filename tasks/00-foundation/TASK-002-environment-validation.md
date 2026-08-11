# TASK-002 — Centralize environment validation

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
- docs/18-production-readiness.md
- docs/19-security-privacy.md

## Objective

Hacer que toda configuración requerida y condicional se valide server-side al inicio sin lecturas arbitrarias de `process.env`.

## Scope

- Mantener la validación existente de DB/Auth/Node.
- Agregar estructura para flags `AI_ENABLED`, `BILLING_ENABLED` y capability credentials cuando se habiliten.
- Documentar nombres en `.env.example` sin secretos.
- Fail fast ante combinación de flag y credencial faltante.

## Out of Scope

- Provisionar Railway, Mercado Pago u OpenRouter.

## Domain Rules

- Secretos nunca van al cliente.
- Features opcionales no pueden romper el core si están deshabilitadas.

## Implementation Notes

Extender `packages/config/src/index.ts`; mantener config por capability y no usar `process.env.X` en módulos de negocio.

## Expected Files

- `packages/config/src/index.ts`
- `.env.example`
- `packages/config/package.json`

## Database Changes

None.

## API / Application Services

None.

## UI Changes

None.

## Security Requirements

- `DATABASE_URL`, auth secrets, provider tokens and AI keys are server-only.
- Invalid production configuration must stop startup.

## Financial Invariants

- Configuration cannot select a provider that changes financial truth.

## Error Cases

- Missing required variable.
- Enabled capability without its credentials/model.
- Empty secret treated as undefined.

## Acceptance Criteria

- [x] All current and future env variables have one validated boundary.
- [x] Feature flags enforce conditional requirements.
- [x] `.env.example` documents required/optional purpose.
- [x] Client bundle exposes no secret.

## Tests Required

### Unit

- [x] Valid and invalid env matrices are exposed through the pure `parseCapabilityEnvironment` contract; executable runner coverage belongs to TASK-005.

### Integration

- [x] App fails fast with missing core variable.

### E2E

None.

### Security

- [x] No `NEXT_PUBLIC_*` secret configuration.

### Property / Invariant

None.

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

Config is the only environment access layer and covers current plus conditionally enabled capabilities.

## Notes

Capability configuration is validated at startup; missing core variables fail the app/build and no client-side secret variables are configured.
