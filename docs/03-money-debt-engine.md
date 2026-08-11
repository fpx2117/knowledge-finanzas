# Money & Debt Engine

## 1. Objetivo

Este documento define el motor financiero determinístico de la aplicación.

El motor es responsable de calcular y validar:

* representación monetaria;
* precisión;
* redondeo;
* saldos;
* transferencias;
* reembolsos;
* deudas;
* cuotas;
* pagos parciales;
* pagos anticipados;
* asignación de pagos;
* tarjetas de crédito;
* recurrencias;
* movimientos programados;
* obligaciones futuras;
* proyecciones base.

La regla principal es:

```text
AI does not calculate financial truth.
```

Toda lógica financiera crítica debe ser:

```text
deterministic
testable
explainable
versionable
```

---

# 2. Principios fundamentales

## 2.1 Source of truth

Las fuentes canónicas son:

```text
Transactions
DebtInstallments
DebtPayments
PaymentAllocations
ScheduledTransactions
RecurringRules
```

No son fuente de verdad:

```text
Dashboard totals
Cached balances
Projected balances
Net worth snapshots
Spendable money
```

---

## 2.2 Derived values

Valores derivados deben poder reconstruirse.

Ejemplos:

```text
Account Balance
Outstanding Debt
Installment Remaining
Monthly Spending
Budget Remaining
Projected Cashflow
```

---

## 2.3 No floating point

Nunca utilizar:

```text
float
double
JavaScript Number arithmetic
```

como motor financiero principal para montos.

---

# 3. Money Value Object

El dominio debe tratar dinero como un value object conceptual.

```ts
Money {
  amount
  currency
}
```

Ejemplo:

```text
1000.50 ARS
```

---

# 4. Money Invariants

Dos `Money` pueden sumarse directamente únicamente si:

```text
currency A = currency B
```

Operación inválida:

```text
ARS 1000 + USD 100
```

sin una conversión explícita.

---

# 5. Money Representation in Application

Aunque PostgreSQL utilice:

```text
NUMERIC
```

el código TypeScript no debe convertir estos valores indiscriminadamente a `number`.

Usar una representación decimal exacta.

Conceptualmente:

```ts
Money {
  amount: Decimal
  currency: CurrencyCode
}
```

---

# 6. Currency Metadata

Necesitamos metadata central de monedas.

Ejemplo conceptual:

```ts
Currency {
  code: "ARS"
  decimalPlaces: 2
}
```

No hardcodear globalmente:

```text
all currencies = 2 decimals
```

---

# 7. Rounding

Toda operación monetaria debe pasar por una estrategia centralizada.

Conceptualmente:

```ts
roundMoney(
  amount,
  currency,
  roundingMode
)
```

---

# 8. Default Rounding Mode

Para operaciones financieras ordinarias:

```text
HALF_UP
```

puede ser una estrategia inicial razonable.

La implementación concreta debe ser única en todo el sistema.

---

# 9. No Feature-Level Rounding

Evitar:

```text
Math.round()
toFixed()
```

distribuidos por features.

Todos los redondeos deben pasar por:

```text
Money / Rounding module
```

---

# 10. Installment Division

Ejemplo:

```text
100 / 3
```

para moneda con dos decimales.

Resultado determinístico:

```text
33.33
33.33
33.34
```

---

# 11. Remainder Allocation

La diferencia de redondeo debe asignarse de forma determinística.

V1:

```text
last installment receives remainder
```

Ejemplo:

```text
100.00

33.33
33.33
33.34
```

---

# 12. Alternative Remainder Strategy

Post-MVP podríamos distribuir diferencias entre primeras cuotas.

Pero nunca permitir que:

```text
sum(installments) != total
```

---

# 13. Financial Date Concepts

Debemos distinguir:

```text
occurredAt
postedAt
dueDate
scheduledDate
paidAt
```

---

# 14. occurredAt

Representa cuándo ocurrió económicamente una operación.

Ejemplo:

```text
compra realizada 10/08
```

---

# 15. postedAt

Representa cuándo el movimiento quedó confirmado/registrado.

Puede diferir de `occurredAt`.

---

# 16. dueDate

Fecha límite de una obligación.

No implica que exista una transacción real.

---

# 17. scheduledDate

Fecha esperada de un movimiento futuro.

Tampoco afecta saldo real.

---

# 18. paidAt

Momento en el que se ejecutó un pago real.

---

# 19. Account Balance Engine

La función conceptual:

```text
calculateAccountBalance(accountId, at?)
```

produce saldo real.

---

# 20. Asset Account Balance

Para:

```text
CASH
BANK
DIGITAL_WALLET
SAVINGS
```

balance conceptual:

```text
openingBalance
+
INCOME
+
TRANSFER_IN
+
REFUND
+
positive ADJUSTMENT
-
EXPENSE
-
TRANSFER_OUT
-
LIABILITY_PAYMENT
-
negative ADJUSTMENT
```

considerando solo movimientos:

```text
POSTED
```

---

# 21. Voided Transactions

Una transacción:

```text
VOIDED
```

no participa del balance.

---

# 22. Future Transactions

Una:

```text
ScheduledTransaction
```

no participa del saldo real.

---

# 23. Credit Card Balance

Una tarjeta representa liability, no efectivo disponible.

Debemos distinguir:

```text
Outstanding Card Balance
```

de:

```text
Available Credit
```

---

# 24. Outstanding Card Balance

Conceptualmente:

```text
posted purchases
+
fees/interest
-
payments
-
refunds
```

---

# 25. Available Credit

```text
Available Credit
=
Credit Limit
-
Outstanding Card Balance
```

con reglas adicionales si existen consumos pendientes.

---

# 26. Credit Limit Is Not Asset

Nunca incluir:

```text
credit limit
```

como dinero disponible o activo.

---

# 27. Total Cash Balance

Una métrica consolidada puede sumar únicamente cuentas consideradas líquidas.

Ejemplo:

```text
CASH
BANK
DIGITAL_WALLET
SAVINGS
```

No tarjetas.

---

# 28. Net Worth

Conceptualmente:

```text
Net Worth
=
Assets
-
Liabilities
```

---

# 29. V1 Assets

Para V1:

```text
asset value
=
balances of asset accounts
```

---

# 30. V1 Liabilities

```text
liabilities
=
outstanding debts
+
outstanding credit card obligations
```

evitando doble conteo entre Debt y CreditCard.

---

# 31. Transfer Engine

Crear transferencia requiere:

```text
source account
destination account
amount
date
```

---

# 32. Transfer Preconditions

Validar:

```text
same user

different accounts

amount > 0

same currency in V1

source account active

destination account active
```

---

# 33. Transfer Posting

La operación debe crear:

```text
Transfer
+
TRANSFER_OUT Transaction
+
TRANSFER_IN Transaction
```

en una única DB transaction.

---

# 34. Transfer Invariant

Debe cumplirse:

```text
outgoing amount = incoming amount
```

en V1 same-currency.

---

# 35. Transfer Net Effect

Sobre patrimonio:

```text
0
```

Ignorando fees.

---

# 36. Transfer Fees

Post-MVP:

```text
Transfer
100

Fee
2
```

podría crear:

```text
TRANSFER_OUT 100
EXPENSE 2
TRANSFER_IN 100
```

El fee sí es gasto.

---

# 37. Cross Currency Transfers

Futuro:

```text
USD 100
→
ARS 150,000
```

requiere:

```text
sourceAmount
targetAmount
exchangeRate
```

No mezclar con V1.

---

# 38. Refund Engine

Un refund debe poder enlazarse a:

```text
originalTransactionId
```

---

# 39. Refund Preconditions

Validar:

```text
same user

original transaction exists

original transaction eligible

refund amount > 0
```

---

# 40. Refund Maximum

Conceptualmente:

```text
total refunded
<=
original refundable amount
```

salvo casos especiales explícitos.

---

# 41. Refund Reporting

Un refund debe reducir:

```text
net spending
```

de la categoría original cuando sea posible.

---

# 42. Refund Account Impact

Si entra dinero nuevamente a la cuenta:

```text
account balance increases
```

pero no se clasifica como ingreso ordinario.

---

# 43. Adjustment Engine

Los adjustments sirven para reconciliar errores o diferencias.

---

# 44. Adjustment Types

Conceptualmente:

```text
BALANCE_CORRECTION
REVERSAL
MANUAL_CORRECTION
```

---

# 45. Adjustment Requirement

Todo adjustment debe contener:

```text
reason
```

y, cuando aplique:

```text
relatedTransactionId
```

---

# 46. Avoid Silent Balance Editing

Nunca permitir:

```text
account.balance = 5000
```

sin movimiento.

Para corregir:

```text
create Adjustment
```

---

# 47. Debt Engine

Una deuda tiene:

```text
Debt
+
Installments
+
Payments
+
Allocations
```

---

# 48. Debt Outstanding Amount

Derivado:

```text
Outstanding Debt
=
SUM(active installment total)
-
SUM(payment allocations)
```

sobre cuotas no canceladas.

---

# 49. Debt Original Amount vs Total Payable

Pueden ser distintos.

Ejemplo:

```text
principal
100,000

interest
20,000

fees
5,000

total payable
125,000
```

---

# 50. originalAmount

Representa principal/valor original según tipo de deuda.

No asumir:

```text
originalAmount = sum installments
```

cuando existen intereses/fees.

---

# 51. Debt Lifecycle

Estados:

```text
ACTIVE
OVERDUE
PAID
CANCELLED
```

---

# 52. Debt Status Derivation

Preferencia:

```text
PAID
```

si:

```text
all non-cancelled installments remaining = 0
```

---

# 53. Debt Overdue

```text
OVERDUE
```

si:

```text
at least one installment is overdue
AND
debt remaining > 0
```

---

# 54. Debt Active

```text
ACTIVE
```

si:

```text
remaining > 0
AND
no overdue installments
```

---

# 55. Cancelled Debt

Una deuda cancelada no borra historial.

Cuotas futuras pueden marcarse:

```text
CANCELLED
```

según operación.

---

# 56. Installment Generation Engine

Input:

```text
total
count
firstDueDate
frequency
currency
```

---

# 57. V1 Frequencies for Installments

```text
MONTHLY
WEEKLY
BIWEEKLY
CUSTOM
```

---

# 58. Monthly Date Generation

Problema:

```text
first due date = January 31
```

¿Qué ocurre en febrero?

---

# 59. End-of-Month Rule

V1:

Si la fecha original cae en un día inexistente en el siguiente mes:

```text
use last valid day of that month
```

Ejemplo:

```text
31 Jan
28 Feb
31 Mar
30 Apr
```

---

# 60. Preserve Anchor Day

La estrategia debe recordar el:

```text
anchorDay = 31
```

para que marzo vuelva a:

```text
31
```

y no continúe desde:

```text
28
```

---

# 61. Leap Year

Ejemplo:

```text
31 Jan 2028
29 Feb 2028
31 Mar 2028
```

Debe estar cubierto por tests.

---

# 62. Installment Amount Generation

Sin intereses:

```text
totalAmount
/
installmentCount
```

con algoritmo de rounding central.

---

# 63. Fixed Installments

Si el usuario especifica:

```text
installment amount
```

podemos calcular total:

```text
amount * count
```

si ese flujo de creación lo requiere.

---

# 64. Manual Installments

El usuario puede reemplazar cualquier:

```text
dueDate
amount
```

antes de confirmar la deuda.

---

# 65. Installment Confirmation

Preferible flujo:

```text
generate preview
↓
user reviews
↓
persist debt + installments
```

para evitar correcciones posteriores innecesarias.

---

# 66. Installment Status Engine

Para cuota:

```text
remaining =
totalAmount - allocations
```

---

# 67. Installment PAID

Si:

```text
remaining = 0
```

estado:

```text
PAID
```

---

# 68. Installment PARTIALLY_PAID

Si:

```text
0 < remaining < totalAmount
```

y aún no está vencida:

```text
PARTIALLY_PAID
```

---

# 69. Installment OVERDUE

Si:

```text
remaining > 0
AND
dueDate < today
```

estado:

```text
OVERDUE
```

incluso si hubo pagos parciales.

---

# 70. Installment PENDING

Si:

```text
remaining = totalAmount
AND
dueDate >= today
```

---

# 71. Due Today

Una cuota con:

```text
dueDate = today
```

no se considera vencida durante ese día.

---

# 72. User Timezone

`today` debe calcularse según:

```text
user.timezone
```

No timezone del servidor.

---

# 73. Payment Engine

Registrar pago requiere:

```text
Debt
Account
Amount
Payment Date
Allocation Strategy
```

---

# 74. Payment Preconditions

Validar:

```text
same user

debt active/overdue

account valid

amount > 0

currency compatible
```

---

# 75. Available Account Balance

V1 puede permitir registrar pago aunque el saldo calculado quede negativo.

Por ejemplo:

```text
bank overdraft
```

Pero la UI debe advertir.

No bloquear universalmente por balance insuficiente.

---

# 76. Payment Creates Cash Movement

Un pago desde cuenta asset genera:

```text
LIABILITY_PAYMENT
```

que reduce la cuenta.

---

# 77. Payment Is Not Consumer Expense

Para reportes de gasto:

```text
LIABILITY_PAYMENT
```

no debe volver a sumar consumo si la deuda provino de gastos ya registrados.

---

# 78. Important Exception

Una deuda creada manualmente puede representar dinero prestado sin gasto original registrado.

Por eso reportes deben distinguir:

```text
cash outflow
```

de:

```text
consumption expense
```

---

# 79. Financial Reporting Dimensions

Conviene separar:

```text
Cashflow
Consumption
Liability Settlement
```

No todo outflow es gasto de consumo.

---

# 80. Payment Allocation Strategies

V1 puede ofrecer:

```text
MANUAL
OLDEST_DUE_FIRST
```

---

# 81. MANUAL Allocation

El usuario elige:

```text
cuota(s)
+
monto por cuota
```

---

# 82. OLDEST_DUE_FIRST

Algoritmo:

```text
sort unpaid installments by dueDate ASC
```

y asignar hasta consumir el pago.

---

# 83. Example Allocation

Pago:

```text
250
```

Cuotas:

```text
#1 remaining 100
#2 remaining 100
#3 remaining 100
```

Resultado:

```text
#1 = 100
#2 = 100
#3 = 50
```

---

# 84. Allocation Invariant

Debe cumplirse:

```text
sum(allocations)
=
payment.amount
```

V1.

---

# 85. Overpayment

V1:

No permitir pago superior a:

```text
total outstanding debt
```

salvo que tengamos explícitamente soporte para saldo acreedor.

---

# 86. Payment Atomicity

La operación completa debe ser atómica:

```text
Transaction
DebtPayment
Allocations
Statuses
```

---

# 87. Concurrent Payment Protection

Dos requests concurrentes podrían intentar pagar la misma cuota.

Dentro de transaction DB:

```text
lock relevant installments
```

o usar estrategia equivalente.

Luego recalcular:

```text
remaining
```

antes de persistir allocations.

---

# 88. Early Payment

Una cuota futura puede recibir pago.

No hay restricción:

```text
paidAt < dueDate
```

Eso representa pago anticipado válido.

---

# 89. Paying Multiple Future Installments

Permitido.

Ejemplo:

```text
pagar cuotas 5, 6 y 7 hoy
```

---

# 90. Loan Principal Prepayment

No forma parte de V1 avanzado.

V1 paga obligaciones existentes.

Post-MVP podremos permitir:

```text
principal prepayment
```

que regenere amortización.

---

# 91. Credit Card Engine

Una tarjeta combina:

```text
CreditCard Account
+
Purchases
+
Statements
+
Payments
```

---

# 92. Card Purchase

Una compra:

```text
CREDIT_CARD_PURCHASE
```

debe aumentar liability de tarjeta.

---

# 93. Card Purchase Does Not Reduce Bank

Hasta que se pague la tarjeta.

---

# 94. Card Consumption Reporting

La compra sí cuenta como:

```text
consumer expense
```

en la fecha de consumo según política de reporte.

---

# 95. Card Payment

Pagar tarjeta:

```text
Bank -300
Credit Card Liability -300
```

No crear un segundo gasto de consumo.

---

# 96. Statement Period Engine

La tarjeta tiene:

```text
closingDay
dueDay
```

---

# 97. Purchase Statement Assignment

Una compra debe asignarse al período según:

```text
occurredAt
```

y closing date.

---

# 98. Example

Cierre:

```text
25
```

Compra:

```text
24 Aug
```

→ statement actual.

Compra:

```text
26 Aug
```

→ siguiente statement.

---

# 99. Closing Date Edge Cases

Si `closingDay = 31` y el mes tiene 30/28 días:

usar:

```text
last valid day
```

preservando anchor day.

---

# 100. Payment Due Date

El statement debe calcular vencimiento según:

```text
paymentDueDay
```

del período correspondiente.

---

# 101. Due Before Closing Ambiguity

Ejemplo:

```text
closing day = 25
due day = 5
```

el vencimiento pertenece al mes siguiente.

El motor debe calcular explícitamente:

```text
next valid due date after closing date
```

---

# 102. Card Installment Purchase

Ejemplo:

```text
1200
12 cuotas
```

Cada cuota debe asignarse a un período futuro.

---

# 103. Card Installment Engine

Genera obligaciones:

```text
100
100
...
100
```

con referencia a la compra original.

---

# 104. Avoid Duplicate Debt Modeling

V1 debe reutilizar:

```text
DebtInstallment
```

para obligaciones de tarjeta cuando sea posible.

No crear dos motores matemáticos separados.

---

# 105. Statement as Grouping

`CreditCardStatement` agrupa obligaciones/cuotas correspondientes a un período.

No es necesariamente la fuente original de cada deuda.

---

# 106. Minimum Payment

Post-MVP.

No implementar una simulación simplificada incorrecta.

---

# 107. Interest on Revolving Card Debt

Post-MVP.

Requiere reglas claras de:

```text
interest
taxes
fees
```

dependientes del emisor/país.

---

# 108. Scheduled Transaction Engine

Una scheduled transaction representa expectativa.

No afecta saldo.

---

# 109. Posting

Cuando usuario confirma ocurrencia:

```text
ScheduledTransaction
↓
POSTED Transaction
```

---

# 110. Automatic Posting

V1 recomendada:

```text
manual confirmation
```

para evitar inventar movimientos.

---

# 111. Why Manual Confirmation

Ejemplo:

```text
salary expected 31st
```

puede:

```text
arrive late
change amount
not arrive
```

No debemos modificar saldo real por expectativa.

---

# 112. Auto-Post Option

Post-MVP puede existir por regla:

```text
autoPost = true
```

para eventos muy predecibles.

Debe ser opt-in.

---

# 113. Scheduled Occurrence Status

```text
SCHEDULED
POSTED
SKIPPED
CANCELLED
```

---

# 114. Skip

`SKIPPED` conserva historial de que la ocurrencia existía pero no sucedió.

---

# 115. Recurring Engine

`RecurringTransaction` es una regla.

No es una transacción.

---

# 116. Recurring Expansion Window

No generar infinitamente.

Generar/proyectar, por ejemplo:

```text
next 90 days
```

o según horizonte requerido.

---

# 117. Idempotent Generation

La combinación:

```text
recurringRuleId
+
scheduledDate
```

debe ser única.

---

# 118. Recurring Amount Change

Si cambia el monto:

```text
future unposted occurrences
```

pueden actualizarse según reglas.

No modificar automáticamente:

```text
past posted transactions
```

---

# 119. Recurring Rule Pause

Al pausar:

```text
no new occurrences
```

Se debe decidir qué hacer con las ya generadas.

Preferencia:

```text
existing scheduled occurrences remain
```

hasta que el usuario las cancele explícitamente.

---

# 120. End Date

Después de:

```text
endDate
```

no generar nuevas ocurrencias.

---

# 121. Financial Obligation Engine

Necesitamos una vista unificada para próximos compromisos.

Fuentes:

```text
DebtInstallments
CreditCardStatements
ScheduledExpenses
RecurringExpenseOccurrences
```

---

# 122. Obligation DTO

Conceptualmente:

```ts
FinancialObligation {
  sourceType
  sourceId
  description
  dueDate
  totalAmount
  remainingAmount
  currency
  status
}
```

---

# 123. Upcoming Obligations

Query:

```text
getUpcomingObligations(userId, from, to)
```

---

# 124. Ordering

Ordenar por:

```text
dueDate ASC
```

y luego prioridad si es necesario.

---

# 125. Overdue Included

La vista puede separar:

```text
OVERDUE
TODAY
UPCOMING
```

---

# 126. Spendable Money Engine

Esta métrica debe ser explicable.

V1 conceptual:

```text
Spendable Money
=
Liquid Asset Balances
-
Reserved Funds
-
Selected Near-Term Obligations
```

---

# 127. Obligation Horizon

No existe un único horizonte universal correcto.

V1:

```text
30 days
```

configurable en cálculo.

---

# 128. Spendable Is Estimate

Debe mostrarse como:

```text
Disponible estimado
```

no como verdad absoluta.

---

# 129. Cashflow Projection Engine

Input:

```text
starting balance

scheduled income

scheduled expenses

debt installments

card obligations
```

---

# 130. Projection Event

```ts
CashflowEvent {
  date
  type
  amount
  currency
  sourceType
  sourceId
}
```

---

# 131. Projection Algorithm

Para cada moneda:

```text
start with current liquid balance

sort future events by date

apply income/outflow

emit projected balance after each event
```

---

# 132. Same-Day Ordering

Cuando existen múltiples eventos el mismo día, el orden puede afectar el saldo intradía.

V1:

```text
all events grouped by date
```

y mostrar balance final del día.

No inferir hora inexistente.

---

# 133. Projected Negative Balance

Detectar primer día donde:

```text
projected balance < 0
```

---

# 134. Shortfall

Calcular:

```text
shortfall amount
```

para alertas.

---

# 135. Projection Confidence

Post-MVP podemos diferenciar:

```text
confirmed obligations
expected income
estimated recurring expenses
```

con niveles de confianza.

No necesario V1.

---

# 136. Budget Engine Boundary

Presupuesto usa:

```text
posted consumption expenses
```

no todo cash outflow.

---

# 137. Debt Payment and Budget

Pagar deuda no consume nuevamente presupuesto si la compra original ya fue categorizada.

---

# 138. Loan Payment Exception

Si un préstamo representa efectivo recibido y los gastos posteriores se registran por separado:

```text
loan repayment
```

tampoco es consumo.

Es liability settlement.

---

# 139. Budget Spending Formula

Conceptualmente:

```text
gross qualifying expenses
-
qualifying refunds
```

por categoría/período.

---

# 140. Transaction Classification Layer

Para reportes conviene derivar una clase económica.

Ejemplos:

```text
CONSUMPTION
INCOME
TRANSFER
LIABILITY_SETTLEMENT
REFUND
ADJUSTMENT
```

---

# 141. Why Economic Classification

El `transaction.type` describe el movimiento.

La clase económica describe su significado para reportes.

Esto evita lógica duplicada en dashboards.

---

# 142. Example

```text
LIABILITY_PAYMENT transaction
```

Economic class:

```text
LIABILITY_SETTLEMENT
```

No:

```text
CONSUMPTION
```

---

# 143. Idempotency Keys

Operaciones que pueden repetirse por retry deberían aceptar identidad estable.

Ejemplos:

```text
scheduled posting
recurring generation
imports
```

---

# 144. Scheduled Posting Idempotency

Si ya existe:

```text
postedTransactionId
```

un retry devuelve el mismo resultado.

No crea otra transacción.

---

# 145. Recurring Generation Idempotency

Unique:

```text
ruleId + occurrenceDate
```

---

# 146. Payment Idempotency

Para requests UI ordinarios podemos prevenir double-submit.

Para integraciones futuras:

```text
idempotencyKey
```

será recomendable.

---

# 147. Engine Package

Crear:

```text
packages/finance
```

para lógica pura.

---

# 148. Proposed Structure

```text
packages/finance/
├── src/
│   ├── money/
│   │   ├── money.ts
│   │   ├── currency.ts
│   │   └── rounding.ts
│   │
│   ├── accounts/
│   │   └── balances.ts
│   │
│   ├── transfers/
│   │   └── transfer-rules.ts
│   │
│   ├── debt/
│   │   ├── installments.ts
│   │   ├── allocation.ts
│   │   └── status.ts
│   │
│   ├── credit/
│   │   ├── statements.ts
│   │   └── card-installments.ts
│   │
│   ├── recurrence/
│   │   └── recurrence.ts
│   │
│   ├── cashflow/
│   │   ├── obligations.ts
│   │   └── projection.ts
│   │
│   └── index.ts
```

---

# 149. Finance Package Rules

`@app/finance` debe ser lo más puro posible.

No depender directamente de:

```text
Next.js
React
OpenRouter
Redis
BullMQ
```

---

# 150. DB Independence

Idealmente las funciones matemáticas no dependen de Drizzle.

Input:

```text
plain typed data
```

Output:

```text
plain typed result
```

---

# 151. Example Pure Function

```ts
allocatePayment({
  amount,
  installments,
  strategy: "OLDEST_DUE_FIRST"
})
```

retorna allocations.

No hace:

```text
db.insert()
```

---

# 152. Application Service Responsibility

El application layer:

```text
load data
↓
call finance engine
↓
persist result atomically
```

---

# 153. Testing Strategy

El finance engine necesita cobertura particularmente fuerte.

---

# 154. Money Tests

```text
exact addition

exact subtraction

currency mismatch

rounding

currency precision
```

---

# 155. Installment Tests

```text
100 / 3

31st monthly recurrence

February

leap year

irregular manual dates

sum equals total
```

---

# 156. Allocation Tests

```text
partial payment

full payment

multiple installments

overpayment rejected

oldest-first ordering
```

---

# 157. Status Tests

```text
pending

partial

paid

overdue

due today

cancelled
```

---

# 158. Transfer Tests

```text
two legs

same amount

different accounts

same currency V1

net effect zero
```

---

# 159. Refund Tests

```text
partial refund

full refund

multiple refunds

over-refund rejected
```

---

# 160. Credit Card Tests

```text
purchase before close

purchase after close

closing day 31

due day next month

payment not counted twice as spending
```

---

# 161. Recurrence Tests

```text
weekly

biweekly

monthly

month-end

pause

end date

no duplicate occurrences
```

---

# 162. Cashflow Tests

```text
income before expense

expense before income

same-day events

negative projection

multiple obligations
```

---

# 163. Property-Based Testing

Este motor es buen candidato para property-based tests.

Ejemplos de propiedades:

```text
sum installments = total

sum allocations = payment

balance after transfer across owned accounts preserves total assets

remaining amount never below zero
```

---

# 164. Core Financial Invariants

El motor debe proteger siempre:

```text
Money of different currencies is never added implicitly.

Posted transactions affect actual balance.

Scheduled transactions do not.

Voided transactions do not.

Transfers preserve total assets.

Refunds reduce net spending.

Debt payments reduce liability.

Payment allocations cannot exceed payment.

Payments cannot overpay debt in V1.

Installment remaining cannot be negative.

Paid installment remaining is zero.

Credit card payment is not new consumption.

Projections never mutate actual data.
```

---

# 165. Error Model

El finance engine debe usar errores normalizados.

Ejemplos:

```text
CURRENCY_MISMATCH

INVALID_AMOUNT

INSUFFICIENT_OUTSTANDING_DEBT

PAYMENT_OVERALLOCATION

INVALID_INSTALLMENT_COUNT

INVALID_DUE_DATE

TRANSFER_SAME_ACCOUNT

CROSS_CURRENCY_TRANSFER_UNSUPPORTED

OVER_REFUND

INVALID_RECURRENCE
```

---

# 166. No UI Messages in Engine

El engine retorna códigos/datos.

La UI traduce:

```text
PAYMENT_OVERALLOCATION
```

a:

```text
El monto asignado supera el pago disponible.
```

---

# 167. Versioning

Algoritmos relevantes deben poder versionarse.

Ejemplos:

```text
installmentGenerationVersion

cashflowProjectionVersion

spendableMoneyVersion
```

---

# 168. Why Versioning

Si cambiamos la fórmula de:

```text
Spendable Money
```

debemos poder saber con qué lógica se generó un snapshot anterior.

---

# 169. No Versioning Overkill

No versionar cada función trivial.

Priorizar algoritmos que:

```text
affect persisted projections
or user-visible financial interpretation
```

---

# 170. Observability

Registrar métricas, no información sensible innecesaria.

Útil:

```text
operation

duration

success/failure

entity IDs

algorithm version
```

Evitar logs completos de:

```text
financial history
```

---

# 171. Performance

V1 puede recalcular balances on demand para volúmenes normales.

Más adelante:

```text
balance projections
snapshots
incremental aggregates
```

si los datos crecen.

---

# 172. Avoid Premature Caching

No persistir veinte agregados antes de medir.

Primero:

```text
correct queries
+
indexes
+
pure engine
```

---

# 173. Engine Success Criterion

El motor es correcto cuando puede representar y calcular sin inconsistencias:

```text
cash income

cash expense

transfer

refund

balance correction

loan

installments

partial payment

early payment

multiple-installment payment

credit card purchase

credit card installments

credit card payment

scheduled salary

recurring rent

overdue obligations

30-day cashflow
```

---

# 174. Próximo documento

El siguiente documento será:

```text
docs/04-projections-and-cashflow.md
```

Debe profundizar en:

```text
Dashboard Metrics

Account Balances

Available Cash

Spendable Money

Upcoming Obligations

Cashflow Timeline

Net Worth

Monthly Summary

Debt Projection

Budget Projections

Snapshot Strategy

Explanation of Every Number
```

El objetivo será convertir las reglas de este motor en información financiera útil para el usuario.
