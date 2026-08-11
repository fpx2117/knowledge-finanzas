# TASK-036 — Establish AI provider boundary and model registry

## Status

DONE

## Phase

Phase 8 — AI + OpenRouter

## Priority

P2

## Depends On

- TASK-002
- TASK-005
- TASK-045

## Source Documents

- docs/08-ai-openrouter.md
- docs/08.1-ai-credits-and-usage.md
- docs/17-ai-categorization-slice.md
- docs/19-security-privacy.md

## Objective

Crear la frontera server-only de `packages/ai` con `AIProvider`, `OpenRouterProvider`, registry de modelos/capabilities, structured outputs, telemetría segura y degradación controlada.

## Scope

- Server-only provider interface/client con `generateStructured` como capability inicial; dejar `generateText` y streaming preparados solo si una capability concreta los necesita.
- OpenRouter adapter para autenticación, requests, timeouts, provider preferences, structured outputs, usage extraction y normalización de errores.
- FAST/BALANCED/QUALITY/REASONING registry and capability validation.
- Model routing valida compatibilidad con structured outputs, tool calling, streaming o reasoning antes de enviar la request.
- Prompt metadata/version, generation metadata and safe telemetry without raw financial context by default.
- AI kill switch, server-side entitlement/quota and graceful unavailable result.
- Access-state integration distinguishes `AI_ACCESS_REQUIRED` from `AI_CREDITS_EXHAUSTED`; `EXPIRED_READ_ONLY` must never call the provider.

## Out of Scope

- Embeddings, RAG, agent frameworks, assistant/tool orchestration, scenario engine, action preparation and autonomous actions.

## Domain Rules

- AI output is untrusted; finance engine remains truth.
- Core works with AI disabled.

## Implementation Notes

OpenRouter HTTP is confined to `packages/ai/src/providers/openrouter`; product features depend on capabilities and `AIProvider`, never on an OpenRouter SDK/client directly. AI remains above application/finance services.

## Expected Files

- `packages/ai/src/provider.ts`
- `packages/ai/src/models/`
- `packages/ai/src/providers/openrouter/`
- `packages/ai/src/structured/`
- `packages/ai/src/telemetry/`
- `packages/ai/evals/`
- `packages/config/src/index.ts`

## Database Changes

Optional `ai_generations` metadata table with limited retention; store safe generation metadata only. Never store the full prompt by default.

## API / Application Services

- AI provider factory and error mapping.
- Central model resolution by role; feature code must not hardcode model IDs.
- Server-side entitlement and quota boundary, separate from provider token/cost telemetry.
- AI usage wrapper remains outside `AIProvider`; credit reservation/commit/release is handled by the usage layer.

## UI Changes

None.

## Security Requirements

- API key server-only, prompt data untrusted, no sensitive full history by default.

## Financial Invariants

- Provider cannot mutate transactions, balances, debts, budgets or billing.

## Error Cases

- Disabled, access required, credits exhausted, timeout, rate limited, invalid output, unsupported model/provider.

## Acceptance Criteria

- [x] Provider is mockable and server-only (`AIProvider` interface, `createOpenRouterProvider` accepts an injectable `fetchImpl`; nothing in `packages/ai` imports Next.js/client code).
- [x] Model role resolves centrally and validates structured-output capability (`resolveModel` + `validateModelCompatibility`, called inside the provider before every request).
- [x] OpenRouter integration is isolated from product features and supports normalized provider failures (all HTTP/timeout errors mapped to `AIErrorCode`; no capability code touches `providers/openrouter` directly).
- [x] Timeout/retry/fallback are bounded (per-request `AbortController` timeout; no unbounded retry loop was added — none of the in-scope capabilities need one yet).
- [x] Structured outputs pass schema validation before reaching a capability (`parseStructuredOutput` re-validates every response against the same Zod schema sent as the JSON Schema hint).
- [x] Entitlement/quota and `AI_ENABLED` are enforced server-side (`createAIExecutor`: kill switch first, then injected entitlement/reservation ports).
- [x] Provider execution is compatible with idempotent credit reservation and release without coupling credits into `AIProvider` (reservation/commit/release ports live in `execute-generation.ts`, not in the provider interface; default to permissive no-ops until TASK-052/045 supply real ones).
- [x] Telemetry excludes raw financial content by default and records safe generation metadata (`GenerationTelemetry` has no field for prompt/raw/output content by construction; verified in tests).

## Tests Required

### Unit

- [x] Registry/error/timeout mapping.
- [x] Structured output and capability compatibility mapping.
- [x] Telemetry redaction and model-role resolution.

### Integration

- [x] Provider contract with mocked HTTP.
- [x] Disabled, quota, timeout, provider-error and unsupported-capability behavior.

### E2E

None.

### Security

- [x] API key never enters client bundle/logs (server-only package, no `"use client"` boundary; key only ever appears in the `Authorization` header sent server-side).

### Property / Invariant

None.

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

AI is an optional, observable, replaceable adapter with no financial authority.

## Notes

AI uses server-side entitlement/quota and must be disableable through configuration, per resolved OQ-009.
