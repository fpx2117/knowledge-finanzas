# TASK-057 — Implement subscription cancellation, reactivation and payment-failure lifecycle

## Status
DONE

## Phase
Phase 7 — Billing + Mercado Pago

## Priority
P1

## Depends On
- TASK-033
- TASK-034
- TASK-045
- TASK-035

## Source Documents
- docs/10-6.subscription-cancellation-refunds.md
- docs/10-billing-subscriptions-mercadopago.md
- docs/16-billing-mercadopago-slice.md
- docs/19-security-privacy.md

## Objective

Permitir que un usuario cancele y, si el provider lo soporta, reactive su suscripción Pro, y manejar fallas de cobro mediante `PAST_DUE` + grace period, sin nunca borrar datos financieros ni prometer un comportamiento de cancelación que Mercado Pago no garantiza.

## Scope

- **Provider verification is a hard prerequisite**: before implementing any cancellation UI copy or access-timing logic, verify the actual Mercado Pago subscription API cancellation semantics available to this project (`CANCEL_AT_PERIOD_END` vs `CANCEL_IMMEDIATELY`, reactivation support, retry behavior on renewal failure). This resolves the provider-capability half of OQ-005; the access-timing/UI implementation must follow whatever the verified provider behavior is, never an assumed one.
- `BillingProvider` interface extension: `cancelSubscription`, `reactivateSubscription?`, plus capability flags `supportsCancelAtPeriodEnd`, `supportsReactivation`.
- `RequestSubscriptionCancellation`: authenticate, load owned subscription, verify cancellable, call provider, normalize result, persist `cancellation_requested_at`/`cancellation_effective_at`/`cancel_at_period_end`, emit notification.
- `ReactivateSubscription`: only offered while `cancel_at_period_end = true` and period has not ended; updates provider first, then reconciles local state.
- `HandlePaymentFailure`/`HandleSubscriptionExpiration`: `PAST_DUE` state entered on renewal failure; `BILLING_GRACE_PERIOD_DAYS` (OQ-004, configurable) governs whether access remains `PRO` during grace or resolves to `EXPIRED_READ_ONLY` after grace expires.
- Cancellation entry point in Settings → Plan & Billing → Manage Subscription → Cancel Subscription, with confirmation showing current plan, next billing date, effective cancellation behavior, and impact on AI credits/WhatsApp allowance.
- Optional, skippable cancellation feedback (`reason_code` + `optional_comment`) that never blocks cancellation.
- Notifications: `SUBSCRIPTION_CANCELLATION_REQUESTED`, `SUBSCRIPTION_REACTIVATED`, `SUBSCRIPTION_EXPIRED`, `PAYMENT_FAILED` via IN_APP + EMAIL (TASK-050).
- Voluntary vs involuntary churn classification for analytics (consumed by TASK-061).

## Out of Scope

- Refunds and disputes (TASK-058).
- Subscription pause, proration, annual plans, automated retention offers/discounts on cancel (explicitly deferred per source doc sections 150-156).
- Admin-triggered cancellation UI beyond reusing the same application service (full admin surface is TASK-059/TASK-060).

## Domain Rules

- `Cancellation != Refund`; cancelling a future renewal never refunds an already-paid period.
- `Cancellation != Account Deletion`; all financial data (accounts, transactions, debts, budgets, planning, reports) remains readable after Pro access ends.
- No false promise: the UI never states "you keep Pro until period end" unless the verified provider behavior guarantees it.
- A subscription with `status = ACTIVE, cancel_at_period_end = true` still resolves `EffectiveProductAccess = PRO` until the effective end.
- `PAST_DUE` within grace resolves `PRO`; `PAST_DUE` after grace resolves `EXPIRED_READ_ONLY`.
- Grace period applies only to renewal failures, never to trial expiration.
- If a paid subscription ends while an independent active promotional grant exists (`ends_at` in the future, not paused per doc section 78), the resolver falls back to `PRO`/`source=PROMOTION` instead of `EXPIRED_READ_ONLY`.
- Reactivation must update the provider first and reconcile from provider truth; it never flips local state alone.
- Cancellation/reactivation are idempotent: a second identical request produces no duplicate effect.

## Implementation Notes

Add `cancellation_requested_at`, `cancellation_effective_at`, `cancel_at_period_end` to the billing subscription model established in TASK-032 (or a closely related table) rather than inventing a parallel entity. If the provider operation is asynchronous, model an optional `CANCELLATION_PENDING` local state and require reconciliation before showing cancellation as complete.

## Expected Files

- `packages/billing/src/providers/mercadopago-provider.ts`
- `packages/billing/src/providers/billing-provider.ts`
- `packages/billing/src/cancellation/request-subscription-cancellation.ts`
- `packages/billing/src/cancellation/reactivate-subscription.ts`
- `packages/billing/src/cancellation/handle-payment-failure.ts`
- `packages/billing/src/cancellation/handle-subscription-expiration.ts`
- `apps/web/src/features/billing/components/cancel-subscription-dialog.tsx`
- `packages/db/src/schema.ts`

## Database Changes

- Extend billing subscription table with `cancellation_requested_at`, `cancellation_effective_at`, `cancel_at_period_end`, `past_due_since`, `grace_period_ends_at`.
- `cancellation_reason_code`, `cancellation_reason_comment` fields or a small companion table.

## API / Application Services

- `RequestSubscriptionCancellation`
- `ReactivateSubscription`
- `HandlePaymentFailure`
- `HandleSubscriptionExpiration`
- `CancellationPolicy` (effective timing, grace behavior)

## UI Changes

- Cancel Subscription flow (confirmation, optional feedback, success state).
- Reactivate Subscription action while `cancel_at_period_end = true`.
- Subscription status badges: `ACTIVE`, `CANCELLATION_SCHEDULED`, `PAST_DUE`, `EXPIRED`.

## Security Requirements

- Ownership enforced: a user can only cancel/reactivate their own subscription.
- Cancellation/reactivation endpoints authenticate, authorize, and rate-limit.
- Provider errors are sanitized before reaching the client; no raw Mercado Pago error bodies.

## Financial Invariants

- Cancellation never deletes or archives financial history.
- Payment failure never causes immediate data loss.
- Provider reality wins for cancellation/reactivation truth; checkout/cancellation redirects are never treated as provider truth.
- AI credits and WhatsApp allowance remain usable exactly while `PRO` is effective, and become unusable (without deleting ledger history) once access ends.

## Error Cases

- No cancellable subscription, subscription already scheduled for cancellation, reactivation attempted after period already ended, provider outage during cancellation/reactivation, duplicate cancellation request.

## Acceptance Criteria

- [x] Provider cancellation semantics (period-end vs immediate, reactivation support) are verified and documented before the effective-access logic is implemented; the implementation matches the verified behavior, not an assumption. — Verified: Mercado Pago's preapproval API only supports immediate cancellation; only `paused` (not `cancelled`) subscriptions can be reactivated. See `docs/adr/ADR-002-mercadopago-cancellation-semantics.md`.
- [x] A user can cancel their subscription from Settings and sees an accurate, provider-consistent description of what happens next.
- [x] N/A — the provider does not support cancel-at-period-end (verified); this branch of the criterion does not apply.
- [x] The provider only supports immediate cancellation: access reflects the normalized immediate result; the UI states access ends immediately and offers subscribing again, never a fake "reactivate".
- [x] N/A — reactivation of a `CANCELLED` subscription is not supported by the provider (verified); not implemented. Pausing (which is reactivable) is explicitly out of scope.
- [x] A renewal payment failure enters `PAST_DUE`; access remains `PRO` within `BILLING_GRACE_PERIOD_DAYS` and becomes `EXPIRED_READ_ONLY` after grace expires.
- [x] Cancelling twice produces no duplicate side effects (`BILLING_SUBSCRIPTION_ALREADY_CANCELLED`); reactivation criterion is N/A per above.
- [x] All financial data remains fully readable after access transitions to `EXPIRED_READ_ONLY`.

## Tests Required

### Unit
- [x] Cancellation-timing behavior for the verified immediate-only provider capability (`CancellationPolicy` as originally scoped does not apply — there is only one mode).
- [x] Grace period boundary calculations (`tests/unit/billing-subscription-lifecycle.test.ts`, plus pre-existing `tests/unit/billing-access-resolver.test.ts`).

### Integration
- [x] Cancel → provider call → normalized persistence, in a single flow (pre-existing, still passing). Notification emission is explicitly deferred — see Notes.
- [x] N/A — reactivation against provider state does not apply (verified no-reactivation model).
- [x] Payment failure → grace → recovery restores `PRO`; grace expiry resolves `EXPIRED_READ_ONLY` (`tests/integration/billing-payment-failure-lifecycle.test.ts`).

### E2E
- [x] N/A — no cancel-at-period-end flow exists to test (verified immediate-only).
- [x] N/A — no reactivate flow exists to test (verified not supported for `CANCELLED`). Cancellation confirmation flow is covered instead: `tests/e2e/billing.spec.ts`.

### Security
- [x] User A cannot cancel another user's subscription (pre-existing integration test, still passing); reactivation N/A.

### Property / Invariant
- [x] Cancellation is idempotent under duplicate requests.
- [x] Cancellation never deletes accounts, transactions, debts, budgets, or planning data (`tests/integration/billing-payment-failure-lifecycle.test.ts`).
- [x] N/A — no promotional-grant concept exists yet in this repository (TASK-053 is still `TODO`); there is nothing to fall back to. Documented as a deliberate gap, not silently assumed.

## Verification Commands
- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`

## Definition of Done

Cancellation behaves exactly as the verified Mercado Pago semantics dictate (immediate, no reactivation), payment failures degrade access in a controlled and reversible way via `PAST_DUE` + grace period, and financial data is preserved through every transition.

## Notes

This task closed the provider-verification half of OQ-005 (see `tasks/OPEN_QUESTIONS.md`, now fully `RESOLVED`); the result is recorded in `docs/adr/ADR-002-mercadopago-cancellation-semantics.md`.

Scope narrowed by the verified provider behavior: `ReactivateSubscription`, `cancellation_requested_at`/`cancellation_effective_at`, and any "keep Pro until period end" UI copy from the original task scope do not apply and were not built — implementing them would have been exactly the false promise this task explicitly prohibits. What was added: `HandlePaymentFailure` (payment webhook → `PAST_DUE`, optimistic and idempotent), `HandleSubscriptionExpiration`-equivalent grace sweep (`createExpirePastDueSubscriptions`, exported and wired via `apps/web/src/lib/billing/expire-past-due-subscriptions.instance.ts` but not yet triggered by a scheduler — no cron/worker infra exists until TASK-039/041), optional non-blocking cancellation reason capture, and an accurate two-step cancellation confirmation UI.

Notification emission (`SUBSCRIPTION_CANCELLATION_REQUESTED`, `PAYMENT_FAILED`, etc.) from the original scope was **not implemented**: it depends on the notification domain from TASK-047, which is still `TODO` (no notification repository/service exists in the codebase yet, only the DB schema). Building a one-off notification write path here would have duplicated TASK-047's job. This is a known, explicit gap to close when TASK-047/050 land, not a silent omission.
