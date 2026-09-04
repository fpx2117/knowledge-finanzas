# 06 — Domain Event Catalog

Basado en doc 14 §9 (contratos cross-module) y §19 (invalidación).

**Estado de implementación (actualizado 2026-09-04, WP-EVENT-TAGS):** sin bus de eventos explícito —
las páginas leen fresco de los servicios en cada request (sin `unstable_cache`), así que la
invalidación real es del Router Cache de Next vía `revalidatePath`. Implementado:
`apps/web/src/lib/events/emit-financial-event.ts` — un único mapa evento→paths que reemplazó las
~85 llamadas a `revalidatePath` que antes vivían dispersas en cada action (y que ya habían perdido
al menos un caso real: anular una transacción no invalidaba `/budgets`). Tags por-usuario
(`revalidateTag('user:<id>:...')`) quedan diferidos hasta que la app efectivamente adopte
`unstable_cache` en sus páginas — construirlos antes sería infraestructura sin capa que la use.

## Catálogo

Para cada evento: **Producer** · **Payload mínimo** · **Consumers / invalidar** · **Read models afectados**
· **Analytics** · **Insight reeval** · **Idempotencia**.

### `transaction.created` (CM-01)
- Producer: 03 Transacciones / 10 Registrar.
- Payload: `{ transactionId, userId, accountId, type, amount, currency, categoryId?, occurredLocalDate, commandId }`.
- Invalidar: `accounts` (balance), `transactions`, `dashboard`, `budgets` (si EXPENSE/REFUND en categoría con budget), `reports`, `insights`.
- Read models: account balance, budget spent(month,category), report aggregates, spendable/cashflow.
- Analytics: `transaction.created` (sin monto exacto).
- Insight reeval: gasto vs presupuesto, anomalía de monto, comercio recurrente.
- Idempotencia: **por `commandId`** (unique) — hoy FALTA.

### `transaction.updated` (CM-02)
- Producer: 03.
- Payload: `{ transactionId, changed: [amount|date|account|category|type], before, after, commandId }`.
- Invalidar: todos los derivados afectados por los campos cambiados (potencialmente 2 cuentas, 2 meses de budget, 2 categorías).
- Idempotencia: version/check optimista sobre la fila.

### `transaction.voided` (CM-03)
- Producer: 03.
- Payload: `{ transactionId, reason, commandId }`.
- Invalidar: igual que created; **sin borrar la fila** (trazabilidad §5.1).
- Read models: revertir delta de balance/consumo.

### `transfer.created` (CM-04)
- Producer: 03 / 10.
- Payload: `{ transferId, userId, fromAccountId, toAccountId, amount, currency, occurredLocalDate, commandId }`.
- Invalidar: `accounts` (ambas), `transactions`, `dashboard`, `reports`.
- Read models: 2 balances; **excluir de income/expense** (`INTERNAL_TRANSFER`).
- Idempotencia: `commandId` + atomicidad (una TX DB, 2 legs).

### `transfer.voided`
- Producer: 03. Void emparejado de ambas legs, atómico.

### `obligation.created` (CM-05)
- Producer: 05 / 10.
- Payload: `{ obligationId, userId, kind: debt|installment_plan|subscription, totalAmount, currency, schedule, commandId }`.
- Invalidar: `obligations`, `dashboard` (disponible conservador), `calendar`, `cash-flow`, `insights`.

### `obligation.updated`
- Producer: 05. Cambios de monto/fecha/estado → mismos consumidores.

### `obligation.payment_linked` (CM-06)  — **invariante anti doble conteo §14.1**
- Producer: 05 + 03.
- Payload: `{ obligationId, paymentId, transactionId (LIABILITY_PAYMENT), allocation[], amount, commandId }`.
- Invalidar: `obligations` (outstanding), `transactions`, `accounts` (balance −), `dashboard`, `reports`.
- Regla: el pago reduce **balance**, no **consumo de presupuesto**; la obligación pagada sale de `obligations[]` de `calculateSpendable`.
- Idempotencia: `commandId`; lock de fila de deuda; sin overpayment.

### `budget.updated` (CM-07)
- Producer: 04.
- Payload: `{ budgetId, userId, month, categoryId, limit, commandId }`.
- Invalidar: `budgets`, `dashboard`, `reports` (budget), `insights`.

### `goal.updated` / `goal.allocation.created` (CM-08)
- Producer: 07.
- Payload: `{ goalId, userId, allocationId?, direction: contribution|withdrawal, amount, currency, linkedTransactionId?, commandId }`.
- Invalidar: `goals`, `dashboard`, `reports`/`insights` si aplica.
- Regla: **no** crear EXPENSE artificial; **no** reducir disponible V1 (PD-007).
- (Requiere WP-GOALS-ALLOC para existir con semántica derivada.)

### `category.assignment.changed` (CM-09)
- Producer: 11 / 03.
- Payload: `{ transactionId, fromCategoryId, toCategoryId, taxonomyNodeId, commandId }`.
- Invalidar: `transactions`, `budgets` (ambas categorías), `reports`, `insights`; registrar **señal de aprendizaje** personal; ofrecer crear regla.

### `personal_rule.created` / `.changed` (CM-10)
- Producer: 11.
- Payload: `{ ruleId, userId, matcher, action, priority, commandId }`.
- Invalidar: `capture` previews, `imports` previews, `classification` previews.
- Regla: preview + impacto calculable antes de aplicar retroactivo (§42).

### `pending_item.resolved` (CM-11)
- Producer: 03.
- Payload: `{ pendingId, resolution: confirmed|merged|discarded|categorized, resultTransactionId?, commandId }`.
- Invalidar: ledger/read models según tipo.

### `user.timezone.changed` (CM-12)
- Producer: 11.
- Payload: `{ userId, fromTz, toTz }`.
- Invalidar: queries de calendario, labels de período local, schedules de notificación.
- Regla: **no** reescribir timestamps históricos; sólo representación local (§23.2).

### `subscription.entitlement.changed`
- Producer: plataforma (webhooks Billing reconciliados).
- Payload: `{ userId, fromState, toState, effectiveAt }`.
- Invalidar: shell gates, `/settings/plan`, acceso de escritura premium.
- Regla: nunca perder datos por downgrade; lectura + export preservados.

## Consistencia (§19.1)

- El write model confirma primero su mutación propia.
- **Saldo de cuenta y anti-doble-conteo** → consistencia fuerte o transición explícita "actualizando".
- Read models de reportes → pueden ser eventualmente consistentes **con marca visible** (`stale`).
