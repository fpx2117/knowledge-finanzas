# 00 — Repository Map

Monorepo **pnpm workspaces** (`apps/*`, `packages/*`), `pnpm@10.4.1`, Node ≥20.11.
Sin Turbo/Nx. Scripts raíz orquestan via `pnpm --filter`.

## apps/

| App | Stack | Responsabilidad | Estado | Relación con specs |
|---|---|---|---|---|
| `apps/web` | Next.js (App Router, React Server Components, server actions), Tailwind + shadcn, Better Auth client | Única app de producto: shell, todas las pantallas, server actions de dominio, route handlers de API (`/api/auth`, `/api/health/*`, `/api/webhooks/*`, `/api/notifications/stream`) | Activo — greenfield frontend rebuild en curso (rama `feat/capture-system`) | Implementa 01–13; navegación en `src/components/layout/nav-items.ts` |

### apps/web/src estructura

- `app/(app)/…` — rutas privadas autenticadas (layout con guard de onboarding + entitlements).
- `app/admin/…` — panel comercial/soporte, role-gated (`admin_roles`).
- `app/api/…` — auth catch-all, health, webhooks (mercadopago/resend/twilio), SSE de notificaciones.
- `app/onboarding/…`, `app/elegir-acceso`, `app/login`, `app/signup`, `app/pricing` — flujo pre-app.
- `features/<dominio>/{actions,services,schemas,components,lib}` — **arquitectura feature-sliced**.
  `actions/` = server actions (command surface), `services/` = read models / orquestación,
  `schemas/` = Zod. Features: `accounts, auth, budgets, calendar, capture, categories, dashboard,
  debts, goals, imports, insights, reports, transactions, transfers`.
- `lib/<área>` — wiring de infraestructura hacia packages (`ai, analytics, auth, billing, errors,
  finance, notifications, observability, onboarding, privacy, promotions, referrals, admin`).
- `components/layout`, `components/shared` — shell y componentes transversales.
- `middleware.ts` — security headers, request-id, rate limit de webhooks.

## packages/

| Package | Responsabilidad | Tecnologías | Estado |
|---|---|---|---|
| `finance` | **Núcleo financiero puro** (sin I/O): `Money` (decimal.js), rounding, currency metadata, `LocalDate`/timezone, `calculateAssetAccountBalance`, `classifyLedgerEffect`, `validateTransfer` + `calculateTransferAssetDelta`, motor de deuda (installments, allocation, status), recurrencia, proyecciones (`calculateSpendable`, `calculateCashflow`, `upcoming`, `reminders`), budgets | TS puro, `decimal.js` | Sólido; cubre B–F del roadmap |
| `db` | Drizzle schema (`src/schema.ts`, ~60 tablas, 39 migraciones `0000–0038`), client, repositories, queries, taxonomy + merchants, audit (`src/audit/finance-audit.ts`), scripts (`backup`, `restore`, `seed-taxonomy`, `backfill-transactions`, `finance-audit`, `recovery-validate`) | Drizzle ORM, `postgres` | Activo |
| `auth` | Better Auth + Drizzle: email/password, sesiones, roles admin, hook de signup (`?ref=`) | Better Auth | DONE |
| `billing` | Dominio de suscripción, planes, entitlements (`ProductAccessResolver`), Mercado Pago provider, webhooks, refunds/disputes, trial (`StartTrial`), `usage` | TS + provider adapter | DONE (sin deploy real MP) |
| `ai` | Boundary de IA: capability pattern (prompt+schema+executor), model registry, OpenRouter provider, credit metering / reservations, structured output + Zod, rate-limit. Capabilities: `transaction.categorize`, `merchant.normalize`, `insights/explain-financial-insight` | TS, OpenRouter | DONE; no cableado al capture rebuild |
| `notifications` | Dominio de notificación, preferencias, reglas, templates, providers (Resend, Twilio), webhooks. **Sin queue/worker** (scope narrowed) | TS | DONE (sync) |
| `analytics` | Registro de eventos Zod `.strict()`, provider Postgres, `AnalyticsService.track()` no-throw | TS | DONE (parcial wiring) |
| `privacy` | Perfil estadístico opcional, consentimientos por propósito, pipeline de agregados cohorte | TS | DONE |
| `promotions` / `referrals` | Domain-only (códigos promo, atribución, rewards) | TS | DONE (poco wiring UI/eventos) |
| `audit` | `audit_log` append-only, redact snapshot, require-reason | TS | DONE |
| `observability` | Logger JSON con redacción, request-id, rate limiter in-memory, security headers, business-metrics, cost-guardrails | TS | DONE (sin Redis) |
| `config` | Validación de env (Zod), `pricing.ts` versionado, `production-hardening.ts` | Zod | DONE |
| `shared` | Errores base, permissions | TS | DONE |
| `validation` | Primitivas de validación compartidas | Zod | DONE |

## database/

- PostgreSQL (docker-compose local; Railway objetivo, **sin deploy real**).
- Drizzle migraciones `packages/db/drizzle/0000…0038` + `meta/`.
- ~60 tablas: núcleo financiero (`accounts, transactions, transfers, debts, debt_installments,
  debt_payments, debt_payment_allocations, scheduled_transactions, recurring_*, subscriptions,
  budgets, budget_alerts, goals, quick_templates`), clasificación (`categories, category_taxonomy,
  category_map, merchants, merchant_aliases, merchant_user_defaults, user_classification_rules`),
  captura (`import_batches, duplicate_dismissals`), billing (7 tablas `billing_*`), promo/referral
  (7 tablas), IA (`ai_credit_entries, ai_credit_reservations`), notificaciones (5 tablas),
  analytics/privacy (5 tablas), onboarding (`user_onboarding, user_financial_profiles`),
  auth (`users, session, account, verification`), `admin_roles`, `audit_log`, `reminders`.

## infrastructure/

- `Dockerfile` multi-stage (non-root), `railway.toml`, `docker-compose.yml`.
- `.github/workflows/ci.yml` (lint/typecheck/schema-drift/migrate/test/build/e2e con Postgres service) + `dependabot.yml`. **Escrito y verificado local; nunca ejecutado en Actions** (repo recién puesto bajo git).
- `runbooks/` — deploy fallido, provider outage, webhook incident, backup, restore, disaster-recovery, monthly-pricing-review.
- Health: `/api/health/live`, `/api/health`, `/api/health/deep` (token).
- `assertProductionHardening()` gateado por `RAILWAY_ENVIRONMENT_NAME` (no `NODE_ENV`).

## testing/

- **Vitest**: `vitest.unit.config.ts`, `vitest.integration.config.ts` (requiere `TEST_DATABASE_URL`), root `vitest.config.ts`.
- **Playwright**: `playwright.config.ts`, `pnpm test:e2e` contra Postgres de test; ~13+ specs E2E (todas caminan onboarding + elegir Trial).
- `tests/` en raíz + suites por package.
- Scripts de integridad: `pnpm finance:audit` (5 validadores SQL), `pnpm recovery:validate`.

## tooling/documentation/

- `docs/01–14 *-product-ui-spec-extreme.md` — **spec vigente** (nueva, sin reconciliar).
- `docs/visual/` — spec visual por pantalla (base del greenfield rebuild).
- `docs/capture/implementation-backlog.md` — backlog del sistema de captura (reconstruido).
- `docs/README.md` — (obsoleto: contiene texto de Metas).
- `tasks/TASK-001…064` + `MASTER_PLAN.md` + `OPEN_QUESTIONS.md` + `tasks/adr/` — backlog previo, 64/64 `DONE`.
- `docs/00-product-foundation.md` — **NO EXISTE** (referenciado por la spec 14 como `00-product-foundation(2).md`). Ver 01-gap-analysis §Blockers.
