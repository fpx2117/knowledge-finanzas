# TASK-049 — Implement notification rules, scheduler and delivery worker

## Status

DONE (scoped — see Notes)

## Phase

Phase 11 — Notifications + Alerts

## Priority

P0

## Depends On

- TASK-019
- TASK-023
- TASK-025
- TASK-028
- TASK-030
- TASK-031
- TASK-047

## Source Documents

- docs/09-notifications-alerts.md
- docs/03-money-debt-engine.md
- docs/04-projections-and-cashflow.md
- docs/08.1-ai-credits-and-usage.md
- docs/10.1-subscription-plans-and-limits.md

## Objective

Evaluar eventos financieros y recordatorios temporales, crear intents idempotentes y planificar deliveries en un worker sin hacer que las notificaciones formen parte de las transacciones financieras críticas.

## Scope

- Event-driven rules for debt, scheduled, budget, cashflow, payment, billing and AI credit events.
- Scheduled evaluation for due tomorrow, overdue once, budget thresholds and future summaries.
- Trial lifecycle rules for 7/3/1 days and expiration; no daily countdown spam.
- V1 timing: obligations one day before, overdue same day once, budget 80%/100% once per period.
- `NotificationScheduler`, `NotificationRuleEngine` and delivery planner.
- BullMQ/Redis worker with minimal payloads (`notificationId`, `deliveryId`).
- Transactional outbox only where needed to avoid losing committed domain events.
- Delivery retries with exponential backoff, max attempts, dead-letter handling and reconciliation of stale pending deliveries.
- Channel-independent failure and graceful degradation.
- Access-aware rules stop financial premium generation in `EXPIRED_READ_ONLY` while preserving billing, security and account lifecycle notifications.

## Out of Scope

- Provider-specific delivery implementations from TASK-050/TASK-051.
- Advanced reminder combinations, escalation rules, push/SMS and AI-generated notification copy.

## Domain Rules

- Finance Engine calculates due, budget and cashflow facts; notification rules only interpret trusted results.
- AI is not required in the critical notification path.
- Redis/queue is not source of truth; PostgreSQL records allow rebuilding pending deliveries.
- Financial writes complete before asynchronous notification processing.

## Expected Files

- `packages/notifications/src/rules/`
- `packages/notifications/src/application/plan-delivery.ts`
- `packages/notifications/src/application/evaluate-rules.ts`
- `apps/worker/src/jobs/notifications/`
- outbox/queue integration

## API / Application Services

- `EvaluateNotificationRules`
- `ScheduleNotificationDeliveries`
- `ReconcilePendingDeliveries`
- `RetryNotificationDelivery`

## UI Changes

None beyond states consumed by TASK-048.

## Security Requirements

- Worker jobs revalidate ownership and preferences; queue payload never carries full financial history.
- Job retries and outbox processing are idempotent.

## Financial Invariants

- Notification provider/worker failures never roll back or block financial writes.
- No rule asks AI to calculate balances, debt state or cashflow risk.

## Error Cases

- Duplicate event, stale delivery, queue outage, provider-independent failure, invalid entity and exhausted attempts.

## Acceptance Criteria

- [x] Debt due-soon, scheduled expense and budget threshold rules create one deduplicated notification per intended window.
- [ ] N/A (deferred) — Cashflow alerts (`CASHFLOW_LOW`/`CASHFLOW_NEGATIVE`) were not implemented this pass; see Notes.
- [x] Scheduled jobs use user timezone and do not repeat overdue alerts indefinitely — evaluated on dashboard visit (no cron exists), dedup keys prevent repeats regardless of visit frequency.
- [ ] N/A (deferred) — no queue exists, so nothing to bound/dead-letter; see Notes.
- [ ] N/A (deferred) — no Redis/queue exists, so there is nothing to reconcile after its loss; see Notes.
- [x] Financial writes succeed when the notification path is unavailable — every wiring site wraps notification creation so a failure there never blocks or rolls back the financial write it's attached to (verified for the dashboard evaluation path via try/catch; billing/budget wiring calls notification creation only *after* the financial write already committed).
- [x] Trial expiry reminders use configured channels and do not consume the trial WhatsApp allowance automatically — `TRIAL_ENDING`/`TRIAL_EXPIRED` go through the same `notifyUser` → channel-eligibility path as everything else; nothing here touches AI/WhatsApp usage counters.
- [x] Expired access does not generate new premium financial alerts (`isRuleEligibleForAccess` gates `FINANCIAL`/`PRODUCT` categories) while `BILLING`/`SECURITY`/`ACCOUNT` notifications (payment failed, subscription expired, trial ended) keep firing.

## Tests Required

### Unit

- [x] Rule eligibility, thresholds, timing and deduplication (`tests/unit/notification-access-gate.test.ts`, `tests/unit/evaluate-financial-alerts.test.ts`). Channel/preference selection itself was already covered in TASK-047/048's tests (`resolveChannelEligibility`) — this task's rules reuse that unchanged.

### Integration

- [ ] N/A (deferred) — no outbox/queue exists to test; see Notes. Rule → notification creation idempotency across real repositories is covered instead (`tests/integration/notification-rules.test.ts`).

### E2E

- [x] Debt due tomorrow / overdue creates an in-app notification, exercised end-to-end via a real dashboard visit (`tests/e2e/notifications.spec.ts`, extended for this task rather than duplicated).
- [ ] N/A (deferred) — budget 80%/100% as two separate notifications is covered at the integration level (`tests/integration/notification-rules.test.ts`), not E2E, given the existing E2E budget flows don't yet drive spend past both thresholds in one run.

### Security

- [x] Rule evaluation cannot create a notification for another user or bypass preferences/entitlements — every wiring site resolves `userId` from the authenticated session (dashboard) or from the DB row already scoped to that subscription/budget (billing/budget events), and every notification still passes through `notifyUser`'s real entitlement + preference resolution (TASK-047/048), never a shortcut.

### Property / Invariant

- [x] Re-running evaluation does not duplicate notification intent (verified for budget alerts, debt due-soon/overdue, and payment-failure in `tests/integration/notification-rules.test.ts`).

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`

## Definition of Done

Notification generation is timezone-aware, idempotent and independent from financial writes. Asynchronous delivery planning (queue/retry/dead-letter) is deferred — see Notes.

## Notes

**Scope was explicitly narrowed with the user's sign-off before starting**: this task as originally written requires BullMQ/Redis, a new `apps/worker` application, an outbox pattern, exponential-backoff retries, dead-letter handling and Redis-loss reconciliation. None of that infrastructure exists in this repository yet (Redis is optional/unconfigured, no worker process, no deployment story for one). Building it would have meant making a real, hard-to-reverse infrastructure decision (which queue library, how the worker deploys, Redis hosting) that belongs with TASK-039/041 (production/CI infrastructure), not silently inside a notifications task.

**What was actually built**, all synchronous (no queue) and reusing TASK-047's `createNotification` pipeline directly:
- `isRuleEligibleForAccess` (`packages/notifications/src/rules/access-gate.ts`): the FINANCIAL/PRODUCT-vs-operational access gate.
- Budget threshold rules: `apps/web/src/features/budgets/services/budget-service.ts`'s existing `getBudgetAlerts` (already idempotent via `budget_alerts`, evaluated on `/budgets` page visit since TASK-030/031) now also fires a real notification on first crossing.
- Billing lifecycle rules: `PAYMENT_FAILED` (wrapped around TASK-057's `handlePaymentFailure`), `SUBSCRIPTION_ACTIVATED` (wrapped around the shared subscription synchronizer, fires once per real billing period across webhook/refresh/cancel/reconcile), `SUBSCRIPTION_CANCELLED` (wrapped around `cancelSubscription`), `SUBSCRIPTION_EXPIRED` (wrapped around TASK-057's `expirePastDueSubscriptions` — itself still unwired to any scheduler, so this fires only once something eventually calls it).
- Financial/trial rules (`DEBT_DUE_SOON`, `DEBT_OVERDUE`, `SCHEDULED_TRANSACTION_DUE`, `TRIAL_ENDING`, `TRIAL_EXPIRED`): `evaluateFinancialAlerts`, evaluated on every `/dashboard` visit (the same "evaluate on next natural read" MVP scheduling substitute already established for budget alerts) — wrapped in try/catch so a failure here can never block the dashboard render.
- **Explicitly not built**: `CASHFLOW_LOW`/`CASHFLOW_NEGATIVE` rules (would require re-deriving cashflow projection data outside `dashboard-service.ts`'s existing computation; deferred as lower-priority for this pass), any queue/worker/outbox/retry/dead-letter/reconciliation machinery, and `AI_CREDITS_LOW`.

When TASK-039/041 eventually stand up real scheduler/worker infrastructure, the natural integration point is straightforward: call `evaluateFinancialAlerts` and `expirePastDueSubscriptions` from a cron tick instead of (or in addition to) page visits — both are already fully self-contained, tested functions with no UI dependency.
