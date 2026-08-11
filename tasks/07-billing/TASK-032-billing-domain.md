# TASK-032 — Establish billing domain, plans and entitlement resolution

## Status

DONE

## Phase

Phase 7 — Billing + Mercado Pago

## Priority

P1

## Depends On

- TASK-002
- TASK-007

## Source Documents

- docs/10-billing-subscriptions-mercadopago.md
- docs/16-billing-mercadopago-slice.md
- docs/10.1-subscription-plans-and-limits.md
- docs/10.2-pricing-unit-economics.md
- docs/08.1-ai-credits-and-usage.md
- docs/19-security-privacy.md

## Objective

Crear bounded context Billing separado de `packages/finance`, con trial interno, suscripción `PRO_MONTHLY` y entradas para resolver `TRIAL`, `PRO` y `EXPIRED_READ_ONLY`.

## Scope

- Trial lifecycle fields (`trial_started_at`, `trial_ends_at`) and configurable 14-day duration.
- Billing subscriptions/payments/webhook event schema, `billing_periods` and exact billing Money.
- Stable `PRO_MONTHLY` identity, provider price references and actual provider fee fields; the full access/limit resolver is TASK-045.
- `ProductAccessResolver`/billing boundary for `TRIAL`, `PRO` and `EXPIRED_READ_ONLY`; AI and WhatsApp accounting remain outside Billing.
- One active paid subscription invariant.

## Out of Scope

- Provider API calls, checkout UI, webhook processing, coupons/proration.

## Domain Rules

- Platform billing payment never creates personal finance transaction.
- Redirect is not proof of paid access.
- Trial is internal and never creates a Mercado Pago subscription.
- PostgreSQL local normalized state is used for access; provider remains external truth for paid subscriptions.
- `PENDING` does not grant `PRO`; active trial or expired read-only state remains effective until provider confirmation.

## Implementation Notes

Create `packages/billing`; share only generic Money/config primitives, not finance calculators.

## Expected Files

- `packages/billing/src/`
- `packages/db/src/schema.ts`
- `packages/config/src/index.ts`

## Database Changes

- `billing_plans`, `billing_subscriptions`, `billing_periods`, `billing_payments`, `billing_webhook_events` and constraints/indexes.

## API / Application Services

- `EntitlementService`, `SubscriptionAccessResolver`.

## UI Changes

None.

## Security Requirements

- Billing resources ownership-filtered; secrets server-only.

## Financial Invariants

- Billing ledger is never joined into personal balance/expense calculations.

## Error Cases

- Plan missing/inactive, conflicting subscription, invalid money/status.

## Acceptance Criteria

- [x] Billing tables migrate with exact amounts and unique provider IDs.
- [x] Trial fields and `PRO_MONTHLY` billing-period inputs migrate with exact types and indexes.
- [x] No FREE plan or zero-value provider subscription is created for trial (trial is only `users.trial_started_at`/`trial_ends_at`, no billing row).
- [x] `hasEntitlement` boundary is server-side and does not expose provider calls to features (packages/billing has no provider dependency).
- [x] Billing state can feed `TRIAL`, `PRO` and `EXPIRED_READ_ONLY` resolution without a mutable `users.is_pro` shortcut (`resolveProductAccess` derives it live).
- [x] Personal `transactions` has no automatic billing relation.

## Tests Required

### Unit

- [x] Access resolver/status/entitlement matrix.

### Integration

- [x] Constraints and ownership.

### E2E

None.

### Security

- [x] User A cannot inspect User B subscription.

### Property / Invariant

- [x] At most one effective paid subscription.

## Verification Commands

- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

Billing domain and feature-gate contracts exist without coupling personal finance to platform payments.

## Notes

Keep OQ-003/OQ-004 configurable: production catalog values and grace-period values are supplied by validated environment/catalog configuration.
