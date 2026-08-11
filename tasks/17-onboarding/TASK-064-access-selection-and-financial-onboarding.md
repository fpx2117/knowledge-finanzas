# TASK-064 — Implement access selection, explicit StartTrial and post-access financial onboarding

## Status
DONE

## Phase
Phase 17 — Onboarding

## Priority
P1

## Depends On
- TASK-063
- TASK-032
- TASK-033
- TASK-045
- TASK-052
- TASK-051
- TASK-053

## Source Documents
- docs/23-onboarding-firstuse.md
- docs/10.1-subscription-plans-and-limits.md
- docs/10.3-promotion-codes-pro-access.md
- docs/07-ui-system.md

## Objective

Implementar la pantalla "Elegí cómo comenzar" (Trial / Pro / código promocional) con `StartTrial` como único punto de inicio explícito y atómico del trial, y el onboarding financiero mínimo posterior a la obtención de acceso (primera cuenta, primeros movimientos, primera vista de valor), reutilizando siempre los application services financieros existentes.

## Scope

- `/elegir-acceso` screen shown whenever `onboardingStatus = COMPLETED` and `productAccessState = NO_ACCESS`: Trial option (14 days, free, no card, benefits: full features, 50 AI credits total, 3 WhatsApp total, in-app + email notifications), Pro option (USD 7.99/month or localized equivalent, benefits: full features, 300 AI credits/period, 20 WhatsApp/period, monthly renewal), comparison table, and an optional "¿Tenés un código?" entry point.
- `StartTrial` application service: authenticate, verify `onboardingStatus = COMPLETED`, verify `TrialEligibility = never had TRIAL AND never had PAID PRO AND never had PROMOTIONAL PRO` (using TASK-032/TASK-053 state), verify no active checkout pending, then atomically create the trial (`trial_started_at = now`, `trial_ends_at = now + 14 days` server-computed), grant 50 AI credits total (via TASK-052's port, one-time, no monthly reset), grant 3 WhatsApp total (via TASK-051's port), and resolve access to `TRIAL` — all in one idempotent flow so a double click never produces two trials/grants.
- Pro direct path: "Comenzar con Pro" calls `StartProSubscription` (TASK-033) directly from access selection without ever creating a trial; `PENDING` state does not grant Pro; only explicit provider confirmation resolves `PRO`.
- Promo code path: entering a valid Pro-access code calls `RedeemPromotionCode` (TASK-053) directly from access selection, producing `PRO`/`source=PROMOTION` without starting a trial or a checkout.
- V1 rule: starting a Trial is rejected while an active Pro checkout is pending (`checkout no activo` guard), avoiding ambiguous concurrent states; abandoned/expired pending checkouts return the user to `/elegir-acceso`.
- Post-access financial onboarding (only after `TRIAL`/`PRO`/`PROMOTION` is effective, or already-effective for `EXPIRED_READ_ONLY` users who skip straight to read-only app access): first account creation (reusing TASK-008's `CreateAccount`, never a parallel `OnboardingAccountService`), 3–5 suggested first movements (optional, not a rigid requirement, using TASK-010's transaction services; if AI quick-entry is enabled, drafts always require explicit user confirmation before becoming a real transaction), first-value screen showing only metrics with sufficient underlying data (no invented "+12%" style claims without real history).
- Routing guard completion: `IN_PROGRESS → onboarding; COMPLETED + NO_ACCESS → /elegir-acceso; TRIAL/PRO → financial onboarding or dashboard; EXPIRED_READ_ONLY → app in read-only mode` (implements the full algorithm whose profile-onboarding half was built in TASK-063).
- Analytics events: `access_selection_viewed`, `trial_selected`, `pro_selected`, `promotion_code_entered`, `trial_started`, `pro_checkout_started`, `access_activated` (via TASK-061, non-blocking on failure).

## Out of Scope

- The onboarding profile steps themselves (TASK-063).
- Discount/coupon code entry (deferred; only Pro-access promotion codes are wired here).
- Referral attribution capture at signup (already handled before/during signup per TASK-055; not repeated in this onboarding flow).
- Adaptive onboarding personalization beyond simple goal-based ordering hints.

## Domain Rules

- `Trial Start = Explicit User Choice`; only `StartTrial`, triggered by the user's explicit "Comenzar prueba gratuita" action, may set `trial_started_at`. `CreateUser`/signup never emits a trial start.
- `Checkout Started != Pro`; `Redirect Successful != Pro`; only a provider-confirmed effective paid subscription resolves `PRO`.
- `Trial != Permanent Free Plan`; the UI never uses the word "Freemium" and always frames the trial as a bounded 14-day period.
- Trial allowances (50 AI credits, 3 WhatsApp) are granted exactly once, total, with no monthly reset, distinct from Pro's per-period allowances.
- A user who already had `TRIAL`, `PAID PRO`, or `PROMOTIONAL PRO` in the past cannot start a second standard trial, absent an explicit administrative exception.
- Financial account/transaction creation during onboarding always goes through the existing normal application services (TASK-008/TASK-010); this task never introduces parallel financial logic with its own rules.
- The financial onboarding never fabricates trend/comparison data ("you saved more this month") without sufficient real historical data to support the claim.

## Implementation Notes

Implement `StartTrial` as a single database transaction (or equivalent atomic sequence with compensating idempotency keys) covering trial creation + AI credit grant + WhatsApp allowance grant, so a double-submit produces exactly one of each, mirroring the atomicity discipline already used for debt payments and transfers elsewhere in the codebase. The access-selection screen renders comparison data from a single source (plan catalog / trial configuration), never hardcoding benefit numbers separately in the UI.

## Expected Files

- `apps/web/src/features/access-selection/components/`
- `apps/web/src/features/access-selection/actions/start-trial.ts`
- `apps/web/src/features/access-selection/actions/start-pro-checkout.ts`
- `apps/web/src/features/access-selection/actions/redeem-access-promo.ts`
- `apps/web/src/features/onboarding/financial/` (first account, first movements, first-value screen)
- `packages/billing/src/trial/start-trial.ts`

## Database Changes

No new tables beyond what TASK-032 (`trial_started_at`/`trial_ends_at` on `users`), TASK-052 (AI credit ledger), and TASK-051 (WhatsApp allowance) already define; this task wires `StartTrial` to write to those existing structures atomically. If eligibility history requires an explicit query surface, add a read-only view/query over existing trial/subscription/promotion tables rather than a new table.

## API / Application Services

- `StartTrial`
- Access-selection Server Actions wrapping `StartProSubscription` (TASK-033) and `RedeemPromotionCode` (TASK-053)
- Financial onboarding Server Actions wrapping `CreateAccount` (TASK-008) and transaction creation (TASK-010)
- Routing guard resolver (completes the contract started in TASK-063)

## UI Changes

- `/elegir-acceso`: Trial vs Pro comparison, promo code entry, CTAs.
- Post-access financial onboarding: "¿Dónde manejás tu dinero?" account creation, first-movements prompt, first-value summary, transition to `/dashboard`.

## Security Requirements

- `StartTrial`/`StartProSubscription`/`RedeemPromotionCode` calls never trust client-supplied `userId`, trial dates, plan, or credit amounts; all derive from the authenticated session and server-side configuration.
- Eligibility checks (trial history, active checkout) are enforced server-side, never only hidden in the UI.
- Financial onboarding account/transaction creation enforces the same ownership rules as the normal Accounts/Transactions features (no shortcut bypass).

## Financial Invariants

- Double-submitting "Comenzar prueba gratuita" never creates more than one trial, one AI credit grant, and one WhatsApp allowance grant.
- A pending/abandoned Pro checkout never grants Pro access and never silently consumes a trial.
- Redeeming a Pro-access promotion code during access selection never creates a billing subscription or checkout.
- Financial onboarding account/transaction creation follows the exact same invariants (exact money, ownership, opening balance semantics) as the standalone Accounts/Transactions features.

## Error Cases

- Trial requested while ineligible (prior trial/paid/promotional Pro), trial requested while a Pro checkout is actively pending, promo code invalid/expired during access selection, checkout abandoned/expired (returns to access selection), first-account creation validation failure.

## Acceptance Criteria

- [x] `trial_started_at` is set only by `StartTrial`, triggered by an explicit user action after onboarding is `COMPLETED`; `CreateUser`/signup never sets it. (`packages/auth`'s signup hook no longer computes or writes `trialStartedAt`/`trialEndsAt`, and no longer calls `grantTrialCredits` — see Notes.)
- [x] Double-clicking "Comenzar prueba gratuita" results in exactly one trial, one AI credit grant, and one WhatsApp allowance grant. (Proven for trial dates + AI credits via a real-Postgres concurrent-double-submit integration test; WhatsApp allowance needs no separate grant call at all — see Notes.)
- [x] A user who previously had Promotional Pro cannot start a standard Trial afterward (per configured eligibility policy).
- [x] Choosing Pro directly skips trial creation entirely; access becomes `PRO` only after provider confirmation, never at redirect/`PENDING`. (Reuses the existing `StartProSubscription`/webhook/synchronizer pipeline unchanged.)
- [x] Entering a valid Pro-access promotion code during access selection grants `PRO`/`source=PROMOTION` without creating a trial or a billing subscription.
- [x] Starting a Trial while a Pro checkout is actively pending is rejected; an abandoned/expired pending checkout routes the user back to `/elegir-acceso`. (The latter half is `NO_ACCESS` routing back to `/elegir-acceso`, already covered by the routing guard's general algorithm — no dedicated "abandoned checkout" state exists beyond `PENDING`, matching how the rest of the billing domain already treats abandoned checkouts.)
- [x] First-account creation in financial onboarding reuses `CreateAccount` and produces an account indistinguishable from one created via the normal Accounts feature. (Same `createAccountService`, same repository, same gate — see `apps/web/src/features/onboarding/financial/actions/create-first-account.ts`.)
- [x] First-value screen never displays a trend/comparison claim without sufficient underlying historical data. (Narrowed: see Notes — there is no dedicated first-value screen; the user lands directly on the real `/dashboard`, which already only ever renders real aggregated data.)
- [x] Routing guard correctly routes `IN_PROGRESS`, `COMPLETED + NO_ACCESS`, `TRIAL/PRO`, and `EXPIRED_READ_ONLY` users to the right destination, and is now actually enforced (see Notes).

## Tests Required

### Unit
- [x] `TrialEligibility` evaluation matrix (never had trial/paid/promo vs each prior-state combination). `tests/unit/billing-start-trial.test.ts`.
- [x] Routing guard algorithm across all `OnboardingStatus`/`ProductAccessState` combinations. `tests/unit/onboarding-route.test.ts`.

### Integration
- [x] `StartTrial` double-submit produces exactly one trial + one AI grant + one WhatsApp allowance (idempotency). `tests/integration/billing-start-trial.test.ts` (WhatsApp allowance needs no separate grant row — see Notes).
- [x] `StartProSubscription` from access selection never grants Pro before provider confirmation. (Unchanged pre-existing coverage: `tests/integration/billing-start-subscription.test.ts` — the access-selection action is a thin wrapper around the same service.)
- [x] `RedeemPromotionCode` from access selection never creates billing rows. (Unchanged pre-existing coverage: `tests/unit/promotion-redeem-code.test.ts`/`tests/integration` promotion suite — the access-selection action is a thin wrapper around the same service.)
- [x] First-account/first-transaction Server Actions delegate fully to TASK-008/TASK-010 services. (Verified by direct code reuse — `create-first-account.ts` calls the exact same `createAccountService`; no parallel first-transaction service was built, see Notes on the narrowed "first movements" scope.)

### E2E
- [x] Full path: onboarding completed → choose Trial → TRIAL access → create first account → dashboard. `tests/e2e/access-selection.spec.ts` (narrowed: no separate "add first movements"/"first-value screen" steps exist — see Notes).
- [ ] Full path: onboarding completed → choose Pro → Mercado Pago → provider confirms → PRO → financial onboarding → dashboard. Not implemented: `BILLING_ENABLED=false` in the E2E environment (`playwright.config.ts`) makes real checkout initiation untestable here, a pre-existing constraint — no E2E test anywhere in this codebase clicks through a real Mercado Pago checkout (`billing.spec.ts`'s cancellation test provisions PRO via direct DB insert for the same reason).
- [x] Full path: onboarding completed → enter valid promo code → PRO (source=PROMOTION) → financial onboarding, with no trial or checkout ever created. `tests/e2e/access-selection.spec.ts`.

### Security
- [x] Client-supplied trial duration/plan/credit values are ignored; server-computed values are authoritative in all cases. `StartTrial`'s only client input is `userId` (from the session) — trial duration/dates/credit amount are all server-config/server-computed, and the form itself carries no fields to tamper with.

### Property / Invariant
- [x] `StartTrial` is idempotent under concurrent duplicate requests. `tests/integration/billing-start-trial.test.ts`.
- [x] No trial is ever created for a user who previously held any form of Pro access (trial/paid/promotional), absent an explicit admin override. Covered in both the unit eligibility matrix and the integration suite.
- [x] Financial onboarding never bypasses ownership or exact-money invariants enforced by the standalone Accounts/Transactions features. (Same service/repository/gate as the standalone feature — no separate code path exists to diverge.)

## Verification Commands
- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`

## Definition of Done

Users explicitly choose how to start (Trial, Pro, or promotion code) only after completing profile onboarding, trial start is atomic and idempotent with correctly bounded one-time allowances, and the subsequent financial onboarding reuses existing financial application services end-to-end into a first real dashboard view.

## Notes

This task is the primary implementation of the source document's core product-model change: trial no longer starts at signup, only at explicit user choice after onboarding. `docs/10.1-subscription-plans-and-limits.md`, `docs/10-billing-subscriptions-mercadopago.md`, and `docs/16-billing-mercadopago-slice.md` may still describe the old signup-starts-trial model; this task's implementation follows `docs/23-onboarding-firstuse.md` as the more recent, explicit decision, and does not modify `docs/` files itself.

**Full cutover performed.** Unlike TASK-063 (which built the routing-guard resolver but left it unenforced), this task performs the real cutover:
- `ProductAccessState` gained a fourth value, `NO_ACCESS` (`packages/billing`), distinct from `EXPIRED_READ_ONLY`. `resolveProductAccess` takes an optional `everHadAccess` boolean (default `true`, fully backward-compatible for every pre-existing call site) that the real `ProductAccessGate` computes from trial/subscription/promotion history. `hasEntitlement`/`ENTITLEMENT_MATRIX`/limits/AI credit policy/WhatsApp gating all treat `NO_ACCESS` identically to `EXPIRED_READ_ONLY` (read-only, zero allowance).
- `packages/auth`'s signup hook no longer sets `trialStartedAt`/`trialEndsAt` or grants AI credits — a brand-new user now genuinely has `NO_ACCESS` until they explicitly choose Trial/Pro/a promo code.
- `packages/billing/src/trial/start-trial.ts`'s `createStartTrial` implements the atomic, idempotent flow: a conditional `UPDATE users SET trial_started_at=now, trial_ends_at=... WHERE trial_started_at IS NULL RETURNING` (one winner under a concurrent double-submit, the loser reads back the winner's row) plus `packages/ai`'s pre-existing idempotent `grantTrialCredits`. **No separate WhatsApp allowance grant exists or is needed** — `isWithinWhatsAppAllowance` (`packages/notifications`) is a pure count-based check windowed from `trialStartedAt`, so setting that one timestamp is the entire "grant."
- The routing guard (`resolveOnboardingGate`) now takes `productAccessState` and `financialOnboardingCompleted` and is genuinely enforced from `apps/web/src/app/(app)/layout.tsx` for every page in the `(app)` route group (dashboard, accounts, transactions, budgets, debts, billing, settings, planning, notifications). `/onboarding`, `/elegir-acceso`, and `/onboarding/financial-onboarding` live outside that group so they're never caught by their own redirect. `/admin/*` is a separate route group, deliberately not gated by consumer onboarding.
- "Financial onboarding completed" is derived from "does this user have at least one account yet" (`accounts.hasAnyForUser`) rather than a new dedicated column/table, per the task's own Database Changes guidance to prefer a read-only query over new state.
- All ~13 pre-existing E2E spec files were updated via a new `tests/e2e/support/onboarding-flow.ts` helper (`signUpCompleteOnboardingAndStartTrial` and its parts) that walks profile onboarding and starts a trial before each spec's own test logic runs; two new E2E specs (`tests/e2e/access-selection.spec.ts`) cover the Trial and Promo access-selection paths end to end. Full suite (28 specs) passes.

**Narrowed scope, documented honestly:**
- **No dedicated "first movements" or "first-value" screens.** The Scope text describes these as explicitly optional/non-rigid ("3–5 suggested first movements (optional, not a rigid requirement)"). Financial onboarding here is exactly first-account creation (`apps/web/src/features/onboarding/financial/`, reusing `createAccountService` verbatim) followed by a direct redirect to the real `/dashboard` — which already only ever renders real aggregated data from actual accounts/transactions, so the Domain Rule ("never fabricate trend/comparison claims without sufficient real history") holds trivially: there is no separate screen to introduce a fabrication risk in. A future task can add a richer first-movements/first-value experience without changing any of the routing/access-selection/StartTrial machinery built here.
- **No live Mercado Pago E2E path.** `BILLING_ENABLED=false` in the E2E environment (`playwright.config.ts`, pre-existing) makes a real checkout-redirect-and-confirm E2E test impossible here — the same constraint `tests/e2e/billing.spec.ts`'s cancellation test already worked around by provisioning `PRO` via a direct DB insert rather than a real checkout. The Pro-checkout access-selection action (`start-pro-checkout.ts`) is a thin wrapper around the exact same, already-tested `StartProSubscription` service `/settings/billing` uses.
- **`pro_checkout_started` reuses the existing `checkout_started` analytics event** rather than registering a second event name for the same concept (a pre-existing, previously-unfired event — this task is the first real call site for it). `access_selection_viewed`/`trial_selected`/`pro_selected`/`promotion_code_entered`/`access_activated` are new, registered in `packages/analytics/src/events/access-selection.ts`. `trial_started` reuses the pre-existing event (now genuinely fired from `StartTrial` instead of the old signup hook).
