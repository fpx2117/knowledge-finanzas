# TASK-054 — Implement promotion redemption UI, expiry reminders and promotions admin

## Status
DONE

## Phase
Phase 12 — Promotions

## Priority
P3

## Depends On
- TASK-053
- TASK-047
- TASK-035

## Source Documents
- docs/10.3-promotion-codes-pro-access.md
- docs/07-ui-system.md
- docs/09-notifications-alerts.md

## Objective

Exponer la redención de códigos promocionales y el estado de acceso promocional al usuario final, y dar a operadores autorizados un panel mínimo para crear y administrar promociones, todo consumiendo `packages/promotions` de TASK-053 sin duplicar su lógica.

## Scope

- Sección "¿Tenés un código promocional?" en Settings → Plan & Usage (extiende la UI de TASK-035), con estados de éxito ("Tenés acceso Pro hasta el 8 de septiembre de 2026") y error genérico.
- Indicador de "Pro promocional" con fecha de expiración en el resumen de plan y en Dashboard donde corresponda.
- Notificaciones de expiración de promoción vía TASK-047/049: recordatorios a 7/3/1 días antes del fin del grant, usando `PROMOTION_STARTED`/`PROMOTION_ENDING`/`PROMOTION_EXPIRED`, claramente distinguidas de notificaciones de suscripción paga.
- Admin UI mínima (`/admin/promotions`) para: listar códigos (code, status, duration, redeemed/max, redemption window, active grants), crear/editar código, activar/pausar/revocar código, otorgar/extender/revocar un grant manual con motivo obligatorio.
- Autorización server-side por rol (`SUPPORT` solo lectura, `ADMIN`/`SUPER_ADMIN` para mutaciones) reutilizando el framework de autorización de TASK-059.

## Out of Scope

- Campaign grouping UI, bulk code generation, influencer dashboards (post-MVP).
- Definición del framework de roles/autorización en sí (TASK-059).
- Discount/coupon UI (deferred).

## Domain Rules

- The UI never computes promotion duration, allowance, or eligibility; all outcomes come from `packages/promotions` application services.
- A promotion expiry notification is never labeled as a subscription/billing event.
- Admin actions that grant, extend, or revoke access always require an explicit reason and produce an audit entry (consumed by TASK-059's audit log).

## Implementation Notes

The redemption form posts only `code`; all other fields (duration, allowance, endsAt) come back from the server response and are rendered as-is. The admin promotions list and forms follow the dense, table-first admin style defined in `docs/21-commercial-admin.md` (reused by TASK-060's shared admin components once available, or implemented locally if TASK-060 has not landed yet).

## Expected Files

- `apps/web/src/features/promotions/components/`
- `apps/web/src/features/promotions/actions/redeem-promotion-code.ts`
- `apps/web/src/features/admin/promotions/`
- `packages/notifications/src/rules/promotion-expiry.ts`

## Database Changes

No new tables required; reuses TASK-053 schema.

## API / Application Services

- `redeemPromotionCodeAction` (Server Action wrapping `RedeemPromotionCode`)
- Admin Server Actions wrapping `PromotionService.createCode/updateCode/activateCode/pauseCode/revokeCode/extendGrant/revokeGrant/GrantPromotionalProAccess`

## UI Changes

- Settings → Plan & Usage: promo code input, applied-promotion state, expiry banner.
- `/admin/promotions`: list, create/edit form, grant management actions.

## Security Requirements

- Every admin Server Action re-validates role server-side; hidden buttons are not authorization.
- Promo redemption endpoint is rate-limited per user/IP (enforced in TASK-053, surfaced here via consistent error handling).
- Admin promotion mutations require authentication + role + reason where applicable.

## Financial Invariants

- UI never allows an admin to directly toggle a user's product access state; all changes go through grant/extend/revoke operations.
- Promotion UI never fabricates or displays a fake Mercado Pago subscription state.

## Error Cases

- Invalid/expired/exhausted code (generic user-facing message), already-active promotion, active-paid-subscription block, unauthorized admin action, missing reason on sensitive admin action.

## Acceptance Criteria

- [x] User can redeem a valid code from Settings and immediately sees Pro access with the promotional expiry date.
- [x] User cannot redeem an invalid/expired code; the message is generic and does not reveal code existence.
- [x] Expiry reminders are sent at 7/3/1 days before `ends_at`, distinct from billing notifications (`PROMOTION_ENDING`/`PROMOTION_EXPIRED`, category `ACCOUNT`, never `BILLING`).
- [ ] Admin can create, activate, pause, and revoke a promotion code; only authorized roles can perform mutations. **Deferred — see Notes.**
- [ ] Admin can manually grant, extend, and revoke a user's promotional access with a required reason. **Deferred — see Notes.**
- [ ] Non-admin users receive `NOT_FOUND`/`FORBIDDEN` when calling admin promotion Server Actions directly. **N/A — no admin Server Actions exist in this pass.**

## Tests Required

### Unit
- N/A for the redeem form specifically — this codebase has no React component-testing infrastructure anywhere (no `@testing-library`, no `.test.tsx` files exist in the repo); every other form/component in the codebase is verified via Playwright E2E only, not component unit tests. Followed that existing convention rather than introducing new test infra for one form. Pure logic (rule/domain/service layers) is fully unit tested: `tests/unit/promotion-expiry.test.ts` (8 cases).

### Integration
- [x] Redeem Server Action delegates entirely to `RedeemPromotionCode`; no duplicated business logic in the UI layer — `redeemPromotionCodeAction` only resolves session/IP/`hasActivePaidSubscription` and calls the domain function; verified by `tests/integration/notification-rules.test.ts`'s new promotion-expiry case exercising the real `evaluateFinancialAlerts` -> `createPromotionRepository` -> `evaluatePromotionExpiry` path, and `tests/integration/product-access-gate.test.ts`'s new case exercising `ProductAccessGate` -> `resolveProductAccessSource` with a real manual grant.
- N/A Admin grant/extend/revoke actions + audit entry — no admin Server Actions in this pass (see Notes).

### E2E
- [x] Full redemption flow: enter code → Pro access → expiry banner. (`tests/e2e/promotions.spec.ts`)
- N/A "reminder notification exists in notification center" as a browser step — the 7/3/1-day reminder timing can't be exercised by driving a browser in real time; covered instead by the integration test above plus the unit tests for `evaluatePromotionExpiry`'s exact thresholds.
- N/A Admin creates a code, user redeems it, admin revokes — no admin UI in this pass (see Notes).

### Security
- N/A SUPPORT/role-gated admin actions — no admin UI in this pass (see Notes).
- [x] Rate limiting is enforced before the repository is ever touched (inherited from TASK-053, surfaced here via `mapPromotionActionErrorToUi`'s `PROMOTION_REDEMPTION_RATE_LIMITED` message) — verified at the `RedeemPromotionCode` unit-test layer in TASK-053; this task adds the IP+userId key derivation in `redeemPromotionCodeAction` on top of it.

### Property / Invariant
- N/A audit entries — no admin mutations exist in this pass to audit (see Notes).

## Verification Commands
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`

## Definition of Done

Users can redeem promotional codes and see their promotional Pro status; authorized operators can manage promotion codes and grants end-to-end with auditable, role-gated actions.

## Notes

If TASK-059/TASK-060 (Commercial Admin core) land after this task, the `/admin/promotions` surface here is the first admin route and should follow the same authorization pattern that TASK-059 formalizes; align naming (`AdminDataTable`, `AdminActionDialog`, `AdminReasonField`) so TASK-060 can reuse these components rather than rebuild them.

**Scope narrowed with the user's explicit sign-off: `/admin/promotions` was not built in this pass.** The task's own Scope section requires role-based authorization (`SUPPORT` read-only, `ADMIN`/`SUPER_ADMIN` for mutations) "reutilizando el framework de autorización de TASK-059" plus an audit log "consumed by TASK-059's audit log" — but TASK-059 (the role/audit framework itself) is still `TODO` and, unlike TASK-058's single-boolean `actor.isAdmin` DI stub, there is no reasonably small stand-in here: a real admin panel needs both a role system AND a persisted audit trail, not one injected flag. Fabricating throwaway versions of both just to satisfy this task's Definition of Done would be more invented infrastructure than the actual admin UI is worth building twice. Given the choice, the user chose to ship only the user-facing surface now (redemption UI, promotional status indicator, expiry notifications) and defer `/admin/promotions` in full until TASK-059 lands and the admin UI can be built once, correctly, on real authorization — not TASK-058's narrower "add one DI parameter" pattern.

**A real bug in `ProductAccessResolver`'s consumers was fixed as part of this task, not just added-to.** Before this task, `apps/web/src/lib/billing/product-access-gate.ts` and `apps/web/src/features/billing/services/billing-page-service.ts` both called the plain `resolveProductAccess` without ever passing `activePromotion` — meaning a user with only a promotional grant (no trial, no paid subscription) would have been incorrectly resolved as `EXPIRED_READ_ONLY` everywhere: blocked from writes by `assertCanWrite`, and shown the "your trial ended" empty state on the billing page instead of their actual Pro access. Both were updated to fetch the user's active grant (`createPromotionRepository(db).findActiveGrantForUser`) and pass it through `resolveProductAccessSource`. The `promotions` dependency is optional on both factories (defaulting to "no active promotion") specifically so every pre-existing unit test that constructs these services without knowing about promotions keeps passing unchanged — only the two real app-layer wiring files (`product-access-gate.instance.ts`, the billing settings page) supply the real repository.

**`BillingPageView` gained `accessSource: ProductAccessSource` and `promotion: { endsAt: Date } | null`.** `access` (the existing `TRIAL`/`PRO`/`EXPIRED_READ_ONLY` field) is unchanged in meaning — a promotional user still shows `access: "PRO"` — but the UI needs to distinguish *why* to render "Pro promocional" instead of a real subscription's plan/price/cancel controls, hence the new `accessSource` field.

**`evaluateFinancialAlerts` gained a required `promotions: { findActiveGrantForUser }` dependency** (not optional, unlike the two gates above) since this factory has no other pre-existing callers outside this codebase's own instance wiring and two test files, both of which were updated directly rather than adding a default — keeping the dependency required means a future caller can't silently forget to wire promotion-expiry reminders in.

**Redemption rate limiting uses the in-memory limiter from `packages/promotions` (built in TASK-053), keyed separately by `user:<id>` and `ip:<address>`.** Like `packages/ai`'s existing rate limiter, this doesn't survive process restarts or work across multiple horizontally-scaled instances — an accepted, pre-existing tradeoff in this codebase (TASK-039/Railway deployment hardening is a separate, still-`TODO` task), not a new gap introduced here.

**New `NotificationType` values required touching every exhaustive `Record<NotificationType, ...>` map**, same pattern flagged repeatedly in TASK-050/051: `packages/db/src/schema.ts`'s `notification_type` enum (+ migration `0018_parallel_tyger_tiger.sql`), `packages/notifications/src/domain/types.ts`, `apps/web/src/features/notifications/lib/templates.ts` (in-app copy), and `packages/notifications/src/templates/email/templates.ts` (email copy, deliberately duplicated per that file's own existing convention). WhatsApp's template registry (`packages/notifications/src/templates/whatsapp/registry.ts`) is a whitelist, not an exhaustive record, so `PROMOTION_*` types were deliberately left out of V1 WhatsApp scope, matching how `TRIAL_STARTED`/`TRIAL_ENDING` etc. are also WhatsApp-absent today.
