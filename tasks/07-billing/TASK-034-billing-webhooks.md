# TASK-034 — Implement Mercado Pago webhooks and billing synchronization

## Status

DONE

## Phase

Phase 7 — Billing + Mercado Pago

## Priority

P0

## Depends On

- TASK-032
- TASK-033

## Source Documents

- docs/10-billing-subscriptions-mercadopago.md
- docs/16-billing-mercadopago-slice.md
- docs/08.1-ai-credits-and-usage.md
- docs/10.1-subscription-plans-and-limits.md
- docs/10.2-pricing-unit-economics.md
- docs/09-notifications-alerts.md
- docs/19-security-privacy.md
- docs/18-production-readiness.md

## Objective

Procesar webhooks verificados, idempotentes y basados en estado actual del proveedor para actualizar subscriptions, payments, billing periods y access state.

## Scope

- `/api/webhooks/mercadopago` without user session.
- Authenticity verification, event persistence/deduplication and quick acknowledgement.
- Provider fetch, status/payment mapping and atomic local synchronization.
- `BillingPeriod` upsert for each confirmed Pro period.
- Emit `GrantProPeriodCredits` and `StartProWhatsAppAllowance` ports only after the period is confirmed; retries must not duplicate either grant/allowance.
- Persist `provider_fee` and `net_amount` when reported; never substitute the 10% pricing assumption for actual provider data.
- PENDING/ACTIVE/PAST_DUE/PAUSED/CANCELLED/EXPIRED, trial/expired access and grace config.

## Out of Scope

- Full reconciliation scheduler and operator UI.

## Domain Rules

- Invalid webhook mutates nothing.
- Event order is not trusted; current provider state wins.
- Trial expiration has no automatic grace; grace applies only to eligible Pro renewal failures.

## Implementation Notes

Persist event before heavy processing; queue later if needed, never put raw payload/secrets in Redis.

## Expected Files

- `apps/web/src/app/api/webhooks/mercadopago/route.ts`
- `packages/billing/src/webhooks/`
- `packages/billing/src/subscriptions/`

## Database Changes

Webhook event status/identity indexes and billing payment provider uniqueness.

## API / Application Services

- `ProcessMercadoPagoWebhook`, `SynchronizeSubscription`, payment upsert.

## UI Changes

None.

## Security Requirements

- Official signature/authenticity mechanism, shape validation, replay safety and rate-aware handling.

## Financial Invariants

- Webhook cannot create personal transaction or duplicate billing payment/grant.

## Error Cases

- Invalid signature, unknown event, provider fetch failure, out-of-order/replayed event.

## Acceptance Criteria

- [x] Invalid webhook leaves all billing state unchanged.
- [x] Same event repeated has same final state.
- [x] Provider resource is fetched when possible (webhook payload is never trusted directly; `getSubscription`/`getPayment` re-fetch from Mercado Pago).
- [x] Webhook acknowledges quickly and records processing failure safely.
- [x] Each confirmed billing period is created/upserted once.
- [x] AI grant and WhatsApp allowance integrations are idempotent and occur only after confirmation (ports called only when `periodCreated` is true; concrete AI/WhatsApp implementations are out of scope per Phase 8/11).
- [x] Actual provider fee remains distinguishable from the assumed gateway rate (`provider_fee`/`net_amount` persisted verbatim from the payment response, nullable until reported; no 10% assumption anywhere in this code path).

## Tests Required

### Unit

- [x] Signature/mapper/idempotency logic.

### Integration

- [x] Event and subscription/payment atomic updates.

### E2E

- [ ] Mock verified event activates subscription. (covered instead by the integration test suite against real repositories with a stubbed provider — no Playwright/session fixture available in this environment)

### Security

- [x] Forged/replayed events rejected or no-op.

### Property / Invariant

- [x] Duplicate webhook never duplicates payment/entitlement.
- [x] Duplicate renewal never creates a second period, AI grant or WhatsApp allowance.

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

Billing access follows verified provider state through a retry-safe webhook boundary.

## Notes

Do not perform AI/email/large reports before acknowledgement.
