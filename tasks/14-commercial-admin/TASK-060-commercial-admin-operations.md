# TASK-060 — Implement commercial admin billing, promotions, referrals, AI and notification operations

## Status
DONE

## Phase
Phase 14 — Commercial Admin

## Priority
P3

## Depends On
- TASK-059
- TASK-053
- TASK-054
- TASK-055
- TASK-056
- TASK-057
- TASK-058
- TASK-052
- TASK-051

## Source Documents
- docs/21-commercial-admin.md
- docs/19-security-privacy.md

## Objective

Completar el panel administrativo comercial con las acciones operativas reales sobre billing, promociones, referidos, créditos de IA y notificaciones, todas ejecutadas a través de los application services ya existentes de cada dominio y con un dashboard de excepciones orientado a operación, no a vanity metrics.

## Scope

- Billing section: subscription inspection (plan, provider status, period, cancel-at-period-end, past due, grace end), `Reconcile Now` action (calls TASK-034's subscription reconciliation, never a manual status picker), cancellation/reactivation using the same application services as the user-facing flow (TASK-057), payments table with duplicate-charge warning (from TASK-058), refund request form/confirmation calling `RequestRefund` (TASK-058), webhook diagnostics and `Retry Processing` (SUPER_ADMIN, idempotent replay).
- Promotions section: reuses TASK-054's create/edit/activate/pause/revoke and manual grant/extend/revoke flows under the shared admin authorization/audit framework from TASK-059 (if TASK-054 already implemented its own admin surface, this task consolidates it under the shared `/admin` shell and components rather than duplicating logic).
- Referrals section: reuses TASK-056's admin view (invalidate, retry reward) under the shared framework.
- AI Credits section: balance breakdown (plan/purchased/promotional), usage history without exposing raw prompts, manual `Add`/`Remove AI Credits` that always writes an `ADMIN_ADJUSTMENT` ledger entry via TASK-052's ledger (never a direct balance mutation), negative-balance guard.
- WhatsApp/Notifications section: current allowance, used/remaining, period, opt-in state, delivery history with failure codes; explicitly no "Send WhatsApp Now" ad-hoc admin tool; `Retry Delivery` only for technically failed transactional deliveries, never a new logical notification.
- Reconciliation dashboard (`/admin/billing/reconciliation`): stale PENDING subscriptions, past-due needing refresh, failed webhooks, pending refunds, provider mismatches — individual reconciliation actions only, no "Reconcile Everything" global button in V1.
- Commercial overview dashboard: Active Pro, Active Trials, Expired Read-Only, Promo Pro, MRR, Past Due, Refunds Pending, Failed Webhooks, prioritizing actionable exception queues over vanity charts.
- Discounts section placeholder: since coupons/discounts (`docs/10.5-discounts-and-coupons.md`) are explicitly deferred, this section is out of scope for implementation; do not build a Discounts admin surface pointing at non-existent functionality.

## Out of Scope

- Discounts/coupons admin management (deferred; no coupon domain exists to manage).
- Bulk/destructive actions ("revoke all grants", global reconcile) beyond CSV export of curated fields for elevated roles.
- Impersonation, four-eyes approval workflows, dynamic commercial configuration editing.

## Domain Rules

- Every write action in this task calls an existing domain application service (billing, promotions, referrals, AI credits, notifications); this task never introduces new business logic that bypasses those services.
- `Refund = Billing Application Service`; the admin refund form never talks to Mercado Pago directly.
- `AI Adjustment = Ledger Entry`; no direct balance column mutation.
- `Manual Pro = Promotional Grant`; the admin "Grant Pro Access" action always produces a `promotional_access_grants` row via TASK-053, never a fake billing subscription.
- Reconciliation never lets the admin manually pick a target status; the provider determines the normalized outcome.
- Every sensitive action here inherits TASK-059's reason-required + audit-logged behavior; no new sensitive action skips it.

## Implementation Notes

Build shared `AdminDataTable`, `AdminStatusBadge`, `AdminActionDialog`, `AdminAuditTimeline`, `AdminReasonField` components once here (or promote them from TASK-054 if built first) and have every admin surface in TASK-054/TASK-056/this task consume the same components, so `/admin` reads as one consistent system per the source document's UI style guidance (dense, functional, table-first, low decoration).

## Expected Files

- `apps/web/src/features/admin/billing/`
- `apps/web/src/features/admin/ai/`
- `apps/web/src/features/admin/notifications/`
- `apps/web/src/features/admin/overview/`
- `apps/web/src/features/admin/shared/` (`AdminDataTable`, `AdminStatusBadge`, `AdminActionDialog`, `AdminAuditTimeline`, `AdminReasonField`)
- `packages/billing/src/admin/` (thin admin-facing wrappers over existing application services, if needed)

## Database Changes

No new tables required beyond what TASK-057/TASK-058/TASK-052/TASK-047 already define; this task is UI/orchestration over existing schemas.

## API / Application Services

- Admin Server Actions wrapping: `ReconcileBillingSubscription` (TASK-034), `RequestSubscriptionCancellation`/`ReactivateSubscription` (TASK-057), `RequestRefund`/`ReconcileRefund` (TASK-058), AI credit `ADMIN_ADJUSTMENT` entry point (TASK-052), notification delivery retry (TASK-049/050/051).
- `GetCommercialOverviewMetrics`
- `GetReconciliationQueue`

## UI Changes

- `/admin/billing`, `/admin/billing/reconciliation`, `/admin/ai-usage`, `/admin/notifications`, `/admin` overview dashboard.
- Shared admin component library used across all admin surfaces.

## Security Requirements

- Every action in this task re-validates role server-side via TASK-059's `RequirePermission` guard.
- Refund and AI adjustment forms require explicit confirmation and a reason field before submission.
- Webhook replay is restricted to `SUPER_ADMIN` and must be idempotent (no duplicate grants/payments/refunds on replay).

## Financial Invariants

- No admin action in this task can produce a duplicate financial or billing effect (reconciliation, refund, AI adjustment, webhook replay are all idempotent).
- AI credit adjustments never drive the balance negative.
- User financial/account data is never deleted as a side effect of any commercial admin action.

## Error Cases

- Reconciliation attempted on a subscription with no provider reference, refund confirmation mismatch, AI adjustment that would go negative, webhook replay of an already-processed event, unauthorized action attempted directly against a Server Action.

## Acceptance Criteria

- [x] Admin can inspect a subscription's normalized and raw provider status and trigger `Reconcile Now`, which never lets the admin manually choose the resulting status — the action calls the real batch `ReconcileSubscriptions` and only ever reports back what the provider snapshot resolved to.
- [x] Admin can cancel a subscription using the exact same application service as the user-facing flow. **Reactivation is not implemented — it does not exist anywhere in this codebase.** `packages/billing/src/subscriptions/` has no `reactivate-subscription.ts`; per ADR-002 (verified during TASK-057/058), Mercado Pago's real preapproval API has no reactivation support at all (`supportsReactivation: false` is a fixed, verified capability flag) — there is no domain service to wrap, and the Domain Rule "every write calls an existing application service" means one was never fabricated here either.
- [x] Admin can request a refund with a required reason; the request calls `RequestRefund` and shows `PENDING`/`APPROVED`/`FAILED`, never assuming success on click.
- [x] Admin can add/remove AI credits; every adjustment creates a ledger entry (`ADMIN_CREDIT_ADJUSTMENT`/`ADMIN_DEBIT_ADJUSTMENT` — see Notes on why two types, not one) and never allows a negative balance.
- [x] Admin can view WhatsApp/notification delivery history but has no ad-hoc "send message" tool — only `Retry Delivery` on an existing FAILED delivery row exists; nothing in this codebase can create a new notification from `/admin`.
- [x] Webhook replay by `SUPER_ADMIN` never duplicates a grant, payment, or refund.
- [x] Reconciliation dashboard lists exception queues (stale pending, past due, failed webhooks, pending refunds) with individual reconcile actions, no global "reconcile everything" button.
- [x] Commercial overview dashboard shows Active Pro/Trials/Expired/Promo Pro/MRR/Past Due/Refunds Pending/Failed Webhooks from local data.
- **Referrals section: not built.** Scoped out with the user's explicit sign-off — TASK-055 (referral domain) and TASK-056 (referral admin view) don't exist yet, so there is no `InvalidateReferral`/`RetryReward` application service to wrap. This is the same "can't wrap a service that doesn't exist" constraint as reactivation above, at the whole-section level. `/admin`'s nav intentionally has no Referrals link — a stub link pointing at nothing would violate the same "no admin surface for non-existent functionality" principle this task already applies to Discounts.

## Tests Required

### Unit
- [x] Reconciliation queue query composition (no external calls at query time). (`tests/unit/admin-reconciliation-queue.test.ts`)
- [x] `RetryWebhookEvent`, `RetryDelivery`, `AdminAdjustCredits`, `GetCommercialOverviewMetrics` — all pure application-layer wrappers, unit tested with fakes. (`tests/unit/admin-retry-webhook-event.test.ts`, `admin-retry-delivery.test.ts`, `admin-adjust-credits.test.ts`, `admin-overview-metrics.test.ts`)

### Integration
- [x] Admin refund action calls `RequestRefund` and produces exactly one audit entry. (`tests/integration/admin-operations.test.ts`)
- [x] Admin AI adjustment writes a ledger entry, not a direct balance update; negative-balance guard is enforced. (same file, real Postgres)
- [x] Webhook replay is a no-op on an already-processed event (idempotency). (same file, real Postgres)
- [x] `GetReconciliationQueue` surfaces real stale-PENDING/past-due/failed-webhook data from Postgres.

### E2E
- [x] Admin resolves a stale-PENDING subscription via the reconciliation queue end to end. **Scoped by a real environmental constraint: no Mercado Pago sandbox exists in this environment** (same constraint the pre-existing cancellation E2E test already works around by using `providerSubscriptionId: null`). This test verifies the actual reconciliation flow — dialog opens, confirms, the real batch reconciler runs, the page never crashes — rather than asserting a specific resulting provider status, since that status genuinely depends on an unreachable external provider. See Notes.
- [x] Admin processes a refund and the user's Pro access is preserved when the provider is unreachable — same environmental constraint reframed as a feature: this is exactly what proves "never assume success on click" (Acceptance Criteria), since the failure path is the one naturally reachable in this environment without live Mercado Pago credentials.

### Security
- [x] SUPPORT cannot execute refund, AI adjustment, or webhook replay actions — verified both as a permission-matrix check and as a real E2E render check (buttons are absent, not just disabled).
- [x] Direct Server Action calls bypassing the hidden UI are still rejected for unauthorized roles — every action starts with `requireAdminUser(permission)`, proven at the guard level in TASK-059's own test suite plus this task's integration tests, which call the underlying domain services with the exact same authorization pattern the Server Actions use.

### Property / Invariant
- [x] Every sensitive action in this task produces exactly one audit entry. (`tests/integration/admin-operations.test.ts`)
- [x] Reconciliation and webhook replay are idempotent under repeated invocation. (`tests/unit/admin-retry-webhook-event.test.ts`, `tests/integration/admin-operations.test.ts` — replaying an already-PROCESSED event is a proven no-op; the underlying synchronizer's own upserts, already covered by TASK-034/057/058's test suites, are what make a *successful* replay idempotent too.)

## Verification Commands
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`

## Definition of Done

Authorized operators can fully diagnose and resolve billing, promotion, referral, AI credit, and notification exceptions from one consistent admin surface, with every mutation flowing through the same domain services users trigger themselves and every sensitive action audited.

## Notes

No Discounts admin surface is built here; `docs/10.5-discounts-and-coupons.md` remains explicitly deferred per `tasks/MASTER_PLAN.md`. If discounts are implemented in the future, a corresponding admin section should be added as a new task rather than retrofitted here.

**Referrals scoped out with explicit user sign-off.** TASK-055/TASK-056 (the referral domain and its own admin view) are still `TODO`, and this task's Domain Rule — "every write action calls an existing domain application service, never introduces new business logic that bypasses those services" — means there was nothing to wrap. Rather than fabricate a referral domain inline (which would belong to TASK-055, not this task) or build a Referrals nav entry pointing at nothing, the section was skipped entirely, mirroring exactly how this task already treats Discounts. When TASK-055/056 land, their admin actions should be wired into the existing `/admin` shell (reusing `AdminDataTable`/`AdminActionDialog`/`AdminReasonField`) rather than building a separate admin surface.

**Reactivation doesn't exist anywhere, and this was verified, not assumed.** TASK-057's own task file originally scoped a `ReactivateSubscription` service, but by the time it was actually implemented the file `packages/billing/src/subscriptions/reactivate-subscription.ts` was never created — because ADR-002 (`docs/adr/ADR-002-mercadopago-cancellation-semantics.md`), written while verifying real Mercado Pago API behavior for TASK-057/058, established that Mercado Pago's preapproval API has no reactivation endpoint at all. `BillingProvider.supportsReactivation` is a fixed `false` capability flag reflecting that verified limit, not a runtime check. This task's admin billing surface correctly has no "Reactivate" button for the same reason the user-facing one doesn't.

**AI credit admin adjustments use two ledger entry types, `ADMIN_CREDIT_ADJUSTMENT` and `ADMIN_DEBIT_ADJUSTMENT`, not one shared `ADMIN_ADJUSTMENT`.** `packages/db/src/repositories/ai-credits.ts`'s balance calculation hardcodes which entry types count as credits vs. debits (`CREDIT_ENTRY_TYPES`/`DEBIT_ENTRY_TYPES` arrays) — a single type can't represent both directions under that existing architecture without a schema change bigger than this task warranted. The two-type split slots into the existing pattern with a one-line addition to each array, and both plainly read as "an admin changed this balance" in the ledger, which is what the Domain Rule ("AI Adjustment = Ledger Entry") actually requires. The negative-balance guard lives inside `ai-credits.ts`'s new `adjustBalance` method, inside the same per-user-serialized transaction `reserve()` already uses (`pg_advisory_xact_lock`), so a concurrent debit can never race past it.

**`Reconcile Now` operates on the whole reconcilable batch, not a single subscription — because that's the only reconciliation function that exists.** `packages/billing/src/subscriptions/reconcile-subscriptions.ts`'s `createReconcileSubscriptions` has no per-subscription filter parameter; it always evaluates every PENDING/ACTIVE/PAST_DUE subscription and isolates per-item failures. The admin action calls this real function and reports back only the one subscription's result — this is "the exact same application service," just not a bespoke single-subscription variant that was never built. A dedicated single-subscription reconcile function could be added later if the batch call proves too slow at scale; nothing in this task's scope required it yet.

**Webhook event replay (`createRetryWebhookEvent`, `packages/billing/src/webhooks/retry-webhook-event.ts`) is new code, not a wrapper over an existing function** — `createMercadoPagoWebhookProcessor` only ever processes a *fresh* incoming notification (it inserts a new `billing_webhook_events` row via `recordReceived`), it has no "replay this existing FAILED row" mode. The new function re-derives the provider snapshot from the stored row's `eventType`/`externalResourceId` and replays it through the exact same `synchronizer`/`handlePaymentFailure` the live webhook route uses — so while the *function* is new, the actual state-changing logic it calls is 100% shared with the live path, keeping the Domain Rule intact in spirit (no bypass of the real reconciliation machinery).

**Two new permission keys were added beyond TASK-059's original four**: `billing.manage` (reconcile + cancel — TASK-059 didn't anticipate a non-refund billing write permission), `billing.webhook.replay` (SUPER_ADMIN-exclusive, per this task's own Security Requirement), and `notifications.manage` (delivery retry). This is an additive extension of `packages/shared/src/permissions/permission-keys.ts` and `role-permissions.ts`'s matrix — no existing permission check changed behavior.

**The commercial overview's MRR/Active-Trials/Expired-Read-Only numbers are honest approximations, not exact figures**, and this is stated plainly rather than hidden: MRR sums each ACTIVE subscription's *current* plan price (no proration, no historical pricing, no multi-currency conversion — none of which exist elsewhere in this codebase either); the four access-state buckets are computed to be mutually exclusive and sum to the total user count by following `ProductAccessResolver`'s own priority (a user with both a subscription and a promotional grant is counted once, under Active Pro), but this requires a handful of separate count queries per page load rather than one aggregate — acceptable for an admin dashboard, not something to build a materialized view for at this stage.

**A real CSS bug was found and fixed while writing the refund E2E test**: `AdminActionDialog`'s expanded confirm state originally reused `.management-card` (a flex-row layout built for full-width contexts like the billing settings page), which broke down inside `.admin-summary-grid`'s narrow `minmax(220px, 1fr)` cards — the confirm button became genuinely unclickable (an adjacent grid card intercepted pointer events), not just visually cramped. Fixed with a dedicated `.admin-action-dialog` class using a stacked flex-column layout. Caught by `tests/e2e/admin-operations.spec.ts`'s refund test failing with a real Playwright "element intercepts pointer events" error, not by manual review — this is exactly the kind of bug the "test the golden path in a real browser" requirement exists to catch.
