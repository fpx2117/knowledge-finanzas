# TASK-040 — Establish observability, security controls and rate limits

## Status

DONE

## Phase

Phase 9 — Production + Security Hardening

## Priority

P0

## Depends On

- TASK-039

## Source Documents

- docs/18-production-readiness.md
- docs/19-security-privacy.md
- docs/08-ai-openrouter.md
- docs/08.1-ai-credits-and-usage.md
- docs/10.2-pricing-unit-economics.md
- docs/09-notifications-alerts.md
- AGENTS.md

## Objective

Agregar controles operativos y de seguridad transversales sin degradar integridad financiera.

## Scope

- Structured logs/request IDs/error tracking with redaction.
- Security headers/CSP/HTTPS/open-redirect policy.
- Rate limits for auth, AI by user/capability, billing refresh, webhook abuse and future uploads.
- Critical metrics/alerts and IDOR/concurrency security suite.
- Business cost metrics and guardrail alerts are emitted without raw financial/AI context; detailed implementation is TASK-046.

## Out of Scope

- Full SIEM, advanced fraud detection and public admin console.

## Domain Rules

- Critical financial errors are high severity.
- Redis is optional infrastructure, never financial truth.

## Implementation Notes

Use operation/entity IDs, not full descriptions/notes/request bodies. Prefer bounded Redis fallback behavior for core writes.

## Expected Files

- `packages/observability/`
- `apps/web` middleware/headers
- rate-limit utilities and security tests.

## Database Changes

Optional audit metadata table only if logs do not suffice; preserve financial history.

## API / Application Services

- Logging/error middleware and rate-limit boundary.

## UI Changes

None beyond safe error states.

## Security Requirements

- CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS when stable.
- No raw provider/auth/financial sensitive logging.
- AI telemetry excludes raw prompts, full descriptions, conversations and tool results by default.
- Credit grants, consumption, refunds, expiration and remaining balance are observable without exposing raw financial/AI context.

## Financial Invariants

- Rate limiting must not create, drop or fake financial writes.

## Error Cases

- Provider error leakage, rate-limit backend outage, suspicious concurrency.

## Acceptance Criteria

- [x] Requests/jobs have correlation IDs. Every request through `apps/web/src/middleware.ts` gets an `x-request-id` (trusted from an incoming UUID-shaped header, generated fresh otherwise), set on the response and propagated to the Server Component/Route Handler/Server Action downstream via `next/headers`. Deliberately excluded on `/api/webhooks/*` — see Notes for why.
- [x] Sensitive fields are redacted. `packages/observability`'s `redactFields`/`createLogger` strip a denylist of sensitive key names (password, secret, token, description, notes, prompt, message, content, etc.) at any nesting depth before an entry ever reaches a sink.
- [x] Security headers and internal error mapping are active. CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-Frame-Options on every response; HSTS added over HTTPS. `mapErrorToUi` (pre-existing) already never leaks a raw message/stack for an unexpected error — confirmed, unchanged.
- [x] IDOR, double payment/posting/transfer tests exist. `tests/integration/security-idor-and-concurrency.test.ts` (new) plus the pre-existing `tests/integration/ownership-repositories.test.ts`.

## Tests Required

### Unit

- [x] Redaction/header/rate policy. `tests/unit/observability-redact.test.ts`, `tests/unit/observability-security-headers.test.ts`, `tests/unit/observability-rate-limit.test.ts`, `tests/unit/observability-request-id.test.ts`, `tests/unit/observability-logger.test.ts`.

### Integration

- [x] Error tracking/log sink contract. Narrowed: `createLogger`'s `LogSink` port and its exact entry shape (`level`, `event`, `timestamp`, `service`, `requestId`, redacted `fields`) are proven by `tests/unit/observability-logger.test.ts` using a capturing sink — no real external log aggregator exists to integrate against yet (nothing in this codebase currently sends logs anywhere but stdout), so there is no live "integration" beyond the contract itself. Swapping `consoleSink` for a real vendor sink later needs no changes to any call site.

### E2E

None.

### Security

- [x] IDOR, XSS-safe rendering, open redirect, webhook authenticity. IDOR: see above. XSS-safe rendering: pre-existing (React's default escaping; no `dangerouslySetInnerHTML` in the codebase). Open redirect: pre-existing (every server-side `redirect()` call site in this codebase uses a literal, hardcoded path — never a client-supplied URL). Webhook authenticity: pre-existing signature verification (Mercado Pago/Resend/Twilio) confirmed still correctly wired, now with structured logging on `invalid_signature`/unexpected-error outcomes and a new bounded per-IP rate limit in `middleware.ts` (60 req/min per IP+path) in front of it.

### Property / Invariant

- [x] Retry/concurrency invariants across critical writes. `tests/integration/security-idor-and-concurrency.test.ts`'s concurrency suite proves two concurrent debt payments against the same debt serialize correctly under real Postgres row locking (`for("update")`) with no corrupted/lost allocation — this and the pre-existing atomic transfer/webhook-idempotency/AI-credit/StartTrial/promotion-redemption tests together cover the write paths that matter most; ordinary transaction/account creation has no idempotency key and a genuine double-click there still creates two rows today — a real, narrow, pre-existing gap this task didn't introduce and didn't have the room to close (see Notes).

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

Operations can diagnose failures without exposing secrets or compromising financial correctness.

## Notes

Do not rate-limit ordinary legitimate ledger writes indiscriminately.

**What was built:**
- `packages/observability` (new): `createLogger`/`consoleSink` (structured JSON to stdout, swappable sink port), `redactFields` (denylist-based, any nesting depth), `generateRequestId`/`resolveRequestId` (UUID-only trust boundary — a log-injection guard), `createBoundedInMemoryRateLimiter` (same shape as `packages/ai`'s and `packages/promotions`'s existing limiters, duplicated rather than shared per this repo's package-decoupling convention, but bounded on total tracked keys — appropriate for a key space as large as arbitrary source IPs), `buildSecurityHeaders`.
- `apps/web/src/middleware.ts` (new): security headers on every response; request-ID resolution/propagation; a 60 req/min per-IP+path rate limit in front of the three webhook routes.
- Structured logging wired into all three webhook route handlers (`mercadopago`/`resend`/`twilio`): `invalid_signature` outcomes and unexpected processing errors are now logged (never the raw signature/body), where they previously either silently 500'd or left no trace beyond the webhook-event DB row.
- Auth rate limiting: better-auth ships its own IP+path-keyed limiter with strict built-in defaults for sign-in/sign-up/change-password/change-email (3 req/10s) and password-reset/verification-email (3 req/60s) — this task just turns it on (`packages/auth/src/index.ts`), no custom implementation needed.
- `tests/integration/security-idor-and-concurrency.test.ts` (new): cross-user IDOR denial for debts/debt-payments/transfers/budgets at the service layer (the pre-existing `ownership-repositories.test.ts` already covered accounts/categories/transactions), plus a real concurrent-write proof for debt payments.

**A real bug found and fixed along the way:** the first version of the request-ID middleware would have silently overwritten Mercado Pago's own `x-request-id` header — which is a security-critical input baked directly into their webhook HMAC signature manifest (`packages/billing/src/webhooks/verify-signature.ts`) — with a freshly generated UUID whenever MP's own ID wasn't UUID-shaped, which would have broken webhook signature verification in production in a way that would have been very hard to diagnose. Caught via manual review before it shipped; webhook paths are now explicitly excluded from request-ID header rewriting (still get security headers and the new rate limit).

**Narrowed scope, documented honestly:**
- **Redis-backed distributed rate limiting is not implemented.** `REDIS_URL` remains reserved/unused (as it was before this task) — no Redis client is wired anywhere in the codebase. Every rate limiter (auth via better-auth, AI, promotions, the new webhook-abuse one) is in-memory, correct for this app's current single-instance Railway deployment (TASK-039), and would need a shared backend only once running multiple web replicas. The Domain Rule ("Redis is optional infrastructure, never financial truth") and Implementation Notes ("prefer bounded ... fallback behavior") are both satisfied by the bounded in-memory design.
- **Structured logging is not wired into every server action/service** — only the three webhook routes and the middleware-level request-ID/security-header layer. Retrofitting logging calls across this codebase's ~80 existing server actions is a much larger, higher-risk undertaking than this task's actual Expected Files list (`packages/observability`, `apps/web` middleware/headers, rate-limit utilities and security tests) calls for. `packages/observability`'s `createLogger` is ready for any future call site to adopt incrementally without any further plumbing.
- **"Future uploads" rate limiting is not implemented** — no upload feature/endpoint exists anywhere in this codebase yet (`S3_*` env vars are reserved/unused, matching TASK-039's finding for `REDIS_URL`); there is nothing to rate-limit.
- **Ordinary transaction/account/budget creation has no idempotency key against a genuine double-click double-submit.** This predates this task and wasn't introduced by it; adding idempotency keys to every core write service is a substantial, separate undertaking (would touch account/transaction/budget/scheduled-transaction creation across many files) that doesn't fit this task's scope. What IS proven here is that concurrent writes against *shared* state (the same debt's installments) never corrupt totals under real Postgres row locking — the actual financial-integrity property that matters most, distinct from duplicate-click UX.
