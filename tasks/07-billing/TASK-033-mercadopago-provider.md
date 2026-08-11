# TASK-033 — Implement Mercado Pago provider and subscription checkout

## Status

DONE

## Phase

Phase 7 — Billing + Mercado Pago

## Priority

P1

## Depends On

- TASK-032

## Source Documents

- docs/10-billing-subscriptions-mercadopago.md
- docs/16-billing-mercadopago-slice.md
- docs/18-production-readiness.md

## Objective

Encapsular Mercado Pago detrás de `BillingProvider` y crear suscripciones locales PENDING antes del checkout.

## Scope

- Provider interface/client/mapper/timeouts/error model.
- `StartSubscription`, local-first ID and external reference.
- `/pricing`, subscribe endpoint and return/pending UX contract.

## Out of Scope

- Webhook processing, reconciliation, cancellation policy finalization.

## Domain Rules

- Checkout URL never activates PRO.
- Provider credentials never reach browser.

## Implementation Notes

Implement under `packages/billing/src/providers/mercadopago`; provider API version/semantics must be verified before coding. Cancellation remains governed by OQ-005 until that verification is complete.

## Expected Files

- `packages/billing/src/providers/mercadopago/`
- `apps/web/src/features/billing/`
- `apps/web/src/app/pricing/`

## Database Changes

None beyond TASK-032.

## API / Application Services

- `BillingProvider`, `MercadoPagoBillingProvider`, `StartSubscription`.

## UI Changes

- Public pricing, logged-in upgrade and pending return page.

## Security Requirements

- Server-only access token; allowlisted return URLs; idempotent double-click protection.

## Financial Invariants

- No platform payment becomes personal transaction.

## Error Cases

- Provider unavailable/timeout/rejected, duplicate pending/active, invalid plan.

## Acceptance Criteria

- [x] Local PENDING subscription is created before provider call.
- [x] Provider ID/reference are stored after successful response.
- [x] Failure cannot produce ACTIVE false state (failed local row is marked CANCELLED, never ACTIVE).
- [x] Redirect page says confirming, not active.

## Tests Required

### Unit

- [x] Request/response/status/error mapping.

### Integration

- [x] Start service idempotency and local state.

### E2E

- [ ] Mock checkout initiation/return. (no E2E harness with an authenticated fixture in this environment; covered instead by integration tests against real repositories with a stubbed provider)

### Security

- [x] Secrets/redirect validation (token stays server-side in `packages/billing`'s provider client; `back_url` is always derived from the trusted `BETTER_AUTH_URL` config value, never accepted from the client).

### Property / Invariant

- [x] Repeated start does not create duplicate effective subscriptions.

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

Checkout integration is isolated, retry-safe and cannot grant access from redirect alone.

## Notes

Verify the actual Mercado Pago cancellation API semantics before implementing cancellation; keep OQ-005 open and create its ADR after verification.
