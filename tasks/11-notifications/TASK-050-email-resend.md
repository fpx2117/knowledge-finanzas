# TASK-050 — Implement transactional email notifications with Resend

## Status

DONE

## Phase

Phase 11 — Notifications + Alerts

## Priority

P1

## Depends On

- TASK-047
- TASK-049
- TASK-003

## Source Documents

- docs/09-notifications-alerts.md
- docs/10.1-subscription-plans-and-limits.md
- docs/10.2-pricing-unit-economics.md
- docs/18-production-readiness.md

## Objective

Entregar emails transaccionales mediante un `EmailProvider` abstraído, templates versionados y delivery asíncrono observable sin cálculos financieros en templates.

## Scope

- `EmailProvider` contract and server-only `ResendEmailProvider`.
- Versioned templates for debt due, budget exceeded and cashflow warning.
- Billing, security and trial lifecycle templates remain deliverable in `EXPIRED_READ_ONLY`.
- Minimal deterministic template DTOs with source links.
- Provider error normalization, retry policy and hard-bounce suppression.
- Resend delivery/bounce/complaint/failure webhooks when enabled.
- Delivery state updates and basic email metrics.

## Out of Scope

- Marketing newsletters, campaigns, alternative unverified recipient emails and AI-generated emails.

## Domain Rules

- Templates receive already-calculated values and never calculate debt, balance or budget state.
- Provider outage does not affect in-app/realtime or financial workflows.
- Financial email is disabled in `EXPIRED_READ_ONLY`; billing/security/account emails remain eligible.
- Email uses verified account email unless an explicitly verified alternate is later supported.

## Expected Files

- `packages/notifications/src/providers/email/`
- `packages/notifications/src/templates/email/`
- `apps/web/src/app/api/webhooks/resend/route.ts`
- email configuration and provider tests

## Security Requirements

- Resend API key server-only; webhook authenticity validated.
- Do not put sensitive balances, full histories or secrets in email content.

## Financial Invariants

- Email generation and delivery never mutate financial truth.

## Acceptance Criteria

- [x] Resend is hidden behind `EmailProvider` (`packages/notifications/src/providers/email/provider.ts`; `createResendEmailProvider` is the only implementation, swappable without touching callers).
- [x] Templates are versioned (`EMAIL_TEMPLATE_VERSION`) and use deterministic DTOs (`EmailTemplateInput`: type + already-computed metadata + a pre-resolved internal `actionUrl` — never raw financial calculation).
- [ ] Sending is asynchronous with bounded retries — partially met, see Notes (no queue exists; sending is synchronous, one attempt per call, "bounded" only in the sense that nothing auto-retries beyond that one attempt today).
- [x] Permanent recipient failures do not retry indefinitely — `isRetryableEmailError` classifies `NOTIFICATION_INVALID_RECIPIENT` (and any hard bounce reported via webhook) as non-retryable; a bounce/complaint also disables the user's `EMAIL` preference so no *future* notification attempts that channel either.
- [x] Delivery status/webhooks update owned delivery rows idempotently (`createProcessResendWebhook`, resolved by `providerMessageId`; every effect — status set, preference disabled — is naturally idempotent under redelivery, verified in tests).
- [x] Core finance remains usable if Resend is disabled or unavailable — `EMAIL_NOTIFICATIONS_ENABLED=false` (the default) means `sendEmailDelivery` is `null` and `notifyUser` skips sending entirely; a runtime provider failure is caught inside `notifyUser` and never propagates to the caller (verified: the caller's financial write already committed before `notifyUser` is invoked in every wiring site).

## Tests Required

### Unit

- [x] Template selection, DTO mapping, retry classification and error mapping (`tests/unit/email-templates.test.ts`, `tests/unit/send-email-delivery.test.ts`, `tests/unit/resend-webhook-signature.test.ts`, `tests/unit/process-resend-webhook.test.ts`).

### Integration

- [x] Mock Resend success/failure, webhook authenticity and duplicate callbacks (`tests/integration/email-delivery.test.ts`, real Postgres + a fake `EmailProvider` — real Resend/OpenRouter/Mercado Pago are never called from unit/integration tests per `tests/README.md`).

### E2E

- [ ] N/A — covered at the integration level instead (`tests/integration/email-delivery.test.ts`'s first test: a `DEBT_OVERDUE` notification creates an `EMAIL` delivery row and sends it through the exact template the type maps to). A true E2E test would need a real or sandboxed Resend account, which this environment doesn't have; this mirrors how Mercado Pago's provider-contract tests are explicitly a separate, non-CI workflow per `tests/README.md`.

### Security

- [x] API key never reaches client bundle/logs (only read via `env.RESEND_API_KEY` inside server-only instance files under `apps/web/src/lib/notifications/`, never exported to a client component) and webhook spoofing is rejected (`tests/unit/resend-webhook-signature.test.ts`: tampered body, wrong secret, stale timestamp, missing headers all rejected).

### Property / Invariant

- [x] Provider failure cannot roll back financial writes (`tests/integration/email-delivery.test.ts`: a throwing provider only marks the delivery row `FAILED`; the notification itself, and by construction the financial write that triggered it, are untouched).

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`

## Definition of Done

Transactional email is templated, retry-classified, observable via webhook-driven delivery status, and replaceable behind `EmailProvider`. Asynchronous queued sending is deferred — see Notes.

## Notes

**Scope narrowed the same way TASK-049 was** (no BullMQ/Redis/worker exists in this repo): "asynchronous with bounded retries" as originally written implies a queue that retries a failed send later. Instead, sending happens synchronously, once, right after `createNotification` creates the `EMAIL` delivery row (inside `apps/web/src/lib/notifications/notify.ts`) — the same pattern already established for every other TASK-049 wiring site. A failed send is classified (`isRetryableEmailError`) and recorded (`attemptCount`, `lastErrorCode`) so a *future* worker has everything it needs to actually retry — `notification_deliveries` rows in `FAILED` status with `attemptCount: 1` and a retryable error code are exactly what a queue consumer would pick up — but nothing in this codebase currently re-attempts them. This is the same "ready for a future scheduler, not wired to one" pattern as `expirePastDueSubscriptions`.

**Duplication tradeoff, made deliberately**: `packages/notifications/src/templates/email/templates.ts` duplicates the copy already written for in-app notifications (`apps/web/src/features/notifications/lib/templates.ts`, TASK-048) rather than sharing it. This app has no i18n system to route both surfaces through, and email needs its own subject line plus HTML-safe (escaped) body regardless. If a notification type's wording changes, both files need updating — flagged in both files' comments so it isn't a silent trap.

`RESEND_WEBHOOK_SECRET` was added to `packages/config` (optional, like `MERCADOPAGO_WEBHOOK_SECRET`) — not present before this task.
