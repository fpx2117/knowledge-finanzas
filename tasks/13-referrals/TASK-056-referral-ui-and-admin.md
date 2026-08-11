# TASK-056 — Implement user referral page, reward notifications and referral admin view

## Status
DONE

## Phase
Phase 13 — Referrals

## Priority
P3

## Depends On
- TASK-055
- TASK-047

## Source Documents
- docs/10.4-referrals-and-affiliates.md
- docs/07-ui-system.md
- docs/09-notifications-alerts.md

## Objective

Dar a los usuarios una página de referidos donde compartan su enlace y vean el estado de sus invitaciones/recompensas, y dar a operadores autorizados una vista de administración de referidos, consumiendo exclusivamente `packages/referrals` de TASK-055.

## Scope

- Settings → Referidos: enlace propio (`GetOrCreateReferralCode`), botón copiar enlace, resumen (`GetReferralSummary`: signups, converted, rewards, currentRewardPolicy).
- Estado por invitación mostrado de forma privacy-safe (ej. "Invitación 1 — Registrada", "Invitación 2 — Pro activado — Recompensa recibida"), sin exponer email/identidad completa del referido.
- Captura de `referral code` durante signup (query param `?ref=` o equivalente) que se pasa a `AttributeReferral` server-side.
- Notificaciones (IN_APP + EMAIL opcional, nunca WhatsApp por defecto) para: alguien se registró con tu enlace (opcional), tu invitación activó Pro y recibiste tu recompensa.
- Admin view (`/admin/referrals`): tabla referrer/referred/attribution date/status/conversion date/reward/reward status; acciones `Invalidate` (con reason) y `Retry Reward`; nunca "Mark Converted" manual sin mecanismo auditado.

## Out of Scope

- Affiliate self-service portal, leaderboards, multi-touch attribution UI (post-MVP).
- Definition of the admin authorization framework itself (TASK-059).

## Domain Rules

- The referral page never invents or estimates reward values; all figures come from `GetReferralSummary`.
- Referral status displayed to the referrer never exposes the referred user's email or financial data.
- Admin `Invalidate`/`Retry Reward` actions require server-side role authorization and produce an audit entry.

## Implementation Notes

Share the referral link component and privacy-safe status list rendering with the referral summary. The admin table follows the dense, table-first style shared with TASK-054/TASK-060.

## Expected Files

- `apps/web/src/features/referrals/components/`
- `apps/web/src/features/referrals/queries/get-referral-summary.ts`
- `apps/web/src/features/admin/referrals/`
- `packages/notifications/src/rules/referral-events.ts`

## Database Changes

No new tables required; reuses TASK-055 schema.

## API / Application Services

- `GetReferralSummary`
- Admin Server Actions wrapping `InvalidateReferral`/`RetryReferralReward`

## UI Changes

- Settings → Referidos page.
- `/admin/referrals` list and action dialogs.

## Security Requirements

- Referral summary query is scoped to the authenticated user; no cross-user referral data leak.
- Admin actions re-validate role server-side regardless of UI visibility.

## Financial Invariants

- Referral UI never grants access or credits directly; all rewards flow through TASK-055 application services.

## Error Cases

- No active referral code yet (auto-create on first view), invalid/foreign attribution ID on admin action, unauthorized admin action.

## Acceptance Criteria

- [x] User sees their own referral link and can copy it.
- [x] Referral summary reflects signups, conversions, and rewards from `GetReferralSummary` without client-side calculation.
- [x] Reward notification is sent once per granted reward and is distinct from billing notifications (`REFERRAL_REWARD_GRANTED`, deduped on the reward id, copy never mentions a subscription/payment).
- [x] Admin can invalidate a suspicious referral with a required reason and retry a failed reward idempotently.
- [x] Non-admin cannot access `/admin/referrals` or its Server Actions (same `requireAdminUser`/`AdminLayout` gate as every other `/admin/*` route — see task notes).

## Tests Required

### Unit
- [x] Referral status list rendering without exposing sensitive referred-user data.

### Integration
- [x] `GetReferralSummary` returns only the authenticated user's data.
- [x] Admin invalidate/retry actions call TASK-055 services and produce audit entries.

### E2E
- [x] Full flow: copy link → simulated referred signup/conversion → reward visible in referrer's summary and notification center. (Signup/attribution/REFERRAL_SIGNUP notification are the real end-to-end path; the conversion step is simulated by calling `HandleReferralConversion`/`GrantReferralReward` directly, since no live `PaidProActivated` trigger exists yet — see task notes.)

### Security
- [x] User A cannot query User B's referral summary via direct Server Action call. (`GetReferralSummary` is not a client-callable Server Action at all — it's an internal query the settings page calls server-side with `requireCurrentUser().id`, so there's no such call surface to begin with; the integration test proves the underlying scoping property directly.)
- [x] SUPPORT role cannot invalidate/retry rewards if the permission model restricts it to ADMIN. (Already covered by `tests/unit/admin-permissions.test.ts`, which explicitly asserts `referrals.invalidate` is SUPPORT-denied/ADMIN-granted — that permission key predates this task, from TASK-059.)

### Property / Invariant
- [x] Retry of an already-granted reward never grants a second reward.

## Verification Commands
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`

## Definition of Done

Users can share their referral link and track invitations/rewards; authorized operators can inspect, invalidate, and retry referral rewards end-to-end.

## Notes

Coordinate favicon/status vocabulary with TASK-054's promotion admin surface so `/admin` reads as one consistent system once TASK-059/TASK-060 land.

**Signup-time attribution wiring (scope decision, user-confirmed):** this repo has no dedicated
signup UI page yet — registration happens by POSTing directly to better-auth's
`/api/auth/sign-up/email` (the real onboarding UI is TASK-063/064, still `TODO`). To make
`?ref=` capture actually work today rather than deferring it entirely, a `signupReferralCode`
field was added to better-auth's `user.additionalFields` (`input: true`) and consumed from
`databaseHooks.user.create.after` in `packages/auth`, which calls `AttributeReferral` and fires
the `REFERRAL_SIGNUP` notification directly. This required two things not listed in Expected
Files: a new `users.signup_referral_code` column (the only way for better-auth to accept and
surface an extra signup-time input value to the hook) and `@know-finanzas/referrals`/
`@know-finanzas/notifications` as new `packages/auth` dependencies. A future onboarding signup
page (TASK-063/064) just needs to forward its `?ref=` query param into this same field.

**`REFERRAL_SIGNUP` is IN_APP-only, not IN_APP+EMAIL.** `packages/auth` sits below `apps/web` in
the dependency graph and cannot reach `apps/web`'s full `notifyUser` pipeline (product-access
resolution, EMAIL/WhatsApp provider wiring) from a `databaseHooks` callback. Since `ACCOUNT`
category notifications are always channel-entitled regardless of product access, the hook calls
`createCreateNotification` directly with `channelEntitlements` hardcoded to `IN_APP`/`REALTIME`
only — correct for this category, just missing the EMAIL leg an app-layer trigger would add.
`REFERRAL_REWARD_GRANTED`, by contrast, fires from `apps/web`'s admin Retry action and gets the
full IN_APP+EMAIL pipeline via `notifyUser`.

**`MAX_REFERRAL_PROMO_DAYS_AHEAD` is now actually wired**, closing the gap TASK-055 left as a
port-only contract: `apps/web/src/lib/referrals/referral-service.instance.ts`'s
`grantReferralPromotionalDays` composes `packages/promotions`' `PromotionService.extendGrant`
(when the referrer already has an active grant, capped via `cappedPromotionalDays`) with
`GrantPromotionalProAccess` (when they don't) — this is the apps/web wiring layer TASK-055's own
notes said this composition belonged at.

**No live reward-granting trigger exists yet.** Nothing in the codebase automatically calls
`HandleReferralConversion`/`GrantReferralReward` on a real `PaidProActivated` event (same gap
TASK-055 documented). In this task, a reward only ever actually grants through the admin
"Reintentar recompensa" action — which only appears once a reward already exists and is
`FAILED`. Since nothing yet drives a reward from `PENDING` to a first grant attempt either, the
E2E test simulates the conversion step by calling `HandleReferralConversion`/
`GrantReferralReward` directly, exactly as a future live trigger would.
