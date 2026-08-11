# Projections & Cashflow

## 1. Objetivo

Este documento define cómo construir las proyecciones financieras y las métricas derivadas de la aplicación.

Debe permitir responder:

```text
¿Cuánto tengo hoy?

¿Cuánto debo?

¿Qué vence próximamente?

¿Cuánto tengo comprometido?

¿Cuánto puedo gastar?

¿Voy a llegar bien al próximo ingreso?

¿Cómo evoluciona mi situación financiera?
```

Las proyecciones son una capa de lectura.

Nunca deben convertirse en fuente de verdad financiera.

---

# 2. Principio fundamental

Debemos mantener esta separación:

```text
Actual
≠
Scheduled
≠
Obligation
≠
Projection
```

Y también:

```text
Balance
≠
Available Cash
≠
Spendable Money
≠
Net Worth
```

Cada métrica debe tener una definición explícita.

---

# 3. Source Data

Las proyecciones se construyen principalmente desde:

```text
Accounts

Posted Transactions

Debt Installments

Debt Payment Allocations

Scheduled Transactions

Recurring Rules

Credit Card Statements

Budgets

Savings / Reserved Funds
```

---

# 4. Projection Rule

Toda proyección debe poder:

```text
recalculate
```

desde las fuentes canónicas.

No debe requerir información oculta o manual para reconstruirse.

---

# 5. Actual Balance

`Actual Balance` representa dinero real actualmente registrado.

Para cuentas asset:

```text
Actual Balance
=
Opening Balance
+
Posted Financial Movements
```

Solo incluye:

```text
POSTED
```

No incluye:

```text
Scheduled Transactions

Future Installments

Expected Income

Projected Events
```

---

# 6. Per-Account Balance

Cada cuenta debe poder responder:

```text
balance(account, date?)
```

Para hoy:

```text
current account balance
```

Para una fecha pasada:

```text
historical balance
```

si la historia disponible lo permite.

---

# 7. Total Liquid Balance

Representa la suma de cuentas consideradas líquidas.

Inicialmente:

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

# 8. Multi-Currency Liquid Balance

Nunca sumar directamente:

```text
ARS
+
USD
```

sin conversión.

V1 puede mostrar:

```text
ARS 1,200,000

USD 2,500
```

por separado.

---

# 9. Base Currency Consolidation

Cuando exista FX explícito:

```text
Total Assets in Base Currency
```

puede utilizar una tasa de cambio conocida.

El resultado debe indicar:

```text
exchange rate source

exchange rate date
```

Post-MVP.

---

# 10. Outstanding Debt

Representa todas las obligaciones de deuda aún no satisfechas.

Conceptualmente:

```text
Outstanding Debt
=
sum(
  remaining amount
  of active non-cancelled debt obligations
)
```

---

# 11. Remaining Installment

Para cada cuota:

```text
Remaining
=
Total Amount
-
Allocated Payments
```

---

# 12. Debt Total

Por deuda:

```text
Debt Remaining
=
sum(remaining installments)
```

---

# 13. Debt Aggregation

Dashboard puede mostrar:

```text
Total Debt
```

y desglose:

```text
Credit Cards

Loans

Installment Purchases

Personal Debts

Other
```

---

# 14. Avoid Debt Double Counting

Si una obligación de tarjeta está representada como:

```text
DebtInstallment
```

y también agrupada en:

```text
CreditCardStatement
```

no sumar ambas.

`CreditCardStatement` puede ser una vista/agrupador.

La obligación subyacente debe tener una sola representación económica.

---

# 15. Upcoming Obligations

Representa pagos esperados dentro de un rango.

Ejemplo:

```text
next 7 days

next 30 days

current month
```

---

# 16. Obligation Sources

Puede incluir:

```text
Debt Installments

Credit Card Statements

Scheduled Expenses

Recurring Expense Occurrences
```

---

# 17. Upcoming Obligation DTO

Conceptualmente:

```ts
UpcomingObligation {
  sourceType
  sourceId
  title
  dueDate
  amount
  remainingAmount
  currency
  status
  accountId?
  categoryId?
}
```

---

# 18. Obligation Status Groups

Para UX:

```text
OVERDUE

DUE_TODAY

UPCOMING
```

---

# 19. Due Today

Una obligación con:

```text
dueDate = user's current date
```

se clasifica como:

```text
DUE_TODAY
```

No como vencida.

---

# 20. Upcoming Window

Dashboard V1:

```text
30 days
```

como ventana principal.

También permitir:

```text
7 days

This Month
```

---

# 21. Committed Money

Conceptualmente:

```text
Committed Money
=
selected upcoming obligations
```

dentro de un horizonte determinado.

---

# 22. Committed Is Horizon-Dependent

Ejemplo:

```text
Committed next 7 days
≠
Committed next 30 days
```

Por eso nunca mostrar solo:

```text
Committed: $X
```

sin indicar horizonte.

---

# 23. Available Cash

`Available Cash` representa:

```text
Liquid Balance
```

sin considerar todavía compromisos futuros.

Ejemplo:

```text
Dinero en cuentas:
$1,000,000
```

---

# 24. Reserved Money

Puede representar fondos que el usuario decidió apartar.

Ejemplos:

```text
Emergency Fund

Taxes

Vacation

Annual Insurance
```

---

# 25. Spendable Money

Métrica derivada central.

V1:

```text
Spendable Money
=
Liquid Balance
-
Reserved Money
-
Selected Near-Term Obligations
```

---

# 26. Spendable Horizon

V1 default:

```text
30 days
```

La UI debería indicarlo explícitamente:

```text
Disponible estimado después de compromisos de los próximos 30 días
```

---

# 27. Spendable Money Is Not Balance

Ejemplo:

```text
Balance:
$1,000,000

Reserved:
$100,000

Next 30-day obligations:
$450,000

Spendable:
$450,000
```

---

# 28. Spendable Can Be Negative

Ejemplo:

```text
Balance:
$300,000

Obligations:
$500,000

Spendable:
-$200,000
```

No limitar artificialmente a cero.

El valor negativo comunica:

```text
shortfall
```

---

# 29. Spendable Explanation

Toda visualización debe permitir explicar:

```text
Liquid balance
$1,000,000

Reserved
-$100,000

Upcoming obligations
-$450,000

Estimated spendable
$450,000
```

---

# 30. Expected Income

Ingresos futuros pueden mejorar la proyección de cashflow.

Pero no deberían aumentar automáticamente:

```text
Spendable Money today
```

sin una política explícita.

---

# 31. Conservative Spendable V1

Recomendación V1:

```text
Spendable Money
```

no incluye ingresos futuros.

Esto produce una métrica conservadora.

---

# 32. Future Liquidity

En cambio:

```text
Projected Balance
```

sí incorpora ingresos futuros.

---

# 33. Cashflow Projection

Proyecta la evolución futura de liquidez.

Conceptualmente:

```text
Current Liquid Balance
+
Future Inflows
-
Future Outflows
```

---

# 34. Cashflow Sources

Inflows:

```text
Scheduled Income

Recurring Income Occurrences
```

Outflows:

```text
Scheduled Expenses

Recurring Expense Occurrences

Debt Installments

Credit Card Obligations
```

---

# 35. Projection Events

Cada evento debe normalizarse:

```ts
CashflowEvent {
  id
  date
  direction
  amount
  currency
  sourceType
  sourceId
  title
  confidence
}
```

`confidence` puede omitirse en V1.

---

# 36. Direction

```text
INFLOW

OUTFLOW
```

---

# 37. Projection Timeline

Ejemplo:

```text
Current
$800,000

Aug 12
Internet
-$25,000
→ $775,000

Aug 15
Rent
-$300,000
→ $475,000

Aug 20
Credit Card
-$180,000
→ $295,000

Aug 31
Salary
+$1,200,000
→ $1,495,000
```

---

# 38. Same-Day Events

Si varios eventos ocurren el mismo día:

```text
group by financial date
```

La UI puede mostrar eventos individuales y un balance final del día.

---

# 39. Intraday Ordering

V1 no debe inferir:

```text
salary arrives before rent
```

si ambos solo tienen fecha.

El resultado correcto es:

```text
end-of-day projected balance
```

---

# 40. Projection Horizon

Default V1:

```text
30 days
```

Opciones futuras:

```text
60 days

90 days

6 months

12 months

custom
```

---

# 41. Projected Balance

Por fecha:

```text
Projected Balance(date)
=
Current Liquid Balance
+
sum(future events through date)
```

---

# 42. Projected Minimum Balance

Una métrica útil:

```text
Minimum Projected Balance
```

dentro del horizonte.

Ejemplo:

```text
Lowest projected balance:
$85,000 on Aug 27
```

---

# 43. Projected Shortfall

Si:

```text
Minimum Projected Balance < 0
```

generar:

```text
Projected Shortfall
```

---

# 44. Shortfall Amount

```text
Shortfall Amount
=
abs(minimum negative projected balance)
```

---

# 45. Shortfall Alert

Ejemplo:

```text
Con los movimientos previstos registrados, tu saldo podría quedar $75.000 por debajo de cero el 27 de agosto.
```

---

# 46. Projection Is Estimate

La UI siempre debe comunicar que:

```text
future != guaranteed
```

Preferir:

```text
Saldo proyectado
```

sobre:

```text
Saldo futuro
```

---

# 47. Projection Assumptions

Debe ser posible explicar qué eventos incluye una proyección.

Ejemplo:

```text
Incluye:
- sueldo programado
- alquiler
- tarjeta
- préstamo

No incluye:
- gastos no programados
```

---

# 48. Projection Event Origin

Cada evento debe poder navegar hasta su origen:

```text
Scheduled Salary

Debt Installment

Recurring Rent

Credit Card Statement
```

---

# 49. Monthly Summary

Debe separar:

```text
Income

Consumption Expenses

Liability Payments

Transfers

Refunds
```

---

# 50. Main Monthly Result

Una métrica simple:

```text
Net Cashflow
=
Cash Inflows
-
Cash Outflows
```

---

# 51. Consumption Result

Otra perspectiva:

```text
Income
-
Consumption Expenses
```

Estas métricas no siempre son iguales.

---

# 52. Why Two Perspectives

Ejemplo:

```text
Income:
1,000

Consumption:
500

Loan payment:
300
```

Entonces:

```text
Consumption surplus:
500

Cashflow surplus:
200
```

Ambas son válidas para preguntas diferentes.

---

# 53. Dashboard Default

Para usuario general:

```text
Ingresos
Gastos
Resultado del mes
```

debe tener semántica claramente definida.

Recomendación:

`Gastos` significa:

```text
consumption expenses
```

y mostrar pagos de deuda en sección separada.

---

# 54. Cash Outflows Card

Podemos mostrar adicionalmente:

```text
Salidas de dinero
```

que incluya:

```text
expenses
+
liability payments
```

pero no transferencias internas.

---

# 55. Monthly Expense

```text
Monthly Expense
=
qualifying consumption transactions
-
qualifying refunds
```

---

# 56. Transfers Excluded

Transferencias no participan de:

```text
income
expense
```

en resumen general.

---

# 57. Liability Payment Excluded From Consumption

Un pago de tarjeta:

```text
does not increase monthly consumption
```

si la compra original ya fue contabilizada.

---

# 58. Debt Cashflow

Pero sí participa en:

```text
cash outflow
```

y:

```text
cashflow projection
```

---

# 59. Monthly Income

Incluye:

```text
posted income
```

No:

```text
expected income
```

---

# 60. Refund Treatment

Refund reduce:

```text
net spending
```

preferiblemente en la categoría original.

---

# 61. Expense by Category

Cálculo:

```text
posted qualifying expenses
-
linked refunds
```

agrupados por categoría.

---

# 62. Split Transactions

Si existen splits:

```text
use split categories
```

en lugar de categoría principal.

---

# 63. Uncategorized Spending

Debe existir:

```text
Uncategorized
```

como grupo visible.

No ocultar gastos sin categoría.

---

# 64. Merchant Report

Post-MVP o V1.1:

```text
spending by merchant
```

Ejemplo:

```text
Carrefour
Uber
Netflix
```

---

# 65. Budget Projection

Presupuesto real:

```text
spent
```

usa posted consumption.

---

# 66. Budget Remaining

```text
remaining
=
limit
-
spent
```

---

# 67. Budget Percentage

```text
usage
=
spent / limit
```

---

# 68. Budget Overrun

Si:

```text
spent > limit
```

mostrar:

```text
over budget
```

con monto:

```text
spent - limit
```

---

# 69. Budget Forecast

Post-MVP:

Podemos proyectar cierre de presupuesto usando:

```text
spending pace
+
known future expenses
```

Pero debe diferenciarse de gasto real.

---

# 70. Debt Projection

Mostrar evolución de deuda pendiente.

Ejemplo:

```text
Current Debt
$900,000

After next scheduled payments
$650,000

Expected paid-off date
Dec 2026
```

---

# 71. Debt Payoff Date

Solo proyectar si:

```text
future debt payments are known
```

No inventar pagos.

---

# 72. Debt Timeline

Por deuda:

```text
Current remaining
Upcoming installments
Paid installments
Projected completion
```

---

# 73. Debt Progress

Puede expresarse:

```text
Paid Principal / Total Payable
```

o:

```text
Paid Obligations / Total Obligations
```

La UI debe indicar cuál usa.

---

# 74. Avoid Misleading Debt Percentage

No mostrar simplemente:

```text
70% paid
```

sin definición.

Especialmente si existen:

```text
interest
fees
```

---

# 75. Net Worth

```text
Net Worth
=
Asset Value
-
Liability Value
```

---

# 76. Net Worth Today

V1:

Assets:

```text
liquid account balances
```

Liabilities:

```text
outstanding debts
```

---

# 77. Net Worth vs Spendable

Ejemplo:

```text
Net Worth
$3,000,000

Spendable
$250,000
```

No existe contradicción.

Una persona puede tener patrimonio y baja liquidez.

---

# 78. Net Worth History

Para mostrar evolución, necesitamos snapshots o reconstrucción histórica.

Post-MVP:

```text
daily
weekly
monthly snapshots
```

---

# 79. Snapshot Strategy

Snapshots son optimización/read model.

No source of truth.

---

# 80. Recommended Snapshot Frequency

Para V1.1:

```text
daily
```

puede ser suficiente.

---

# 81. Snapshot Version

Cada snapshot debe guardar:

```text
calculationVersion
```

cuando la fórmula pueda evolucionar.

---

# 82. Snapshot Rebuild

Debe existir posibilidad conceptual de:

```text
rebuild snapshots
```

desde datos canónicos.

---

# 83. Dashboard Metrics

Dashboard V1 debería mostrar:

```text
Liquid Balance

Spendable Money

Income This Month

Expenses This Month

Outstanding Debt

Upcoming Payments

Projected Balance

Budget Status
```

---

# 84. Dashboard Priority

Orden sugerido:

```text
1. Available / Spendable

2. Upcoming obligations

3. Monthly activity

4. Debt

5. Projection

6. Budgets
```

---

# 85. Dashboard Main Card

Ejemplo:

```text
Dinero en cuentas
$1,250,000

Comprometido 30 días
-$420,000

Disponible estimado
$830,000
```

---

# 86. Dashboard Debt Card

```text
Deuda pendiente
$680,000

Próximo pago
$85,000 · Aug 25
```

---

# 87. Dashboard Monthly Card

```text
This month

Income
$1,800,000

Expenses
$950,000

Net
+$850,000
```

---

# 88. Dashboard Projection Card

```text
30-day projection

Expected end balance
$1,420,000

Lowest balance
$180,000 · Aug 27
```

---

# 89. Dashboard Budget Card

```text
Food
$145,000 / $200,000

Transport
$70,000 / $100,000
```

---

# 90. Upcoming Payments View

Debe mostrar:

```text
overdue

today

next 7 days

later
```

---

# 91. Upcoming Payment Row

Ejemplo:

```text
Aug 18
Visa
$145,000
Due in 4 days
```

---

# 92. Partial Payment Representation

Ejemplo:

```text
Loan installment
Total: $100,000
Paid: $40,000
Remaining: $60,000
```

La lista de próximos pagos debe usar:

```text
remaining
```

no `total`.

---

# 93. Overdue Section

Las obligaciones vencidas deben tener alta visibilidad.

Mostrar:

```text
amount remaining

days overdue

original due date
```

---

# 94. Days Overdue

```text
daysOverdue
=
today - dueDate
```

usando timezone del usuario.

---

# 95. Financial Timeline

Una timeline consolidada puede incluir:

```text
posted transactions

future obligations

scheduled events
```

pero visualmente diferenciados.

---

# 96. Timeline Visual States

Conceptualmente:

```text
POSTED
→ actual

SCHEDULED
→ expected

OBLIGATION
→ committed

OVERDUE
→ requires attention
```

---

# 97. Do Not Merge Meaning

Una cuota futura y un gasto pagado pueden compartir fecha/monto.

Pero son entidades distintas.

La UI no debe ocultar esa diferencia.

---

# 98. Cashflow Timeline

Para proyección:

```text
current balance
↓
future events ordered by date
↓
projected end balance
```

---

# 99. Timeline Filtering

Filtros:

```text
all

income

expenses

debts

recurring

scheduled
```

---

# 100. Projection Confidence

V1 puede usar solo dos niveles conceptuales:

```text
COMMITTED

EXPECTED
```

---

# 101. COMMITTED

Ejemplos:

```text
debt installment

closed card statement

known bill
```

---

# 102. EXPECTED

Ejemplos:

```text
scheduled salary

estimated recurring income
```

---

# 103. Why Confidence Matters

Un ingreso esperado no tiene la misma certeza que:

```text
loan installment due
```

---

# 104. Projection Without Confidence

Si se omite en V1, aún debemos preservar `sourceType` para poder agregarlo después.

---

# 105. Scenario Projection

Post-MVP:

```text
What if I spend X?

What if I pay debt early?

What if income is delayed?
```

---

# 106. Scenario Is Ephemeral

Un escenario:

```text
does not mutate canonical data
```

hasta que el usuario confirma una operación real.

---

# 107. Example Scenario

```text
If I spend $300,000 today:

Current spendable:
$500,000

New spendable:
$200,000

Projected minimum:
-$50,000
```

---

# 108. Explain Every Number

Principio clave:

```text
Every important financial number should be drillable.
```

---

# 109. Balance Explanation

```text
Opening balance
$500,000

Income
+$1,200,000

Expenses
-$400,000

Transfers
-$100,000

Current
$1,200,000
```

---

# 110. Spendable Explanation

```text
Liquid balance
$1,200,000

Reserved
-$100,000

Upcoming obligations
-$450,000

Spendable
$650,000
```

---

# 111. Debt Explanation

```text
Loan
$300,000

Visa
$250,000

Installment purchase
$130,000

Total
$680,000
```

---

# 112. Monthly Expense Explanation

```text
Food
$200,000

Housing
$300,000

Transport
$80,000

Other
$70,000

Refunds
-$20,000
```

---

# 113. Consistency Rule

La suma del desglose debe coincidir con el total mostrado.

Siempre.

---

# 114. Dashboard Calculation Service

Propuesta:

```text
packages/finance/src/dashboard/
```

---

# 115. Dashboard Service Inputs

Puede recibir:

```text
balances

posted transactions

obligations

budgets

scheduled events
```

---

# 116. Dashboard Service Output

Conceptualmente:

```ts
DashboardSummary {
  liquidBalances
  spendable
  monthlySummary
  debtSummary
  upcomingPayments
  cashflowProjection
  budgetSummary
}
```

---

# 117. Query vs Engine Boundary

DB/query layer:

```text
fetch relevant financial data
```

Finance engine:

```text
calculate meaning
```

UI:

```text
present meaning
```

---

# 118. Read Models

Propuesta:

```text
packages/db/src/queries/
├── dashboard.ts
├── balances.ts
├── upcoming-obligations.ts
├── monthly-summary.ts
├── debt-summary.ts
└── cashflow-inputs.ts
```

---

# 119. Finance Projections Structure

```text
packages/finance/src/projections/
├── spendable-money.ts
├── cashflow.ts
├── monthly-summary.ts
├── debt-summary.ts
├── net-worth.ts
└── dashboard.ts
```

---

# 120. No SQL Business Logic Sprawl

SQL puede:

```text
filter
aggregate
join
```

pero reglas centrales como:

```text
what counts as consumption
what counts as liability settlement
spendable formula
```

deben estar centralizadas y testeadas.

---

# 121. Reporting Classification

Cada movimiento debe poder mapearse a:

```text
INCOME

CONSUMPTION

TRANSFER

LIABILITY_SETTLEMENT

REFUND

ADJUSTMENT
```

---

# 122. Monthly Cashflow

```text
Cash In
-
Cash Out
```

donde transferencias propias quedan excluidas del total consolidado.

---

# 123. Monthly Consumption

```text
Consumption Expenses
-
Refunds
```

---

# 124. Savings Rate

Post-MVP:

```text
Savings Rate
=
(Income - Consumption) / Income
```

pero debe aclararse si incluye o no debt principal.

---

# 125. Avoid Vanity Metrics

No mostrar métricas complejas solo porque pueden calcularse.

Prioridad:

```text
actionable
understandable
explainable
```

---

# 126. Alerts Engine

Alertas determinísticas posibles:

```text
PAYMENT_OVERDUE

PAYMENT_DUE_SOON

PROJECTED_SHORTFALL

BUDGET_NEAR_LIMIT

BUDGET_EXCEEDED
```

---

# 127. Due Soon Threshold

Default configurable:

```text
3 days
```

pero el usuario puede definir recordatorios específicos.

---

# 128. Budget Near Limit

Ejemplo:

```text
usage >= 80%
```

puede generar aviso.

El porcentaje debe ser configuración, no hardcode disperso.

---

# 129. Projected Shortfall Alert

Generar solo si:

```text
projection crosses below zero
```

dentro del horizonte.

---

# 130. Alert Deduplication

No notificar repetidamente el mismo evento sin cambio relevante.

Ejemplo conceptual:

```text
alertType + sourceId + projectionVersion
```

---

# 131. AI Insights Boundary

AI puede recibir resultados calculados.

Ejemplo:

```text
Food spending:
+22%

Transport:
-10%

Debt:
-$100,000 this month
```

y redactar explicación.

---

# 132. AI Does Not Calculate Metrics

No enviar transacciones crudas y pedir:

```text
"calculate my spending"
```

como fuente principal.

Primero calculamos.

Luego AI explica.

---

# 133. Projection Privacy

Enviar a AI solo agregados necesarios cuando se generen insights.

Preferir:

```text
category totals
trend percentages
```

sobre:

```text
full transaction history
```

---

# 134. Performance Strategy V1

Primero:

```text
indexed queries
+
on-demand calculation
```

---

# 135. Optimization Later

Si hace falta:

```text
daily snapshots

monthly aggregates

cached dashboard summaries
```

---

# 136. Cache Invalidation

Si usamos caché, una operación como:

```text
transaction posted
debt payment
scheduled event posted
```

debe invalidar las proyecciones afectadas.

---

# 137. Prefer Recalculation Over Fragile Cache

Para V1:

```text
correctness > micro-optimization
```

---

# 138. Snapshot Candidates

Post-MVP:

```text
daily account balances

daily net worth

monthly spending totals

monthly debt totals
```

---

# 139. Historical Reports

Los reportes históricos deben usar:

```text
financial date
```

y no `createdAt`.

Ejemplo:

una transacción de julio creada en agosto debe afectar julio si `occurredAt` pertenece a julio.

---

# 140. Month Boundaries

Siempre calcular usando:

```text
user.timezone
```

cuando se parte de timestamps.

---

# 141. Projection Date

Eventos futuros basados en `DATE` deben interpretarse como día financiero local del usuario.

---

# 142. Testing — Spendable

Casos:

```text
no obligations

future obligations

reserved funds

negative spendable

different horizon
```

---

# 143. Testing — Cashflow

Casos:

```text
income only

expenses only

income and obligations

negative crossing

same-day events

multiple currencies
```

---

# 144. Testing — Monthly Summary

Casos:

```text
income

expense

refund

transfer

liability payment

voided transaction

split transaction
```

---

# 145. Testing — Debt Summary

Casos:

```text
active debt

partial installment

paid debt

cancelled installment

overdue installment

credit card grouping
```

---

# 146. Testing — Time

Casos:

```text
month end

year end

leap year

timezone boundary

due today
```

---

# 147. Property Invariants

Ejemplos:

```text
dashboard breakdown totals equal headline totals

projected balance equals starting balance plus cumulative events

spendable explanation components sum to spendable

outstanding debt never negative
```

---

# 148. Dashboard Success Criterion

El dashboard funciona cuando el usuario puede comprender rápidamente:

```text
cash position

debt position

upcoming commitments

monthly activity

near-term risk
```

sin inspeccionar varias pantallas.

---

# 149. Projection Success Criterion

Una proyección es correcta cuando:

```text
every event has a source

every total can be explained

future events do not alter actual balances

no obligation is counted twice

no currency is implicitly mixed
```

---

# 150. V1 Dashboard Scope

Implementar:

```text
Liquid Balance

Income This Month

Expenses This Month

Outstanding Debt

Upcoming Payments

30-Day Cashflow

Estimated Spendable

Budget Status
```

---

# 151. V1.1 Projection Scope

Agregar:

```text
Net Worth History

Debt Reduction Chart

90-Day Cashflow

Reserved Funds

Savings Goals

Merchant Trends
```

---

# 152. Post-MVP

Más adelante:

```text
scenario planning

forecast confidence

cashflow simulations

advanced debt payoff scenarios

multi-currency net worth

historical FX

predictive spending
```

---

# 153. Final Projection Principles

Mantener siempre:

```text
Actual is actual.

Scheduled is expected.

Obligation is committed.

Projection is estimated.
```

Y:

```text
Balance tells what exists.

Debt tells what is owed.

Spendable estimates what can be used.

Cashflow shows what may happen next.

Net worth shows overall financial position.
```

---

# 154. Próximo documento

El siguiente documento será:

```text
docs/05-mvp-roadmap.md
```

Debe convertir todo lo definido hasta ahora en fases implementables:

```text
Foundation

Accounts

Transactions

Transfers

Debt & Installments

Payments

Recurring / Scheduled

Dashboard

Cashflow

Budgets

Hardening
```

y especificar claramente:

```text
qué entra en MVP

qué queda para V1.1

orden de implementación

criterios de aceptación

Definition of Done
```
