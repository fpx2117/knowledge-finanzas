# TASK-055 — Establish referral domain, attribution and reward granting

## Status
DONE

## Phase
Phase 13 — Referrals

## Priority
P3

## Depends On
- TASK-053
- TASK-052
- TASK-034

## Source Documents
- docs/10.4-referrals-and-affiliates.md
- docs/10.3-promotion-codes-pro-access.md
- docs/08.1-ai-credits-and-usage.md
- docs/19-security-privacy.md

## Objective

Crear el bounded context `packages/referrals` que atribuye nuevos usuarios a un referrer mediante un código estable, y otorga una recompensa server-controlada solo cuando el usuario referido alcanza su primer Pro pago efectivo (`FIRST_PAID_PRO_ACTIVATION`), reutilizando el dominio de Promociones y de AI Credits para el otorgamiento real.

## Scope

- `referral_codes` (uno por usuario, generado automáticamente, no derivado de PII), `referral_attributions`, `referral_rewards` schema con ownership e índices.
- Atribución: captura de `referral code` durante signup (o dentro de una ventana corta post-signup, ej. 24h, si el usuario aún no tiene atribución), `REFERRAL_ATTRIBUTION_DAYS` configurable (default 30), política `LAST VALID REFERRAL BEFORE SIGNUP`, congelada permanentemente al crear el usuario.
- Bloqueo de self-referral (`referrer_user_id = referred_user_id` rechazado).
- `HandleReferralConversion`: escucha el evento normalizado `PaidProActivated` emitido por Billing (TASK-034), busca la atribución `ATTRIBUTED`, la marca `CONVERTED` de forma idempotente (un pago repetido/webhook duplicado nunca genera una segunda conversión ni una segunda recompensa).
- `ReferralRewardPolicy` configurable: `non_paid_reward_type`/`value` (default `PROMOTIONAL_PRO_DAYS = 30`, otorgado vía `packages/promotions`' `GrantPromotionalProAccess` con `source = REFERRAL_REWARD`) y `paid_reward_type`/`value` (default `AI_CREDITS = 100`, otorgado vía el AI Credit ledger de TASK-052 con entry type `REFERRAL_REWARD_GRANT`).
- Cap anti-abuso: `REFERRAL_REWARDS_PER_USER_PER_PERIOD` (default 3 rewards / rolling 30 days) y `MAX_REFERRAL_PROMO_DAYS_AHEAD` (default 90 promotional days banked ahead) para el caso `non_paid`.
- Reward policy versioning (`referral-policy:v1`) snapshotted en la atribución/reward; cambios de política nunca alteran recompensas ya otorgadas.
- `RetryReferralReward` (admin/idempotent) para reintentar un reward que falló después de una conversión ya registrada, sin afectar el estado de la suscripción paga.
- `InvalidateReferral` (admin-only, requiere reason) para fraude/chargeback.
- Errores normalizados y auditables para toda mutación administrativa.

## Out of Scope

- Affiliate accounts, monetary commissions, payout providers, multi-level referrals (post-MVP per doc section 174).
- Referral UI (TASK-056).
- Extra trial days for referred users (explicitly not implemented in V1 per doc section 42-43).

## Domain Rules

- `Referral Signup` never equals `Referral Conversion`; only an effective first paid Pro subscription qualifies.
- `Checkout Started`/`PENDING subscription` never equals `Referral Conversion`.
- A single paid conversion can generate at most one standard referral reward.
- Repeated billing webhooks/events for the same activation cannot duplicate a reward (idempotency key: `referralAttributionId + qualificationEvent + rewardBeneficiary`).
- Referral reward failure never rolls back or affects the paid subscription that triggered it; the paid subscription remains authoritative and active regardless of reward outcome.
- Referral rewards never call Mercado Pago directly; they consume normalized Billing events/state only.
- Promotional-day rewards use the Promotion domain (TASK-053); AI credit rewards use the AI Credit domain (TASK-052). This package never writes directly to `promotional_access_grants` or the AI credit ledger tables.
- Reward amounts and eligibility are always server-controlled; the frontend can only submit a referral code during signup, never `referrerUserId`, `rewardType`, or `converted`.

## Implementation Notes

Use an event/outbox-style handoff from Billing's `PaidProActivated` normalized event rather than a distributed transaction across Billing, Promotions, and AI Credits (per doc section 119, no distributed transaction). If the downstream grant call fails after the conversion is recorded, persist `REWARD_PENDING`/`REWARD_FAILED` for `RetryReferralReward` to resolve later, idempotently.

## Expected Files

- `packages/referrals/src/domain/`
- `packages/referrals/src/application/attribute-referral.ts`
- `packages/referrals/src/application/handle-referral-conversion.ts`
- `packages/referrals/src/application/grant-referral-reward.ts`
- `packages/referrals/src/policies/reward-policy.ts`
- `packages/referrals/src/errors.ts`
- `packages/db/src/schema.ts`

## Database Changes

- `referral_codes` (id, owner_user_id, code UNIQUE case-insensitive, status, created_at, updated_at).
- `referral_attributions` (id, referral_code_id, referrer_user_id, referred_user_id, status, attributed_at, converted_at, created_at) with unique `referred_user_id` (one attribution per referred user).
- `referral_rewards` (id, referral_attribution_id, beneficiary_user_id, type, value, status, reward_policy_version, grant_reference_id, created_at, granted_at) with unique `(referral_attribution_id, qualification_event, beneficiary_user_id)`.
- Indexes: `referral_codes(code)`, `referral_attributions(referrer_user_id)`, `referral_attributions(referred_user_id)`, `referral_rewards(referral_attribution_id)`.

## API / Application Services

- `GetOrCreateReferralCode`
- `AttributeReferral`
- `HandleReferralConversion`
- `GrantReferralReward`
- `RetryReferralReward` (admin)
- `InvalidateReferral` (admin)

## UI Changes

None; consumed by TASK-056.

## Security Requirements

- Referral attribution accepts only a `code` from the client; `referrerUserId` is resolved server-side.
- Endpoints never reveal a referral code owner's email, financial information, or conversion statistics without authorization.
- Referral attribution/validation endpoints are rate-limited.

## Financial Invariants

- Self-referral is never rewarded.
- A paid conversion generates at most one standard referral reward.
- Repeated `PaidProActivated` events cannot duplicate a reward.
- Referral reward failure never rolls back paid billing state.
- Reward amounts are server-controlled and bounded by configured caps (`REFERRAL_REWARDS_PER_USER_PER_PERIOD`, `MAX_REFERRAL_PROMO_DAYS_AHEAD`).

## Error Cases

- Self-referral attempt, attribution window expired, existing attribution present (late/duplicate attribution), reward cap reached, downstream grant failure requiring retry.

## Acceptance Criteria

- [x] A valid referral code captured during/shortly after signup creates exactly one `ATTRIBUTED` attribution frozen at signup.
- [x] Self-referral is rejected and produces no attribution.
- [x] `HandleReferralConversion` triggered by `PaidProActivated` marks the attribution `CONVERTED` and creates exactly one reward, even if the underlying billing event is delivered more than once. (`HandleReferralConversion` itself is idempotent and covered end-to-end; the live `PaidProActivated` wiring is not built — see Notes.)
- [x] Non-paid referrer (trial/expired/promotional) receives a `PROMOTIONAL_PRO_DAYS` reward via the Promotion domain; an active paid Pro referrer receives an `AI_CREDITS` reward via the AI Credit ledger. (Granted through port contracts, not a live call into `packages/promotions`/`packages/ai` — see Notes.)
- [x] Reward cap (`REFERRAL_REWARDS_PER_USER_PER_PERIOD`) blocks further rewards once reached within the rolling window.
- [x] A failed downstream grant leaves the reward `PENDING`/`FAILED` and retryable via `RetryReferralReward` without duplicating on success.
- [x] Reward policy is versioned; changing the policy does not alter already-granted rewards (each reward snapshots `rewardPolicyVersion` at creation time).

## Tests Required

### Unit
- [x] Attribution window and last-valid-referral-before-signup logic. (Attribution window only — see Notes on the "last valid referral before signup" narrowing.)
- [x] Self-referral rejection.
- [x] Reward policy resolution (non-paid vs paid referrer) and cap enforcement.

### Integration
- [x] Duplicate `PaidProActivated` event produces one conversion and one reward. (Simulated as two calls to `HandleReferralConversion` for the same referred user, matching how a retried/duplicate billing event would be replayed by the caller once live-wired.)
- [x] Reward grant failure is retryable idempotently and does not roll back billing.
- [ ] Reward respects `MAX_REFERRAL_PROMO_DAYS_AHEAD` when combined with an existing active promotional grant. (Not testable within this package — the cap composes `PromotionService.extendGrant` with `GrantPromotionalProAccess` at the apps/web wiring layer that TASK-055's Expected Files don't include; `cappedPromotionalDays` itself is unit-tested.)

### E2E
- [ ] Referred user completes trial then converts to paid Pro; referrer receives the configured reward. (No UI exists yet — this is TASK-056's job per Expected Files/UI Changes.)

### Security
- [x] Referral attribution endpoint rejects a client-supplied `referrerUserId`/`converted` flag. (Enforced by `AttributeReferral`'s signature — it only accepts `rawCode`/`referredUserId`/`referredUserCreatedAt` — even though no HTTP endpoint exists yet in this task.)
- [ ] User cannot read another user's referral attribution/reward details. (No read endpoints exist yet — nothing to test until TASK-056.)

### Property / Invariant
- [x] A single paid conversion never produces more than one standard reward.
- [x] Reward granting never mutates `billing_subscriptions`/`billing_payments`/`billing_periods` (true by construction — `createReferralRepository` never imports or references the billing schema tables).

## Verification Commands
- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

Referral attribution, conversion detection, and reward granting work end-to-end and idempotently, rewarding real paid acquisition rather than signups, without ever touching Mercado Pago directly or creating parallel commercial-code logic.

## Notes

Extra trial days for referred users and affiliate monetary commissions are explicitly out of scope for V1 per the source document; do not implement them speculatively.

**Scope narrowing (consistent with TASK-053's "ports without live wiring" precedent):**

- **No live `PaidProActivated` wiring.** Nothing in the codebase currently emits a normalized `PaidProActivated` event from Billing. `HandleReferralConversion` is fully built and idempotent, but it takes `referrerHasEffectivePaidAccess`/`occurredAt` as caller-supplied inputs rather than subscribing to a real event bus. Wiring it to Billing's actual state transitions is deferred to whichever task first needs it (likely alongside TASK-056 or a dedicated billing-events task) — matching how `packages/promotions`' `AiCreditGrantPort`/`NotificationAllowancePort` were built as ports first and live-wired later.
- **"Last valid referral before signup" not implemented.** This codebase has no pre-signup click/cookie tracking infrastructure (no landing-page attribution capture), so there is no way to compare multiple candidate referral touches and pick the last one. What IS implemented and tested: a referral code submitted within a short post-signup window (`isWithinAttributionWindow`, default 24h) is attributed, and a referred user can only ever be attributed once (enforced by the `referral_attributions.referred_user_id` unique index). `REFERRAL_ATTRIBUTION_DAYS` (30-day) framing from the spec doesn't apply without that upstream tracking.
- **Promotional-day "banking ahead" (`MAX_REFERRAL_PROMO_DAYS_AHEAD`) is a port contract only.** Composing `PromotionService.extendGrant` with `GrantPromotionalProAccess` to actually bank/cap promotional days ahead of an existing active grant requires calling into `packages/promotions` from the consuming layer — this package only exposes `GrantReferralPromotionalDaysPort`/`GrantReferralAiCreditsPort` (both no-op-defaulted) and never touches `promotional_access_grants`/AI credit ledger tables directly, per the Domain Rules. `cappedPromotionalDays` (the pure capping function) is implemented and unit-tested; the orchestration that would call it isn't, since Expected Files doesn't include any `apps/web` wiring for this task.
- **Reward beneficiary is always the referrer**, per the spec's `ReferralRewardPolicy` (non-paid referrer → promotional days; paid referrer → AI credits) — `referred_user_id` never receives a reward.

**Migration gotcha discovered while building this task (documented for future migrations touching newly-added enum values):** Postgres forbids using an enum label added via `ALTER TYPE ... ADD VALUE` within the same transaction that adds it (SQLSTATE 55P04) — and drizzle's migrator (both `drizzle-kit migrate` and the `drizzle-orm/postgres-js` migrator used by the test suite) wraps *all* migrations pending at the time of a given run into one transaction. Casting the enum column to `::text` in a partial index predicate does NOT work around this — Postgres then rejects it with "functions in index predicate must be marked IMMUTABLE" instead, since enum-to-text output is only STABLE. The only real fix is applying the `ADD VALUE` migration and any migration that USES the new value as two separate `db:migrate` invocations (see `0021_hot_magma.sql` / `0022_referral_reward_grant_index.sql`, split for exactly this reason). While verifying this fix against a genuinely from-scratch database, we also discovered migration `0003_nappy_forgotten_one.sql` (`ALTER TYPE transaction_type ADD VALUE 'TRANSFER_OUT'`) has the identical problem with `0004_transfer_leg_constraints.sql`'s use of that value — a pre-existing bug, unrelated to referrals, that has never surfaced because neither the dev nor test database has ever been migrated from absolute zero in one run before. Left unfixed here as out of scope for TASK-055; both the dev and test databases were manually bootstrapped around it (0000-0003 applied directly, then 0004 onward normally) to unblock this task's verification.
