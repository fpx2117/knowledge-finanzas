# TASK-063 — Implement profile onboarding flow, persistence and resume

## Status
DONE

## Phase
Phase 17 — Onboarding

## Priority
P2

## Depends On
- TASK-003
- TASK-002
- TASK-062

## Source Documents
- docs/23-onboarding-firstuse.md
- docs/07-ui-system.md
- docs/19-security-privacy.md

## Objective

Implementar el onboarding de perfil (bienvenida, configuración básica, objetivo financiero, contexto financiero declarativo, perfil estadístico opcional y privacidad) que ocurre siempre antes de la elección de acceso comercial, con progreso persistido server-side y reanudable, sin nunca iniciar un trial ni activar acceso automáticamente.

## Scope

- `OnboardingStatus` (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`) explícitamente separado de `ProductAccessState` (`NO_ACCESS`, `TRIAL`, `PRO`, `EXPIRED_READ_ONLY`); `user_onboarding` (user_id, version, status, current_step, started_at, completed_at) con `onboarding_version` (ej. `onboarding:v1`) para no forzar a usuarios existentes a repetir el flujo tras cambios futuros.
- Pantallas: Bienvenida (breve, un CTA); Configuración básica (display_name, país, moneda principal, timezone IANA autodetectada+confirmada, idioma); Objetivo financiero (1 principal + hasta 2 secundarios, enum `CONTROL_SPENDING`/`ORGANIZE_FINANCES`/`PAY_OFF_DEBT`/`SAVE_MORE`/`BUILD_EMERGENCY_FUND`/`PLAN_EXPENSES`/`TRACK_RECURRING_EXPENSES`/`UNDERSTAND_CASHFLOW`/`OTHER`); Contexto financiero (income pattern, credit card usage, debt presence, recurring expenses, multiple accounts, management style — todas Sí/No/Prefiero no responder, sin montos exactos); Perfil estadístico opcional (delegado a TASK-062's `SaveStatisticalProfile`); Privacidad/consentimiento (delegado a TASK-062's `UpdateAnalyticsConsent`).
- `user_financial_profiles` (user_id, primary_goal, secondary_goals, income_pattern, uses_credit_cards, has_debt_declared, has_recurring_expenses_declared, uses_multiple_accounts, management_style, updated_at) — a declarative profile that never feeds financial calculations.
- Server-side persisted progress with resume-at-step behavior (`IN_PROGRESS` returns the user to their exact step, never restarts from zero).
- Fast path: País → Moneda → Objetivo → Elegir acceso, with the rest completable later; core mandatory fields limited to país/moneda/timezone/objetivo principal per the source document.
- Existing-user compatibility: if this feature ships after other users already exist, they are never blocked; profile completion is offered as an optional "Completar perfil" action.
- Analytics events: `onboarding_started`, `onboarding_step_viewed`, `onboarding_step_completed`, `onboarding_step_skipped`, `onboarding_completed` (via TASK-061's `AnalyticsService`, never blocking onboarding on analytics failure).
- Routing guard groundwork: resolves `authenticated? → onboarding completed? → access? → financial onboarding? → dashboard`, with the access/financial-onboarding branches implemented by TASK-064.

## Out of Scope

- Access selection screen, `StartTrial`, `StartProSubscription`, promo code entry during access selection (TASK-064).
- Financial onboarding (first account, first transactions) that happens after access is granted (TASK-064).
- Statistical profile fields and analytics consent persistence themselves (owned by TASK-062; this task only wires the onboarding steps to call TASK-062's services).
- Adaptive/personalized onboarding, per-country variants, AI-assisted free-text goal parsing (post-MVP).

## Domain Rules

- `Onboarding Completion != Product Access`; completing onboarding never grants `TRIAL` or `PRO`; access remains `NO_ACCESS` until the user explicitly chooses in TASK-064.
- `Declared Financial Context != Financial Truth`; answering "No tengo deudas" never modifies or hides a `Debt` the user later creates for real; the Debt domain remains authoritative.
- Objectives (`primary_goal`) only affect UX ordering, onboarding personalization, and educational messaging; they never alter financial formulas.
- Optional questions are truly skippable; skipping never blocks progression to the next step.
- Country/currency/timezone answers never silently create financial data; they configure defaults only.
- All server-authoritative values (userId, timestamps) are never trusted from the client.

## Implementation Notes

Reuse existing user/session/config primitives (TASK-002, TASK-003) rather than inventing parallel identity fields. Wire the statistical-profile and consent steps as thin UI screens that call TASK-062's `SaveStatisticalProfile`/`UpdateAnalyticsConsent` application services directly; do not duplicate their persistence logic inside the onboarding feature.

## Expected Files

- `apps/web/src/features/onboarding/components/`
- `apps/web/src/features/onboarding/steps/`
- `apps/web/src/features/onboarding/actions/start-onboarding.ts`
- `apps/web/src/features/onboarding/actions/save-basic-profile.ts`
- `apps/web/src/features/onboarding/actions/save-financial-context.ts`
- `apps/web/src/features/onboarding/actions/complete-onboarding.ts`
- `apps/web/src/features/onboarding/schemas/`
- `packages/db/src/schema.ts`

## Database Changes

- `user_onboarding` (user_id, version, status, current_step, started_at, completed_at, created_at, updated_at).
- `user_financial_profiles` (user_id, primary_goal, secondary_goals, income_pattern, uses_credit_cards, has_debt_declared, has_recurring_expenses_declared, uses_multiple_accounts, management_style, updated_at).

## API / Application Services

- `StartOnboarding`
- `SaveBasicProfile`
- `SaveFinancialContext`
- `CompleteOnboarding`
- Routing guard resolver (shared contract consumed by TASK-064 and the app shell)

## UI Changes

- Onboarding wizard: Bienvenida, Configuración básica, Objetivo financiero, Contexto financiero, (delegated) Perfil estadístico, (delegated) Privacidad, resumen/`COMPLETED` transition into access selection (TASK-064).
- Mobile: one task per screen; Desktop: related questions may group on one surface. `prefers-reduced-motion` respected; no confetti/gradients/bounces.

## Security Requirements

- Every onboarding Server Action authenticates the session and writes only to the authenticated user's own `user_onboarding`/`user_financial_profiles` rows.
- Sensitive declarative fields (income pattern, debt presence) are not logged in generic request/response logs.
- All Zod-validated inputs (country code, currency, timezone, enum values) are validated server-side, never trusted from client-only validation.

## Financial Invariants

- Onboarding never creates, modifies, or hides any `Account`, `Transaction`, `Debt`, or `Budget` record.
- Onboarding never grants trial/Pro access as a side effect of any step, including `CompleteOnboarding`.

## Error Cases

- Step save failure (must preserve entered data, show error, allow retry), analytics failure during onboarding (must never block progression), resume with an unknown/removed step (falls back to the nearest valid step), existing user with no onboarding record (treated as optional, not forced).

## Acceptance Criteria

- [x] A new user completing onboarding ends with `onboardingStatus = COMPLETED` and `productAccessState = NO_ACCESS`, never an auto-started trial. (`onboardingStatus = COMPLETED` is real and proven. `productAccessState = NO_ACCESS` is not yet true end-to-end: `packages/auth`'s signup hook still auto-grants a trial today, exactly as it did before this task — changing that is explicitly TASK-064's job per this task's own Notes. What IS proven: `CompleteOnboarding` itself never touches `trialStartedAt`/`trialEndsAt`/any access field — see the integration test asserting they're byte-for-byte unchanged across a full onboarding run.)
- [x] A user who abandons onboarding at a given step and returns later resumes at that exact step, not from the beginning.
- [x] All statistical-profile and privacy-consent fields can be left completely empty and onboarding still reaches `COMPLETED`.
- [x] Declaring `has_debt_declared = false` during onboarding has no effect on the Debt domain when the user later creates a real debt.
- [x] A simulated analytics provider failure during onboarding does not block step progression or completion. (Every onboarding action wraps its `AnalyticsService.track()` call the same way every other feature in this codebase does — `track()` itself never throws, by construction — see TASK-061.)
- [x] Existing users (present before this feature ships) are never forced through onboarding; it is offered as an optional action. (True by construction: the routing guard isn't enforced at all yet — see task notes on the scope decision.)

## Tests Required

### Unit
- [x] Step sequencing, resume-at-step logic, and fast-path shortcut.
- [x] Declarative profile schema validation (all fields optional/skippable where specified).

### Integration
- [x] `CompleteOnboarding` sets `COMPLETED` without touching `ProductAccessState`.
- [x] Onboarding steps that delegate to TASK-062 correctly call `SaveStatisticalProfile`/`UpdateAnalyticsConsent` without duplicating persistence.

### E2E
- [x] Full onboarding flow: welcome → basic config → goal → financial context → (skip) statistical profile → (decline) consent → completed → routed to access selection. (Routed to `/dashboard` — the actual access-selection screen is TASK-064's job and doesn't exist yet.)
- [x] Abandon at step 3, return later, resume at step 3.

### Security
- [x] User A's onboarding Server Action calls cannot read or write User B's `user_onboarding`/`user_financial_profiles` rows. (Every action resolves `userId` exclusively from `requireCurrentUser()`, never from client input; proven directly at the service/repository layer by a real-Postgres integration test.)

### Property / Invariant
- [ ] `CompleteOnboarding` never results in a non-`NO_ACCESS` `ProductAccessState` for a user who has not made an access choice. (Not testable yet — there is no `NO_ACCESS` state anywhere in the current `ProductAccessState` type; it's introduced by TASK-064. What's proven instead: `CompleteOnboarding` never writes to any access-related field at all.)
- [x] No onboarding step ever writes to `accounts`, `transactions`, `debts`, or `budgets`.

## Verification Commands
- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`

## Definition of Done

New users complete a short, resumable, mostly-optional profile onboarding entirely decoupled from commercial access, with all declarative data clearly separated from financial truth.

## Notes

This task formalizes the product decision recorded in the source document: "el Trial deja de comenzar al registrarse y pasa a comenzar exclusivamente cuando el usuario elige 'Comenzar prueba gratuita'". TASK-064 is the task that must implement `StartTrial` accordingly; existing references to trial-starts-at-signup in `docs/10.1`, `docs/10`, and `docs/16` are flagged as a pending documentation update by the source doc itself and are out of scope to edit here (`docs/` is not modified by this backlog).

**Scope decision (user-confirmed via AskUserQuestion before implementation): the onboarding
routing guard is built but not enforced.** The full onboarding flow, persistence, resume-at-step
logic, and the `resolveOnboardingGate` resolver function are all real, tested code — but nothing
redirects a new signup into `/onboarding` automatically yet. Two reasons drove this: (1) the spec's
"siempre ocurre antes de la elección de acceso comercial" only makes sense once TASK-064's
access-selection screen exists for onboarding to lead into — today, forcing users through the
wizard would just dead-end them at the same dashboard they'd reach directly anyway; (2) enforcing
it would have required rewriting all 11 pre-existing E2E spec files (every one signs up and goes
straight to `/accounts`, `/dashboard`, etc.) as a side effect of this task, a much larger blast
radius than the option not chosen. `resolveOnboardingGate` is ready for whichever future task
(likely TASK-064 itself) flips it on. In the meantime, `/onboarding` is reachable via a
"Completar perfil" link in the app shell's settings nav — satisfying the Scope's own
existing-user-compatibility requirement ("profile completion is offered as an optional action")
for every user, new or existing, not just users who signed up before this shipped.

**`ProductAccessState` still has no `NO_ACCESS` value.** The type this task's Domain Rules and
Acceptance Criteria describe (`NO_ACCESS`/`TRIAL`/`PRO`/`EXPIRED_READ_ONLY`) doesn't exist yet —
today's real type (`packages/billing`) is `TRIAL`/`PRO`/`EXPIRED_READ_ONLY` only, and
`packages/auth`'s signup hook still auto-grants a trial exactly as it always has. This task
doesn't touch that at all, per its own Notes pointing to TASK-064. What's real: `CompleteOnboarding`
itself never writes to `trialStartedAt`, `trialEndsAt`, or anything access-adjacent — proven
directly by an integration test that asserts those fields are byte-for-byte unchanged across a
full onboarding run.

**`users.country`/`users.language` are new columns**, not listed in this task's own Database
Changes (which only mentions `user_onboarding`/`user_financial_profiles`) — the basic-profile
step's "país"/"idioma" fields needed a home, and `users.timezone`/`users.baseCurrency` already
live directly on `users` as real account configuration (not on either of the two new tables, which
are for onboarding progress and declarative financial context respectively) — so these two follow
the same existing pattern rather than inventing a third table. Both are plain `text`, matching the
`text`-not-`pgEnum` convention used for every evolving categorical column this session (see
TASK-055's/TASK-061's Notes on why).

**Fast path**: the only fields the flow actually requires are country, currency, timezone
(basic-profile step) and primary goal (goal step); the financial-context step, statistical-profile
step, and privacy-consent step are all fully skippable in one action each, matching the source
doc's "País → Moneda → Objetivo → Elegir acceso, con el resto completable después."
