# Open Questions and Decisions

Las decisiones resueltas son normativas para las tasks. Las decisiones configurables deben quedar parametrizadas, no hardcodeadas. No quedan preguntas abiertas.

## Resolved

### OQ-001 — Adjustment Direction

- **Status:** RESOLVED.
- **Documents:** `docs/03-money-debt-engine.md`, `docs/14-dashboard-cashflow-slice.md`, `docs/15-budgets-slice.md`, `AGENTS.md`.
- **Decision:** usar `ADJUSTMENT_IN` y `ADJUSTMENT_OUT`; no persistir un adjustment genérico sin dirección.
- **Implementation:** `docs/adr/ADR-001-adjustment-direction.md`.
- **Impact:** TASK-013, balance/reporting queries, migrations and recovery audit.

### OQ-002 — Budget Category Hierarchy and Overlap

- **Status:** RESOLVED.
- **Documents:** `docs/15-budgets-slice.md`, `docs/02-database-schema.md`.
- **Decision:** un budget padre incluye todos sus descendientes. Se permiten budgets padre/hijo superpuestos y cada uno funciona como comparación independiente.
- **Invariant:** la superposición no representa doble gasto financiero; solo repite el gasto dentro de dos comparaciones presupuestarias.
- **Impact:** TASK-030 query semantics, UI explanation and tests.

### OQ-006 — Payment Reversal

- **Status:** RESOLVED.
- **Documents:** `docs/12-debts-installments-payments-slice.md`, `docs/19-security-privacy.md`.
- **Decision:** V1 crea pagos, pero no permite editar ni eliminar `DebtPayment`. Payment reversal queda fuera del primer slice y requerirá una decisión/ADR futura antes de exponerse.
- **Impact:** TASK-021 and TASK-022 must omit edit/delete/reversal actions.

### OQ-007 — Archived Account Balance on Dashboard

- **Status:** RESOLVED.
- **Documents:** `docs/05-mvp-roadmap.md`, `docs/14-dashboard-cashflow-slice.md`.
- **Decision:** excluir cuentas archivadas del liquid balance actual. Antes de archivar una cuenta con saldo no cero, mostrar una advertencia; el historial sigue accesible.
- **Impact:** TASK-008, TASK-011 and TASK-029.

### OQ-008 — README/Repository Status Drift

- **Status:** RESOLVED.
- **Documents:** `README.md`, `docs/05-mvp-roadmap.md`, repository code.
- **Decision:** README debe indicar que Auth y migrations ya existen. No recrear esas capabilities.
- **Impact:** repository onboarding and TASK-001/TASK-003/TASK-004 status interpretation.

## Resolved as Configurable

### OQ-003 — Billing Commercial Catalog

- **Status:** RESOLVED AS CONFIGURABLE.
- **Documents:** `docs/10.1-subscription-plans-and-limits.md`, `docs/10-billing-subscriptions-mercadopago.md`, `docs/16-billing-mercadopago-slice.md`.
- **Decision:** usar estados `TRIAL` de 14 días, `PRO` mediante `PRO_MONTHLY` confirmado por provider y `EXPIRED_READ_ONLY`; no existe `FREE` permanente.
- **Implementation:** trial interno sin Mercado Pago, `ProductAccessResolver` server-side, precio inicial configurable de USD 7.99/mes y entitlements/allowances por estado.
- **Impact:** TASK-032, TASK-034, TASK-035, TASK-045, AI/notifications and production configuration.

### OQ-004 — Billing Grace Period

- **Status:** RESOLVED AS CONFIGURABLE.
- **Documents:** `docs/10-billing-subscriptions-mercadopago.md`, `docs/16-billing-mercadopago-slice.md`.
- **Decision:** usar `BILLING_GRACE_PERIOD_DAYS`. No fijar todavía un valor de producción; la configuración debe validarse y documentarse por entorno.
- **Impact:** TASK-034, TASK-035 and entitlement resolver/UI.

### OQ-009 — AI Entitlement and Usage Limits

- **Status:** RESOLVED AS CONFIGURABLE.
- **Documents:** `docs/08-ai-openrouter.md`, `docs/16-billing-mercadopago-slice.md`, `docs/17-ai-categorization-slice.md`.
- **Decision:** implementar entitlement y quota server-side. AI debe poder desactivarse por configuración sin romper el core financiero.
- **Implementation:** `AI_ENABLED`, capability entitlement and per-user usage quota; no client-only gate.
- **Impact:** TASK-036, TASK-037, TASK-035 and production configuration.

### OQ-010 — Recovery Objectives

- **Status:** RESOLVED PROVISIONALLY.
- **Documents:** `docs/18-production-readiness.md`, `docs/20-backup-recovery.md`.
- **Decision:** baseline de lanzamiento: RPO <= 1 hour y RTO <= 4 hours. Retention, infraestructura y valores efectivos deben quedar documentados/configurados según la capacidad real del proveedor.
- **Impact:** TASK-042 through TASK-044 and Railway plan selection.

## Still Open

Ninguna.

### OQ-005 — Mercado Pago Cancellation Semantics

- **Status:** RESOLVED.
- **Documents:** `docs/10-billing-subscriptions-mercadopago.md`, `docs/16-billing-mercadopago-slice.md`, `docs/10-6.subscription-cancellation-refunds.md`.
- **Decision:** verificado contra la documentación oficial de Mercado Pago: la cancelación de `preapproval` es siempre inmediata (`PUT status=cancelled`), sin mecanismo de cancelación programada. Solo las suscripciones `paused` (no `cancelled`) documentan reactivación; pausar queda fuera de alcance. No se implementa reactivación de una suscripción cancelada; la única vía de vuelta a `PRO` es una suscripción nueva.
- **Implementation:** `docs/adr/ADR-002-mercadopago-cancellation-semantics.md`.
- **Impact:** TASK-057 cancellation UX/copy, `BillingProvider` capability flags, no promotional-grant fallback change required.

## ADR Candidates

Ninguno pendiente.
