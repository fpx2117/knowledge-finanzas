# 05 — Domain Ownership Registry

Basado en doc 14 §6. Un único owner lógico por concepto; los consumidores leen read models / APIs
del owner y **no replican lógica financiera crítica**.

Permisos: **READ** (consulta) · **COMMAND** (muta vía owner) · **DERIVE** (calcula read model propio a
partir del owner) · **CACHE** (cachea con invalidación explícita, nunca como fuente de verdad).

| Entidad | Owner (módulo) | Tabla(s) / package | Autoridad sobre | Consumidores y su permiso |
|---|---|---|---|---|
| `Account` | 02 Cuentas | `accounts`; `finance/accounts` | tipo, moneda, estado, opening, ownership; **saldo derivado** | 03 READ · 01 READ+DERIVE · 08 READ+DERIVE · 10 READ · 06 READ |
| `Transaction` | 03 Transacciones | `transactions`; `finance/transactions` | hecho confirmado / estado del movimiento | 01,02,04,05,06,08,09 READ+DERIVE · 10 COMMAND · 02 DERIVE(balance) |
| `Transfer` | 03 Transacciones | `transfers` (+ 2 legs en `transactions`); `finance/transfers` | movimiento interno atómico, neto 0 | 01,02,06,08 READ · 10 COMMAND |
| `RecurringRule` / `RecurringSeries` | 03 Transacciones | `recurring_transactions`, `recurring_series`; `finance/recurrence` | patrón + generación programada | 05,06,09 READ · 10 COMMAND |
| `ScheduledTransaction` | 03 Transacciones (planning) | `scheduled_transactions` | evento futuro explícito; no muta balance hasta post | 05,06 READ · 01 DERIVE · 10 COMMAND |
| `Budget` | 04 Presupuestos | `budgets`, `budget_alerts`; `finance/budgets` | límite mensual por categoría | 01,03,08,09 READ+DERIVE |
| `Obligation` (deuda/cuota/suscripción) | 05 Obligaciones | `debts`, `debt_installments`, `debt_payments`, `debt_payment_allocations`, `subscriptions`; `finance/debt` | compromiso futuro + estado de pago + outstanding | 01,03,06,08,09 READ+DERIVE · 10 COMMAND |
| `CalendarEvent projection` | 06 Calendario | `features/calendar/services` | proyección temporal **derivada**; NO fuente de verdad | 01,05,08 READ |
| `Goal` | 07 Metas | `goals` (+ pendiente `goal_allocations`); `features/goals` | intención de ahorro + progreso por asignaciones | 01,08,09 READ |
| `Report read model` | 08 Reportes | `features/reports/services` | agregación analítica **reconstruible** + `calculationVersion` | 01,09 READ |
| `Insight` | 09 Insights | `features/insights/services` | señal derivada con evidencia + lifecycle | 01,12 READ |
| `CaptureDraft` | 10 Registrar | `features/capture` (estado efímero, `quick_templates` para atajos) | estado temporal de captura; **nunca ledger** | 03 (recibe command) |
| `Category` | 11 Configuración | `categories` (personal), `category_taxonomy` + `category_map` (canónica), `merchants` | taxonomía personal y del sistema | 03,04,08,10 READ |
| `PersonalRule` | 11 Configuración | `user_classification_rules` | regla explícita del usuario, **prioridad sobre inferencia** | 03,09,10 READ |
| `Merchant` / `MerchantAlias` | 11 / Clasificación | `merchants`, `merchant_aliases`, `merchant_user_defaults` | normalización de comercio | 03,10 READ |
| `ImportBatch` | 10 / 11 | `import_batches`, `duplicate_dismissals` | lote idempotente + fingerprint de fila | 03 READ+COMMAND |
| `HelpArticle / SupportCase` | 12 Ayuda | — (MISSING) | contenido de soporte + diagnóstico read-only | todos READ |
| `Session / Entitlement / ShellState` | 13 Application Shell | `session`, `billing_subscriptions`, `admin_roles`; `packages/billing` `ProductAccessResolver` | estado transversal **no financiero** | todos READ |
| `Notification` | plataforma (fuera 01–13) | `notifications`, `notification_*`; `packages/notifications` | avisos + preferencias + entregas | 13 READ · dominios COMMAND(emit) |
| `BillingSubscription` | plataforma | `billing_*`; `packages/billing` | verdad comercial **reconciliada con proveedor** | 11,13 READ · webhooks COMMAND |
| `AICreditLedger` | plataforma | `ai_credit_entries`, `ai_credit_reservations`; `packages/ai` | metering de IA | capabilities COMMAND · 11 READ |

## Reglas de ownership a hacer cumplir

1. **Balance** sólo lo deriva 02 (y 01 puede re-derivar para presentación con el mismo cálculo versionado). Prohibido: lógica de balance duplicada en Dashboard (anti-pattern #2).
2. **Dinero disponible** = un único servicio versionado (`calculateSpendable`); cualquier superficie que lo muestre lo consume, no lo recomputa (§11.1).
3. **Consumo de presupuesto** sólo lo deriva 04, a partir de `consumptionDelta` del ledger, no de `type` crudo.
4. **Registrar** nunca escribe entidades: emite command al owner (§25).
5. **IA** nunca es owner de ningún concepto financiero (§17).
6. **Calendario / Reportes / Insights** son DERIVE puros: no pueden mutar un hecho confirmado (§5.1).
