# 04 — Route Registry

Fuente spec: doc 14 §8 (registro maestro de rutas).
Fuente código: `apps/web/src/app/**` + `apps/web/src/components/layout/nav-items.ts`.
Todas las rutas privadas viven en el route group `(app)` con guard de sesión + onboarding + entitlements
en su `layout`. Auth: `session required` salvo indicado. Entitlement: `TRIAL|PRO|EXPIRED_READ_ONLY`
(lectura preservada en EXPIRED; escrituras premium gateadas server-side — §28).

## Leyenda de estado

`OK` coincide · `RENAME` existe con otro path · `SPLIT` existe pero sin las subvistas · `MISSING` no existe

## Registro

| Ruta spec | Vista | Owner | Prio | Ruta en código | Estado | Deep-link / Mobile |
|---|---|---|---:|---|---|---|
| `/app` | Resumen | 01 | P0 | `(app)/dashboard` | RENAME | bottom bar slot 1; sin deep-link params |
| `/accounts` | Cuentas/Todas | 02 | P0 | `(app)/accounts` | OK | slot 2 |
| `/accounts/banks` | Bancos | 02 | P0 | — | MISSING | filtro server-side |
| `/accounts/wallets` | Billeteras | 02 | P0 | — | MISSING | — |
| `/accounts/cash` | Efectivo | 02 | P0 | — | MISSING | — |
| `/accounts/savings` | Ahorro | 02 | P0 | — | MISSING | — |
| `/accounts/:accountId` | Detalle cuenta | 02 | P0 | `(app)/accounts/[accountId]` | OK | ID opaco |
| — | Nueva cuenta | 02 | — | `(app)/accounts/new` | extra (aceptable) | full-screen en mobile |
| `/transactions` | Todos | 03 | P0 | `(app)/transactions` | OK | slot 3; filtros por query param |
| `/transactions/expenses` | Gastos | 03 | P0 | — | MISSING | (hoy: filtro dentro de `/transactions`?) |
| `/transactions/income` | Ingresos | 03 | P0 | — | MISSING | — |
| `/transactions/transfers` | Transferencias | 03 | P0 | `(app)/transfers` (+ `/new`, `/[transferId]`) | RENAME | árbol separado |
| `/transactions/recurring` | Recurrentes | 03 | P1 | `(app)/transactions/recurrentes` | RENAME (ES) | — |
| `/transactions/pending` | Pendientes | 03 | P0 | `(app)/transactions/pendientes` | RENAME (ES) | CTA Revisar |
| `/transactions/:transactionId` | Detalle | 03 | P0 | `(app)/transactions/[transactionId]` | OK | — |
| — | Duplicados | 03 | — | `(app)/transactions/duplicados` | extra (spec: parte de Pendientes) | — |
| — | Importaciones | 03/11 | — | `(app)/transactions/importaciones` | RENAME (spec: `/settings/imports`) | — |
| — | Nuevo movimiento | 03/10 | — | `(app)/transactions/new` | extra | full-screen mobile |
| `/budgets` | Resumen | 04 | P0 | `(app)/budgets` | OK | — |
| `/budgets/categories` | Por categoría | 04 | P0 | — | MISSING | — |
| `/budgets/history` | Historial | 04 | P1 | — | MISSING | — |
| `/budgets/categories/:categoryId` | Detalle categoría | 04 | P0 | — | MISSING | — |
| — | Nuevo budget | 04 | — | `(app)/budgets/new`, `[budgetId]` | extra/OK | — |
| `/obligations` | Todas | 05 | P0 | `(app)/debts` | RENAME | — |
| `/obligations/upcoming` | Próximas | 05 | P0 | — | MISSING | — |
| `/obligations/debts` | Deudas y préstamos | 05 | P0 | `(app)/debts` (mismo) | SPLIT | — |
| `/obligations/installments` | Cuotas | 05 | P0 | — | MISSING (dentro de detalle) | — |
| `/obligations/subscriptions` | Suscripciones | 05 | P1 | `(app)/debts/suscripciones` | RENAME | — |
| `/obligations/:obligationId` | Detalle | 05 | P0 | `(app)/debts/[debtId]` | RENAME | — |
| — | Nueva deuda | 05/10 | — | `(app)/debts/new` | extra | — |
| `/calendar` | Calendario | 06 | P0 | `(app)/calendar` | OK | modos internos (no rutas) |
| `/goals` | Todas | 07 | P0 | `(app)/goals` | OK | — |
| `/goals/active` | Activas | 07 | P0 | — | MISSING | — |
| `/goals/completed` | Completadas | 07 | P1 | — | MISSING | — |
| `/goals/:goalId` | Detalle | 07 | P0 | `(app)/goals/[goalId]` (+ `/editar`) | OK | — |
| — | Nueva meta | 07 | — | `(app)/goals/new` | extra | — |
| `/reports` | Panorama | 08 | P0 | `(app)/reports` | OK | — |
| `/reports/expenses` | Gastos | 08 | P0 | — | MISSING | — |
| `/reports/income` | Ingresos | 08 | P0 | — | MISSING | — |
| `/reports/cash-flow` | Flujo de caja | 08 | P0 | — | MISSING | — |
| `/reports/net-worth` | Patrimonio | 08 | P1 | — | MISSING | — |
| `/reports/categories` | Categorías | 08 | P0 | — | MISSING | — |
| `/insights` | Para vos | 09 | P0 | `(app)/insights` | OK | — |
| `/insights/opportunities` | Oportunidades | 09 | P1 | — | MISSING | — |
| `/insights/history` | Historial | 09 | P1 | — | MISSING | — |
| `/insights/:insightId` | Detalle | 09 | P0 | — | MISSING | — |
| `/settings/profile` | Perfil | 11 | P0 | — | MISSING (parcial en onboarding) | — |
| `/settings/preferences` | Preferencias | 11 | P0 | — | MISSING | locale/tz/moneda |
| `/settings/categories` | Categorías | 11 | P0 | `(app)/settings/categories` | OK | — |
| `/settings/rules` | Reglas | 11 | P1 | `(app)/settings/rules` | OK | — |
| `/settings/imports` | Importaciones | 11 | P0 | (en `/transactions/importaciones`) | RENAME | — |
| `/settings/notifications` | Notificaciones | 11 | P1 | `(app)/settings/notifications` | OK | — |
| `/settings/privacy` | Privacidad | 11 | P0 | `(app)/settings/privacy` | OK | — |
| `/settings/security` | Seguridad | 11 | P0 | — | MISSING | sesiones, reauth, MFA(§49.3) |
| `/settings/plan` | Plan | 11 | P0 | `(app)/settings/billing` + `(app)/billing` + `(app)/billing/return` | RENAME | — |
| `/help` | Centro de ayuda | 12 | P0 | — | MISSING | — |
| `/help/getting-started` | Primeros pasos | 12 | P0 | — | MISSING | — |
| `/help/troubleshoot` | Resolver problema | 12 | P1 | — | MISSING | diagnóstico read-only |
| `/help/status` | Estado del servicio | 12 | P1 | — | MISSING | — |
| `/help/contact` | Contactar soporte | 12 | P1 | — | MISSING | — |
| `/help/feedback` | Feedback | 12 | P1 | — | MISSING | — |

## Rutas fuera de `(app)` (pre-app / plataforma)

| Ruta | Propósito | Auth | Estado |
|---|---|---|---|
| `/login`, `/signup` | Acceso | público | OK |
| `/onboarding/{welcome,basic-profile,goal,financial-context,statistical-profile,privacy-consent,financial-onboarding}` | Wizard (TASK-063/064) | session | OK |
| `/elegir-acceso` | Trial/Pro/promo (TASK-064) | session | OK |
| `/pricing` | Planes público | público | OK |
| `/admin/**` | Panel comercial/soporte | session + `admin_roles` | OK (fuera del alcance de specs 01–13) |
| `/api/auth/[...all]` | Better Auth | — | OK |
| `/api/health/{live,,deep}` | Health | público / token | OK |
| `/api/webhooks/{mercadopago,resend,twilio}` | Webhooks idempotentes | firma | OK |
| `/api/notifications/stream` | SSE centro de notificaciones | session | OK |

## Reglas de routing a hacer cumplir (§8.1)

- IDs opacos ✅ (uuid). Sin info sensible en path ✅.
- Filtros compartibles → query params (no subrutas para cada estado) — respetar al agregar subvistas.
- 404/403 no revelan recursos ajenos — **UNVERIFIED**, añadir tests.
- Dialogs con valor de deep-link pueden ser route-aware (Registrar, detalle) — **UNVERIFIED**.
- Cada route loader valida sesión + ownership — parcialmente verificado (IDOR suite).

## Canónico decidido — ADR-IMPL-001 (Accepted 2026-09-03)

`docs/adr/ADR-IMPL-001-route-and-naming-reconciliation.md`. Resumen:

| Tema | Decisión | Ejecución |
|---|---|---|
| Idioma de paths | **Inglés** (= spec 14 §8 literal); español sólo en labels UI | WP-ROUTES-RENAME |
| Resumen | **`/app`** ; `/dashboard` → redirect 308 | WP-ROUTES-RENAME |
| Obligaciones | **`/obligations`** + `/obligations/{upcoming,debts,installments,subscriptions,:id,new}` ; `/debts*` → 308 | WP-ROUTES-RENAME + WP-ROUTES-SUBVIEWS |
| Transferencias | **`/transactions/transfers`** (+ `/:transferId`, `/new`) ; `/transfers*` → 308 ; sidebar: hija de Transacciones | WP-ROUTES-RENAME |
| Importaciones | **`/settings/imports`** (setup + historial) ; excepciones → `/transactions/pending` ; `/transactions/importaciones` → 308 | WP-ROUTES-RENAME |
| Duplicados | **`/transactions/pending?view=duplicates`** (query param, deep-linkable) ; `/transactions/duplicados` → 308 | WP-ROUTES-RENAME |
| Planning | **se pliega en `/transactions/recurring`** ; `/planning*` → 308 | WP-ROUTES-RENAME |
| Plan / Billing | **`/settings/plan`** ; `/billing` + `/settings/billing` → 308 ; `/billing/return` se mantiene (handler de checkout) | WP-ROUTES-RENAME |
| Sub-rutas nuevas faltantes | crear **ya con path canónico** | WP-ROUTES-SUBVIEWS |
| Filtros/estados | **query params**, nunca sub-ruta por filtro (§8.1) | transversal |

Cualquiera de estas decisiones se revierte con un comentario antes de que WP-ROUTES-RENAME se ejecute.
