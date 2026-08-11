# TASK-051 — Implement controlled WhatsApp notifications with Twilio

## Status

DONE

## Phase

Phase 11 — Notifications + Alerts

## Priority

P1

## Depends On

- TASK-045
- TASK-047
- TASK-049

## Source Documents

- docs/09-notifications-alerts.md
- docs/10.1-subscription-plans-and-limits.md
- docs/10.2-pricing-unit-economics.md
- docs/08.1-ai-credits-and-usage.md
- docs/19-security-privacy.md

## Objective

Entregar WhatsApp mediante `WhatsAppProvider` y Twilio con opt-in explícito, templates aprobados, límites por plan, callbacks idempotentes y control de costos.

## Scope

- `WhatsAppProvider` contract and server-only `TwilioWhatsAppProvider`.
- E.164 phone normalization and verified/confirmed recipient setup.
- `WhatsAppTemplateRegistry` mapping notification type to configured Content SID.
- V1 events: debt due/overdue, scheduled expense due, cashflow negative and monthly summary.
- Server-side entitlement and state-aware allowances: `TRIAL_WHATSAPP_TOTAL` or `PRO_WHATSAPP_PER_PERIOD`.
- Usage read model/counting policy based on accepted/sent provider messages.
- Twilio status callbacks, normalized delivery states and duplicate callback idempotency.
- WhatsApp-specific cost/usage metrics and independent kill switch.

## Out of Scope

- Sending every transaction/balance/AI suggestion, SMS, marketing messages and unapproved dynamic content.
- Mixing WhatsApp usage with AI credits.

## Domain Rules

- Explicit opt-in is required; having a phone number is not consent.
- TRIAL allows 3 WhatsApp messages total, PRO allows 20 per billing period, and `EXPIRED_READ_ONLY` allows zero financial WhatsApp alerts.
- Limit exhaustion stops new WhatsApp deliveries while in-app/email remain available.
- Messages use minimal sensitive content and known application routes only.

## Expected Files

- `packages/notifications/src/providers/whatsapp/`
- `packages/notifications/src/templates/whatsapp/`
- `apps/web/src/features/notifications/` opt-in/preferences UI
- `apps/web/src/app/api/webhooks/twilio/route.ts`

## Security Requirements

- Twilio credentials server-only; official callback signature validation.
- Ownership, entitlement, opt-in and limit checks occur before delivery creation.
- No automatic-authentication or arbitrary signed links in messages.

## Financial Invariants

- WhatsApp delivery does not mutate accounts, transactions, debts, budgets or balances.
- Twilio failure never blocks financial writes or removes in-app notifications.
- WhatsApp usage is separate from AI credit ledger.

## Acceptance Criteria

- [x] Twilio is hidden behind `WhatsAppProvider`.
- [x] Phone numbers are normalized to E.164 and opt-in is explicit/auditable — reuses TASK-047's `notification_whatsapp_consent` table and E.164 validation; no new work needed here.
- [x] Only configured templates/SIDs are used — `resolveWhatsAppTemplate` returns `null` (safe no-send, `WHATSAPP_TEMPLATE_NOT_CONFIGURED`) for any type without a configured Content SID.
- [x] Entitlement and trial/period allowance are enforced server-side — `notify.ts` checks `ProductAccessGate` state, `isWithinWhatsAppAllowance`, and `countSentWhatsAppSince` before sending.
- [x] Duplicate callbacks and retries are idempotent — `createProcessTwilioWebhook` re-applies the same status, no separate event ledger needed.
- [x] Limit exhaustion leaves in-app/email delivery available — the allowance check only gates the WHATSAPP send call in `notify.ts`; IN_APP/EMAIL deliveries are created independently in `createNotification` regardless.
- [x] Twilio outage degrades WhatsApp only and exposes an observable delivery failure — `sendWhatsAppDelivery` is wrapped in try/catch inside `notify.ts` and never throws past it; failures are recorded on the delivery row (`status: FAILED`, `attemptCount`, `lastErrorCode`).

## Tests Required

### Unit

- [x] E.164 normalization, template registry, opt-in, entitlement and limit policy. (`tests/unit/whatsapp-template-registry.test.ts`, `tests/unit/whatsapp-allowance.test.ts`; E.164 normalization itself was already covered by TASK-047's tests, reused unchanged.)
- [x] Callback/error mapping and usage counting. (`tests/unit/twilio-webhook-signature.test.ts`, `tests/unit/process-twilio-webhook.test.ts`, `tests/unit/send-whatsapp-delivery.test.ts`)

### Integration

- [x] Mock Twilio success/failure, callbacks, retries and duplicate callbacks. (`tests/integration/whatsapp-delivery.test.ts`, real Postgres + fake `WhatsAppProvider`)

### E2E

- N/A — no E2E coverage added. WhatsApp sending requires real Twilio Content SIDs configured via env, which are unset in the E2E environment (`WHATSAPP_NOTIFICATIONS_ENABLED=false` there, mirroring TASK-050's email E2E scope decision); the notification-center E2E coverage from TASK-048 already exercises the shared UI path. Allowance/entitlement/webhook behavior is covered by integration tests against real Postgres instead.

### Security

- [x] User cannot trigger delivery to another user; spoofed Twilio callback is rejected. (`tests/integration/whatsapp-delivery.test.ts` — "rejects a spoofed webhook signature"; delivery lookup by `providerMessageId` is server-generated, never client-supplied, so cross-user targeting isn't reachable through this path.)

### Property / Invariant

- [x] A provider retry/callback cannot create duplicate delivery or double-count usage. (`tests/integration/whatsapp-delivery.test.ts` — "webhook-reported delivery ... duplicate callbacks are idempotent"; usage counting only counts `SENT`/`DELIVERED` rows via `countSentWhatsAppSince`, and a webhook callback only updates an existing delivery's status, it never creates a new delivery row or re-sends.)

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`

## Definition of Done

WhatsApp is an opt-in, plan-limited, template-based and auditable channel that fails independently from core finance.

## Notes

**Scope narrowed the same way TASK-049/050 were** (no BullMQ/Redis/worker exists in this repo): sending happens synchronously, once, right after `createNotification` creates the `WHATSAPP` delivery row (inside `apps/web/src/lib/notifications/notify.ts`), immediately after the entitlement/allowance checks pass. A failed send is classified (`isRetryableWhatsAppError`) and recorded (`attemptCount`, `lastErrorCode`) so a future worker could retry it, but nothing currently does — same "ready for a scheduler, not wired to one" pattern as the email channel.

**WhatsApp usage counting reuses the existing `notification_deliveries` table** rather than introducing a new usage-ledger table: `countSentWhatsAppSince(userId, since)` counts rows with `channel = 'WHATSAPP'` and `status IN ('SENT', 'DELIVERED')` since the start of the user's current allowance window (`trialStartedAt` for TRIAL, `currentPeriodStart` for PRO). This mirrors the "reuse existing tables, minimal new infra" pattern used throughout this phase (e.g., bounce suppression in TASK-050 reused `notification_preferences` instead of a new suppression list). A `FAILED` delivery never counts toward the limit — only messages that actually reached Twilio successfully consume a user's budget.

**Template registry is scoped to the V1 event types only** (`WHATSAPP_V1_TYPES`: `DEBT_DUE_SOON`, `DEBT_OVERDUE`, `SCHEDULED_TRANSACTION_DUE`, `CASHFLOW_NEGATIVE`, `MONTHLY_FINANCIAL_SUMMARY`), matching docs/09-notifications-alerts.md. Any other `NotificationType`, or a V1 type whose Content SID env var isn't configured, resolves to `null` from `resolveWhatsAppTemplate` — this is the documented safe default ("only configured templates/SIDs are used"), not an error, and results in a `WHATSAPP_TEMPLATE_NOT_CONFIGURED` (non-retryable) outcome rather than a provider call.

Five new optional env vars were added to `packages/config` for the Content SIDs: `TWILIO_TEMPLATE_DEBT_DUE_SOON_SID`, `TWILIO_TEMPLATE_DEBT_OVERDUE_SID`, `TWILIO_TEMPLATE_SCHEDULED_TRANSACTION_DUE_SID`, `TWILIO_TEMPLATE_CASHFLOW_NEGATIVE_SID`, `TWILIO_TEMPLATE_MONTHLY_FINANCIAL_SUMMARY_SID` — all unset in this environment, so `whatsAppProvider` resolves to `null` and `sendWhatsAppDelivery` is a no-op wire-up until Twilio credentials/templates are actually provisioned.
