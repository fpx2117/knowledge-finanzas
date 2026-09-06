# 07 — Data Model Audit

Fuente: `packages/db/src/schema.ts` (~1354 líneas, ~60 tablas), migraciones `0000–0038`.
**No se propone ninguna migración todavía** (checkpoint). Sólo hallazgos y propuestas.
Detalle de constraints/índices por tabla: parcialmente `UNVERIFIED` (schema leído en bloques, no íntegro).

## Cobertura de entidades de la spec

| Entidad spec | Tabla(s) | Estado |
|---|---|---|
| Account | `accounts` | ✅ |
| Transaction (ledger) | `transactions` (precision 20/scale 6, enum type/status/source, `originalTransactionId`, `relatedTransactionId`, `transferId`, `scheduledTransactionId`, `taxonomyNodeId`, `paymentMethod`, `classification` jsonb, `occurredAt` tz, `postedAt`) | ✅ estructura; ⚠️ ver D-1 |
| Transfer | `transfers` + 2 legs en `transactions` | ✅ |
| RecurringRule | `recurring_transactions`, `recurring_series` | ✅ |
| ScheduledTransaction | `scheduled_transactions` | ✅ |
| Budget | `budgets`, `budget_alerts` | ✅ |
| Obligation | `debts`, `debt_installments`, `debt_payments`, `debt_payment_allocations`, `subscriptions` | ✅ fragmentado (ver D-3) |
| Goal | `goals` + `goal_allocations` (INITIAL/CONTRIBUTION/WITHDRAWAL); `current_amount` es cache re-sincronizado + audit check | ✅ D-2 cerrado 2026-09-05 |
| Category | `categories`, `category_taxonomy`, `category_map` | ✅ |
| Merchant | `merchants`, `merchant_aliases`, `merchant_user_defaults` | ✅ |
| PersonalRule | `user_classification_rules` | ✅ |
| ImportBatch | `import_batches`, `duplicate_dismissals` | ✅ |
| QuickTemplate | `quick_templates` (`amountHints`) | ✅ |
| Reminder | `reminders` | ✅ |
| Insight | — (sólo `features/insights/services`) | ❌ sin persistencia dedicada → sin lifecycle/history (D-4) |
| Report read model | — | ❌ sin tabla materializada / `calculationVersion` (D-5) |
| HelpArticle / SupportCase | — | ❌ módulo 12 inexistente |
| Session / Entitlement | `session`, `account`, `verification`, `billing_*` | ✅ |
| Notification | `notifications`, `notification_deliveries`, `notification_preferences`, `notification_whatsapp_consent` | ✅ |
| Billing | `billing_plans/subscriptions/periods/payments/webhook_events/refunds/disputes` | ✅ |
| Promo / Referral | `promotion_codes/redemptions`, `promotional_access_grants`, `promotion_access_periods`, `referral_codes/attributions/rewards` | ✅ |
| AI credits | `ai_credit_entries`, `ai_credit_reservations` | ✅ |
| Analytics / Privacy | `analytics_event_log`, `analytics_consents`, `analytics_consent_history`, `analytics_cohort_metrics`, `user_statistical_profiles` | ✅ |
| Onboarding | `user_onboarding`, `user_financial_profiles` | ✅ |
| Admin / Audit | `admin_roles`, `audit_log` (append-only) | ✅ |

## Hallazgos

### D-1 — `transactions` sin idempotency key  · **CRITICAL**
No hay `command_id` / `idempotency_key` ni unique. Viola §38. Sólo `billing_refunds`, notificaciones y
referrals tienen keys de idempotencia.
**Propuesta:** `command_id uuid` nullable + `unique index (user_id, command_id) where command_id is not null`.
Server actions de create/void aceptan y propagan la key; retry se resuelve por lookup de la key.
Mismo tratamiento para el application service de transfer y de debt payment (verificar si ya lo tienen).

### ~~D-2~~ — `goals.currentAmount` mutable → **CERRADO (2026-09-05, WP-GOALS-ALLOC)**
Spec §6.2/§15: "el progreso se deriva de asignaciones a la meta".
**Resuelto:** tabla `goal_allocations` `{ id, userId, goalId, kind: INITIAL|CONTRIBUTION|WITHDRAWAL,
amount (>0), currencyCode, occurredOn, note, accountId?, relatedTransactionId? (nullable, no crea
EXPENSE — CM-08), createdAt }` (mig 0043 + backfill: una `INITIAL` por meta con progreso).
`current_amount` queda como **cache re-sincronizado dentro de la misma transacción** que cada
escritura de allocation (`goal-service.applyAllocation`). Validador
`checkGoalAllocationConsistency` en `finance:audit`: `current_amount == Σ signed allocations` +
ownership/moneda. `withdraw()` nuevo. Probado end-to-end en `tests/integration/goal-allocations.test.ts`.

### D-3 — Obligación sin read model unificado  · **MEDIUM (arquitectura)**
Spec 05 trata deuda + cuota + suscripción + programado como una superficie "Obligaciones".
Cuatro tablas sin vista/servicio que las unifique → Calendario, Reportes, Resumen y `calculateSpendable`
tienen que re-juntar la lista cada uno.
**Propuesta:** servicio `getObligations(userId, horizon)` que normaliza a `UpcomingItem[]` (ya existe
`projections/upcoming.ts` con `sortAndDedupeUpcoming` — extender). No requiere tabla nueva.

### D-4 — Insight sin persistencia  · **MEDIUM**
Sin lifecycle (open/acted/dismissed), sin `/insights/history`, sin cooldown/dedupe persistido.
**Propuesta (cuando se aborde Fase F):** `insights` `{ id, userId, detectorKey, severity, evidence jsonb, status, firstDetectedAt, lastEvaluatedAt, actedAt?, dedupeKey, cooldownUntil }`.

### D-5 — Read models de Reportes sin materialización ni `calculationVersion`  · **MEDIUM**
§42 exige `calculationVersion`. Hoy los servicios calculan on-read sobre queries ad hoc.
**Propuesta:** definir el contrato de read model (input range + filtros → output + `calculationVersion` +
cobertura/warnings §21) antes de construir las 4 vistas P0. Materialización diferible; el contrato no.

### D-6 — Escala monetaria  · **RESUELTO 2026-09-04**
`numeric(20,6)` en DB vs redondeo por-paso en `Money`. Decisión del usuario: la DB **sí** puede
contener sub-centavo (splits, pagos supuestos/estimados, agregados estadísticos). Implementado
como "settle-once" — `Money` sólo redondea al emitir el string final (`toString()`/`split()`), nunca
en cada operación intermedia. Sin cambio de schema (la columna ya era `numeric(20,6)`). Ver
`docs/adr/ADR-IMPL-002-money-settle-once-precision.md` y WP-MONEY-SCALE.

### D-7 — `onDelete` restrictivo  · ✅ / verificar
`transactions.userId`/`accountId` usan `onDelete: "restrict"` — correcto para un ledger (no borrado en
cascada). Verificar que **toda** entidad financiera use `restrict` o soft-delete, nunca `cascade`.

### D-8 — Soft delete / audit uniformes  · UNVERIFIED
Verificar patrón consistente de `archivedAt`/`voidedAt` + timestamps en todas las tablas de dominio, y que
las operaciones sensibles escriben `audit_log`.

## Índices críticos a confirmar (UNVERIFIED)

- `transactions (user_id, account_id, occurred_at)` y `(user_id, taxonomy_node_id, occurred_at)` para reportes.
- `transactions (user_id, status, type)` para agregación de balance.
- `debt_installments (debt_id, due_date)` para próximos vencimientos.
- Unique parcial de idempotencia (D-1).
- `budgets (user_id, month, category_id)` unique de budget activo (OQ-002 permite padre/hijo — verificar semántica del unique).
