# TASK-053 — Establish promotion codes domain, schema and redemption service

## Status
DONE

## Phase
Phase 12 — Promotions

## Priority
P2

## Depends On
- TASK-032
- TASK-045
- TASK-052

## Source Documents
- docs/10.3-promotion-codes-pro-access.md
- docs/10.1-subscription-plans-and-limits.md
- docs/08.1-ai-credits-and-usage.md
- docs/19-security-privacy.md

## Objective

Crear el bounded context `packages/promotions` que permite otorgar Pro promocional temporal (`PROMOTIONAL PRO`) mediante códigos, sin crear ni modificar ninguna suscripción de Mercado Pago, y extender `ProductAccessResolver` para resolver `PAID_SUBSCRIPTION > PROMOTION > TRIAL > EXPIRED_READ_ONLY`.

## Scope

- `promotion_codes`, `promotion_redemptions`, `promotional_access_grants` schema con ownership, constraints e índices (`code`, `status`, `promotion_code_id`, `user_id`, `ends_at`).
- Normalización de código (uppercase, trim, alfabeto restringido `A-Z0-9-`, longitud 4–32).
- Estados de código: `DRAFT`, `ACTIVE`, `PAUSED`, `EXPIRED`, `REVOKED`.
- Configuración por código: `duration_value`/`duration_unit` (`DAYS` únicamente en V1), `redemption_starts_at`/`redemption_ends_at` opcionales, `max_redemptions`/`max_redemptions_per_user` (default 1), `stacking_policy` (`NOT_STACKABLE` por default).
- `PromotionService` (`createCode`, `updateCode`, `activateCode`, `pauseCode`, `revokeCode`, `redeemCode`, `getPromotion`, `listPromotions`, `revokeGrant`, `extendGrant`) y application service `RedeemPromotionCode`.
- Redención atómica: valida status, ventana, límites globales/por usuario y stacking dentro de la misma transacción de base de datos.
- Snapshot de términos (`durationValue`, `accessLevel`, allowance de IA/WhatsApp) congelado en el grant al momento de redención; editar el código nunca modifica grants existentes.
- Extensión de `ProductAccessResolver` (definido en TASK-045) para incluir `PROMOTION` en `ProductAccessSource` con prioridad `PAID_SUBSCRIPTION > PROMOTION > TRIAL > EXPIRED_READ_ONLY`.
- Integración server-side (vía puerto, no acceso directo a tablas) con el AI Credit ledger (TASK-052) y con el WhatsApp allowance de notifications (TASK-047/051) usando `Promotion Usage Periods` de máximo 30 días para promociones más largas que 31 días.
- Grant manual sin código (`ADMIN_OVERRIDE`/`MANUAL_PROMOTION`) reutilizado por Commercial Admin (TASK-060).
- Errores normalizados: `PROMOTION_INVALID`, `PROMOTION_NOT_ACTIVE`, `PROMOTION_NOT_STARTED`, `PROMOTION_EXPIRED`, `PROMOTION_REDEMPTION_LIMIT_REACHED`, `PROMOTION_USER_LIMIT_REACHED`, `PROMOTION_ALREADY_REDEEMED`, `PROMOTION_ALREADY_ACTIVE`, `PROMOTION_NOT_STACKABLE`, `PROMOTION_NOT_APPLICABLE_TO_ACTIVE_SUBSCRIPTION`, `PROMOTION_REDEMPTION_RATE_LIMITED`.

## Out of Scope

- Admin/user UI (TASK-054).
- Campaign entities, stackable/queued promotions, bulk code generation, influencer/affiliate attribution (post-MVP per doc section 192).
- Billing discounts/coupons (`docs/10.5-discounts-and-coupons.md`); explicitly a separate, deferred mechanism per MASTER_PLAN.
- Referral-originated grants (TASK-055 calls into this service but does not live here).

## Domain Rules

- A promotion code never creates or mutates a `billing_subscriptions`/`billing_payments`/`billing_periods` row.
- `EffectiveProductAccess = PRO` when an active promotional grant exists, regardless of trial state; the underlying `trial_ends_at` is never extended or reset by a promotion.
- V1 default: an `ACTIVE` paid subscription rejects promotion redemption (`PROMOTION_NOT_APPLICABLE_TO_ACTIVE_SUBSCRIPTION`); paid subscription always outranks an active promotion once effective.
- V1 default: a user with an already-active promotional grant cannot redeem a second code (`PROMOTION_ALREADY_ACTIVE`); `stacking_policy` exists as a typed field for future policies but only `NOT_STACKABLE` is implemented.
- Redemption is atomic: concurrent requests against a finite `max_redemptions` can never produce more redemptions than the configured maximum.
- Grant `ends_at` is computed from server time; a promotion never trusts a client-supplied duration, userId, or accessLevel.
- Codes are never physically deleted; disabling uses `REVOKED`/`PAUSED`. Redemption history is never deleted.
- AI credits and WhatsApp allowances granted through a promotion are bounded per promotion usage period and are never unlimited.

## Implementation Notes

Create `packages/promotions` with `domain/`, `application/`, `repositories/`, `errors.ts`. Use a single DB transaction (SELECT ... FOR UPDATE or an equivalent locking strategy on the code row) to enforce `max_redemptions` under concurrency. AI credit and WhatsApp allowance grants are issued through explicit ports (`AiCreditGrantPort`, `NotificationAllowancePort`) implemented by TASK-052/TASK-047, not by writing to their tables directly.

## Expected Files

- `packages/promotions/src/domain/`
- `packages/promotions/src/application/redeem-promotion-code.ts`
- `packages/promotions/src/application/promotion-service.ts`
- `packages/promotions/src/errors.ts`
- `packages/db/src/schema.ts`
- `packages/billing/src/plans/resolver.ts` (extend `ProductAccessResolver`)
- `packages/validation/` promotion schemas

## Database Changes

- `promotion_codes` (code, normalized_code UNIQUE, name, description, status, access_level, duration_value, duration_unit, redemption_starts_at, redemption_ends_at, max_redemptions, max_redemptions_per_user, stacking_policy, ai_credits_per_period, whatsapp_messages_per_period, created_by, created_at, updated_at).
- `promotion_redemptions` (id, promotion_code_id, user_id, status, redeemed_at, grant_id, metadata, created_at) with unique `(promotion_code_id, user_id)` when max-per-user = 1.
- `promotional_access_grants` (id, user_id, promotion_code_id nullable for manual grants, redemption_id nullable, access_level, starts_at, ends_at, status, revoked_at, revoked_by, revocation_reason, source, created_at, updated_at).
- `promotion_access_periods` (id, grant_id, starts_at, ends_at, sequence, status, created_at) for usage-period bounded AI/WhatsApp allowances.
- Indexes: `promotion_codes(normalized_code)`, `promotion_codes(status)`, `promotion_redemptions(promotion_code_id)`, `promotion_redemptions(user_id)`, `promotional_access_grants(user_id)`, `promotional_access_grants(ends_at)`.

## API / Application Services

- `RedeemPromotionCode`
- `PromotionService.createCode/updateCode/activateCode/pauseCode/revokeCode`
- `PromotionService.extendGrant/revokeGrant`
- `GrantPromotionalProAccess` (manual, admin-only entry point reused by TASK-060)

## UI Changes

None; consumed by TASK-054.

## Security Requirements

- Redemption input from the client is limited to `code`; `userId` always comes from the authenticated session.
- Redemption and grant listing endpoints enforce ownership; a user can never read another user's redemptions or grants.
- Redemption is rate-limited per user and per IP to reduce brute-force code guessing.
- Error responses for invalid/expired/exhausted codes are generic (`PROMOTION_INVALID`-class) to avoid code enumeration; internal logs retain the exact reason.

## Financial Invariants

- Promotional Pro access never creates, backdates, or fakes a Mercado Pago subscription/payment/billing period.
- A promotion redemption cannot exceed `max_redemptions` under concurrency.
- Editing a promotion code's duration/allowance never retroactively changes already-issued grants.
- Promotion expiration never deletes user financial or account data.
- AI credit and WhatsApp allowances granted via promotion are always finite and configuration-driven, never unlimited.

## Error Cases

- Invalid/unknown code, not yet started, expired window, global limit reached, per-user limit reached, already has active promotion, active paid subscription blocking redemption, rate limited.

## Acceptance Criteria

- [x] `ProductAccessResolver` resolves `PRO`/`source=PROMOTION` for an active grant when no paid subscription is effective, following the priority `PAID_SUBSCRIPTION > PROMOTION > TRIAL > EXPIRED_READ_ONLY`. Implemented as a new `resolveProductAccessSource` function alongside the existing `resolveProductAccess` — see Notes for why this is additive rather than a breaking signature change.
- [x] Redeeming a valid code creates exactly one redemption and one grant; retried/duplicate requests do not create a second grant — enforced by `PROMOTION_ALREADY_REDEEMED`/`PROMOTION_ALREADY_ACTIVE` plus the DB-level partial unique index.
- [x] `max_redemptions` cannot be exceeded by concurrent redemption requests — verified with 6 real concurrent `redeemPromotionCode` calls against `max_redemptions = 3` in `tests/integration/promotions.test.ts`, using `SELECT ... FOR UPDATE` on the code row.
- [x] Editing a promotion code's duration after redemptions leaves existing grants' `ends_at` unchanged — `durationValue`/`aiCreditsPerPeriod`/`whatsappMessagesPerPeriod` are not present in `UpdatePromotionCodeInput` at all (a type-level guarantee, not just a runtime check), and grants store their own snapshot columns.
- [x] Redeeming while an active paid subscription exists is rejected with `PROMOTION_NOT_APPLICABLE_TO_ACTIVE_SUBSCRIPTION`.
- [x] Redeeming while another promotional grant is active is rejected with `PROMOTION_ALREADY_ACTIVE`.
- [x] Grant revocation causes `ProductAccessResolver` to immediately recalculate access without deleting user data — `revokeGrant` only ever updates `status`/`revokedAt`/`revokedBy`/`revocationReason`; the row (and the redemption/code history behind it) is never deleted.
- [x] AI credits/WhatsApp allowance are granted through the AI Credit / Notifications ports, never via direct table writes from `packages/promotions` — `packages/promotions` has zero imports of `@know-finanzas/db` or any AI-credit/notification table.

## Tests Required

### Unit
- [x] Code normalization and validation (case, whitespace, alphabet, length). (`tests/unit/promotion-normalize-code.test.ts`)
- [x] Redemption state machine: status/window/limit/stacking checks. (`tests/unit/promotion-redemption-decision.test.ts`, 15 cases)
- [x] `ProductAccessResolver` priority matrix including `PROMOTION`. (`tests/unit/billing-access-resolver.test.ts`, new cases added)
- [x] Usage-period chunking, `PromotionService`, `GrantPromotionalProAccess`, `RedeemPromotionCode` (fake repository), and the in-memory rate limiter. (`tests/unit/promotion-usage-periods.test.ts`, `promotion-service.test.ts`, `promotion-grant-manual-access.test.ts`, `promotion-redeem-code.test.ts`, `promotion-rate-limiter.test.ts`)

### Integration
- [x] Concurrent redemption requests against `max_redemptions = N` never exceed `N` successful redemptions. (`tests/integration/promotions.test.ts`)
- [x] Editing a code after redemptions does not change existing grants (snapshot terms).
- [x] Manual grant (no code) creates a grant with `source = ADMIN_OVERRIDE`/`MANUAL_PROMOTION`, never touches billing tables.

### E2E
None. No admin/user UI or Server Action layer exists yet to redeem a code end-to-end through the browser — that's TASK-054's job, matching this task's own "UI Changes: None; consumed by TASK-054" and TASK-058's precedent for domain-only tasks with no UI surface.

### Security
- [x] User A cannot read or redeem against User B's redemption history. (`tests/integration/promotions.test.ts` — per-user redemption counts and active grants are fully independent per user, verified with two real users redeeming the same code.)
- [x] Repeated redemption attempts are rate-limited. (`tests/unit/promotion-redeem-code.test.ts`, `tests/unit/promotion-rate-limiter.test.ts` — `createRedeemPromotionCode` checks every supplied rate-limit key before ever touching the repository.)

### Property / Invariant
- [x] A finite `max_redemptions` is never exceeded under concurrency.
- [x] Promotion redemption never creates a row in `billing_subscriptions`, `billing_payments`, or `billing_periods`. (`tests/integration/promotions.test.ts` asserts all three tables stay empty after a manual grant; the redemption path never imports or references any billing table at all — enforced structurally, not just by a test.)

## Verification Commands
- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

Promotion codes can be created, validated and atomically redeemed to grant time-bounded Pro access, fully isolated from Mercado Pago state, with server-controlled duration and bounded AI/WhatsApp allowances.

## Notes

Discounts/coupons on paid subscriptions (`docs/10.5-discounts-and-coupons.md`) are a separate, explicitly deferred mechanism per `tasks/MASTER_PLAN.md`; this task does not implement them. Referral-granted promotional access (TASK-055) calls into `PromotionService`/`GrantPromotionalProAccess` rather than duplicating grant logic.

**`resolveProductAccess`'s extension is additive, not a breaking signature change.** The acceptance criterion asks for a resolver that "resolves PRO/source=PROMOTION," which reads as wanting a `{state, source}` pair back. Restructuring `resolveProductAccess`'s return type to an object would have broken both existing call sites (`packages/billing/src/plans/entitlements.ts`, `apps/web/src/lib/billing/product-access-gate.ts`) and every test asserting a bare `"PRO"`/`"TRIAL"`/`"EXPIRED_READ_ONLY"` string — none of which are in this task's Expected Files. Instead: `resolveProductAccess` keeps its existing signature and bare `ProductAccessState` return type verbatim (a caller who never passes the new optional `activePromotion` field sees byte-for-byte the same behavior as before this task), and a new sibling function `resolveProductAccessSource` returns the `ProductAccessSource` (`"PAID_SUBSCRIPTION" | "PROMOTION" | "TRIAL" | "NONE"`) using the identical priority logic. `ENTITLEMENT_MATRIX` needed no change at all, since `PROMOTION` is a *source*, not a new `ProductAccessState` — a promotional grant still resolves to the plain `"PRO"` state, which already has full entitlements.

**No app-layer (`apps/web`) wiring was added**, matching TASK-058's precedent for a domain-only task with "UI Changes: None." `RedeemPromotionCode`, `PromotionService`, and `GrantPromotionalProAccess` are fully implemented, tested against real Postgres repositories, and exported from `@know-finanzas/promotions` — TASK-054 wires the redemption UI/Server Action, and TASK-060 wires the admin surface for `PromotionService`/`GrantPromotionalProAccess`.

**AI credit / WhatsApp allowance integration stops at the port boundary**, the same way `packages/billing/src/subscriptions/ports.ts`'s `GrantProPeriodCreditsPort`/`StartProWhatsAppAllowancePort` do today: `AiCreditGrantPort`/`NotificationAllowancePort` are called once per `Promotion Usage Period` (bounded to <=30 days via `computePromotionUsagePeriods`), but nothing in this codebase yet implements them against the real AI credit ledger (`packages/ai`) or the WhatsApp allowance counting in `apps/web/src/lib/notifications/notify.ts`. This mirrors an existing, already-shipped precedent — `StartProWhatsAppAllowancePort` has been defined and noop'd since TASK-049 without ever being wired into `notify.ts`'s actual allowance counting (which reads `trialStartedAt`/`currentPeriodStart` directly) — so a promotion's `whatsappMessagesPerPeriod`/`aiCreditsPerPeriod` are recorded on the grant/period rows (available for a future integration) but don't yet flow through to real credit grants or WhatsApp sends.

**Concurrency correctness detail worth flagging for future maintainers**: `packages/db/src/repositories/promotions.ts`'s `redeemCode` and `createManualGrant` both catch a Postgres unique-violation (SQLSTATE `23505`) to detect the cross-code "two different promotions redeemed by the same user at once" race (the per-code `FOR UPDATE` lock only serializes redemptions of the *same* code, not different codes targeting the same user). The catch **must** wrap `database.transaction(...)` itself, not sit inside the transaction callback — catching mid-transaction and returning a value instead of rethrowing leaves the underlying Postgres session in an aborted state, and the driver's own implicit `COMMIT` then re-raises the same error anyway. This was caught by the integration test for manual-grant double-redemption during this task's own implementation, not left as a latent bug.

**Schema note**: `promotion_redemptions.grant_id` and `promotional_access_grants.redemption_id` are a genuine mutual (circular) foreign-key reference — each table references the other. Drizzle/drizzle-kit handles this correctly (both `CREATE TABLE` statements run first, then both `FOREIGN KEY` constraints are added via `ALTER TABLE`), verified via `pnpm db:generate`/`pnpm db:migrate` in this task. The insert order within `redeemCode`'s transaction is: redemption (grant_id null) -> grant (redemption_id set) -> update redemption's grant_id — both rows are fully linked before the transaction commits.
