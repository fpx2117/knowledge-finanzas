# 11 — Traceability Matrix

Se mantiene durante toda la implementación. Una fila por requisito verificable.
`Status` ∈ IMPLEMENTED / PARTIAL / MISSING / LEGACY / UNVERIFIED / BLOCKED.
`Tests`: nombre de suite o `—`.

| Requirement | Spec | Domain / Owner | API (action/service) | DB | Code (UI/route) | Tests | Status |
|---|---|---|---|---|---|---|---|
| Aritmética decimal exacta | 14 §4.1 | `packages/finance/money` | — | `numeric(20,6)` | — | `packages/finance` unit | IMPLEMENTED |
| No sumar monedas sin FX | 14 §4.2, §22 | `Money.assertSameCurrency`, `calculateSpendable` | dashboard/reports services | — | `/dashboard`, `/reports` | unit ✓ / KPI multimoneda ✗ | PARTIAL |
| Balance derivado del ledger, incl. transferencias | 14 §4.5, PD-004, PD-005 | `calculateAssetAccountBalance`, `ledger-totals.ts` (`buildLedgerTotalColumns`, exhaustivo sobre 8 tipos) | `features/accounts/services`, `features/dashboard/services` | `accounts` (sin col balance) | `/accounts`, `/accounts/[id]`, `/dashboard` | `ledger-total-columns` unit, `transfer-balance` integ (2) | IMPLEMENTED (bug CRITICAL corregido 2026-09-04 — transferencias no movían el saldo mostrado) |
| Idempotencia del create de transacción | 14 §38, Foundation §14 | `finance` (repo `findByCommandId`) | `create-transaction`, `quickCreateTransactionAction` | `transactions.command_id` + idx único parcial (mig 0039) | form + Quick Add (`commandId` hidden) | `transactions-service` unit, `transaction-idempotency` integ (5) | IMPLEMENTED |
| Idempotencia de transfer | 14 §38 | `finance`/`db` (repo `findByCommandId`) | `createTransferService`, `transfer-actions` | `transfers.command_id` + idx único parcial (mig 0040) | `transfer-form` (`commandId` hidden) | `transfer-idempotency` integ (4) | IMPLEMENTED |
| Idempotencia de debt-payment | 14 §38, §14.1 | `finance`/`db` | `createDebtPaymentService`, `recordPaymentAction` | `debt_payments.command_id` + idx único parcial (mig 0041) | diálogo de pago (`commandId` hidden) | `debt-payment-idempotency` integ (4) | IMPLEMENTED |
| Transferencia neto 0 income/expense | 14 §4.6, PD-005 | `validateTransfer`, `calculateTransferAssetDelta`, `classifyLedgerEffect` | `createTransferService` | `transfers` + 2 legs | `/transfers/*` | unit / atomicidad ✗ | PARTIAL |
| Anti doble conteo obligación pagada | 14 §14.1 | `finance/debt`, `calculateSpendable`, `dashboard-service` | `createDebtPaymentService`, `getDashboardSummary` | `debt_payments`, `debt_payment_allocations` | `/debts/*`, `/dashboard` | `anti-double-count` integ (4, wiring real) + `debt-payment-idempotency` integ (4, bajo retry/carrera) | IMPLEMENTED |
| Ingresos futuros no aumentan disponible | 14 §11, PD-014 | `calculateSpendable` | dashboard service | — | `/dashboard` | unit | IMPLEMENTED |
| Metas no reducen disponible V1 | 14 §15, PD-007 | `calculateSpendable` (`reservedAmount` ≠ metas) | goal-service | `goals` | `/goals/*` | unit | IMPLEMENTED |
| Progreso de meta derivado de asignaciones | 14 §15 | `features/goals` | goal-actions | `goals.currentAmount` **mutable**, sin `goal_allocations` | `/goals/[goalId]` | — | PARTIAL |
| Aporte a meta no es gasto | 14 CM-08 | goal-service | goal-actions | — | — | ✗ | UNVERIFIED |
| Presupuesto: transferencias no consumen | 14 §13 | `classifyLedgerEffect` (transfer→consumo 0) | budget service | `budgets` | `/budgets` | ✗ query real | UNVERIFIED |
| Presupuesto: pago de deuda no re-consume | 14 §13 | ledger classification | budget service | — | `/budgets` | ✗ | UNVERIFIED |
| Refund reduce consumo por vínculo | 14 §13, §5 | `calculateRemainingRefundable` | create-transaction (REFUND) | `transactions.originalTransactionId` | `/transactions/*` | ✗ | UNVERIFIED |
| Anular recalcula derivados | 14 CM-03 | `classifyLedgerEffect` | `void-transaction.ts` | — | `/transactions/[id]` | — | UNVERIFIED |
| Editar transacción (alcance acotado) | 14 CM-02 | `editTransaction()` | `edit-transaction.ts` | `transactions.updateMetadataForUser` | `/transactions/[id]` | `transactions-service` unit (9), `transaction-edit` integ (4, incl. IDOR) | PARTIAL — descripción/comercio/categoría/notas; monto/fecha/cuenta/tipo no editables por decisión de producto |
| Import CSV/TSV idempotente + preview | 14 CF-05, §10 | `features/imports` | imports actions | `import_batches`, `duplicate_dismissals` | `/transactions/importaciones` | ✗ | PARTIAL |
| Detección de duplicados en captura | spec captura §20/21 | `features/transactions` detection | duplicate-review-actions | `duplicate_dismissals` | `/transactions/duplicados` | — | PARTIAL |
| Registrar = command surface, no owner | 14 §25, PD-002 | `features/capture` | quick-actions | `quick_templates` | Quick Add global (`N`/`Cmd+K`) | — | PARTIAL |
| Parser NL español determinístico | 14 §17.2 | `features/capture/lib` | — | — | Quick Add | unit (memoria) | IMPLEMENTED |
| Dinero disponible explicable | 14 §11.1 | `calculateSpendable` (versionado ✗) | dashboard service | — | `/dashboard` | ✗ | PARTIAL |
| Saldo proyectado ≠ estilo confirmado | 14 §12 | `calculateCashflow` | dashboard/calendar | — | `/dashboard`, `/calendar` | ✗ | UNVERIFIED |
| Reportes con drill-down al ledger + calculationVersion | 14 §16, §42 | `features/reports/services` | reports service | sin read model materializado | `/reports` (1 vista) | — | PARTIAL |
| Reportes P0: gastos/ingresos/cash-flow/categorías | 14 §8, §40 | — | — | — | — | — | MISSING |
| Insights determinísticos con evidence package | 14 §16, CF-09 | `features/insights/services` | insight-service | sin tabla `insights` | `/insights` | — | UNVERIFIED |
| IA sólo explica, no genera señal ni escribe | 14 §17 | `packages/ai` capabilities | ai services | `ai_credit_*` | — | package tests | IMPLEMENTED |
| Core funciona con IA caída | 14 §13, §29 | boundary IA | — | — | — | ✗ degraded-mode | UNVERIFIED |
| Reglas personales prevalecen + preview de impacto | 14 §4.9, §42, CM-10 | classification | classification-rule-actions | `user_classification_rules` | `/settings/rules` | — | PARTIAL |
| Calendario: capas semánticas + timezone | 14 §20, §23, PD-008 | `finance/dates`, calendar service | calendar service | — | `/calendar` | ✗ DST/medianoche | PARTIAL |
| Cambio de timezone no reescribe históricos | 14 §23.2, CM-12 | `dates/timezone` | settings action | — | `/settings/preferences` (✗) | ✗ | UNVERIFIED |
| Módulo Ayuda + diagnóstico read-only | 14 §8 (12), CF-10, PD-011 | — | — | — | — | — | MISSING |
| Command palette sin mutación financiera | 14 §24, PD-012 | shell | — | — | shell | ✗ | UNVERIFIED |
| 404/403 no filtran existencia | 14 §8.1, §26 | route loaders | — | — | `(app)/**` | ✗ | UNVERIFIED |
| Ownership server-side en toda lectura/escritura | 14 §4.14–15, §26 | `packages/shared/permissions` | `requireCurrentUser` + services | — | todas | `security-idor-and-concurrency` (6 dominios) | PARTIAL |
| Entitlement server-side; downgrade sin pérdida | 14 §28 | `ProductAccessResolver` | `(app)/layout` guard | `billing_subscriptions` | shell / `/settings/billing` | package tests | PARTIAL |
| Redirect de checkout no confirma pago | 14 §28, PD-015 | `packages/billing` webhooks | `/api/webhooks/mercadopago` | `billing_webhook_events` | `/billing/return` | package tests | IMPLEMENTED |
| Webhooks verificables e idempotentes | 14 §4.16, §38 | `packages/billing`/`notifications` | route handlers | `billing_webhook_events` | `/api/webhooks/*` | package/integration | IMPLEMENTED |
| Analytics sin datos financieros sensibles | 14 §34 | `packages/analytics` (Zod `.strict()`) | `AnalyticsService.track` | `analytics_event_log` | — | package tests | IMPLEMENTED |
| Onboarding → primera cuenta → 5 mov → dashboard → cashflow | 14 CF-01, §39.3 | — | — | `user_onboarding` | `/onboarding/*`, `/elegir-acceso` | E2E (~13 specs) | PARTIAL |
| Backup/restore + auditoría de integridad | (tasks 42–44) | `packages/db/audit` | scripts | — | — | `finance-audit`, `recovery-validate` | IMPLEMENTED (local) |

## Cómo se mantiene

- Cada PR que cierre un WP actualiza las filas que toca (Status + Tests).
- Filas nuevas se agregan cuando un WP introduce un requisito verificable no listado.
- `UNVERIFIED` → sólo se mueve a IMPLEMENTED/PARTIAL con un test nombrado o evidencia de código citada.
