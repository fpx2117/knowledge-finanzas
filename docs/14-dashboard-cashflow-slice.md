# Dashboard & Cashflow Vertical Slice

## 1. Objetivo

Este documento define el vertical slice para el dashboard financiero completo del MVP y la proyección de cashflow de corto plazo.

El usuario debe poder responder desde una sola vista:

```text
¿Cuánto dinero tengo?

¿Cuánto debo?

¿Qué vence próximamente?

¿Cuánto tengo comprometido?

¿Cuánto puedo gastar?

¿Voy a quedar corto de dinero en los próximos días?
```

El dashboard no es source of truth.

Es un read model construido desde:

```text
Accounts
+
Posted Transactions
+
Debt Installments
+
Payment Allocations
+
Scheduled Transactions
+
Recurring Occurrences
+
Budgets
```

---

# 2. Scope

Incluye:

```text
Liquid Balances

Monthly Income

Monthly Consumption Expenses

Debt Summary

Upcoming Obligations

Estimated Spendable

30-Day Cashflow

Projected End Balance

Minimum Projected Balance

Projected Shortfall

Dashboard Explainability

Multi-Currency Handling

Dashboard Read Models

Performance / Query Strategy

Tests
```

No incluye todavía:

```text
automatic FX conversion

90/180/365-day forecasting

machine-learning forecasts

advanced scenario planning

investment valuation

historical net-worth chart

predictive expenses

AI financial advice
```

---

# 3. Core Principle

Mantener siempre:

```text
Actual
≠
Expected
≠
Committed
≠
Projected
```

Y:

```text
Balance
≠
Spendable
≠
Cashflow
≠
Net Worth
```

La UI debe reflejar estas diferencias.

---

# 4. Dashboard Route

Ruta:

```text
/dashboard
```

Será la pantalla inicial después del login.

---

# 5. Dashboard Questions

Cada bloque debe responder una pregunta concreta.

```text
Liquid Balance
→ ¿Cuánto tengo?

Outstanding Debt
→ ¿Cuánto debo?

Upcoming Obligations
→ ¿Qué vence?

Spendable
→ ¿Qué puedo gastar?

Cashflow
→ ¿Qué puede pasar?
```

---

# 6. Dashboard V1 Layout

Desktop conceptual:

```text
┌───────────────────────────────────────────────┐
│ Disponible estimado                          │
│ $830.000                                     │
│ Saldo $1.250.000 · Comprometido $420.000    │
└───────────────────────────────────────────────┘

┌────────────────────┐ ┌──────────────────────┐
│ Ingresos este mes  │ │ Gastos este mes     │
│ $1.800.000         │ │ $950.000            │
└────────────────────┘ └──────────────────────┘

┌────────────────────┐ ┌──────────────────────┐
│ Deuda pendiente    │ │ Próximos pagos      │
│ $680.000           │ │ $420.000 · 30 días  │
└────────────────────┘ └──────────────────────┘

┌───────────────────────────────────────────────┐
│ Próximos movimientos                         │
│ ...                                           │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│ Proyección · próximos 30 días                 │
│ ...                                           │
└───────────────────────────────────────────────┘
```

---

# 7. Mobile Layout

En mobile:

```text
Spendable

Liquid Balance

Monthly Income

Monthly Expenses

Debt

Upcoming

Cashflow
```

en una sola columna.

No intentar replicar exactamente el grid desktop.

---

# 8. DashboardSummary Read Model

Conceptualmente:

```ts
type DashboardSummary = {
  balances: BalanceSummary[]
  spendable: SpendableSummary[]
  monthly: MonthlySummary[]
  debt: DebtSummary[]
  upcoming: UpcomingSummary[]
  cashflow: CashflowSummary[]
}
```

Los resultados pueden estar separados por currency.

---

# 9. Multi-Currency Rule

No sumar:

```text
ARS
+
USD
```

sin FX explícito.

Si el usuario tiene varias monedas:

```text
ARS
  Balance
  Spendable
  Debt
  Projection

USD
  Balance
  Spendable
  Debt
  Projection
```

---

# 10. Primary Currency Presentation

Si existe:

```text
user.baseCurrency
```

puede mostrarse primero.

Pero V1 no convierte automáticamente otras monedas.

---

# 11. Liquid Balance

Representa dinero actual en cuentas asset.

Incluye:

```text
CASH

BANK

DIGITAL_WALLET

SAVINGS
```

No incluye:

```text
CREDIT_CARD
```

---

# 12. Liquid Balance Formula

Por moneda:

```text
Liquid Balance
=
SUM(current balance of active liquid asset accounts)
```

---

# 13. Archived Accounts

Decisión V1:

las cuentas archivadas con saldo histórico pueden seguir teniendo balance.

Para dashboard actual, recomendación:

```text
exclude archived accounts
```

salvo que producto después incorpore:

```text
include archived balances
```

como setting.

Antes de archivar una cuenta con saldo no cero, la UI debe advertir.

---

# 14. Balance Query

No cargar todas las transacciones en memoria.

Crear query agregada:

```text
getAccountBalances(userId)
```

que produzca:

```ts
{
  accountId
  accountType
  currency
  openingBalance
  movementNet
  currentBalance
}
```

---

# 15. Balance Semantics

Para cuentas asset:

```text
INCOME
+ amount

REFUND
+ amount

TRANSFER_IN
+ amount

EXPENSE
- amount

TRANSFER_OUT
- amount

LIABILITY_PAYMENT
- amount
```

Más adelante:

```text
ADJUSTMENT_IN
ADJUSTMENT_OUT
```

---

# 16. Required Schema Correction — Adjustment Direction

El schema anterior definía:

```text
ADJUSTMENT
```

sin dirección.

Esto es ambiguo.

Antes de implementar ajustes, elegir una de estas opciones:

```text
ADJUSTMENT_IN
ADJUSTMENT_OUT
```

recomendado,

o un campo explícito:

```text
adjustmentDirection
```

No implementar un adjustment sin dirección definida.

---

# 17. Monthly Income

Por moneda:

```text
Monthly Income
=
SUM(POSTED INCOME)
```

dentro del mes financiero actual del usuario.

---

# 18. Monthly Consumption Expense

Por moneda:

```text
Monthly Consumption
=
SUM(qualifying posted consumption)
-
SUM(qualifying refunds)
```

---

# 19. Monthly Expense Exclusions

Excluir:

```text
TRANSFER_OUT

TRANSFER_IN

LIABILITY_PAYMENT

VOIDED transactions
```

---

# 20. Credit Card Purchases

Cuando se implemente tarjeta:

```text
CREDIT_CARD_PURCHASE
```

sí contará como consumo.

Su pago posterior:

```text
LIABILITY_PAYMENT
```

no.

---

# 21. Monthly Result

Se pueden mostrar dos conceptos distintos.

Consumption result:

```text
Income
-
Consumption Expenses
```

Cashflow result:

```text
Cash Inflows
-
Cash Outflows
```

V1 dashboard principal puede mostrar únicamente:

```text
Income

Consumption Expenses
```

para evitar confusión.

---

# 22. Debt Summary

Por moneda:

```text
Outstanding Debt
=
SUM(remaining amount of non-cancelled installments)
```

---

# 23. Debt Summary DTO

```ts
type DebtSummary = {
  currency: CurrencyCode
  outstandingAmount: Money
  overdueAmount: Money
  nextPayment?: {
    debtId: string
    installmentId: string
    amount: Money
    dueDate: LocalDate
  }
}
```

---

# 24. Outstanding Debt Card

Ejemplo:

```text
Deuda pendiente

ARS 680.000

Próximo pago
ARS 85.000 · 25 Ago
```

---

# 25. Overdue Debt

Si existe:

```text
overdueAmount > 0
```

mostrar:

```text
Vencido
ARS 95.000
```

con acceso al detalle.

---

# 26. Upcoming Obligations

Unificar fuentes:

```text
DebtInstallment

Scheduled Expense
```

y luego:

```text
CreditCardStatement
```

cuando exista.

---

# 27. Do Not Materialize Generic Obligation Table Yet

Usar un read model.

Conceptualmente:

```text
UNION / normalized query results
```

desde entidades existentes.

No crear una tabla:

```text
financial_obligations
```

a menos que exista una necesidad posterior clara.

---

# 28. UpcomingObligation DTO

```ts
type UpcomingObligation = {
  sourceType:
    | "DEBT_INSTALLMENT"
    | "SCHEDULED_EXPENSE"

  sourceId: string

  title: string

  dueDate: LocalDate

  totalAmount: Money

  remainingAmount: Money

  status:
    | "OVERDUE"
    | "DUE_TODAY"
    | "UPCOMING"

  confidence:
    | "COMMITTED"
    | "EXPECTED"
}
```

---

# 29. Upcoming Window

Default:

```text
30 days
```

Dashboard muestra top N.

Planning page puede mostrar lista completa.

---

# 30. Upcoming Total

Conceptualmente:

```text
Upcoming Outflows 30d
=
SUM(remaining obligations inside horizon)
```

---

# 31. Overdue Inclusion

Para la card de compromisos:

recomendación:

```text
include overdue
+
due through horizon end
```

porque el dinero sigue comprometido.

---

# 32. Spendable Money

Métrica central.

V1 conservadora:

```text
Spendable
=
Liquid Balance
-
Reserved Funds
-
Committed Near-Term Obligations
```

---

# 33. Reserved Funds

Si todavía no existe `ReservedFund`:

```text
Reserved Funds = 0
```

en este slice.

No inventar almacenamiento temporal.

La fórmula queda preparada para agregarlo después.

---

# 34. Spendable V1 Without Reserved Funds

Temporalmente:

```text
Spendable
=
Liquid Balance
-
Selected Near-Term Obligations
```

---

# 35. What Counts As Committed

Para V1:

```text
Debt Installments
```

son committed.

Scheduled expenses:

```text
EXPECTED
```

son más inciertos.

Por eso conviene separar:

```text
Committed Spendable

Projected Balance
```

---

# 36. Recommended Spendable Policy

V1:

```text
Estimated Spendable
=
Liquid Balance
-
Debt Installments due within 30 days
```

No restar automáticamente todo scheduled expense hasta que exista una clasificación:

```text
COMMITTED vs EXPECTED
```

más explícita para esos movimientos.

---

# 37. Why Conservative Semantics Matter

No queremos presentar:

```text
Saldo - every expected event
```

como dinero definitivamente no disponible.

El label debe indicar:

```text
Disponible estimado
```

---

# 38. Spendable DTO

```ts
type SpendableSummary = {
  currency: CurrencyCode
  liquidBalance: Money
  reservedAmount: Money
  committedObligations: Money
  spendable: Money
  horizonDays: number
}
```

---

# 39. Spendable Can Be Negative

No hacer:

```ts
Math.max(0, spendable)
```

Si:

```text
Liquid
300

Committed
500
```

resultado:

```text
-200
```

Esto informa un shortfall.

---

# 40. Spendable Explanation

Debe existir breakdown:

```text
Dinero en cuentas
ARS 1.250.000

Compromisos próximos
-ARS 420.000

Disponible estimado
ARS 830.000
```

---

# 41. Spendable Does Not Include Future Income

V1:

```text
expected salary
```

no aumenta `Spendable Today`.

Sí aparece en cashflow futuro.

---

# 42. Cashflow Objective

Proyectar:

```text
how liquid money may evolve
```

durante:

```text
30 days
```

---

# 43. Cashflow Inputs

Por currency:

```text
Current Liquid Balance

Scheduled Income

Scheduled Expenses

Remaining Debt Installments
```

---

# 44. Do Not Use Recurring Rule Directly

El cashflow utiliza:

```text
materialized ScheduledTransaction occurrences
```

no `RecurringTransaction` directamente.

Así evitamos doble conteo.

---

# 45. Cashflow Event DTO

```ts
type CashflowEvent = {
  sourceType:
    | "SCHEDULED_INCOME"
    | "SCHEDULED_EXPENSE"
    | "DEBT_INSTALLMENT"

  sourceId: string

  date: LocalDate

  direction: "INFLOW" | "OUTFLOW"

  amount: Money

  confidence: "EXPECTED" | "COMMITTED"

  title: string
}
```

---

# 46. Event Amount

Debt installment:

```text
remainingAmount
```

No:

```text
totalAmount
```

si ya hubo pago parcial.

---

# 47. Scheduled Amount

Scheduled event usa:

```text
expected amount
```

hasta ser posteado.

---

# 48. Projection Horizon

V1:

```text
today
→
today + 30 financial days
```

Definir exactamente si el día final es inclusivo.

Recomendación:

```text
[today, horizonEnd]
```

inclusivo.

---

# 49. Starting Balance

```text
startingBalance
=
current liquid balance
```

de esa moneda.

---

# 50. Projection Algorithm

```text
events = normalizeFutureEvents()

events = filter horizon

events = sort by date

group events by financial date

balance = current liquid balance

for each date:
  inflow = sum date inflows
  outflow = sum date outflows

  balance =
    balance
    + inflow
    - outflow

  emit daily point
```

---

# 51. Same-Day Ordering

No inferir orden intradía.

Ejemplo:

```text
salary +1000
rent -800
same day
```

Mostrar resultado end-of-day:

```text
+200 net effect
```

No afirmar que primero entró salario.

---

# 52. Daily Cashflow Point

```ts
type CashflowPoint = {
  date: LocalDate
  inflow: Money
  outflow: Money
  projectedBalance: Money
  events: CashflowEvent[]
}
```

---

# 53. Projected End Balance

```text
Projected End Balance
=
balance after final day in horizon
```

---

# 54. Minimum Projected Balance

```text
Minimum Projected Balance
=
MIN(
  current balance,
  every projected daily balance
)
```

---

# 55. Minimum Date

Guardar también:

```text
minimumBalanceDate
```

para explicar riesgo.

---

# 56. Projected Shortfall

Si:

```text
minimumProjectedBalance < 0
```

entonces:

```text
hasShortfall = true
```

y:

```text
shortfallAmount
=
abs(minimumProjectedBalance)
```

---

# 57. First Negative Date

Además:

```text
firstNegativeDate
```

es útil para UI.

---

# 58. CashflowSummary

```ts
type CashflowSummary = {
  currency: CurrencyCode
  horizonStart: LocalDate
  horizonEnd: LocalDate
  startingBalance: Money
  projectedEndBalance: Money
  minimumProjectedBalance: Money
  minimumBalanceDate: LocalDate
  firstNegativeDate?: LocalDate
  shortfallAmount?: Money
  points: CashflowPoint[]
}
```

---

# 59. Cashflow UI Summary

Ejemplo:

```text
Proyección · próximos 30 días

Saldo actual
ARS 800.000

Saldo proyectado final
ARS 1.495.000

Saldo mínimo proyectado
ARS 295.000 · 20 Ago
```

---

# 60. Shortfall UI

Si negativo:

```text
Posible falta de saldo

ARS 75.000

Primer saldo negativo proyectado:
27 Ago
```

---

# 61. Shortfall Copy

Preferir:

```text
Con los movimientos registrados, tu saldo proyectado podría quedar por debajo de cero el 27 de agosto.
```

No:

```text
Te vas a quedar sin dinero.
```

---

# 62. Cashflow Timeline

Ejemplo:

```text
Hoy
ARS 800.000

12 Ago
Internet
-25.000
→ 775.000

15 Ago
Alquiler
-300.000
→ 475.000

20 Ago
Préstamo
-180.000
→ 295.000

31 Ago
Sueldo
+1.200.000
→ 1.495.000
```

---

# 63. Timeline Confidence

Puede mostrar badges:

```text
Comprometido

Esperado
```

cuando la distinción sea útil.

---

# 64. Cashflow Chart

Puede agregarse un gráfico de línea.

Pero:

```text
chart is secondary
```

La timeline y resumen textual deben funcionar sin él.

---

# 65. Chart Data

El chart debe usar:

```text
CashflowPoint[]
```

del finance engine.

No recalcular saldos en el componente.

---

# 66. Explainability

Cada número importante debe ser drillable.

Ejemplo:

```text
Disponible estimado
ARS 830.000
```

→

```text
View details
```

---

# 67. Explain Spendable

Detalle:

```text
Liquid Balance
1.250.000

Debt installments next 30 days
-420.000

Spendable
830.000
```

---

# 68. Explain Debt

Detalle:

```text
Loan
300.000

Notebook
130.000

Personal Debt
250.000

Total
680.000
```

---

# 69. Explain Monthly Expense

Detalle:

```text
Food
200.000

Housing
300.000

Transport
80.000

Other
70.000

Refunds
-20.000
```

---

# 70. Explain Projection

Debe poder indicar:

```text
Included

Debt installments
Scheduled salary
Scheduled rent
Recurring occurrences
```

y:

```text
Not included

Unscheduled future expenses
Unknown income
```

---

# 71. Dashboard Read Services

Crear:

```text
GetDashboardSummary
```

y/o servicios específicos:

```text
GetLiquidBalances

GetMonthlySummary

GetDebtSummary

GetUpcomingObligations

GetSpendableMoney

GetCashflowProjection
```

---

# 72. Avoid Giant Service

`GetDashboardSummary` puede orquestar servicios especializados.

No meter todas las reglas en una única función enorme.

---

# 73. Finance Package Structure

Agregar:

```text
packages/finance/src/projections/
├── spendable-money.ts
├── cashflow.ts
├── monthly-summary.ts
├── debt-summary.ts
└── types.ts
```

---

# 74. Query Package Structure

```text
packages/db/src/queries/
├── account-balances.ts
├── monthly-summary.ts
├── debt-summary.ts
├── upcoming-obligations.ts
├── cashflow-inputs.ts
└── dashboard.ts
```

---

# 75. Query Responsibilities

Queries obtienen datos ya filtrados:

```text
user ownership

date ranges

statuses

aggregates
```

Finance package aplica significado financiero.

---

# 76. Example Balance Query Result

```ts
type AccountBalanceInput = {
  accountId: string
  currency: CurrencyCode
  openingBalance: DecimalString
  transactionTotals: {
    income: DecimalString
    expense: DecimalString
    transferIn: DecimalString
    transferOut: DecimalString
    refund: DecimalString
    liabilityPayment: DecimalString
  }
}
```

---

# 77. Exact Money Boundary

DB devuelve:

```text
NUMERIC
```

como representación segura, normalmente string en driver.

Convertir a exact decimal/Money.

Nunca:

```ts
Number(dbAmount)
```

para cálculos canónicos.

---

# 78. Date Boundary

DB queries deben recibir:

```text
financial range
```

calculado a partir de:

```text
user.timezone
```

---

# 79. Current Month

Crear helper:

```text
getFinancialMonthRange(userTimezone, now)
```

en una capa de fechas compartida.

---

# 80. Avoid UTC Month Bugs

Ejemplo:

usuario registra movimiento:

```text
31 Aug 23:30 local
```

aunque UTC sea 1 Sep.

Debe pertenecer a:

```text
August
```

para reportes del usuario.

---

# 81. Upcoming Query Range

Usar:

```text
LocalDate
```

para due/scheduled dates.

No convertir arbitrariamente a UTC midnight para comparar días financieros.

---

# 82. Dashboard Performance

El dashboard no debe ejecutar decenas de queries repetitivas.

Objetivo inicial razonable:

```text
small bounded set of aggregate queries
```

---

# 83. No N+1

Especialmente:

```text
balances per account

upcoming source details

debt summaries
```

deben resolverse con joins/agregados apropiados.

---

# 84. Suggested Query Pattern

Puede haber:

```text
1 balance aggregate query

1 monthly summary query

1 debt aggregate query

1 upcoming query

1 cashflow input query
```

y luego cálculo en memoria exacta.

No es requisito rígido, pero evita N+1.

---

# 85. No Premature Materialized Views

No crear inicialmente:

```text
materialized dashboard view

current_balance column

spendable_money column
```

---

# 86. Cache Strategy

V1:

```text
on-demand calculation
```

Si después hay problemas:

```text
request cache

short-lived application cache

snapshots
```

pero con invalidación explícita.

---

# 87. Mutation Revalidation

Cambios que invalidan dashboard:

```text
Create Transaction

Void Transaction

Transfer

Void Transfer

Debt Payment

Create Debt

Scheduled Posting

Scheduled Edit

Recurring Generation
```

---

# 88. Next.js Revalidation

Application/UI integration puede usar:

```text
revalidatePath
```

o estrategia de cache vigente del proyecto.

No acoplar finance engine a Next.js.

---

# 89. Loading State

Dashboard debe poder mostrar skeletons por sections.

Evitar bloquear toda la shell.

---

# 90. Partial Failure

Si una query secundaria falla:

recomendación inicial:

```text
dashboard request fails safely
```

en lugar de mostrar cifras inconsistentes de distintos momentos.

Más adelante podría haber partial rendering si está bien diseñado.

---

# 91. Snapshot Consistency

Idealmente todas las métricas del dashboard deben calcularse sobre una vista temporal suficientemente consistente.

No es necesario SERIALIZABLE para reads V1.

Pero evitar mezclar caches con tiempos de actualización incompatibles.

---

# 92. Dashboard Header

Puede mostrar:

```text
Resumen financiero
```

y fecha/contexto:

```text
8 Ago 2026
```

según locale.

---

# 93. Primary Card

Debe ser:

```text
Disponible estimado
```

cuando la métrica exista.

Antes de eso:

```text
Dinero en cuentas
```

---

# 94. Negative Spendable UI

Ejemplo:

```text
Disponible estimado

-ARS 120.000

Tus compromisos de los próximos 30 días superan el saldo actual.
```

CTA:

```text
Ver próximos pagos
```

---

# 95. Upcoming Card

Mostrar por ejemplo:

```text
Próximos 30 días

ARS 420.000

5 pagos
```

y debajo próximos 3 eventos.

---

# 96. Upcoming Sorting

Orden:

```text
OVERDUE first

due today

dueDate ASC
```

---

# 97. Dashboard Recent Transactions

Puede mantenerse como sección secundaria.

No reemplazar Upcoming.

---

# 98. Dashboard Empty State — New User

Si no hay cuentas:

```text
Empezá creando tu primera cuenta.
```

No mostrar dashboard lleno de ceros.

---

# 99. Dashboard State — Accounts But No Activity

Mostrar:

```text
Saldo actual

Add Income

Add Expense
```

sin cards irrelevantes.

---

# 100. Dashboard State — No Debt

Debt card puede:

```text
not render
```

o mostrar:

```text
No tenés deudas registradas.
```

Recomendación:

no ocupar demasiado espacio si no aporta información.

---

# 101. Dashboard State — No Upcoming Events

Mostrar:

```text
No tenés pagos registrados para los próximos 30 días.
```

---

# 102. Dashboard State — No Cashflow Events

Si no hay eventos futuros:

```text
Tu proyección se mantiene igual al saldo actual porque no hay movimientos futuros registrados.
```

---

# 103. Data Freshness

Dashboard puede mostrar:

```text
Calculated now
```

internamente.

No necesita mostrar timestamp al usuario salvo que exista caching considerable.

---

# 104. Cashflow Recalculation

Debe producirse después de cualquier cambio en:

```text
balances

scheduled events

debt remaining
```

---

# 105. Cashflow Does Not Mutate Anything

`calculateCashflow()` debe ser función pura.

Nunca:

```text
create transactions

update debt

post scheduled events
```

---

# 106. Spendable Does Not Mutate Anything

Igual:

```text
calculateSpendable()
```

es read-only.

---

# 107. Projection Confidence Future Extension

El modelo debe dejar espacio para:

```text
CONFIRMED

COMMITTED

EXPECTED

ESTIMATED
```

si se necesita más granularidad.

V1 puede usar solo:

```text
COMMITTED
EXPECTED
```

---

# 108. Avoid AI In Calculations

No usar OpenRouter para:

```text
cashflow arithmetic

spendable formula

monthly totals

debt totals
```

---

# 109. AI Integration Point Later

AI puede recibir:

```ts
{
  liquidBalance,
  spendable,
  upcomingTotal,
  projectedMinimum,
  projectedEnd
}
```

y explicar la situación.

Nunca al revés.

---

# 110. Billing Separation

Las suscripciones del SaaS pagadas a Mercado Pago:

```text
do not enter these dashboard calculations automatically
```

Billing domain sigue separado.

Si el usuario quiere registrar nuestra suscripción como gasto personal, debe hacerlo mediante sus propias operaciones/importaciones.

---

# 111. Dashboard Security

Todas las queries usan:

```text
current authenticated user
```

No aceptar:

```text
userId
```

desde query params.

---

# 112. Read Model Security

Aunque una entidad sea alcanzable por FK, filtrar por ownership explícito cuando corresponda.

---

# 113. Sensitive Data

Dashboard response debe contener únicamente información necesaria para UI.

No enviar:

```text
all historical transactions
```

para calcular una card cliente-side.

---

# 114. Server Component Strategy

Dashboard principal debería ser mayormente:

```text
Server Component
```

con Client Components solo para:

```text
interactive chart

filters

dialogs
```

si son necesarios.

---

# 115. Filter Horizon

V1 dashboard fijo:

```text
30 days
```

No agregar selector 7/30/90 inmediatamente salvo que producto lo requiera.

Planning page ya ofrece detalle.

---

# 116. Currency Section

Si varias currencies:

UI puede usar tabs/cards:

```text
ARS

USD
```

sin ocultar que son unidades independientes.

---

# 117. Base Currency Label

No mostrar:

```text
Total
```

para una sola moneda si hay otras existentes.

Preferir:

```text
Saldo ARS
```

---

# 118. Monthly Summary DTO

```ts
type MonthlySummary = {
  currency: CurrencyCode
  income: Money
  consumptionExpenses: Money
  refunds: Money
  liabilityPayments: Money
  netConsumptionResult: Money
}
```

---

# 119. Liability Payments Visibility

Aunque no estén dentro de `Gastos`, puede ser útil mostrar en detalle:

```text
Pagos de deuda este mes
```

porque sí afectan liquidez.

No incluir necesariamente como headline V1.

---

# 120. Monthly Cash Outflow

Podemos derivar:

```text
Consumption Expenses
+
Liability Payments
```

excluyendo transfers.

No es obligatorio mostrar en dashboard inicial.

---

# 121. Outstanding Debt Multi-Currency

Mostrar:

```text
ARS 680.000

USD 400
```

separado.

No:

```text
Total debt 680.400
```

---

# 122. Upcoming Multi-Currency

Igual:

```text
Next 30 days

ARS 420.000
USD 100
```

---

# 123. Cashflow Per Currency

Cada currency obtiene su propia proyección.

No existe:

```text
single combined cashflow
```

hasta tener FX.

---

# 124. Future FX Support

Cuando se implemente:

projection deberá registrar:

```text
exchange rate

rate timestamp/source

conversion method
```

No forma parte de este slice.

---

# 125. Testing — Balance

Given:

```text
Opening
1000

Income
500

Expense
200

Transfer Out
100

Transfer In
50

Liability Payment
100
```

Expected account balance según legs:

```text
1150
```

si todos pertenecen a esa cuenta en esa combinación.

---

# 126. Testing — Consolidated Transfer

Two accounts:

```text
Bank 1000

Cash 100
```

Transfer:

```text
200
```

Expected:

```text
Liquid total 1100
```

---

# 127. Testing — Monthly Summary

Transactions:

```text
Income 1000

Expense 400

Refund 50

Liability Payment 200

Transfer Out 100
```

Expected:

```text
Income 1000

Consumption Expense 350

Liability Payments 200

Transfer excluded
```

---

# 128. Testing — Debt Summary

Installments:

```text
100 remaining

50 remaining

0 remaining
```

Expected:

```text
Outstanding 150
```

---

# 129. Testing — Upcoming Partial

Installment:

```text
total 100

paid 40

due in 3 days
```

Expected upcoming:

```text
60
```

---

# 130. Testing — Spendable

```text
Liquid Balance
1000

Committed next 30 days
400
```

Expected:

```text
Spendable
600
```

---

# 131. Testing — Negative Spendable

```text
Liquid
300

Committed
500
```

Expected:

```text
-200
```

---

# 132. Testing — Future Income Excluded From Spendable

```text
Liquid
300

Debt obligations
200

Scheduled salary
1000
```

Expected spendable:

```text
100
```

not:

```text
1100
```

---

# 133. Testing — Cashflow

Starting:

```text
800
```

Events:

```text
15 Aug
-300

20 Aug
-200

31 Aug
+1000
```

Expected:

```text
15 Aug → 500

20 Aug → 300

31 Aug → 1300
```

---

# 134. Testing — Minimum Balance

Using previous example:

```text
Minimum = 300
```

on:

```text
20 Aug
```

---

# 135. Testing — Shortfall

Starting:

```text
300
```

Events:

```text
-200

-200

+1000
```

Expected:

```text
minimum = -100

shortfall = 100
```

---

# 136. Testing — Same-Day Events

Starting:

```text
500
```

Same day:

```text
+1000
-800
-100
```

Expected end-of-day:

```text
600
```

No assert intraday ordering.

---

# 137. Testing — Posted Scheduled Event

Before posting:

```text
Scheduled Expense 100
```

Projection includes:

```text
-100
```

Current balance unchanged.

After posting:

```text
current balance decreases 100
```

and future projection must no longer include the scheduled event.

---

# 138. Testing — Skipped Event

Skipped scheduled transaction:

```text
excluded
```

from projection.

---

# 139. Testing — Cancelled Event

Also excluded.

---

# 140. Testing — Recurring

Recurring rule has generated one scheduled occurrence.

Projection includes exactly:

```text
one occurrence
```

not rule + occurrence.

---

# 141. Testing — Debt Deduplication

Debt installment must appear once.

No duplicate via:

```text
generic scheduled expense
```

---

# 142. Testing — Multi-Currency

Given:

```text
ARS 1000

USD 500
```

Expected:

```text
two summaries
```

No combined arithmetic.

---

# 143. Testing — Timezone Month Boundary

Create transaction near UTC boundary such that user-local date belongs to previous month.

Expected monthly report uses:

```text
user-local month
```

---

# 144. Testing — Due Today

Installment due today:

```text
DUE_TODAY
```

not overdue.

---

# 145. Property Tests

Useful invariants:

```text
projected balance
=
starting balance
+
cumulative inflows
-
cumulative outflows
```

```text
spendable breakdown sums exactly
```

```text
outstanding debt >= 0
```

```text
one source event appears at most once in projection
```

---

# 146. Dashboard E2E

Create:

```text
Bank
Opening 1000

Income
500

Expense
200

Debt
300
3 installments

Scheduled Salary
1000 next month
```

Expected dashboard:

```text
Liquid Balance
1300

Monthly Income
500

Monthly Expenses
200

Outstanding Debt
300

Upcoming
next installment

Cashflow
includes installment + scheduled salary
```

---

# 147. Shortfall E2E

Create current liquid:

```text
300
```

Future:

```text
Rent -250

Debt -150
```

before next income.

Expected:

```text
Projected Shortfall
100
```

and correct date.

---

# 148. Security Tests

User A dashboard must never include:

```text
User B accounts

User B transactions

User B debt

User B scheduled events
```

---

# 149. Performance Tests

Con dataset razonable:

```text
multiple accounts

thousands of transactions

dozens of debts

dozens of scheduled occurrences
```

dashboard debe evitar N+1.

No fijar SLA artificial antes de medir, pero revisar query plan si degrada.

---

# 150. Index Requirements

Verificar índices existentes:

```text
transactions(user_id, occurred_at)

transactions(account_id, occurred_at)

debts(user_id, status)

debt_installments(debt_id, due_date)

scheduled_transactions(user_id, scheduled_date, status)
```

Agregar compuestos solo si query plan lo justifica.

---

# 151. Dashboard Observability

Registrar:

```text
operation = dashboard_summary

userId

duration

accountsCount

eventsCount

currenciesCount

success/failure
```

No loggear montos completos salvo necesidad explícita.

---

# 152. Cashflow Observability

Puede registrar:

```text
horizonDays

eventCount

duration

calculationVersion
```

---

# 153. Calculation Version

Definir:

```text
cashflowProjectionVersion
```

y:

```text
spendableMoneyVersion
```

cuando estas métricas se persistan o se utilicen para snapshots.

Mientras son on-demand, puede ser constante interna.

---

# 154. No Snapshot Yet

V1:

```text
calculate on demand
```

No crear todavía:

```text
daily_dashboard_snapshots
```

---

# 155. Snapshot Trigger Future

Cuando se requiera historial:

```text
daily balance snapshot

daily debt snapshot

daily net worth snapshot
```

será un read optimization.

No source of truth.

---

# 156. UI Components

Reutilizar:

```text
MoneyAmount

FinancialMetricCard

StatusBadge

EmptyState
```

Agregar:

```text
SpendableCard

DebtSummaryCard

UpcomingPaymentsCard

CashflowSummary

CashflowTimeline

CashflowChart
```

si realmente se necesita gráfico.

---

# 157. SpendableCard

Debe soportar:

```text
main amount

horizon

breakdown

negative state
```

---

# 158. UpcomingPaymentsCard

Mostrar:

```text
total next 30 days

number of obligations

top 3 items

view all
```

---

# 159. CashflowSummary Component

Recibe:

```text
startingBalance

projectedEnd

minimumBalance

minimumDate

shortfall
```

ya calculados.

---

# 160. CashflowTimeline Component

Recibe:

```text
CashflowPoint[]
```

No accede a DB ni recalcula domain logic.

---

# 161. Explainability Drawer

Puede existir patrón reutilizable:

```text
How is this calculated?
```

que abra sheet/dialog con breakdown.

Útil para:

```text
Spendable

Debt

Monthly Expenses

Cashflow
```

---

# 162. Accessibility

Gráfico, si existe, debe tener:

```text
text summary
```

y la timeline debe contener toda información esencial.

---

# 163. Color Semantics

No usar:

```text
green = all positive money

red = all negative money
```

sin contexto.

Ejemplo:

```text
debt payment
```

es salida de efectivo pero reducción de liability.

La UI puede representar dirección y significado por separado.

---

# 164. Financial Copy

Preferir:

```text
Disponible estimado

Deuda pendiente

Próximos pagos

Saldo proyectado

Posible falta de saldo
```

---

# 165. Avoid False Precision

No mostrar mensajes como:

```text
Vas a tener exactamente $183.452 el 27.
```

Preferir:

```text
Saldo proyectado
ARS 183.452
```

con contexto de que depende de movimientos registrados.

---

# 166. No Financial Advice

El dashboard detecta:

```text
shortfall

overdue

budget state
```

pero no debe prescribir automáticamente:

```text
pedí un préstamo

invertí esto

cancelá aquello
```

---

# 167. Definition of Done

El slice está terminado cuando el usuario puede abrir Dashboard y comprender:

```text
current liquid money

monthly income

monthly consumption

outstanding debt

upcoming obligations

estimated spendable

30-day projected cashflow

potential shortfall
```

---

# 168. Technical DoD

Debe pasar:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

---

# 169. Financial DoD

Debe probarse:

```text
internal transfers do not alter consolidated assets

liability payments do not inflate expenses

partial debt payments reduce upcoming amount

future income does not increase current spendable

scheduled events do not alter actual balance

posted scheduled events stop appearing in future cashflow

multi-currency values are never implicitly summed

cashflow cumulative arithmetic is exact
```

---

# 170. UI DoD

Dashboard debe tener:

```text
desktop layout

mobile layout

loading states

empty states

error states

multi-currency presentation

explainable metric breakdowns

shortfall state
```

---

# 171. Scope Boundary

No implementar todavía:

```text
automatic FX

predictive machine-learning forecast

advanced what-if scenarios

investment portfolio valuation

historical net-worth graph

AI-generated financial decisions
```

---

# 172. Next Vertical Slice

Después de completar este slice, crear:

```text
docs/15-budgets-slice.md
```

para implementar:

```text
Monthly Category Budgets

Budget Spending

Refund Integration

Budget Remaining

Budget Status

Near-Limit Detection

Budget Dashboard Integration

Budget Alerts
```
