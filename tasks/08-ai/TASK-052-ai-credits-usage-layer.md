# TASK-052 — Implement AI credits and usage layer

## Status

DONE

## Phase

Phase 8 — AI + OpenRouter

## Priority

P0

## Depends On

- TASK-032
- TASK-036
- TASK-045

## Source Documents

- docs/08.1-ai-credits-and-usage.md
- docs/08-ai-openrouter.md
- docs/10.1-subscription-plans-and-limits.md
- docs/10-billing-subscriptions-mercadopago.md
- docs/16-billing-mercadopago-slice.md
- docs/10.2-pricing-unit-economics.md

## Objective

Implementar el bounded context de AI Credits para controlar el acceso y costo de cada capability sin acoplar créditos a `AIProvider`, Billing ni al ledger financiero personal.

## Scope

- Stable capability catalog and configurable credit cost catalog.
- `ai_credit_entries` auditable ledger with positive amounts and semantic entry types.
- Credit pools `TRIAL_ALLOWANCE`, `PLAN_ALLOWANCE` and `PURCHASED`.
- One-time `TRIAL_GRANT` of 50 credits expiring at `trial_ends_at`.
- `PLAN_GRANT` of 300 credits per confirmed Pro `billing_period_id`.
- Expired access disables AI regardless of historical or purchased credit balance.
- Atomic credit reservations with `PENDING`, `COMMITTED`, `RELEASED` and `EXPIRED` states.
- `executeAICapability()` wrapper: access → entitlement → cost → rate limit → reserve → execute → commit/release → telemetry.
- Stable `operationId`, idempotency, stale reservation reconciliation and no negative balances.
- Provider failure releases reservations; provider fallback/retry uses one reservation and one commercial charge.
- Cost attribution linking AI generation, product credits, model/provider and access state.
- Read model for trial `x/50`, Pro `x/300`, and expired subscription-required UX.
- Purchased-credit structures prepared for future, without purchase checkout in V1.

## Out of Scope

- Purchased credit checkout/refunds, credit packs, gifting, team pools and dynamic token pricing.
- Any direct mutation of `ai_credit_entries` from product features or Billing.

## Domain Rules

- `AIProvider` does not know trial, plan, credits or billing.
- `TRIAL` can consume only trial allowance; `PRO` consumes plan allowance then purchased credits.
- `EXPIRED_READ_ONLY` cannot execute AI or consume purchased credits.
- Trial credits do not renew monthly and do not roll into Pro.
- A valid reservation accepted before access/credit expiry may finish; new executions after expiry are rejected.
- AI credits are not financial currency and never affect personal balances.

## Implementation Notes

Billing calls a port such as `GrantProPeriodCredits` after a confirmed billing period. The AI usage layer owns ledger writes, reservation transactions and balance derivation. Keep provider token/cost telemetry separate from product credit accounting.

## Expected Files

- `packages/ai/src/credits/credit-service.ts`
- `packages/ai/src/credits/credit-policy.ts`
- `packages/ai/src/credits/credit-costs.ts`
- `packages/ai/src/credits/capabilities.ts`
- `packages/ai/src/credits/execute-capability.ts`
- `packages/ai/src/credits/grant-trial-credits.ts`
- `packages/ai/src/credits/grant-pro-period-credits.ts`
- `packages/ai/src/credits/usage-summary.ts`
- `packages/ai/src/credits/reconcile-stale-reservations.ts`
- `packages/ai/src/errors.ts` (extended, not a separate `credits/errors.ts` — same taxonomy as the rest of `packages/ai`)
- `packages/db/src/schema.ts`
- `packages/db/src/repositories/ai-credits.ts`
- `packages/config/src/index.ts` (already had the trial/Pro credit constants from TASK-036)
- `apps/web/src/app/api/webhooks/mercadopago/route.ts` (wires the real `GrantProPeriodCreditsPort`)
- `packages/auth/src/index.ts` (wires trial credit grant on user creation)
- AI usage read queries/UI contracts (`AIUsageSummary` — actual UI is TASK-035)

## Database Changes

- `ai_credit_entries`
- `ai_credit_reservations`
- optional `ai_credit_periods`/read model
- Unique trial grant, Pro period grant and operation identifiers.

## API / Application Services

- `AICreditService.getBalance`
- `AICreditService.reserve`
- `AICreditService.commit`
- `AICreditService.release`
- `GrantTrialCredits`
- `GrantProPeriodCredits`
- `executeAICapability`
- `ReconcileStaleAICreditReservations`

## UI Changes

Consumed by TASK-035 and AI features for state-aware usage display; expired state must show subscription required, not `0/300`.

## Security Requirements

- Authenticated server context is the authority for `userId`.
- User A cannot inspect, consume or grant User B credits.
- Client cannot set balance, pool, access state, capability cost or grant type.

## Financial Invariants

- Credit ledger is separate from personal finance ledger.
- AI credit operations never mutate transactions, balances, debts, budgets or billing state.
- Financial workflows remain usable with zero credits, AI disabled or provider outage.

## Error Cases

- `AI_ACCESS_REQUIRED`, `AI_CREDITS_EXHAUSTED`, `AI_CREDIT_RESERVATION_FAILED`, `AI_CREDIT_OPERATION_DUPLICATE`, `AI_USAGE_RATE_LIMITED`, stale reservation, invalid grant and negative-balance attempt.

## Acceptance Criteria

- [x] New trial creates exactly one 50-credit grant with `expires_at = trial_ends_at` (`grantTrialCredits`, unique on `(userId)` where `type='TRIAL_GRANT'`; wired into `packages/auth`'s `databaseHooks.user.create.after`).
- [x] Trial grant is not renewed and remaining credits do not roll into Pro (`resolvePoolOrder("PRO")` never includes `TRIAL_ALLOWANCE`).
- [x] Each confirmed Pro billing period creates exactly one 300-credit grant (`grantProPeriodCredits`, unique on `(userId, referenceId)` where `type='PLAN_GRANT'`; wired into the Mercado Pago webhook route via `GrantProPeriodCreditsPort`).
- [x] `EXPIRED_READ_ONLY` cannot call provider even when historical/purchased credits exist (`resolvePoolOrder("EXPIRED_READ_ONLY") === []`; `executeAICapability` throws `AI_ACCESS_REQUIRED` before ever reserving).
- [x] Reservation and availability check are atomic and cannot create negative balance (`pg_advisory_xact_lock(hashtext(userId))` inside a transaction, balance computed from ledger minus PENDING holds).
- [x] Provider failure releases reservation with no final consumption (`executeAICapability` releases on any thrown error; only `commit()` writes a CONSUMPTION entry).
- [x] Retry/fallback and repeated operation do not double-charge (`reserve()` is idempotent on `operationId`; a mismatched retry throws `AI_CREDIT_OPERATION_DUPLICATE`).
- [x] Read model distinguishes access-required from exhausted credits (`AIUsageSummary` is a `{state: "ACCESS_REQUIRED"} | {state: "TRIAL", ...} | {state: "PRO", ...}` discriminated union, never a bare number).
- [x] Billing and product features use ports/services rather than direct ledger writes (`GrantProPeriodCreditsPort`, `AICreditRepositoryPort` — no feature code touches `ai_credit_entries`/`ai_credit_reservations` directly).

## Tests Required

### Unit

- [x] Pool selection, consumption order, expiration, cost resolution and error mapping (`tests/unit/ai-credit-policy-and-costs.test.ts`, `tests/unit/ai-credit-service.test.ts`).
- [x] Trial/Pro/expired access policy and reservation state transitions (`tests/unit/ai-execute-capability.test.ts`, `tests/unit/ai-credit-grants-and-reconcile.test.ts`, `tests/unit/ai-usage-summary.test.ts`).

### Integration

- [x] Ledger constraints, unique grants, atomic reservation and stale reservation reconciliation (`tests/integration/ai-credits-repository.test.ts`).
- [x] Billing period grant port and AI generation cost attribution (`tests/integration/billing-webhook.test.ts` — grant-exactly-once via the real port wiring).

### E2E

- [ ] Deferred to TASK-035: no AI credits UI exists yet in this repo (this task's scope is the read-model contract, not the UI itself), so there is nothing to drive an E2E flow against.

### Security

- [x] Cross-user credit access/grants and client mutations are rejected (`getAvailableBalances`/reservations are always scoped by the authenticated `userId`; `tests/integration/ai-credits-repository.test.ts` "keeps balances scoped per user").

### Property / Invariant

- [x] Concurrent operations cannot consume the same credits twice (`tests/integration/ai-credits-repository.test.ts` "concurrency invariant" — two parallel 4-credit reservations against a 4-credit balance resolve to exactly one success).
- [x] Balance never becomes negative and failed executions do not permanently charge (`reserve()` denies when `available < credits`; release/commit tests confirm holds are freed correctly).

## Verification Commands

- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`

## Definition of Done

AI usage is bounded, auditable, state-aware and idempotent, with provider access isolated from credit accounting and financial truth.
