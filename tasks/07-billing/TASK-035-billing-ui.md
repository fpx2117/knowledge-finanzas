# TASK-035 — Implement billing UI, cancellation and reconciliation

## Status

DONE

## Phase

Phase 7 — Billing + Mercado Pago

## Priority

P1

## Depends On

- TASK-034
- TASK-045
- TASK-052

## Source Documents

- docs/10-billing-subscriptions-mercadopago.md
- docs/16-billing-mercadopago-slice.md
- docs/10.1-subscription-plans-and-limits.md
- docs/10.2-pricing-unit-economics.md
- docs/08.1-ai-credits-and-usage.md
- docs/18-production-readiness.md

## Objective

Mostrar trial, suscripción Pro, modo `EXPIRED_READ_ONLY`, historial de pagos, cancellation semantics y permitir refresh/reconciliation seguro.

## Scope

- `/settings/billing` for TRIAL, PENDING, ACTIVE/PRO, PAST_DUE, CANCELLED, EXPIRED and EXPIRED_READ_ONLY.
- Cancel service/UI with actual provider behavior and dates after OQ-005 verification.
- Manual refresh plus scheduled reconciliation contract.
- Server-side entitlement gates for premium modules.
- Plan & Usage view with trial days, billing period, effective access, entitlements and server-calculated usage.
- Pricing/upgrade UI communicates 14 days without card and then USD 7.99/month; never advertises a permanent FREE plan.
- Trial shows 50 AI credits total and 3 WhatsApp total; Pro shows 300 AI/20 WhatsApp per billing period.
- Expired state shows read-only banner and reactivation CTA; it does not present expired access as ordinary usage exhaustion.

## Out of Scope

- Coupons, proration, multi-tier, annual plan and fiscal invoices.

## Domain Rules

- Local access projection is authoritative for request gating; provider sync repairs drift.
- Billing payment is not personal expense.

## Implementation Notes

Use `SubscriptionAccessResolver`, never scattered `status === ACTIVE` checks.

## Expected Files

- `apps/web/src/app/(app)/settings/billing/page.tsx`
- `apps/web/src/features/billing/services/billing-page-service.ts`
- `apps/web/src/features/billing/actions/{cancel-subscription,refresh-subscription}.ts`
- `apps/web/src/features/billing/components/{cancel-subscription-button,refresh-subscription-button}.tsx`
- `apps/web/src/lib/billing/{subscription-synchronizer.instance,ai-usage-summary.instance}.ts`
- `packages/billing/src/subscriptions/{cancel-subscription,refresh-subscription,reconcile-subscriptions}.ts`
- `packages/billing/src/providers/mercadopago/{client,provider}.ts` (added `cancelSubscription`)
- `packages/db/src/repositories/{billing-subscriptions,billing-plans}.ts` (added `listReconcilable`, `findById`)
- worker/reconciliation entry deliberately deferred: `createReconcileSubscriptions` is a complete, tested service, but wiring it to an actual cron/worker trigger needs infra (a scheduler, an internal-trigger auth mechanism) that doesn't exist yet in this repo and is out of this task's declared scope ("worker/reconciliation entry later").

## Database Changes

None.

## API / Application Services

- `CancelSubscription`, `RefreshSubscriptionFromProvider`, `ReconcileSubscriptions`.

## UI Changes

- Billing settings, payment history and locked-feature upgrade states.

## Security Requirements

- Owned subscription; refresh rate limited; server entitlement enforcement.

## Financial Invariants

- No access granted by hidden UI or return URL.

## Error Cases

- Provider outage, past due/grace expiry, already cancelled, refresh abuse.

## Acceptance Criteria

- [x] Every subscription state has safe actionable UI (`/settings/billing`: TRIAL shows days remaining + Subscribe CTA; PRO shows plan/renewal + Refresh/Cancel; PAST_DUE shows a grace-period warning instead of Cancel; EXPIRED_READ_ONLY shows the read-only banner + reactivation CTA).
- [x] Cancellation clearly states whether/when access ends. Mercado Pago's preapproval API cancels immediately (no native "cancel at period end") — per docs §45-46 "provider semantics win", the UI never promises deferred access it can't deliver; `CancelSubscriptionButton` cancels now, and `EXPIRED_READ_ONLY` renders "Tu suscripción anterior fue cancelada el [fecha]" once it takes effect.
- [x] Reconciliation can recover missed webhook drift (`createReconcileSubscriptions` replays `provider.getSubscription` + the same `synchronizeSubscription` a webhook uses, for every PENDING/ACTIVE/PAST_DUE subscription; one subscription's provider failure never aborts the batch).
- [x] Premium action fails server-side without entitlement (pre-existing `ProductAccessGate.assertCanWrite`, TASK-034/045 — unchanged, still enforced on every write service).
- [x] Usage UI distinguishes feature-locked from usage-exhausted states (`AIUsageSummary`'s `ACCESS_REQUIRED` vs `TRIAL`/`PRO` discriminant, TASK-052 — rendered as "La IA está disponible con Pro." vs "x de y disponibles", never a bare `0/300`).
- [x] Downgrade keeps existing data visible and blocks only disallowed new operations (unchanged financial-data visibility; `ProductAccessGate` already gates only writes, not reads).

## Tests Required

### Unit

- [x] State/access UI mapping (`tests/unit/billing-page-service.test.ts` — TRIAL/PRO/EXPIRED_READ_ONLY view assembly, subscription fallback, payment ordering).
- [x] Cancel/refresh/reconcile service logic (`tests/unit/billing-cancel-refresh-reconcile.test.ts`).

### Integration

- [x] Cancel/refresh/reconcile services against real repositories (`tests/integration/billing-cancel-refresh-reconcile.test.ts`).

### E2E

- [ ] Deferred: this repo has no signup/login UI yet (auth is API-only), so no page-driven E2E flow can log in a user to exercise TRIAL→PENDING→ACTIVE/PRO or EXPIRED→reactivation end-to-end. Manually verified in a real browser session instead: a signed-up user renders the TRIAL state with live AI credit data (50/50) from the real TASK-052 wiring, and the Subscribe action surfaces `BILLING_DISABLED` correctly when billing is off.

### Security

- [x] User cannot refresh/cancel another subscription (`findByIdForUser` ownership scoping; `tests/unit/billing-cancel-refresh-reconcile.test.ts` and the integration suite both assert `BILLING_SUBSCRIPTION_NOT_FOUND` for a non-owner).

### Property / Invariant

- [x] Effective access matches resolver and grace policy (unchanged `resolveProductAccess`, reused by `billing-page-service.ts` exactly as `ProductAccessGate` uses it).

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

Billing is a complete product-access projection with no coupling to personal finance ledger.

## Notes

Read price, currency, limits, entitlements and `BILLING_GRACE_PERIOD_DAYS` from validated configuration; do not hardcode production values.
