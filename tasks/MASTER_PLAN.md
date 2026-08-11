# Master Implementation Plan

## Execution Model

Implement one unblocked task at a time. Preserve the global DAG in `tasks/README.md`; a task may be marked `DONE` only after its acceptance criteria and verification commands pass. Vertical slices include schema, domain, application, UI, security and tests together.

## Phase 0 — Repository / Foundation

**Objective:** dejar el monorepo ejecutable, autenticado, migrable, testeable y con primitivas financieras exactas.

**Dependencies:** ninguna externa.

**Tasks:** TASK-001 a TASK-007.

**Enables:** cualquier mutación financiera segura y trazable.

**Definition of Done:** local setup works with Docker/PostgreSQL; auth protects private routes; migrations run from clean DB; config fails fast; exact Money/date primitives and ownership/error contracts have unit tests; lint, typecheck, test and build pass.

## Phase 1 — Accounts + Categories + Transactions

**Objective:** completar la primera vertical: registrar cuentas, categorías, ingresos y gastos, calcular balances y mostrar Dashboard V0.

**Dependencies:** Phase 0.

**Tasks:** TASK-008 a TASK-013.

**Enables:** flujo Register → Account 1000 → Income 500 → Expense 200 → Balance 1300, con void y soporte base de refunds/adjustments.

**Definition of Done:** ownership server-side, exact arithmetic, no mutable current balance, posted/voided semantics, monthly metrics por timezone, empty/loading/error/mobile states y E2E crítico.

## Phase 2 — Transfers

**Objective:** mover dinero entre cuentas propias sin contaminar ingresos, gastos o patrimonio consolidado.

**Dependencies:** Phase 1, especialmente TASK-011.

**Tasks:** TASK-014 a TASK-016.

**Enables:** ledger compuesto con dos legs, historial lógico, void atómico.

**Definition of Done:** same-currency transfers only; exactly one `TRANSFER_OUT` and one `TRANSFER_IN`; atomicity, ownership, paired void, balance and reporting invariants tested.

## Phase 3 — Debts + Installments + Payments

**Objective:** representar obligaciones, generar cuotas, derivar estados y registrar pagos parciales/anticipados atómicamente.

**Dependencies:** Phase 1; transfer-independent.

**Tasks:** TASK-017 a TASK-022.

**Enables:** deuda pendiente, vencimientos, payment allocation, cash outflow sin doble conteo de consumo.

**Definition of Done:** generated/manual installments, preview, exact remainder, anchor-day dates, timezone overdue, oldest-due-first/manual allocation, locking, no overpayment, atomic `LIABILITY_PAYMENT` and UI completa.

## Phase 4 — Planning + Scheduled + Recurring

**Objective:** modelar expectativas futuras sin mutar balances hasta confirmación.

**Dependencies:** Phase 1 and Phase 3.

**Tasks:** TASK-023 a TASK-026.

**Enables:** scheduled income/expenses, recurring rules, occurrence horizon, upcoming inputs and in-app reminder foundation.

**Definition of Done:** scheduled/posted/skipped/cancelled lifecycle, idempotent posting, recurrence anchor dates and unique occurrence constraint, pause/resume/cancel policy, timezone-aware planning UI.

## Phase 5 — Dashboard + Cashflow

**Objective:** responder qué hay, qué vence, qué está comprometido, qué se puede gastar y qué podría ocurrir en 30 días.

**Dependencies:** Phase 3 and Phase 4.

**Tasks:** TASK-027 a TASK-029.

**Enables:** Dashboard V1, spendable explainable, projected end/minimum/shortfall balances and normalized upcoming obligations.

**Definition of Done:** no cross-currency sums, no N+1, no future income in current spendable, remaining amounts for partial debts, pure projection engines, drill-down explanations and responsive UI.

## Phase 6 — Budgets

**Objective:** comparar consumo real por categoría contra límites mensuales sin convertir budgets en reservas u obligaciones.

**Dependencies:** Phase 1, TASK-013 and Phase 5.

**Tasks:** TASK-030, TASK-031.

**Enables:** budget overview/detail, NORMAL/NEAR_LIMIT/EXCEEDED and dashboard budget status.

**Definition of Done:** active budget uniqueness, expense category ownership/type, timezone month, exact net consumption/refunds, negative remaining, configurable threshold, archive and tests.

## Phase 7 — Billing + Mercado Pago

**Objective:** separar cobro de plataforma del ledger personal y resolver entitlements desde estado local sincronizado.

**Dependencies:** Phase 0; feature gates may wrap later modules.

**Tasks:** TASK-032, TASK-033, TASK-034, TASK-045, TASK-035, TASK-057 y TASK-058.

**Enables:** TRIAL → PRO_MONTHLY → EXPIRED_READ_ONLY, checkout, provider synchronization, billing-period idempotency, grace/cancellation policy, access catalog, allowances, server-side feature gates, verified cancellation/reactivation semantics (closes the provider-verification half of OQ-005) and auditable refund/dispute handling.

**Definition of Done:** no redirect-only activation, provider adapter isolated, webhook verified/fetched/idempotent, billing payments never create personal transactions, plan limits and entitlements are server-enforced, subscription UI and reconciliation exist, cancellation/reactivation match verified Mercado Pago semantics, and refunds are idempotent, admin-mediated and audited.

## Phase 8 — AI + OpenRouter

**Objective:** agregar asistencia opcional, estructurada y no autoritativa.

**Dependencies:** Phase 0; TASK-009 for categorization; TASK-032 and TASK-045 if AI is premium.

**Tasks:** TASK-036, TASK-052, TASK-037 y TASK-038.

**Enables:** state-aware AI credits, category suggestions and later read-only explanations using deterministic financial inputs.

**Definition of Done:** server-only provider, model registry, structured output + Zod + domain/ownership validation, prompt versioning, no silent writes, rate/cost controls, safe fallback and core works with AI disabled.

## Phase 9 — Production + Security Hardening

**Objective:** desplegar y operar de forma segura, observable y verificable.

**Dependencies:** all launch capabilities, or explicit feature flags for deferred integrations.

**Tasks:** TASK-039, TASK-040, TASK-041 y TASK-046.

**Enables:** Railway release, health/readiness, secure secrets, headers, IDOR/security tests, structured logs, CI gates, migration discipline, operational response and unit-economics guardrails.

**Definition of Done:** separate environments, secrets validated server-side, HTTPS/auth cookies, security headers, rate limits, critical metrics/alerts, CI checks and no financial writes without atomicity/idempotency guarantees.

## Phase 10 — Backup + Recovery

**Objective:** demostrar restauración, integridad financiera y recuperación operativa.

**Dependencies:** production database and migration discipline.

**Tasks:** TASK-042 a TASK-044.

**Enables:** known RPO/RTO, tested full/PITR restore, audit command, billing reconciliation and recovery drills.

**Definition of Done:** encrypted retained backups, isolated restore runbook, integrity audit, rebuildable derived state, recovery permissions/audit trail and at least one measured drill before launch.

## Phase 11 — Notifications + Alerts

**Objective:** informar eventos financieros relevantes mediante notificaciones persistidas y canales controlados, sin convertir la entrega en parte de la verdad financiera.

**Dependencies:** Phase 3, Phase 4, Phase 5, Phase 6, Phase 7 and production worker/observability foundations.

**Tasks:** TASK-047 a TASK-051.

**Enables:** notification center, unread/read state, authenticated SSE, debt/planning/budget alerts, asynchronous Resend email, controlled Twilio WhatsApp and delivery retries.

**Definition of Done:** notifications persist in PostgreSQL, preferences and timezone are respected, rules are deduplicated, providers are abstracted, deliveries are retryable/idempotent, WhatsApp is opt-in and plan-limited, and financial writes never depend on delivery.

## Phase 12 — Promotions

**Objective:** otorgar acceso Pro promocional temporal (`PROMOTIONAL PRO`) mediante códigos server-controlados, separado por completo de Billing/Mercado Pago.

**Dependencies:** Phase 7 (TASK-032, TASK-045), Phase 8 (TASK-052).

**Tasks:** TASK-053 y TASK-054.

**Enables:** `ProductAccessResolver` con prioridad `PAID_SUBSCRIPTION > PROMOTION > TRIAL > EXPIRED_READ_ONLY`, redención atómica de códigos, grants manuales de soporte, recompensas promocionales para Referrals (Phase 13) y expiry reminders vía Notifications.

**Definition of Done:** redención atómica y concurrency-safe, snapshot de términos congelado por grant, ningún efecto sobre `billing_subscriptions`/`billing_payments`/`billing_periods`, allowances de IA/WhatsApp acotados por período promocional, admin UI con reason obligatorio y auditable.

## Phase 13 — Referrals

**Objective:** atribuir nuevos usuarios a un referrer y recompensar solo conversión paga real (`FIRST_PAID_PRO_ACTIVATION`), reutilizando Promotions y AI Credits para el otorgamiento.

**Dependencies:** Phase 7 (TASK-034), Phase 8 (TASK-052), Phase 12 (TASK-053).

**Tasks:** TASK-055 y TASK-056.

**Enables:** código de referido estable por usuario, atribución congelada al signup, recompensa idempotente ante webhooks duplicados, invalidación/retry administrativos, página de referidos y vista admin.

**Definition of Done:** self-referral bloqueado, checkout/PENDING nunca cuenta como conversión, un pago pago produce a lo sumo una recompensa estándar, falla de recompensa nunca revierte billing, caps anti-abuso configurables aplicados.

## Phase 14 — Commercial Admin

**Objective:** operar excepciones comerciales (billing, promociones, referidos, IA, WhatsApp) desde un panel seguro, auditable y separado de la experiencia normal, sin editor de base de datos directo.

**Dependencies:** Phase 0 (TASK-003), Phase 7 (TASK-032, TASK-034, TASK-045, TASK-057, TASK-058), Phase 12, Phase 13.

**Tasks:** TASK-059 y TASK-060.

**Enables:** roles `SUPPORT`/`ADMIN`/`SUPER_ADMIN`, audit log append-only, búsqueda y resumen comercial de usuario, reconciliación individual, refunds/AI adjustments/webhook replay auditados, dashboard de excepciones.

**Definition of Done:** toda escritura sensible pasa por un application service existente y queda auditada, ninguna acción admin falsifica estado de provider, `SUPPORT` sin acceso irrestricto a datos financieros personales, sin backdoors ni bulk actions destructivas.

## Phase 15 — Product Analytics

**Objective:** medir activación, conversión y retención del producto sin convertir la analítica en fuente de verdad financiera ni de billing.

**Dependencies:** Phase 0 (TASK-002), Phase 7 (TASK-032, TASK-045).

**Tasks:** TASK-061.

**Enables:** `AnalyticsProvider` abstraction, event schema registry versionado, funnels core (signup → activación → Pro → retención), KPIs MVP (Activation Rate, Trial→Pro, MRR desde Billing, Week 4 Retention, AI Adoption).

**Definition of Done:** eventos críticos deduplicados por `event_id`, ningún dato financiero libre en payloads generales, MRR siempre desde Billing, fallas del proveedor de analytics nunca bloquean una operación financiera.

## Phase 16 — Data Analytics, Privacy & Monetization

**Objective:** habilitar un perfil estadístico opcional, consentimiento explícito por propósito y un pipeline interno de agregación con umbrales de privacidad, sin habilitar comercialización externa de datos.

**Dependencies:** Phase 0 (TASK-003), Phase 5 (TASK-028), Phase 15 (TASK-061).

**Tasks:** TASK-062.

**Enables:** `user_statistical_profiles` opcional, `analytics_consents`/historial append-only, métricas derivadas reutilizando el Finance Engine, agregados internos con supresión de cohortes pequeñas, vista admin agregada sin explorer por usuario.

**Definition of Done:** ningún campo estadístico es obligatorio, retiro de consentimiento respetado hacia adelante, ninguna cohorte por debajo del umbral configurado se expone, ningún identificador persistente de individuo en agregados, sin generación/publicación de dataset externo (deferred).

## Phase 17 — Onboarding

**Objective:** conocer al usuario y separar explícitamente registro, onboarding de perfil, elección de acceso e inicio de trial, antes de comenzar el onboarding financiero.

**Dependencies:** Phase 0 (TASK-002, TASK-003), Phase 7 (TASK-032, TASK-033, TASK-045), Phase 8 (TASK-052), Phase 11 (TASK-051), Phase 12 (TASK-053), Phase 16 (TASK-062).

**Tasks:** TASK-063 y TASK-064.

**Enables:** onboarding de perfil resumible y versionado, pantalla "Elegí cómo comenzar", `StartTrial` atómico e idempotente disparado únicamente por elección explícita del usuario, onboarding financiero reutilizando Accounts/Transactions existentes.

**Definition of Done:** `trial_started_at` nunca se fija en signup, doble submit de `StartTrial` produce un único trial/grant, elegibilidad de trial excluye trial/pago/promo previos, checkout pendiente nunca otorga Pro, onboarding financiero no duplica lógica de dominio.

## Explicitly Deferred

No se generan tasks de implementación para investments, bank sync, advanced FX, taxes, household sharing, complex amortization, OCR, full RAG, semantic search, autonomous advisor, advanced scenarios, card minimum payments, rollover budgets, coupons, multi-tier billing, provider-independent recurring billing, mobile push, SMS, notification privacy levels or advanced escalation rules. Se consideran capacidades posteriores y aparecen como límites en las tasks relacionadas.

Adicionalmente quedan explícitamente deferred: billing discounts/coupons (`docs/10.5-discounts-and-coupons.md`, percentage/fixed discounts on Mercado Pago checkout, discount reservations, 100%/forever discounts) — ver Traceability Matrix; stackable/queued promotion codes, promotion campaigns, bulk promotion code generation, influencer/affiliate attribution codes (`docs/10.3`); affiliate accounts, monetary affiliate commissions/payouts, multi-level referrals, revenue sharing (`docs/10.4`); partial refunds beyond a trivial provider case, proration, annual-plan billing/refund logic, automated retention offers, subscription pause (`docs/10-6`); commercial admin impersonation, four-eyes approval workflows, dynamic commercial configuration editing (`docs/21`); session replay, heatmaps, complex multi-touch attribution, predictive churn ML, A/B testing platform (`docs/22`); any external/sold statistical data product, differential privacy, data clean rooms (`docs/23-data-analytics-privacy-and-monetization.md`); adaptive/personalized onboarding, AI-assisted free-text goal parsing, per-country onboarding variants (`docs/23-onboarding-firstuse.md`).
