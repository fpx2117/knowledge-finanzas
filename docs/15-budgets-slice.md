# Budgets Vertical Slice

## 1. Objetivo

Este documento define el vertical slice para presupuestos personales.

El objetivo es permitir que el usuario:

```text
defina límites de gasto

controle cuánto consumió

vea cuánto le queda

detecte categorías cerca del límite

vea cuándo ya excedió el presupuesto
```

Un presupuesto no representa dinero reservado ni una obligación futura.

Regla central:

```text
Budget
≠
Account Balance
≠
Reserved Money
≠
Financial Obligation
```

---

# 2. Scope

Incluye:

```text
Monthly Category Budgets

Budget Creation

Budget Editing

Budget Archive

Actual Spending Calculation

Refund Integration

Budget Remaining

Usage Percentage

Near-Limit Detection

Exceeded State

Dashboard Integration

Budget Detail

Tests
```

No incluye todavía:

```text
Budget Rollover

Envelope Budgeting

Reserved Funds

Shared Budgets

Automatic Budget Recommendations

AI-Generated Budgets

Weekly Budgets

Complex Multi-Category Budgets

Goal-Based Budgeting
```

---

# 3. Core Concept

Un presupuesto responde:

```text
¿Cuánto quiero gastar?
```

No:

```text
¿Cuánto tengo que pagar?
```

Ejemplo:

```text
Food Budget
ARS 200.000
```

significa que el usuario quiere limitar su consumo en esa categoría.

No implica que existan:

```text
ARS 200.000 reservados
```

ni:

```text
ARS 200.000 de obligaciones
```

---

# 4. Budget Entity

Entidad:

```text
Budget
├── id
├── userId
├── name
├── categoryId
├── currencyCode
├── period
├── limitAmount
├── startDate
├── endDate
├── rollover
├── status
├── createdAt
└── updatedAt
```

---

# 5. Budget Period

V1:

```text
MONTHLY
```

No implementar aún:

```text
WEEKLY
QUARTERLY
YEARLY
CUSTOM
```

---

# 6. Budget Status

Estados:

```text
ACTIVE

ARCHIVED
```

El estado visual de consumo:

```text
NORMAL

NEAR_LIMIT

EXCEEDED
```

debe derivarse.

No es necesariamente un estado persistido.

---

# 7. Category Scope

V1 requiere:

```text
one expense category per budget
```

Ejemplo:

```text
Food
ARS 200.000 / month
```

---

# 8. Income Categories

No permitir presupuestos sobre categorías:

```text
INCOME
```

en este slice.

Error:

```text
BUDGET_CATEGORY_TYPE_INVALID
```

---

# 9. Parent Categories

Si existe jerarquía de categorías, necesitamos una política explícita.

Recomendación V1:

```text
budget applies to selected category
+
all descendant expense categories
```

Ejemplo:

```text
Food
├── Supermarket
└── Restaurants
```

Budget:

```text
Food = ARS 200.000
```

incluye ambas subcategorías.

---

# 10. Leaf Category Budget

También puede existir:

```text
Restaurants = ARS 80.000
```

---

# 11. Overlapping Budgets

Esto genera una decisión importante.

Si existen:

```text
Food = 200.000
Restaurants = 80.000
```

el gasto en Restaurants participa en ambos presupuestos.

Esto es válido.

No significa doble gasto financiero.

Son dos comparaciones distintas.

---

# 12. Budget Creation Input

Conceptualmente:

```ts
{
  name?: string
  categoryId: string
  currencyCode: string
  limitAmount: DecimalInput
  startDate?: LocalDate
}
```

---

# 13. Budget Name

Puede derivarse inicialmente de la categoría.

Ejemplo:

```text
Presupuesto de Alimentos
```

No es necesario pedir nombre si no agrega valor.

---

# 14. Currency

V1:

```text
budget currency
```

debe coincidir con los gastos evaluados.

No realizar FX automático.

---

# 15. Budget Preconditions

Validar:

```text
authenticated user

category belongs to user

category is active

category type = EXPENSE

limitAmount > 0

currency supported
```

---

# 16. Budget Uniqueness

Recomendación V1:

permitir como máximo un presupuesto activo para:

```text
user
+
category
+
currency
+
period
```

en un mismo período efectivo.

Evitar duplicados accidentales.

---

# 17. Budget Time Model

Aunque sea mensual, no crear necesariamente una fila nueva cada mes.

Podemos modelar:

```text
recurring monthly budget configuration
```

con:

```text
startDate
```

y opcionalmente:

```text
endDate
```

---

# 18. Alternative Model

Otra opción sería materializar:

```text
BudgetPeriod
```

por mes.

No es necesario para V1.

Preferir una configuración mensual y calcular el período vigente.

---

# 19. Current Budget Period

Para usuario:

```text
user.timezone
```

determina mes actual.

Ejemplo:

```text
2026-08-01
→
2026-08-31
```

como rango financiero local.

---

# 20. Spending Source

El presupuesto utiliza:

```text
POSTED consumption transactions
```

---

# 21. Qualifying Transaction Types

Inicialmente:

```text
EXPENSE
```

Más adelante:

```text
CREDIT_CARD_PURCHASE
```

también debe contar como consumo.

---

# 22. Excluded Types

No contar:

```text
INCOME

TRANSFER_IN

TRANSFER_OUT

LIABILITY_PAYMENT

ADJUSTMENT_IN

ADJUSTMENT_OUT
```

salvo una política específica futura.

---

# 23. Voided Transactions

```text
VOIDED
```

no cuentan.

---

# 24. Refund Integration

Refund asociado a gasto presupuestado reduce consumo neto.

Conceptualmente:

```text
Budget Spent
=
Qualifying Expenses
-
Qualifying Refunds
```

---

# 25. Refund Category

Si refund está vinculado a transaction original:

usar la categoría original.

No exigir que el refund tenga una categoría duplicada.

---

# 26. Partial Refund

Ejemplo:

```text
Food expense
100

Refund
40
```

Budget spent:

```text
60
```

---

# 27. Full Refund

```text
Expense 100
Refund 100
```

Budget spent:

```text
0
```

---

# 28. Over Refund

No debería existir por reglas del ledger.

Budget engine asume que refund engine evita:

```text
refund > refundable amount
```

---

# 29. Transaction Splits

Cuando `TransactionSplit` exista:

el presupuesto debe utilizar:

```text
split category amounts
```

en lugar de asignar todo el gasto a la categoría principal.

---

# 30. Pre-Split V1

Hasta implementar splits:

```text
transaction.categoryId
```

define la categoría completa del gasto.

---

# 31. Uncategorized Expenses

No participan de un presupuesto de categoría específica.

Podemos mostrar separadamente:

```text
Uncategorized Spending
```

en reporting.

---

# 32. Budget Spent

Por presupuesto:

```text
spent
=
net qualifying consumption in period
```

---

# 33. Budget Remaining

```text
remaining
=
limitAmount
-
spent
```

---

# 34. Remaining Can Be Negative

No limitar a cero.

Ejemplo:

```text
Limit
100

Spent
120

Remaining
-20
```

Esto indica:

```text
20 over budget
```

---

# 35. Usage Percentage

Si:

```text
limit > 0
```

entonces:

```text
usagePercent
=
spent / limit * 100
```

---

# 36. Usage Above 100%

Permitido.

Ejemplo:

```text
spent = 150
limit = 100

usage = 150%
```

---

# 37. Budget Visual State

V1:

```text
NORMAL
NEAR_LIMIT
EXCEEDED
```

---

# 38. NORMAL

Ejemplo:

```text
usage < threshold
```

---

# 39. NEAR_LIMIT

Default configurable:

```text
usage >= 80%
AND
usage <= 100%
```

---

# 40. EXCEEDED

```text
spent > limit
```

---

# 41. Threshold Configuration

No hardcodear:

```text
80%
```

en múltiples componentes.

Definir:

```text
BUDGET_NEAR_LIMIT_PERCENT
```

o una constante central.

---

# 42. Boundary at 100%

Recomendación:

```text
spent = limit
```

puede considerarse:

```text
NEAR_LIMIT
```

con:

```text
remaining = 0
```

y:

```text
spent > limit
→ EXCEEDED
```

---

# 43. Budget Engine

Agregar:

```text
packages/finance/src/budgets/
```

---

# 44. Suggested Structure

```text
packages/finance/src/budgets/
├── calculate-budget.ts
├── budget-status.ts
├── budget-types.ts
└── index.ts
```

---

# 45. Pure Function

Conceptualmente:

```ts
calculateBudget({
  limit,
  expenses,
  refunds,
  nearLimitThreshold
})
```

retorna:

```ts
{
  spent,
  remaining,
  usagePercent,
  status
}
```

---

# 46. Money Safety

Toda aritmética debe usar:

```text
Money / exact decimal
```

No:

```text
JavaScript Number
```

---

# 47. Currency Invariant

Todos los valores que participan en un budget calculation deben compartir:

```text
currency
```

Si no:

```text
CURRENCY_MISMATCH
```

---

# 48. Budget Repository

Crear:

```text
BudgetRepository
```

responsable de:

```text
findByIdForUser

listActiveForUser

create

update

archive
```

---

# 49. Budget Read Queries

Crear query:

```text
getBudgetSpendingInputs
```

capaz de obtener consumo por:

```text
category tree

financial period

currency
```

sin cargar todas las transacciones históricas.

---

# 50. Category Descendants

Si budget incluye descendants:

query necesita conocer:

```text
category subtree
```

---

# 51. Category Hierarchy Strategy

V1 puede resolver descendants en application layer si la jerarquía es pequeña.

No introducir closure table si no es necesario.

---

# 52. Hierarchy Depth

La UI debería evitar árboles excesivamente profundos.

Recomendación general:

```text
category
→ subcategory
```

dos niveles suelen ser suficientes.

No es una constraint de DB obligatoria si ya existe otra decisión.

---

# 53. Budget Application Services

Crear:

```text
CreateBudget

UpdateBudget

ArchiveBudget

GetBudgetDetail

GetBudgetOverview
```

---

# 54. CreateBudget

Responsabilidades:

```text
validate authentication

validate category ownership

validate category type/status

validate currency

validate amount

check conflicting active budget

persist
```

---

# 55. UpdateBudget

Permitir cambiar:

```text
limitAmount

name if applicable
```

---

# 56. Category Change

Recomendación:

no permitir cambiar categoría en budget existente.

Si necesita otra:

```text
archive old budget
+
create new budget
```

Esto simplifica historia.

---

# 57. Currency Change

Tampoco permitir cambio libre.

Crear nuevo budget.

---

# 58. Archive

Archivar presupuesto:

```text
ACTIVE
→
ARCHIVED
```

No borra historia.

---

# 59. Budget History

Aunque V1 no tenga gráficos históricos, debe ser posible reconstruir consumo pasado usando:

```text
budget configuration
+
transactions
```

---

# 60. Editing Limit Mid-Month

Pregunta importante:

si el usuario cambia:

```text
Food
200.000
→
250.000
```

el 20 de agosto,

¿se aplica retroactivamente al mismo mes?

Recomendación V1:

```text
yes
```

El presupuesto representa el objetivo vigente para ese período.

No necesitamos versionado histórico de límites todavía.

---

# 61. Historical Limit Accuracy

Si más adelante queremos mostrar:

```text
what the budget limit was in May
```

necesitaremos:

```text
BudgetVersion
```

o materialización por período.

No forma parte de V1.

---

# 62. Budget Detail Route

```text
/budgets/[budgetId]
```

---

# 63. Budget List Route

```text
/budgets
```

---

# 64. New Budget Route

Puede ser:

```text
/budgets/new
```

o dialog.

El formulario es suficientemente simple como para usar dialog si UX lo permite.

---

# 65. Budget List

Cada card:

```text
Category

Spent / Limit

Remaining

Usage

Status
```

---

# 66. Example Card

```text
Alimentos

ARS 145.000 / ARS 200.000

ARS 55.000 disponibles

72.5%
```

---

# 67. Near Limit Example

```text
Entretenimiento

ARS 85.000 / ARS 100.000

ARS 15.000 disponibles

85%

Cerca del límite
```

---

# 68. Exceeded Example

```text
Restaurantes

ARS 120.000 / ARS 100.000

ARS 20.000 por encima

120%

Presupuesto excedido
```

---

# 69. Progress Bar

Puede mostrar progreso visual.

Pero siempre acompañado por:

```text
spent

limit

remaining
```

No usar barra como única información.

---

# 70. Progress Bar Over 100%

Visualmente puede saturarse en 100%:

```text
bar = full
```

mientras texto muestra:

```text
120%
```

No intentar renderizar una barra 3 veces más larga.

---

# 71. Budget Detail

Mostrar:

```text
Category

Period

Limit

Spent

Remaining

Usage

Status
```

---

# 72. Budget Spending Breakdown

También mostrar movimientos que contribuyen al presupuesto.

Ejemplo:

```text
08 Ago
Supermercado
45.000

10 Ago
Restaurante
20.000
```

si pertenecen a la categoría/subcategorías.

---

# 73. Refund Display

Mostrar reembolso como reducción:

```text
12 Ago
Reembolso supermercado
-10.000
```

dentro del breakdown.

---

# 74. Budget Period Navigation

V1 puede permitir:

```text
Previous Month
Current Month
```

si no agrega demasiada complejidad.

Pero el foco principal es:

```text
current month
```

---

# 75. MVP Recommendation

Primera iteración:

```text
current month only
```

en `/budgets`.

Budget detail puede recibir:

```text
?month=YYYY-MM
```

cuando agreguemos navegación histórica.

---

# 76. Dashboard Integration

Dashboard muestra:

```text
Budget Status
```

como sección secundaria.

---

# 77. Dashboard Budget Summary

Ejemplo:

```text
Presupuestos

2 cerca del límite
1 excedido
```

y top items:

```text
Food
72%

Entertainment
85%

Restaurants
120%
```

---

# 78. Dashboard Priority

Presupuestos aparecen después de:

```text
Spendable

Upcoming

Debt

Cashflow
```

porque no representan obligaciones.

---

# 79. No Spendable Integration Yet

Un budget no debe restarse automáticamente de:

```text
Spendable Money
```

Ejemplo:

```text
Food budget remaining
100.000
```

no significa que esos 100.000 estén reservados.

---

# 80. Reserved Funds Future

Cuando exista:

```text
ReservedFund
```

podremos representar dinero separado de verdad.

No usar Budget como sustituto.

---

# 81. Upcoming Integration

Budget tampoco crea:

```text
Upcoming Obligation
```

porque un presupuesto no dice cuándo ocurrirá un gasto.

---

# 82. Cashflow Integration

Budget no entra directamente en cashflow.

Solo las transacciones/scheduled obligations reales.

---

# 83. Monthly Summary Integration

Budget usa el mismo concepto:

```text
Consumption Expense
```

que monthly reporting.

Debe existir una única clasificación económica consistente.

---

# 84. Reporting Classification Dependency

Crear o reutilizar:

```text
classifyTransactionForReporting()
```

para evitar que Budget y Dashboard tengan reglas distintas.

---

# 85. Economic Classes

Por ejemplo:

```text
INCOME

CONSUMPTION

TRANSFER

LIABILITY_SETTLEMENT

REFUND

ADJUSTMENT
```

---

# 86. Budget Qualifying Class

Budget cuenta:

```text
CONSUMPTION
```

y resta:

```text
REFUND
```

cuando corresponde al consumo incluido.

---

# 87. Credit Card Future

Cuando exista `CREDIT_CARD_PURCHASE`:

su economic class será:

```text
CONSUMPTION
```

por lo tanto debe entrar en budgets.

---

# 88. Credit Card Payment Future

```text
LIABILITY_PAYMENT
```

no entra.

---

# 89. Budget Alerts

Crear eventos determinísticos:

```text
BUDGET_NEAR_LIMIT

BUDGET_EXCEEDED
```

---

# 90. Alert Trigger

Después de una mutación que afecta consumo:

```text
expense creation

expense void

refund

refund void/reversal later

category change
```

recalcular estado relevante.

---

# 91. No AI Trigger Logic

AI no decide si presupuesto está excedido.

El finance engine lo decide.

---

# 92. Reminder vs Alert

`Budget Alert` no es igual que:

```text
Reminder
```

Reminder:

```text
future time-based event
```

Budget alert:

```text
state threshold event
```

---

# 93. Notification V1

Puede mostrarse solo:

```text
in-app
```

Ejemplo:

```text
Usaste el 85% de tu presupuesto de entretenimiento.
```

---

# 94. Deduplication

Evitar mostrar notificación en cada gasto una vez superado 80%.

Conceptualmente registrar:

```text
budgetId
+
period
+
alertType
```

como identidad.

---

# 95. Near Limit Alert

Disparar una vez al cruzar:

```text
below threshold
→
at/above threshold
```

---

# 96. Exceeded Alert

Disparar cuando pasa:

```text
spent <= limit
→
spent > limit
```

---

# 97. Falling Back Below Threshold

Por refund podría pasar:

```text
85%
→
70%
```

Luego vuelve a 85%.

Podemos permitir nuevo alert si se quiere.

V1 puede deduplicar por:

```text
period + type
```

y no reenviar.

---

# 98. Alert Persistence

Podemos reutilizar infraestructura futura de notifications.

No crear un sistema complejo solo para budgets.

---

# 99. Error Codes

Agregar:

```text
BUDGET_NOT_FOUND

BUDGET_CATEGORY_NOT_FOUND

BUDGET_CATEGORY_TYPE_INVALID

BUDGET_CATEGORY_ARCHIVED

INVALID_BUDGET_AMOUNT

BUDGET_ALREADY_EXISTS

BUDGET_CURRENCY_MISMATCH

BUDGET_ARCHIVED
```

---

# 100. UI Errors

Ejemplo:

```text
Ya existe un presupuesto activo para esta categoría.
```

---

# 101. Budget Form

Campos:

```text
Category

Monthly Limit

Currency
```

Si currency se puede inferir del contexto del usuario, aún debe quedar clara.

---

# 102. Currency UX

Si usuario usa varias monedas:

permitir seleccionar.

No crear un presupuesto:

```text
Food = 200.000
```

sin indicar moneda.

---

# 103. Category Selector

Mostrar solo:

```text
active expense categories
```

---

# 104. Existing Budget Category

Si ya existe active budget para esa categoría/moneda:

ocultarla o mostrar:

```text
Already budgeted
```

---

# 105. Budget Edit Form

Mostrar:

```text
Category
read-only

Currency
read-only

Monthly Limit
editable
```

---

# 106. Archive Confirmation

Texto:

```text
Archivar este presupuesto dejará de mostrarlo como activo, pero conservará su información histórica.
```

---

# 107. Empty State

```text
Todavía no configuraste presupuestos.

Creá límites mensuales para las categorías que quieras controlar.

[Crear presupuesto]
```

---

# 108. No Expense Yet

Budget creado pero sin gasto:

```text
ARS 0 / ARS 200.000

ARS 200.000 disponibles
```

---

# 109. Zero Limit

No permitir.

Constraint:

```text
limitAmount > 0
```

---

# 110. Negative Spending

Por refunds puede teóricamente ocurrir:

```text
net spending < 0
```

si existen datos históricos extraños.

Idealmente refund constraints evitan esto por categoría/origen.

Budget engine no debería romperse.

Política V1:

```text
allow computed spent >= 0 expectation
```

y detectar inconsistencia si cae debajo de cero por datos legacy.

---

# 111. Database Table

`budgets`:

```text
id

user_id

name

category_id

currency_code

period

limit_amount

start_date

end_date?

rollover

status

created_at

updated_at

archived_at?
```

---

# 112. rollover

V1:

```text
false
```

No implementar lógica.

Puede omitirse de UI aunque exista en schema.

---

# 113. Period Enum

```text
MONTHLY
```

único valor V1 si el enum ya está preparado para futuros tipos.

---

# 114. Constraints

```text
limit_amount > 0

start_date NOT NULL

valid status

valid period
```

---

# 115. Foreign Keys

```text
budget.user_id → users.id

budget.category_id → categories.id
```

Preferir:

```text
ON DELETE RESTRICT
```

---

# 116. Indexes

Mínimo:

```text
budgets(user_id, status)

budgets(user_id, category_id, status)

budgets(user_id, currency_code, status)
```

---

# 117. Uniqueness

Un índice parcial puede proteger:

```text
one ACTIVE monthly budget
per user/category/currency
```

si el modelo de fechas lo permite.

Si no, application validation inicialmente.

---

# 118. Current Period Query

Crear:

```text
getCurrentBudgetOverview(userId, timezone)
```

---

# 119. Query Result

```ts
type BudgetOverviewItem = {
  budgetId: string
  categoryId: string
  categoryName: string
  currency: CurrencyCode
  limit: Money
  spent: Money
  remaining: Money
  usagePercent: Decimal
  status: BudgetUsageStatus
}
```

---

# 120. Query Efficiency

No hacer:

```text
one transaction query per budget
```

Usar:

```text
aggregate spending by category
```

y mapear contra budgets.

---

# 121. Descendant Aggregation

Si existen parent budgets:

la query puede:

```text
load category tree once

aggregate direct category totals

roll child totals into ancestors
```

para evitar queries repetitivas.

---

# 122. Finance/DB Boundary

DB:

```text
fetches grouped raw totals
```

Finance:

```text
calculates spent/remaining/status
```

---

# 123. Ownership

Toda consulta/mutación:

```text
budget.userId = currentUserId
```

---

# 124. Category Ownership

Al crear:

```text
category.userId = currentUserId
```

---

# 125. Category Archive Interaction

Si una categoría tiene budget activo:

recomendación:

```text
block category archive
```

hasta:

```text
archive budget
```

o mover budget.

Esto evita configuraciones activas apuntando a categorías ya no utilizables.

---

# 126. Transaction Category Editing

Si usuario cambia una transacción de:

```text
Food
→
Transport
```

el consumo de ambos budgets debe actualizarse.

No mantener counters manuales sin invalidación robusta.

---

# 127. Transaction Void

Anular un gasto debe reducir:

```text
budget spent
```

---

# 128. Refund

Refund debe reducir spent inmediatamente al recalcular.

---

# 129. Transfer

No impacta budget.

---

# 130. Debt Payment

No impacta budget.

---

# 131. Debt Creation

No impacta budget.

---

# 132. Scheduled Expense

No impacta budget real antes de posting.

---

# 133. Budget Forecast

No implementar todavía.

No mezclar:

```text
scheduled expenses
```

con:

```text
budget spent
```

---

# 134. Future Budget Forecast

Post-MVP podríamos tener:

```text
spent
+
known future category expenses
```

como:

```text
projected budget usage
```

pero debe mostrarse separadamente.

---

# 135. AI Integration Future

AI puede explicar:

```text
Food budget:
90%

12 days remaining
```

pero no calcula ese porcentaje.

---

# 136. AI Budget Suggestion

Post-MVP puede sugerir:

```text
Basado en los últimos meses...
```

pero nunca cambiar presupuesto sin confirmación.

---

# 137. No AI Initially

Este slice debe funcionar completamente sin:

```text
OpenRouter
```

---

# 138. Dashboard Budget Card

Ejemplo:

```text
Presupuestos

Alimentos
72%

Entretenimiento
85% · Cerca del límite

Restaurantes
120% · Excedido

[Ver presupuestos]
```

---

# 139. Dashboard Alert Priority

Si hay varios:

mostrar primero:

```text
EXCEEDED
```

luego:

```text
NEAR_LIMIT
```

---

# 140. Budget List Sorting

Recomendación:

```text
EXCEEDED

NEAR_LIMIT

NORMAL
```

y dentro:

```text
usage DESC
```

---

# 141. Multi-Currency Budget List

Puede agruparse:

```text
ARS
USD
```

si es necesario.

No mezclar montos.

---

# 142. Accessibility

Progress bar necesita:

```text
accessible label
```

Ejemplo:

```text
Alimentos: 72% del presupuesto utilizado.
```

---

# 143. Status Without Color

Mostrar texto:

```text
Cerca del límite
```

o:

```text
Excedido
```

además de estilo visual.

---

# 144. Mobile UI

Budget card debe priorizar:

```text
category

spent / limit

remaining

status
```

No sobrecargar con metadata.

---

# 145. Loading State

Skeletons para:

```text
budget list

dashboard budget summary
```

---

# 146. Error State

Ejemplo:

```text
No pudimos cargar tus presupuestos.

[Reintentar]
```

---

# 147. Testing — Basic Budget

Limit:

```text
200
```

Expense:

```text
50
```

Expected:

```text
spent = 50

remaining = 150

usage = 25%

status = NORMAL
```

---

# 148. Testing — Near Limit

Limit:

```text
100
```

Spent:

```text
80
```

Expected:

```text
usage = 80%

NEAR_LIMIT
```

según threshold V1.

---

# 149. Testing — Exceeded

Limit:

```text
100
```

Spent:

```text
120
```

Expected:

```text
remaining = -20

usage = 120%

EXCEEDED
```

---

# 150. Testing — Refund

Expense:

```text
100
```

Refund:

```text
40
```

Expected:

```text
spent = 60
```

---

# 151. Testing — Transfer Excluded

Budget Food:

```text
100
```

Transfer:

```text
50
```

Expected:

```text
spent unchanged
```

---

# 152. Testing — Debt Payment Excluded

Liability payment:

```text
80
```

Expected:

```text
budget unchanged
```

---

# 153. Testing — Scheduled Expense Excluded

Scheduled Food:

```text
50
```

not posted.

Expected:

```text
spent unchanged
```

---

# 154. Testing — Scheduled Posted

After posting as:

```text
EXPENSE
```

Expected:

```text
spent increases by 50
```

---

# 155. Testing — Voided Expense

Expense:

```text
50
```

then void.

Expected:

```text
spent returns to previous value
```

---

# 156. Testing — Category Change

Expense:

```text
Food 50
```

change category to:

```text
Transport
```

Expected:

```text
Food -50

Transport +50
```

where relevant.

---

# 157. Testing — Parent Category

Budget:

```text
Food
100
```

Expenses:

```text
Supermarket 30

Restaurant 20
```

Expected:

```text
spent = 50
```

---

# 158. Testing — Overlapping Parent/Child

Budgets:

```text
Food 100

Restaurants 50
```

Restaurant expense:

```text
20
```

Expected:

```text
Food spent = 20

Restaurants spent = 20
```

No financial double counting occurs because calculations belong to separate budget comparisons.

---

# 159. Testing — Multi-Currency

Budget:

```text
Food ARS
```

USD expense must not enter it.

---

# 160. Testing — Ownership

User A cannot:

```text
read
edit
archive
```

User B budget.

---

# 161. Testing — Wrong Category Ownership

User A cannot create budget with User B category.

---

# 162. Testing — Income Category

Creating budget for:

```text
Salary
```

must fail.

---

# 163. Testing — Archived Category

Cannot create new budget.

---

# 164. Testing — Duplicate Active Budget

Second active monthly Food ARS budget:

expected rejection.

---

# 165. Testing — Month Boundary

Expense on:

```text
last day of month local time
```

must belong to correct user-local month.

---

# 166. Testing — Refund Across Months

Important policy:

Suppose:

```text
Expense
July

Refund
August
```

¿Qué presupuesto debe reducir?

Recomendación V1:

```text
refund affects the period in which refund occurred
```

para reporting de flujo/consumo mensual actual.

Pero conserva link al original.

---

# 167. Alternative Refund Accounting

Un reporte histórico de consumo puede querer restatar julio.

Eso es un problema contable diferente.

Para V1:

```text
budget uses refund occurredAt period
```

porque es más comprensible operacionalmente.

---

# 168. Document Refund Policy

Esta decisión debe ser consistente entre:

```text
Monthly Summary

Budget

Category Reports
```

No tener semánticas distintas.

---

# 169. Property Tests

Useful invariants:

```text
remaining = limit - spent
```

```text
usage = spent / limit
```

```text
transfers never change spent
```

```text
liability payments never change spent
```

```text
voided expenses never contribute
```

---

# 170. E2E Flow

```text
Register

Create Bank
Opening 1000

Create Food category

Create Food budget
500

Create Food expense
200

Verify:
spent 200
remaining 300
40%

Create Food expense
250

Verify:
spent 450
remaining 50
90%
NEAR_LIMIT

Create Food expense
100

Verify:
spent 550
remaining -50
110%
EXCEEDED

Refund 100

Verify:
spent 450
remaining 50
90%
```

---

# 171. Dashboard E2E

With:

```text
Food 90%

Entertainment 120%

Transport 50%
```

dashboard summary should prioritize:

```text
Entertainment
Food
```

---

# 172. Security Checklist

```text
[ ] authentication required

[ ] budget ownership enforced

[ ] category ownership enforced

[ ] income category rejected

[ ] archived category rejected

[ ] client userId ignored
```

---

# 173. Financial Integrity Checklist

```text
[ ] exact money arithmetic

[ ] only consumption counts

[ ] refunds reduce consumption

[ ] transfers excluded

[ ] liability payments excluded

[ ] scheduled events excluded until posted

[ ] currencies never mixed

[ ] voided transactions excluded
```

---

# 174. UI Checklist

```text
[ ] Budget list

[ ] New budget form

[ ] Budget edit

[ ] Budget archive

[ ] Budget detail

[ ] Progress indicator

[ ] Near-limit state

[ ] Exceeded state

[ ] Spending breakdown

[ ] Empty state

[ ] Loading state

[ ] Error state

[ ] Mobile layout
```

---

# 175. Definition of Done

El slice está terminado cuando el usuario puede:

```text
create monthly category budget

see actual spending

see remaining amount

see usage percentage

identify near-limit budgets

identify exceeded budgets

see contributing transactions

archive budget
```

con cálculos consistentes con el resto del sistema.

---

# 176. Technical DoD

Debe pasar:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

---

# 177. Financial DoD

Tests deben probar:

```text
expenses count

refunds subtract

transfers do not count

debt payments do not count

scheduled expenses do not count before posting

category hierarchy behaves correctly

multi-currency remains separated
```

---

# 178. Scope Boundary

No implementar todavía:

```text
rollover

envelope budgeting

reserved funds

weekly budgets

budget forecasting

AI-generated limits

shared household budgets
```

---

# 179. Next Document

El siguiente documento de la secuencia será:

```text
docs/16-billing-mercadopago-slice.md
```

y debe bajar `docs/10-billing-subscriptions-mercadopago.md` a implementación concreta:

```text
Plans

FREE / PRO

Entitlements

Mercado Pago Provider

Subscription Checkout

Webhook Verification

Subscription Synchronization

Payment History

Cancellation

Grace Period

Reconciliation

Feature Gates

Tests
```
