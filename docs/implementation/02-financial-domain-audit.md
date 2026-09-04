# 02 — Financial Domain Audit

Alcance auditado directamente: `packages/finance/src/{money,transfers,accounts,transactions,projections}`.
Alcance por verificar con integración/lectura de app: application services (transfer, debt payment,
transaction write), dashboard aggregation, budgets consumption query.

Severidad: **CRITICAL** (bloquea features dependientes) / **HIGH** / **MEDIUM** / **LOW**.

## 1. MONEY — `money/money.ts`, `money/rounding.ts`, `money/currency.ts`

| # | Hallazgo | Severidad | Detalle |
|---|---|---|---|
| M-1 | Aritmética exacta correcta | ✅ | `decimal.js`; nunca `number`. `ROUND_HALF_UP` centralizado. `add/subtract/compare/equals` guardan `assertSameCurrency` y lanzan en mismatch. |
| M-2 | Parsing estricto | ✅ | `fromString` valida `/^[+-]?(\d+(\.\d+)?|\.\d+)$/`; `fromPositiveString` exige `> 0`. |
| M-3 | Split sin pérdida de centavos | ✅ | `splitAmount`: cuotas con `ROUND_DOWN`, resto asignado a la última parte. Rechaza negativos y `parts` no-entero. |
| M-4 | ~~Escala DB (`numeric(20,6)`) vs escala de moneda~~ **RESUELTO 2026-09-04** | — | Decisión del usuario: la DB debe preservar sub-centavos. Implementado como "settle-once" (ADR-IMPL-002): `Money` ya no redondea en cada operación — sólo al final (`toString()`/`split()`). Ver WP-MONEY-SCALE en `10-work-packages.md`. |
| M-5 | Serialización | LOW | `toString()` usa `toFixed(decimalPlaces)`. No hay `toJSON` explícito; verificar que los server actions serializan como string y no como `number` al cruzar el boundary RSC→cliente. |
| M-6 | Catálogo de monedas | UNVERIFIED | Revisar `currency.ts`: ¿ARS y USD con `decimalPlaces: 2`? ¿monedas no soportadas lanzan? |

**Conclusión MONEY:** núcleo sólido. Sólo M-4 requiere una decisión de política antes de Fase C.

## 2. LEDGER — `transactions/ledger-classification.ts`, `accounts/calculate-balance.ts`

| # | Hallazgo | Severidad | Detalle |
|---|---|---|---|
| L-1 | Clasificación económica correcta | ✅ | `classifyLedgerEffect`: `EXPENSE`→balance −, consumo +; `REFUND`→balance +, consumo −; `TRANSFER_IN/OUT`→`INTERNAL_TRANSFER`, consumo **0**; `ADJUSTMENT_*`→`BALANCE_ADJUSTMENT`, consumo **0**; `VOIDED`→todo **0**. Cumple invariantes §5, §6, §13. |
| L-2 | Balance derivado, no editable | ✅ | `calculateAssetAccountBalance` = opening + income − expense + refund + adjIn − adjOut + transferIn − transferOut − liabilityPayment. No hay columna `balance` mutable en `accounts` (verificado en schema). Cumple §4.5 / PD-004. |
| L-3 | ~~Sin guard de exhaustividad de tipos~~ **CRITICAL, CONFIRMADO Y RESUELTO 2026-09-04** | ~~HIGH~~ CRITICAL (era especulación de riesgo; se confirmó como bug real) | `calculateAssetAccountBalance` toma totales opcionales con default `"0"` — y **las tres queries SQL que alimentan esos totales omitían `TRANSFER_IN`/`TRANSFER_OUT`**. Efecto real: transferir dinero entre cuentas propias no cambiaba el saldo mostrado en `/accounts`, `/accounts/:id` ni `/dashboard`. Confirmado con un test que falló antes del fix (`tests/integration/transfer-balance.test.ts`). **Fix:** `packages/db/src/queries/ledger-totals.ts` — única función `buildLedgerTotalColumns()` respaldada por un `Record` exhaustivo sobre `transactionTypeEnum.enumValues` (guardia de compilación: un type nuevo sin mapear rompe el build). Las 3 queries + 2 consumidores migrados. Ver WP-LEDGER-EXHAUSTIVE en `10-work-packages.md`. |
| L-4 | `originalTransactionId` / `relatedTransactionId` / `reason` presentes | ✅ | Soporta refund con vínculo y trazabilidad de anulación (§5.1, §13). |
| L-5 | **Idempotencia de escritura ausente** | **CRITICAL** | `transactions` no tiene `command_id`/`idempotency_key` ni unique. Un timeout de red + retry del server action puede crear un movimiento duplicado. Viola §38. Bloquea la certificación de Fase B y el gate G3. |
| L-6 | Recálculo de derivados en edit/void | UNVERIFIED | `classifyLedgerEffect` da la primitiva correcta, pero falta verificar que `transactions/actions` (editar/anular) dispara invalidación de budget/report/insight/dashboard (CM-02/03, §19). |
| L-7 | Ownership en cada lookup/mutación | UNVERIFIED | `packages/shared/permissions` + helpers de TASK-007 existen; `tests/integration/security-idor-and-concurrency.test.ts` cubre accounts/categories/transactions/debts/transfers/budgets. Confirmar cobertura para goals, scheduled, recurring, imports. |

## 3. TRANSFERS — `transfers/validate-transfer.ts`

| # | Hallazgo | Severidad | Detalle |
|---|---|---|---|
| T-1 | Semántica propia, neto 0 | ✅ | `calculateTransferAssetDelta` → `consolidatedDelta = Money.zero` sólo si legs válidos (OUT+IN, distinta cuenta, misma moneda, mismo monto). Cumple PD-005 / §6. |
| T-2 | Sólo misma moneda | ✅ | `TRANSFER_CURRENCY_MISMATCH` si `from.currency ≠ to.currency` o `input.currency ≠ from.currency`. Cumple §22 (no FX). |
| T-3 | Validaciones completas | ✅ | not-found, archived, same-account, cross-user (como not-found, no filtra existencia), amount inválido, fecha futura, antes de apertura. |
| T-4 | Atomicidad e idempotencia del *application service* | **RESUELTO 2026-09-04** | Confirmado: `createTransferService.createTransfer` corre dentro de `database.transaction`, toma `FOR UPDATE` de ambas cuentas, crea exactamente un `TRANSFER_OUT`+`TRANSFER_IN` con el mismo `transferId` (ya existía, TASK-015). **Idempotencia agregada**: `transfers.command_id` + índice único parcial (mig 0040); short-circuit + rescate de `23505`. `transfer-idempotency.test.ts` (4, Postgres real, incl. carrera concurrente). Void emparejado (TASK-016) sigue sin idempotency key propia — no crítico (voidTransfer es idempotente por estado: `TRANSFER_ALREADY_VOIDED`). |
| T-5 | Reporting sin doble conteo | UNVERIFIED | Confirmar que reportes de gasto/ingreso excluyen `economicClass = INTERNAL_TRANSFER` y que "flujo de caja" por cuenta sí los muestra (CF-03.8). |

## 4. OBLIGATIONS / DEBT — `debt/*`, `projections/spendable-money.ts`

| # | Hallazgo | Severidad | Detalle |
|---|---|---|---|
| O-1 | Motor de cuotas y allocation | ✅ | `generateInstallments`, `installment-dates` (anchor-day), `allocatePayment` (oldest-due-first / manual), `calculateDebtRemaining`, `calculateInstallmentRemaining`, `deriveDebtStatus`, `deriveInstallmentStatus`. Rechaza overpayment (`payment-allocation-errors`). |
| O-2 | Pago parcial actualiza outstanding | ✅ | Cubierto por allocation engine + `debt_payment_allocations`. |
| O-3 | **Anti doble conteo (§14.1) no verificable en unidades puras** | **CRITICAL a verificar** | El invariante "saldo 1M − oblig 300k → pago → saldo 700k − oblig 0 = disponible 700k (no 400k)" depende de: (a) `LIABILITY_PAYMENT` reduce balance pero `consumptionDelta = 0`; (b) `calculateSpendable` deja de contar la obligación una vez `remainingAmount = 0` (filtro `amount.gt(0)` — ✅ en código); (c) el caller que arma `obligations[]` para `calculateSpendable` excluye/actualiza la obligación pagada. Falta test de integración end-to-end que ejerza los tres. |
| O-4 | `LIABILITY_PAYMENT` no está en `LedgerTransactionType` | HIGH | `ledger-classification.ts` enumera INCOME/EXPENSE/REFUND/ADJUSTMENT_*/TRANSFER_*, **no `LIABILITY_PAYMENT`**, pero `calculate-balance.ts` sí resta `liabilityPaymentTotal`. Inconsistencia: el pago de deuda se modela fuera del clasificador. Verificar cómo se persiste (¿`transactionType` propio? ¿tabla `debt_payments` sin fila en `transactions`?) y si eso rompe el drill-down del ledger. |
| O-5 | Impacto conservador en "disponible" antes del pago | ✅ (estructura) | `calculateSpendable` resta `committedObligations` con `dueDate <= horizonEnd`. |
| O-6 | Concepto unificado "Obligación" | MEDIUM (arch) | Spec 05 abarca deuda + suscripción + programado + recurrente como una superficie. Hoy son 4 tablas sin read model unificado. No es error financiero pero sí deuda de arquitectura para Reportes/Calendario/Resumen. |

## 5. BUDGET — `budgets/calculate-budget.ts`

| # | Hallazgo | Severidad | Detalle |
|---|---|---|---|
| B-1 | Estados y umbral | ✅ | `calculateBudget`, `BUDGET_NEAR_LIMIT_PERCENT`, `resolveBudgetAlertType`. |
| B-2 | Exclusión de transferencias internas | UNVERIFIED / HIGH | §13 exige que transferencias no consuman presupuesto. `classifyLedgerEffect` da `consumptionDelta = 0` para transfers → correcto **si** la query de spent usa `consumptionDelta` y no `type IN (EXPENSE, ...)` ingenuo. Verificar la query real. |
| B-3 | Pago de deuda no re-consume | UNVERIFIED / HIGH | §13. Verificar que `LIABILITY_PAYMENT` no entra en spent. |
| B-4 | Refund reduce consumo por vínculo semántico | UNVERIFIED | `consumptionDelta` negativo para REFUND ✅; verificar que la agregación mensual lo aplica a la categoría correcta. |
| B-5 | Mes por timezone del usuario | PARTIAL | `monthRangeForTimezone` existe; verificar uso consistente y tests de borde. |

## 6. PROJECTION — `projections/{cashflow,spendable-money,upcoming,normalize-inputs,reminders}.ts`

| # | Hallazgo | Severidad | Detalle |
|---|---|---|---|
| P-1 | Ingresos futuros NO aumentan disponible actual | ✅ | `calculateSpendable` sólo resta compromisos; no suma ingresos. Cumple §11 / PD-014. |
| P-2 | Horizonte 30 días | LOW | `horizonDays: 30` fijo en `calculateSpendable`. **Foundation §10 confirma "proyección de flujo de caja a 30 días" como decisión de producto** → el valor es correcto. Sólo dejar la ventana de *dinero disponible* configurable si producto decide que difiera de 30d (spec 14 §49.1). No bloquea. |
| P-3 | Proyección reconstruible y separada | PARTIAL | `normalizeProjectionInputs` + engines puros → reconstruible ✅. Falta `calculationVersion` explícito y que la UI marque estilo semántico ≠ confirmado (§12). |
| P-4 | Cashflow multimoneda | UNVERIFIED | Verificar que `calculateCashflow` no mezcla monedas. |

## 7. MULTICURRENCY

| # | Hallazgo | Severidad | Detalle |
|---|---|---|---|
| X-1 | Guardas en primitivas | ✅ | `Money` lanza en mismatch; `calculateSpendable` lanza `CURRENCY_MISMATCH`; transfer exige misma moneda. |
| X-2 | Agregación de dashboard / patrimonio | UNVERIFIED / HIGH | Verificar que "saldo total" y "patrimonio" se presentan **separados por moneda** y nunca como "equivalente" sin FX (§22, anti-pattern #3). Falta test de KPI con cuentas ARS+USD. |
| X-3 | Reportes cross-account | UNVERIFIED | Igual que X-2 para `/reports/*`. |

## 8. Scripts de integridad existentes

`packages/db/src/audit/finance-audit.ts` + `pnpm finance:audit` (5 validadores SQL):
leg pairing de transferencias, igualdad pago↔allocation de deuda, no-overpaid-installments,
consistencia ownership/moneda de transacciones, integridad de link scheduled→posted.
`pnpm recovery:validate` orquesta restore→migration→audit→row-count.
**Recomendación:** ampliar con validadores para (a) balance derivado == suma de deltas por cuenta,
(b) `goal.currentAmount` == suma de asignaciones (post WP-GOALS-ALLOC), (c) budget spent recomputable.

## 9. Veredicto y bloqueos

| Feature dependiente | Bloqueada por |
|---|---|
| Certificar Fase B (captura/verdad) y gate **G3** | **L-5 / T-4** (idempotencia de escritura) — CRITICAL |
| Certificar Obligaciones y gate **G1** | **O-3** (test anti-doble-conteo end-to-end) — CRITICAL a verificar |
| Dashboard V1 "definitivo" | X-2 (multimoneda), P-2 (política de horizonte), M-4 |
| Presupuestos "confiables" | B-2 / B-3 (queries de consumo) |
| Metas reconstruibles | B-4 doc 01 (WP-GOALS-ALLOC) |

**El núcleo puro de `packages/finance` está en buen estado.** Los riesgos CRITICAL/HIGH están en
la **frontera de aplicación** (idempotencia, queries de agregación, tests de integración cross-module),
no en la matemática. Ninguna feature nueva debe declararse DONE sin cerrar el hallazgo CRITICAL que la toca.
