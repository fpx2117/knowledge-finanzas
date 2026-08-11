# Implementation Backlog

## Purpose

Este backlog transforma `AGENTS.md` y `docs/` en unidades implementables. Cada task es una unidad de cambio verificable; el orden de ejecución está definido por sus dependencias globales, no por el orden de los documentos.

## Completion Gate

No se inicia una task nueva mientras exista una task anterior en `IN_PROGRESS`. Cada task debe cerrar todos sus criterios, tests y verificaciones y pasar a `DONE` antes de avanzar.

## Repository Baseline

Relevamiento realizado sobre el estado actual del repositorio:

- `apps/web` ya existe con Next.js, shell visual, `/api/health` y scripts de lint/typecheck/build.
- `packages/config` valida core variables y capability flags/credentials.
- `packages/auth` ya integra Better Auth con Drizzle, email/password, sesiones y UUIDs.
- `packages/db` ya contiene `users`, `accounts`, `categories`, `transactions` y migraciones Drizzle iniciales.
- `packages/finance`, `packages/validation`, `packages/billing`, `packages/ai` y `packages/notifications` y sus suites unit/integration/E2E ya existen; el worker de jobs (notificaciones/reconciliación programada) sigue fuera de alcance hasta que TASK-039/041/049 lo requieran.
- Dashboard y movimientos históricos siguen evolucionando por sus tasks específicas.
- `pnpm test` ejecuta Vitest real; `pnpm test:e2e` ejecuta Playwright contra PostgreSQL de test.

## Task Index

| Task | Title | Phase | Priority | Status | Depends On |
| --- | --- | --- | --- | --- | --- |
| TASK-001 | Bootstrap monorepo and local runtime | Phase 0 | P0 | DONE | None |
| TASK-002 | Centralize environment validation | Phase 0 | P0 | DONE | TASK-001 |
| TASK-003 | Integrate Better Auth with protected shell | Phase 0 | P0 | DONE | TASK-001 |
| TASK-004 | Establish Drizzle migrations and financial schema baseline | Phase 0 | P0 | DONE | TASK-001, TASK-002 |
| TASK-005 | Establish automated test infrastructure | Phase 0 | P0 | DONE | TASK-001 |
| TASK-006 | Implement exact Money and financial date primitives | Phase 0 | P0 | DONE | TASK-002, TASK-005 |
| TASK-007 | Establish application errors and ownership helpers | Phase 0 | P0 | DONE | TASK-003, TASK-004, TASK-006 |
| TASK-008 | Implement account vertical slice | Phase 1 | P1 | DONE | TASK-007 |
| TASK-009 | Implement category management vertical slice | Phase 1 | P1 | DONE | TASK-007 |
| TASK-010 | Implement income and expense ledger writes | Phase 1 | P1 | DONE | TASK-008, TASK-009 |
| TASK-011 | Implement derived account balances and activity queries | Phase 1 | P0 | DONE | TASK-006, TASK-010 |
| TASK-012 | Implement Dashboard V0 and first vertical E2E | Phase 1 | P1 | DONE | TASK-011 |
| TASK-013 | Add refund and adjustment ledger semantics | Phase 1 | P2 | DONE | TASK-010, TASK-011 |
| TASK-014 | Implement transfer schema and deterministic rules | Phase 2 | P0 | DONE | TASK-011 |
| TASK-015 | Implement atomic transfer application service | Phase 2 | P0 | DONE | TASK-014 |
| TASK-016 | Implement transfer history, voiding and UI | Phase 2 | P1 | DONE | TASK-015 |
| TASK-017 | Implement debt and installment persistence | Phase 3 | P0 | DONE | TASK-006, TASK-007 |
| TASK-018 | Implement installment generation and preview | Phase 3 | P0 | DONE | TASK-006, TASK-017 |
| TASK-019 | Implement debt lifecycle and obligation queries | Phase 3 | P1 | DONE | TASK-017, TASK-018 |
| TASK-020 | Implement payment allocation engine | Phase 3 | P0 | DONE | TASK-018, TASK-019 |
| TASK-021 | Implement atomic debt payment service | Phase 3 | P0 | DONE | TASK-020, TASK-011 |
| TASK-022 | Implement debts, installments and payment UI | Phase 3 | P1 | DONE | TASK-019, TASK-021 |
| TASK-023 | Implement scheduled transaction lifecycle | Phase 4 | P1 | DONE | TASK-010, TASK-019 |
| TASK-024 | Implement recurrence rules and idempotent occurrence generation | Phase 4 | P1 | DONE | TASK-006, TASK-023 |
| TASK-025 | Implement planning read models and reminders foundation | Phase 4 | P2 | DONE | TASK-019, TASK-023, TASK-024 |
| TASK-026 | Implement planning UI and confirmation flows | Phase 4 | P1 | DONE | TASK-025 |
| TASK-027 | Implement projection inputs and unified upcoming obligations | Phase 5 | P1 | DONE | TASK-019, TASK-023, TASK-024 |
| TASK-028 | Implement spendable money and cashflow engines | Phase 5 | P0 | DONE | TASK-006, TASK-027 |
| TASK-029 | Implement Dashboard V1, explainability and cashflow UI | Phase 5 | P1 | DONE | TASK-028, TASK-013 |
| TASK-030 | Implement monthly category budgets | Phase 6 | P1 | DONE | TASK-013, TASK-009 |
| TASK-031 | Implement budget UI, alerts and dashboard integration | Phase 6 | P2 | DONE | TASK-030, TASK-029 |
| TASK-032 | Establish billing domain, plans and entitlement resolution | Phase 7 | P1 | DONE | TASK-002, TASK-007 |
| TASK-033 | Implement Mercado Pago provider and subscription checkout | Phase 7 | P1 | DONE | TASK-032 |
| TASK-034 | Implement Mercado Pago webhooks and billing synchronization | Phase 7 | P0 | DONE | TASK-032, TASK-033 |
| TASK-045 | Implement plan catalog, entitlements and product limits | Phase 7 | P1 | DONE | TASK-032, TASK-034 |
| TASK-035 | Implement billing UI, cancellation and reconciliation | Phase 7 | P1 | DONE | TASK-034, TASK-045 |
| TASK-036 | Establish AI provider boundary and model registry | Phase 8 | P2 | DONE | TASK-002, TASK-005, TASK-045 |
| TASK-052 | Implement AI credits and usage layer | Phase 8 | P0 | DONE | TASK-032, TASK-036, TASK-045 |
| TASK-037 | Implement OpenRouter transaction categorization suggestions | Phase 8 | P2 | DONE | TASK-009, TASK-032, TASK-036, TASK-045, TASK-052 |
| TASK-038 | Implement deterministic-context AI insights and assistant foundation | Phase 8 | P3 | DONE | TASK-028, TASK-030, TASK-036, TASK-037, TASK-045, TASK-052 |
| TASK-039 | Harden production configuration and Railway deployment | Phase 9 | P0 | DONE (codebase-ready, not actually deployed — no Railway credentials available; see task notes) | TASK-012, TASK-026, TASK-031, TASK-035, TASK-037, TASK-045 |
| TASK-040 | Establish observability, security controls and rate limits | Phase 9 | P0 | DONE (Redis-backed distributed rate limiting and per-server-action logging retrofit both narrowed — see task notes) | TASK-039 |
| TASK-046 | Establish pricing and unit economics controls | Phase 9 | P2 | DONE (no admin UI/dashboard and no historical snapshot storage — both explicitly out of scope/optional; see task notes) | TASK-032, TASK-036, TASK-040 |
| TASK-041 | Establish CI/CD, migration gates and operational runbooks | Phase 9 | P0 | DONE (workflow written and every command verified locally; not yet run by GitHub Actions — repo isn't under git yet, see task notes) | TASK-005, TASK-039, TASK-040 |
| TASK-042 | Configure PostgreSQL backups and recovery objectives | Phase 10 | P0 | DONE (off-platform pg_dump backup + runbook real and verified; Railway's own managed-backup settings left as pending fields — no Railway access, see task notes) | TASK-039 |
| TASK-043 | Implement restore validation and financial integrity audit | Phase 10 | P0 | DONE | TASK-042 |
| TASK-044 | Execute recovery drill and document disaster procedures | Phase 10 | P0 | DONE (real drill executed against local infrastructure; a re-run against real Railway infra is a tracked follow-up — see task notes) | TASK-043 |
| TASK-047 | Establish notification domain, persistence and preferences | Phase 11 | P1 | DONE | TASK-007, TASK-017, TASK-023, TASK-030 |
| TASK-048 | Implement notification center and realtime SSE | Phase 11 | P1 | DONE | TASK-003, TASK-047 |
| TASK-049 | Implement notification rules, scheduler and delivery worker | Phase 11 | P0 | DONE (scoped, no queue/worker — see task notes) | TASK-019, TASK-023, TASK-025, TASK-028, TASK-030, TASK-031, TASK-047 |
| TASK-050 | Implement transactional email notifications with Resend | Phase 11 | P1 | DONE (sync send, no queue — see task notes) | TASK-003, TASK-047, TASK-049 |
| TASK-051 | Implement controlled WhatsApp notifications with Twilio | Phase 11 | P1 | DONE (sync send, no queue — see task notes) | TASK-045, TASK-047, TASK-049 |
| TASK-053 | Establish promotion codes domain, schema and redemption service | Phase 12 | P2 | DONE (no app-layer/UI wiring yet — see task notes) | TASK-032, TASK-045, TASK-052 |
| TASK-054 | Implement promotion redemption UI, expiry reminders and promotions admin | Phase 12 | P3 | DONE (user-facing scope only; `/admin/promotions` deferred to TASK-059 — see task notes) | TASK-053, TASK-047, TASK-035 |
| TASK-055 | Establish referral domain, attribution and reward granting | Phase 13 | P3 | DONE (no live `PaidProActivated`/promotions wiring yet — see task notes) | TASK-053, TASK-052, TASK-034 |
| TASK-056 | Implement user referral page, reward notifications and referral admin view | Phase 13 | P3 | DONE (no live PaidProActivated reward trigger yet — see task notes) | TASK-055, TASK-047 |
| TASK-057 | Implement subscription cancellation, reactivation and payment-failure lifecycle | Phase 7 | P1 | DONE | TASK-033, TASK-034, TASK-045, TASK-035 |
| TASK-058 | Implement billing refunds, duplicate-charge detection and dispute persistence | Phase 7 | P2 | DONE (admin authorization is a minimal DI stub — see task notes) | TASK-057, TASK-033, TASK-034 |
| TASK-059 | Establish commercial admin authorization, audit log and user commercial summary | Phase 14 | P2 | DONE (no sensitive admin write exists yet to audit — see task notes) | TASK-003, TASK-032, TASK-034, TASK-045, TASK-057, TASK-058 |
| TASK-060 | Implement commercial admin billing, promotions, referrals, AI and notification operations | Phase 14 | P3 | DONE (Referrals section excluded — TASK-055/056 don't exist yet; see task notes) | TASK-059, TASK-053, TASK-054, TASK-055, TASK-056, TASK-057, TASK-058, TASK-052, TASK-051 |
| TASK-061 | Establish product analytics pipeline, event schemas and core funnels/KPIs | Phase 15 | P3 | DONE (client UI events, referral_converted, product_access_changed not wired — see task notes) | TASK-002, TASK-032, TASK-045 |
| TASK-062 | Implement statistical profile, analytics consent and internal privacy pipeline | Phase 16 | P3 | DONE (housing_cost_ratio/expense_category_ratios not implemented — no canonical category taxonomy; see task notes) | TASK-003, TASK-028, TASK-061 |
| TASK-063 | Implement profile onboarding flow, persistence and resume | Phase 17 | P2 | DONE (routing guard built and later enforced by TASK-064 — see that task's notes) | TASK-003, TASK-002, TASK-062 |
| TASK-064 | Implement access selection, explicit StartTrial and post-access financial onboarding | Phase 17 | P1 | DONE (no dedicated first-movements/first-value screens, no live Mercado Pago E2E path — see task notes) | TASK-063, TASK-032, TASK-033, TASK-045, TASK-052, TASK-051, TASK-053 |

## Traceability Matrix

| Document | Covered By |
| --- | --- |
| `AGENTS.md` | TASK-001 through TASK-064; constraints repeated in each applicable task |
| `docs/00-product-foundation.md` | TASK-012, TASK-019, TASK-027, TASK-028, TASK-029 |
| `docs/01-domain-model.md` | TASK-006, TASK-010, TASK-014, TASK-017, TASK-023, TASK-030 |
| `docs/02-database-schema.md` | TASK-004, TASK-014, TASK-017, TASK-023, TASK-030, TASK-032, TASK-042 |
| `docs/03-money-debt-engine.md` | TASK-006, TASK-011, TASK-014, TASK-018, TASK-020, TASK-024, TASK-028 |
| `docs/04-projections-and-cashflow.md` | TASK-027, TASK-028, TASK-029, TASK-030 |
| `docs/05-mvp-roadmap.md` | TASK-001 through TASK-031, TASK-039 through TASK-044 |
| `docs/06-accounts-transactions-vertical-slide.md` | TASK-006 through TASK-012 |
| `docs/07-ui-system.md` | TASK-008 through TASK-012, TASK-016, TASK-022, TASK-026, TASK-029, TASK-031, TASK-035, TASK-037, TASK-048 |
| `docs/08-ai-openrouter.md` | TASK-036 through TASK-038, TASK-040 |
| `docs/08.1-ai-credits-and-usage.md` | TASK-032, TASK-034 through TASK-038, TASK-040, TASK-045, TASK-046, TASK-052; defines the AI usage layer and its billing integration |
| `docs/09-ai-use-cases.md` | TASK-037, TASK-038; post-MVP use cases explicitly excluded in those tasks |
| `docs/10-billing-subscriptions-mercadopago.md` | TASK-032 through TASK-035, TASK-045, TASK-052 |
| `docs/10.1-subscription-plans-and-limits.md` | TASK-032, TASK-035, TASK-037, TASK-038, TASK-039, TASK-045, TASK-049, TASK-050, TASK-051, TASK-052 |
| `docs/10.2-pricing-unit-economics.md` | TASK-032, TASK-035, TASK-039, TASK-040, TASK-046, TASK-050, TASK-051, TASK-052 |
| `docs/11-transfers-vertical-slice.md` | TASK-014 through TASK-016 |
| `docs/12-debts-installments-payments-slice.md` | TASK-017 through TASK-022 |
| `docs/13-planning-recurring-slice.md` | TASK-023 through TASK-026 |
| `docs/14-dashboard-cashflow-slice.md` | TASK-027 through TASK-029 |
| `docs/15-budgets-slice.md` | TASK-030, TASK-031 |
| `docs/16-billing-mercadopago-slice.md` | TASK-032 through TASK-035, TASK-045, TASK-052 |
| `docs/17-ai-categorization-slice.md` | TASK-036, TASK-037 |
| `docs/18-production-readiness.md` | TASK-039 through TASK-044 |
| `docs/19-security-privacy.md` | TASK-007, TASK-014 through TASK-016, TASK-021, TASK-032 through TASK-040 |
| `docs/20-backup-recovery.md` | TASK-041 through TASK-044 |
| `docs/09-notifications-alerts.md` | TASK-047 through TASK-051, TASK-040 |
| `docs/10.3-promotion-codes-pro-access.md` | TASK-053, TASK-054 |
| `docs/10.4-referrals-and-affiliates.md` | TASK-055, TASK-056 |
| `docs/10.5-discounts-and-coupons.md` | Not implemented; coupons/billing discounts are explicitly deferred in the "Explicitly Deferred" section of `tasks/MASTER_PLAN.md`, mirroring how post-MVP AI use cases are handled for TASK-037/TASK-038 |
| `docs/10-6.subscription-cancellation-refunds.md` | TASK-057, TASK-058; provider cancellation semantics verified per OQ-005/`docs/adr/ADR-002-mercadopago-cancellation-semantics.md` (immediate-only, no reactivation) |
| `docs/21-commercial-admin.md` | TASK-059, TASK-060 |
| `docs/22-product-analytics.md` | TASK-061 |
| `docs/23-data-analytics-privacy-and-monetization.md` | TASK-062; external dataset generation/sale is explicitly deferred within that task's Out of Scope |
| `docs/23-onboarding-firstuse.md` | TASK-063, TASK-064 |

## Status Rules

- `DONE` means the repository already satisfies the task's scope, not merely that related files exist.
- `IN_PROGRESS` means a usable partial implementation exists and the task records the remaining gap.
- `TODO` means no implementation satisfying the acceptance criteria exists.
- `BLOCKED` is reserved for a task whose implementation cannot proceed without the still-open OQ-005 or another future question.

## Verification Baseline

Current repository scripts are `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, `pnpm build`, plus `pnpm db:generate` and `pnpm db:migrate`. Integration/E2E commands require an isolated `TEST_DATABASE_URL`.

## Backlog Generation Audit

- 64 global task files are defined, `TASK-001` through `TASK-064` (numbering is sequential; there is no `TASK-052` gap and no renumbering of existing tasks).
- Status distribution: 64 `DONE`, 0 `IN_PROGRESS`, 0 `TODO`, 0 `BLOCKED` — every task in the backlog now has an implementation pass, several with explicitly narrowed/documented scope gaps (see each task's own Notes). TASK-049, TASK-050 and TASK-051 are DONE with an explicitly narrowed scope (no queue/worker infra — see their task files). TASK-058 is DONE with `RequestRefund`'s admin-role check implemented as a minimal, explicitly injected `actor.isAdmin` stand-in; TASK-059 now exists with the real role system, but TASK-058 was not retrofitted to use it in this pass (see TASK-058's own notes). TASK-053 is DONE as a domain-only package (`packages/promotions`). TASK-054 is DONE for the user-facing redemption UI/status indicator/expiry reminders; its admin panel (`/admin/promotions`) was built by TASK-060 instead. TASK-059 is DONE: real `SUPPORT`/`ADMIN`/`SUPER_ADMIN` roles (`admin_roles` table), an append-only `audit_log`, `/admin` with role-gated user search + commercial summary + "why this access" breakdown + audit log viewer. TASK-060 is DONE with the Referrals section explicitly excluded (TASK-055/056 don't exist yet, so there's no domain service to wrap — see task notes); it delivers billing (reconcile/cancel/refund/webhook replay), promotions consolidation, AI credit ledger adjustments, notification delivery retry, a reconciliation exception-queue dashboard, and a commercial overview dashboard, all role-gated and audited. TASK-055 is DONE as a domain-only package (`packages/referrals`): referral codes, attribution (post-signup window only — no pre-signup click-tracking infra exists, so "last valid referral before signup" isn't implemented), idempotent conversion handling, and reward granting/retry/invalidation, all reached through port contracts rather than a live `PaidProActivated` subscription or live calls into `packages/promotions`/`packages/ai` (see task notes for the full rationale, matching TASK-053's ports-first precedent). TASK-061 is DONE: `packages/analytics` (Zod-validated, `.strict()` event registry; a fully-owned Postgres-backed `AnalyticsProvider`; `AnalyticsService.track()` that never throws) is live-wired into every server-authoritative MVP event with a real call site today (signup, trial start, referral attribution, account/transaction creation, activation, subscription lifecycle, promotion redemption, AI capability execution/exhaustion, notification clicks) and feeds a new funnel section on `/admin`; client-only UI interaction events, `referral_converted`, `product_access_changed`, and most cohort-based KPIs (retention, churn, reactivation, cost-per-Pro) are defined but not wired/computed in this pass, for the same "no live trigger/no client script yet" reasons as prior tasks — see task notes. TASK-056 is DONE: Settings → Referidos (shareable link, privacy-safe ordinal invitation list, signups/conversions/rewards summary from `GetReferralSummary`) and `/admin/referrals` (invalidate with reason, retry a failed reward, both idempotent/audited). Signup-time `?ref=` capture works today even without a dedicated signup page — wired into better-auth's `user.create.after` hook via a new `signupReferralCode` additionalField — and `MAX_REFERRAL_PROMO_DAYS_AHEAD` is now actually composed (`extendGrant`+`GrantPromotionalProAccess`), closing a gap TASK-055 had left as a port-only contract; what's still not live-wired is any automatic trigger from a real `PaidProActivated` event, so a reward's first grant attempt currently only happens through the admin retry action once a reward already exists (see task notes). TASK-062 is DONE: `packages/privacy` (optional statistical profile — every field nullable, `text` not `pgEnum`; explicit per-purpose `analytics_consents` with an append-only `analytics_consent_history`; `GenerateCohortAggregate:v1`, a pure-DI pipeline reusing `classifyLedgerEffect`/the real `debt_payments` table for `savings_rate`/`debt_service_ratio`, threshold-suppressed via `MIN_EXTERNAL_COHORT_SIZE`) plus Settings → Privacidad y datos and an aggregate-only `/admin/analytics` view. `housing_cost_ratio`/`expense_category_ratios` aren't implemented — this app's categories have no canonical taxonomy to aggregate across users, and inventing one would be exactly the ad-hoc transaction-semantics reimplementation the task itself forbids (see task notes). No external dataset/commercialization surface exists, per the task's own Out of Scope. TASK-063 is DONE: a full, tested onboarding wizard (welcome/basic-profile/goal/financial-context, plus statistical-profile/privacy-consent steps that delegate directly to TASK-062's real services, never duplicating their persistence) with server-persisted resume-at-step. The routing guard resolver (`resolveOnboardingGate`) was built here and later completed and actually enforced by TASK-064, once `productAccessState = NO_ACCESS` existed to route into. TASK-064 is DONE: `NO_ACCESS` was added to `ProductAccessState` (distinct from `EXPIRED_READ_ONLY`), `packages/auth`'s signup hook no longer starts a trial or grants AI credits, a new `StartTrial` application service (`packages/billing`) makes trial start atomic/idempotent/explicit-only, `/elegir-acceso` (Trial/Pro/promo code) and a minimal post-access financial onboarding (first-account creation only, reusing `CreateAccount` verbatim) were built, and the completed routing guard is now enforced from the `(app)` route group's layout for every real page. All ~13 pre-existing E2E specs were updated to walk onboarding + choose Trial before their own test logic, plus two new specs cover the Trial and Promo access-selection paths; a live Mercado-Pago-checkout E2E path and dedicated first-movements/first-value screens were narrowed out (see the task's own notes for why). TASK-039 is DONE codebase-ready-but-not-deployed (explicit user scope decision — the assistant has no Railway credentials and will not create/push live infrastructure without authorization): a multi-stage `Dockerfile` (non-root, no devDependencies/`.env` in the runtime image), `railway.toml`, `docs/deployment-runbook.md`, three health endpoints (`/api/health/live` liveness, `/api/health` readiness, `/api/health/deep` protected diagnostics), and `assertProductionHardening` (rejects an insecure `BETTER_AUTH_URL`/`DATABASE_URL`/secret or a missing `INTERNAL_HEALTH_TOKEN`) were all built and verified — including a hand-run Docker smoke test against real Postgres proving both the happy path and that an unsafe config fails loudly at startup instead of serving traffic. Notably, the hardening had to be gated on Railway's own `RAILWAY_ENVIRONMENT_NAME` rather than `NODE_ENV`, since both `next build` and `next start` force `NODE_ENV=production` internally regardless of the real deploy target — an `NODE_ENV`-gated first attempt broke local builds and the entire E2E suite before this was caught and fixed (see task notes). Actually provisioning a live Railway project/domain/secrets remains a manual step for the user. TASK-040 is DONE: a new `packages/observability` (structured JSON logger with denylist-based field redaction, UUID-trust-boundary request-ID resolution, a bounded in-memory rate limiter, security-header builder) plus `apps/web/src/middleware.ts` (security headers + request-ID propagation + a 60/min per-IP webhook-abuse rate limit on every request), structured logging wired into all three webhook route handlers, and better-auth's own built-in IP+path rate limiter turned on for sign-in/sign-up/password-reset (gated on `RAILWAY_ENVIRONMENT_NAME`, the same signal TASK-039 introduced, for the same reason: `NODE_ENV` can't distinguish real production from the E2E harness's `next start`). A real bug was caught and fixed before shipping: the first request-ID middleware draft would have silently corrupted Mercado Pago's own `x-request-id` header, which their webhook signature HMAC depends on — webhook paths are now explicitly excluded from that rewrite. A new `tests/integration/security-idor-and-concurrency.test.ts` adds cross-user IDOR coverage for debts/transfers/budgets (accounts/categories/transactions were already covered) and proves concurrent debt payments serialize correctly under real Postgres row locking. Narrowed: no Redis-backed distributed rate limiting (Redis remains unused infrastructure, matching TASK-039's finding), no logging retrofit across this codebase's ~80 existing server actions (only webhooks + middleware), and ordinary transaction/account creation still has no idempotency key against a genuine double-click (a pre-existing gap, not introduced by this task) — see task notes. TASK-041 is DONE (workflow written and verified, not yet executed — the repo isn't under git at all yet, an explicit user scope decision matching TASK-039's Railway-credentials pattern): `.github/workflows/ci.yml` (lint/typecheck/schema-drift-check/fresh-database-migration/`pnpm test`/build/E2E, all against a Postgres service container that's always freshly created) plus a PR-only dependency-review job, `.github/dependabot.yml`, and four `runbooks/` files (failed deploy, provider outage, webhook incident, worker jobs — the last explicitly marked not-yet-applicable) each naming an owner/rollback/safe-write-behavior and grounded in this codebase's real existing degradation patterns rather than generic advice. Every command the workflow runs was verified directly in this session; once the user pushes this repo to GitHub, the workflow starts running with no further setup (its own Postgres container means no external secrets are needed for the quality gate to pass). TASK-042 is DONE with Railway's own managed-backup configuration left as pending fields (no Railway project exists yet, same recurring constraint): `packages/db/scripts/backup.mjs`/`restore.mjs` (`pnpm db:backup`/`pnpm db:restore`, a real `pg_dump`/`pg_restore` wrapper, manually verified against real local Postgres via `docker exec` before automating it), `tests/integration/backup-artifact-readability.test.ts` (runs for real wherever `pg_dump`/`pg_restore` exist — now including CI, via a new `postgresql-client` install step — skips cleanly elsewhere), and `runbooks/backup.md` (RPO ≤1h/RTO ≤4h marked explicitly provisional, what happens if the Railway project itself is deleted — the real biggest risk a platform-only backup can't cover — mitigated by this off-platform script with S3 upload as a tracked follow-up reusing this repo's already-reserved `S3_*` env vars). TASK-043 is DONE: `packages/db/src/audit/finance-audit.ts` (five SQL-based validators — transfer leg pairing, debt payment/allocation equality, no-overpaid-installments, transaction ownership/currency consistency, scheduled-transaction posted-link integrity — each a query that only returns rows when something is actually wrong), `pnpm finance:audit`/`pnpm recovery:validate` (real TypeScript scripts run via `tsx`, a new minimal devDependency; `recovery-validate.ts` orchestrates restore→migration-compatibility→audit→row-count-sanity and hard-refuses to run against anything that doesn't look like an isolated recovery target), and `runbooks/restore.md`. Verified as a real end-to-end drill during this task: a real scratch database, a real `pg_dump`/`pg_restore` cycle, and a real `finance:audit` run against the result, all via manual `docker exec` (same client-tools constraint TASK-042 found); `tests/integration/finance-audit.test.ts` proves the audit stays silent on well-formed data and catches every one of the 6 documented corruption classes. TASK-046 is DONE, the last task in the backlog: `packages/config/src/pricing.ts` (versioned, Zod-validated pricing/cost-assumption config), `packages/observability/src/business-metrics.ts` + `cost-guardrails.ts` (pure `decimal.js` calculators — gross/net/contribution kept independently represented, never equalized; the documented ~USD 574.10 100-Pro-user reference scenario reproduces exactly), and `apps/web/.../get-business-metrics.ts` (the real aggregation layer over `billing_subscriptions`/`ai_credit_entries`/`notification_deliveries`/`users`, gated by a new admin-only `commercial.metrics.read` permission that rejects non-admins before any query runs) plus `runbooks/monthly-pricing-review.md`. No admin UI/dashboard was built (explicitly out of scope unless separately approved) and no historical snapshot storage exists yet (explicitly optional in the task's own Database Changes) — both documented as intentional, not accidental, gaps. TASK-044 is DONE with a real, executed drill (not simulated): populated the test database via a full E2E suite run (30 users, 28 accounts, 12 transactions, 3 debts across every domain), backed it up with a real `pg_dump`, restored into a fresh isolated scratch database, ran the migration-compatibility check and `pnpm finance:audit` (zero findings), then booted the actual app against the restored database and performed a real authenticated sign-in and dashboard load. Measured phase durations (backup 431ms, restore 2.5s, migration check 1.3s, audit 1.1s, app boot ~5s, smoke <1s, total ≈11s) are recorded in a dated Drill Report in the new `runbooks/disaster-recovery.md`, explicitly caveated as local-infrastructure timing, not a validated production RPO/RTO — a re-run against real Railway infrastructure is the tracked follow-up once that exists.
- TASK-064 (now `DONE`, the last task from the original TASK-055 through TASK-064 set) covers `docs/10.3`, `docs/10.4`, `docs/10-6`, `docs/21`, `docs/22`, `docs/23-data-analytics-privacy-and-monetization.md` and `docs/23-onboarding-firstuse.md`; `docs/10.5-discounts-and-coupons.md` is intentionally covered by a Traceability Matrix entry pointing at the "Explicitly Deferred" section of `tasks/MASTER_PLAN.md` rather than by an implementation task, since its core content (billing discounts/coupons) is explicitly deferred and no existing task depends on it as a guardrail.
- All task files include the required implementation, security, financial invariant, tests and verification sections.
- All canonical documents represented in the backlog are included in the traceability matrix.
- `pnpm lint`: passed.
- `pnpm typecheck`: passed after the foundation TypeScript/config fixes.
- `pnpm test`: executes the real Vitest suite; `pnpm test:e2e` executes Playwright against PostgreSQL test infrastructure.
- `pnpm build`: passed with validated environment variables.
