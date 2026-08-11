# TASK-058 — Implement billing refunds, duplicate-charge detection and dispute persistence

## Status
DONE

## Phase
Phase 7 — Billing + Mercado Pago

## Priority
P2

## Depends On
- TASK-057
- TASK-033
- TASK-034

## Source Documents
- docs/10-6.subscription-cancellation-refunds.md
- docs/10-billing-subscriptions-mercadopago.md
- docs/19-security-privacy.md

## Objective

Implementar un flujo de reembolso admin-mediado, auditable e idempotente para pagos de Mercado Pago, detección de cargos duplicados, y persistencia básica de disputas/chargebacks, sin nunca simular éxito de reembolso ni borrar historial financiero o de facturación.

## Scope

- `billing_refunds` y `billing_disputes` schema con `provider_refund_id`/`provider_dispute_id` únicos cuando no nulos.
- `BillingProvider` extension: `refundPayment?`, `getRefund?`, capability flags `supportsPartialRefund`, `supportsRefundLookup`.
- `RequestRefund` (admin/support-initiated only in V1, no user self-service): validate payment, validate refundable amount, validate `RefundPolicy`, create refund intent, call provider, persist result, trigger reconciliation.
- `RefundPolicy` service: is refundable, maximum refundable amount, effect on access (per reason: `DUPLICATE_CHARGE` keeps Pro; `SERVICE_FAILURE` per explicit admin decision; full-subscription reversal ends paid entitlement unless explicit compensation), effect on related rewards (referral/coupon eligibility).
- `ReconcileRefund` for stuck/uncertain `PENDING` refunds.
- Duplicate payment detection: observability rule flags `> 1 approved payment for the same expected billing period`; V1 does **not** auto-refund, it surfaces the case for admin review.
- Chargeback/dispute persistence when the provider exposes dispute webhooks (`OPEN`, `WON`, `LOST`, `CLOSED`); access suspension policy on confirmed chargeback is explicit and admin-reviewed, never automatic account deletion.
- Refund/dispute webhook idempotency: repeated events cannot refund twice, expire twice, or duplicate dispute records.
- Compensation pattern: a refund and a promotional-Pro grant (via TASK-053) are always two separate, explicitly linked operations — a refund never fabricates a fake billing period as compensation.

## Out of Scope

- Partial refunds beyond what the provider trivially supports (start with full refund; document partial refund as deferred if the provider API makes it materially more complex).
- User self-service refund requests (admin/support-mediated only in V1).
- Automated chargeback management/scoring, automated retention offers.
- The admin UI surface for browsing refunds/disputes (TASK-059/TASK-060 build the views on top of these services).

## Domain Rules

- `Refund != Delete Financial Data`; refunding a payment never removes billing history or personal financial records.
- Refund amount uses exact Money (`NUMERIC`), never a JS `number`.
- Provider reality wins for refund status; a refund is never marked successful before the provider confirms it.
- Refund requests never modify access as if money had been returned before the provider confirms the refund.
- A refunded/consumed coupon does not automatically become reusable (V1 policy; explicit `RestoreDiscountEligibility` is a separate, non-MVP admin operation and out of scope here since discounts are deferred).
- Referral rewards tied to a refunded/charged-back payment are flagged for manual `InvalidateReferral` (TASK-055) review, never auto-reversed silently.
- Unused plan AI credits and WhatsApp allowance become unusable (not deleted from the ledger) once paid access ends due to refund; historical consumption is never deleted.
- Refund and cancellation are independent operations; refunding a payment does not implicitly cancel the subscription and vice versa.

## Implementation Notes

Model refund/dispute actions as explicit application services callable only from an authorized admin context (the Server Action layer built in TASK-059/TASK-060); this task delivers the domain/application/persistence layer plus the underlying provider calls, not the admin screens themselves. Use an idempotency key persisted as `refund_request_id` in addition to any provider-level idempotency support.

## Expected Files

- `packages/billing/src/refunds/request-refund.ts`
- `packages/billing/src/refunds/reconcile-refund.ts`
- `packages/billing/src/refunds/refund-policy.ts`
- `packages/billing/src/refunds/duplicate-payment-detection.ts`
- `packages/billing/src/disputes/`
- `packages/billing/src/providers/mercadopago-provider.ts`
- `packages/db/src/schema.ts`

## Database Changes

- `billing_refunds` (id, billing_payment_id, provider_refund_id UNIQUE nullable, amount, currency, reason, status, requested_by, requested_at, completed_at, created_at). Indexes: `billing_payment_id`, `provider_refund_id`, `status`.
- `billing_disputes` (id, payment_id, provider_dispute_id UNIQUE nullable, type, status, amount, currency, opened_at, resolved_at, metadata, created_at). Indexes: `payment_id`, `provider_dispute_id`, `status`.

## API / Application Services

- `RequestRefund`
- `ReconcileRefund`
- `RefundPolicy`
- `DetectDuplicatePayments`

## UI Changes

None directly; consumed by TASK-059/TASK-060's admin refund workflow.

## Security Requirements

- `RequestRefund` requires `ADMIN`/`SUPER_ADMIN` role, explicit confirmation, and a required reason.
- Refund/dispute data is never exposed to the affected user beyond a simple status notification (no raw provider payloads).
- Webhook payloads for refund/dispute events are validated for authenticity before any persistence.

## Financial Invariants

- Refund operations are idempotent; retrying the same refund intent never produces two provider refunds.
- Repeated refund/dispute webhooks cannot duplicate money movement or dispute records.
- Refund failure never pretends success; local state never claims `APPROVED` without provider confirmation.
- A duplicate-charge refund preserves the user's active Pro access when a valid payment remains.

## Error Cases

- Payment not found/not owned by expected subscription, refund exceeds refundable amount, refund below minimum guardrail, provider refund failure, provider timeout during refund, partial failure (provider succeeded, local persistence failed), duplicate webhook.

## Acceptance Criteria

- [x] Admin can request a full refund for a payment with a required reason; the refund is created via the provider and persisted with normalized status.
- [x] Refund status only becomes `APPROVED` after explicit provider confirmation; a provider failure leaves local state `FAILED`, never fabricated success.
- [x] Retrying the same refund request does not create a second provider refund — enforced via a persisted `requestIdempotencyKey` unique constraint (`billing_refunds_idempotency_key_unique`), not just an application-level check.
- [x] A duplicate-payment case is surfaced for admin review and does not auto-refund — `DetectDuplicatePayments` only returns cases; nothing calls `RequestRefund` on its behalf.
- [x] `DUPLICATE_CHARGE` refund policy keeps the subscriber's Pro access active while refunding only the extra payment — `resolveRefundAccessEffect("DUPLICATE_CHARGE")` always returns `KEEP_ACCESS`.
- [x] Dispute/chargeback events, when exposed by the provider, are persisted with normalized status without deleting account data.
- [x] `ReconcileRefund` recovers a case where the provider succeeded but the local DB update failed.

## Tests Required

### Unit
- [x] `RefundPolicy` decisions per reason code (`DUPLICATE_CHARGE`, `SERVICE_FAILURE`, `FULL_SUBSCRIPTION_REVERSAL`). (`tests/unit/billing-refund-policy.test.ts`)
- [x] Duplicate-payment detection rule against synthetic payment sets. (`tests/unit/billing-duplicate-payment-detection.test.ts`)
- [x] `RequestRefund` authorization/validation/idempotency, `ReconcileRefund` per-item isolation, `RecordDisputeEvent` idempotency, and Mercado Pago refund request/response mapping. (`tests/unit/billing-request-refund.test.ts`, `tests/unit/billing-reconcile-refund.test.ts`, `tests/unit/billing-record-dispute-event.test.ts`, `tests/unit/billing-mercadopago-provider.test.ts`)

### Integration
- [x] Refund request → provider call → persistence → reconciliation, full round trip with a mocked provider. (`tests/integration/billing-refunds-and-disputes.test.ts`)
- [x] Duplicate refund request (same idempotency key) does not create a second `billing_refunds` row or call the provider twice.
- [x] Refund failure leaves local state accurately reflecting provider failure.

### E2E
None; refund actions are exercised through TASK-059/TASK-060's admin UI tests, as scoped.

### Security
- [x] Non-admin role cannot call `RequestRefund`. (`tests/unit/billing-request-refund.test.ts`)
- [x] Refund without a reason is rejected. (`tests/unit/billing-request-refund.test.ts`)

### Property / Invariant
- [x] A refund intent is never applied twice under retry or duplicate webhook delivery. (`tests/integration/billing-refunds-and-disputes.test.ts` — idempotency key retry; dispute event redelivery)
- [x] Refund/dispute persistence never deletes billing history. (No delete/truncate operation exists anywhere in the refund/dispute code path; both repositories are insert/update-only.)

## Verification Commands
- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

Authorized operators can issue idempotent, auditable refunds and the system detects likely duplicate charges and persists dispute state, all without ever fabricating provider truth or deleting financial/billing history.

## Notes

Partial refunds, proration, and annual-plan refund logic are explicitly deferred per the source document; only implement them if the verified Mercado Pago API makes full-refund-only materially insufficient for a real launch scenario.

**Admin authorization is a minimal DI stub, explicitly scoped this way with the user's sign-off.** This task's stated Security Requirement is "`RequestRefund` requires `ADMIN`/`SUPER_ADMIN` role," but no role/permission system exists anywhere in this codebase yet (`users` has no `role` column, no admin middleware exists) — and critically, TASK-058 does **not** depend on TASK-059 (which is what actually introduces commercial-admin authorization). Rather than fabricate a role system prematurely or silently skip the check, `createRequestRefund` takes an explicit `actor: { userId: string; isAdmin: boolean }` on every call and throws `BILLING_REFUND_NOT_AUTHORIZED` when `isAdmin` is false. This makes the authorization boundary a first-class, independently testable dependency rather than an implicit assumption — when TASK-059 lands, its Server Action layer resolves the real `isAdmin` value from whatever role system it introduces and passes it in; nothing in this task's domain code needs to change.

**No app-layer (`apps/web`) wiring was added.** The task's own "UI Changes" section says "None directly; consumed by TASK-059/TASK-060," and there is currently no admin surface to invoke these services from. `RequestRefund`, `ReconcileRefund`, `DetectDuplicatePayments`, and `RecordDisputeEvent` are fully implemented, tested against real Postgres repositories and a mocked Mercado Pago provider, and exported from `@know-finanzas/billing` — TASK-059/060 wires them into `apps/web/src/lib/billing/*.instance.ts` and Server Actions when the admin UI is built.

**`ReconcileRefund` reconciles via `provider.getPayment`, not `provider.getRefund`.** The scenario it recovers from — "provider call succeeded, local write failed" — means the refund's `providerRefundId` may never have been persisted, so looking it up via `getRefund(paymentId, refundId)` isn't always possible. Instead it re-checks the underlying payment's status (`BillingProvider.getPayment`, which every provider already implements) and treats a `REFUNDED` payment as confirmation the refund went through, marking the local row `APPROVED`. `getRefund` is still implemented on the Mercado Pago provider (`supportsRefundLookup: true`) for completeness and future use, but the reconciliation sweep doesn't require it.

**Duplicate-charge detection is a pure function** (`detectDuplicatePayments`) wrapped by a thin repository-backed service (`createDetectDuplicatePayments`), mirroring the split already used for `RefundPolicy`. It flags any `(subscriptionId, billingPeriodId)` pair with more than one `APPROVED` payment and returns the case list — nothing in this task calls `RequestRefund` automatically from it, matching the "surfaced for admin review, never auto-refunded" requirement.

New tables `billing_refunds` and `billing_disputes` were added via migration `packages/db/drizzle/0016_unusual_lifeguard.sql`, following the same money/currency/status conventions as every other billing table (`numeric(20,6)` amounts, `varchar(3)` currency with a length check, partial unique indexes on nullable provider ids). `billing_refunds.request_idempotency_key` is a required, globally unique column — the idempotency key spans the whole table, not per-payment, since a single admin request must never produce two refunds regardless of which payment it targets.
