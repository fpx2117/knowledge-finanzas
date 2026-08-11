# Domain Model

## 1. Objetivo

Este documento define el modelo de dominio principal para la plataforma de finanzas personales.

El objetivo es representar correctamente:

* cuentas;
* movimientos;
* ingresos;
* gastos;
* transferencias;
* categorías;
* deudas;
* cuotas;
* pagos;
* tarjetas de crédito;
* recurrencias;
* obligaciones futuras;
* presupuestos;
* metas;
* recordatorios.

El modelo debe evitar inconsistencias como:

```text
contar dos veces un gasto

contar una transferencia como ingreso

contar un pago de tarjeta como gasto nuevo

marcar una deuda como pagada sin evidencia

modificar saldos sin movimiento financiero
```

---

# 2. Principio central

Debemos separar claramente:

```text
Actual Transactions
≠
Future Obligations
≠
Scheduled Events
≠
Projections
```

También:

```text
Balance
≠
Spendable Money
≠
Net Worth
```

Estas separaciones son invariantes del dominio.

---

# 3. Aggregate Roots iniciales

Los aggregate roots principales serán:

```text
User

Account

Debt

CreditCard

Budget

SavingsGoal
```

`Transaction` también actúa como entidad central del ledger personal, aunque puede operar dentro de distintos contextos.

---

# 4. User

Representa al propietario de todos los datos financieros.

Campos conceptuales:

```text
id
name
email
timezone
baseCurrency
createdAt
updatedAt
```

---

# 5. User Invariant

Todo dato financiero sensible pertenece a un único usuario.

Ejemplos:

```text
Account.userId

Transaction.userId

Debt.userId

Budget.userId
```

Nunca confiar únicamente en relaciones indirectas para datos críticos si agregar `userId` simplifica seguridad y consultas.

---

# 6. Account

Representa un lugar donde existe:

```text
dinero
```

o:

```text
crédito disponible
```

Campos:

```text
id
userId
name
type
currency
openingBalance
openingDate
status
createdAt
updatedAt
archivedAt?
```

---

# 7. Account Types

Tipos iniciales:

```text
CASH

BANK

DIGITAL_WALLET

SAVINGS

CREDIT_CARD
```

Futuro:

```text
INVESTMENT
```

---

# 8. Account Status

```text
ACTIVE

ARCHIVED
```

Archivar una cuenta no elimina su historial.

---

# 9. Account Balance

Para cuentas de activo:

```text
balance
=
openingBalance
+
income
-
expense
+
incomingTransfers
-
outgoingTransfers
+
adjustments
```

El saldo debe derivarse de movimientos.

---

# 10. Credit Card Account

Una tarjeta de crédito puede representarse como:

```text
Account.type = CREDIT_CARD
```

pero tendrá metadata adicional en:

```text
CreditCard
```

---

# 11. CreditCard

Entidad especializada asociada a una cuenta.

```text
CreditCard
├── id
├── accountId
├── userId
├── creditLimit
├── statementClosingDay
├── paymentDueDay
├── minimumPaymentEnabled
├── createdAt
└── updatedAt
```

---

# 12. Credit Card Semantics

Una compra con tarjeta:

```text
no reduce inmediatamente una cuenta bancaria
```

pero sí:

```text
aumenta la obligación de la tarjeta
```

---

# 13. Transaction

Representa un movimiento financiero ya ocurrido.

Campos conceptuales:

```text
id
userId
accountId
type
amount
currency
description
merchant?
categoryId?
occurredAt
postedAt?
source
status
notes?
createdAt
updatedAt
```

---

# 14. Transaction Types

```text
INCOME

EXPENSE

TRANSFER

REFUND

ADJUSTMENT
```

---

# 15. Transaction Status

```text
POSTED

VOIDED
```

Podemos agregar:

```text
PENDING
```

más adelante para bancos/imports.

---

# 16. Transaction Source

Ejemplos:

```text
MANUAL

RECURRING

IMPORT

DEBT_PAYMENT

CREDIT_CARD_PURCHASE

SYSTEM_ADJUSTMENT
```

Esto ayuda a trazabilidad.

---

# 17. Transaction Invariant

Una transacción `POSTED` puede afectar saldo.

Una transacción futura no debe existir como `POSTED` todavía.

---

# 18. Money Representation

Todos los montos deben usar una representación exacta.

Nunca:

```text
float
```

Preferimos:

```text
minor units
```

o:

```text
exact decimal
```

---

# 19. Currency

Cada monto relevante debe conocer su moneda.

Campos conceptuales:

```text
currencyCode
amount
```

Ejemplo:

```text
ARS
USD
EUR
```

---

# 20. TransactionSplit

Una transacción puede distribuirse entre múltiples categorías.

```text
Transaction
   ↓
TransactionSplit[]
```

Campos:

```text
id
transactionId
categoryId
amount
notes?
```

---

# 21. Split Invariant

Debe cumplirse:

```text
sum(TransactionSplit.amount)
=
Transaction.amount
```

cuando la transacción utiliza splits completos.

---

# 22. Category

Representa clasificación de ingresos/gastos.

Campos:

```text
id
userId
name
type
parentId?
status
createdAt
updatedAt
```

---

# 23. Category Types

```text
EXPENSE

INCOME

BOTH
```

V1 podría simplificar a:

```text
EXPENSE

INCOME
```

---

# 24. Category Hierarchy

Ejemplo:

```text
Food
├── Supermarket
├── Restaurants
└── Delivery
```

Usamos:

```text
parentId
```

para jerarquía simple.

---

# 25. Tag

Tag es diferente de Category.

Campos:

```text
id
userId
name
createdAt
```

Relación:

```text
Transaction
↕
Tag
```

muchos a muchos.

---

# 26. Transfer

Una transferencia conecta dos cuentas del mismo usuario.

Conceptualmente:

```text
Transfer
├── id
├── userId
├── fromAccountId
├── toAccountId
├── amount
├── currency
├── occurredAt
├── outgoingTransactionId
├── incomingTransactionId
└── createdAt
```

---

# 27. Transfer Invariant

Una transferencia no crea:

```text
income
```

ni:

```text
expense
```

a nivel patrimonial.

---

# 28. Transfer Posting

Internamente puede generar dos legs:

```text
Account A
-100

Account B
+100
```

pero ambos deben compartir una identidad lógica de transferencia.

---

# 29. Cross-Currency Transfer

Post-MVP se puede soportar:

```text
USD → ARS
```

con:

```text
sourceAmount
targetAmount
exchangeRate
```

No necesario V1.

---

# 30. Refund

Un refund referencia opcionalmente la transacción original.

Campos extra conceptuales:

```text
originalTransactionId?
```

---

# 31. Refund Semantics

Un refund:

```text
reduce net spending
```

pero no necesariamente:

```text
increase ordinary income
```

---

# 32. Adjustment

Un adjustment corrige diferencias.

Ejemplo:

```text
saldo real banco: 1200
saldo sistema: 1180

adjustment: +20
```

Debe tener:

```text
reason
```

---

# 33. Debt

Representa una obligación financiera agregada.

Campos:

```text
id
userId
name
creditor?
type
currency
originalAmount
startDate
status
interestType
interestRate?
notes?
createdAt
updatedAt
```

---

# 34. Debt Types

```text
CREDIT_CARD

PERSONAL_LOAN

PURCHASE_INSTALLMENTS

MONEY_OWED_TO_PERSON

SERVICE_DEBT

OTHER
```

---

# 35. Debt Status

```text
ACTIVE

PAID

OVERDUE

CANCELLED
```

---

# 36. Debt Invariant

`Debt.status = PAID` solamente si:

```text
remainingAmount = 0
```

o todas sus obligaciones relevantes están satisfechas/canceladas.

---

# 37. DebtInstallment

Representa una obligación individual.

Campos:

```text
id
debtId
installmentNumber
dueDate
principalAmount
interestAmount
feeAmount
totalAmount
status
createdAt
updatedAt
```

---

# 38. Installment Status

```text
PENDING

PARTIALLY_PAID

PAID

OVERDUE

CANCELLED
```

---

# 39. Installment Remaining Amount

Derivado:

```text
remainingAmount
=
totalAmount
-
allocatedPayments
```

No debería ser la única fuente de verdad mutable.

---

# 40. Installment Overdue

Derivado cuando:

```text
dueDate < today
AND
remainingAmount > 0
```

---

# 41. DebtPayment

Representa dinero efectivamente pagado hacia una deuda.

Campos:

```text
id
userId
debtId
accountId
amount
currency
paidAt
transactionId
notes?
createdAt
```

---

# 42. Payment Invariant

Todo `DebtPayment` debe estar respaldado por una:

```text
Transaction
```

que represente salida real de dinero de una cuenta.

---

# 43. Debt Payment Flow

```text
User pays debt
      ↓
Create Expense/Payment Transaction
      ↓
Create DebtPayment
      ↓
Allocate Payment
      ↓
Update derived debt state
```

---

# 44. PaymentAllocation

Permite aplicar un pago a una o varias cuotas.

Campos:

```text
id
paymentId
installmentId
amount
createdAt
```

---

# 45. Payment Allocation Invariant

Debe cumplirse:

```text
sum(payment allocations)
<=
DebtPayment.amount
```

---

# 46. Full Allocation

Idealmente:

```text
sum(allocations)
=
payment.amount
```

salvo que exista explícitamente:

```text
unappliedBalance
```

para casos avanzados.

V1 puede exigir asignación completa.

---

# 47. Partial Payment

Ejemplo:

```text
Installment
100

Payment
40
```

Resultado:

```text
remaining = 60
status = PARTIALLY_PAID
```

---

# 48. Multiple Installments Payment

Ejemplo:

```text
Payment 300
```

se puede distribuir:

```text
Installment 3 → 100
Installment 4 → 100
Installment 5 → 100
```

---

# 49. Debt Generation Strategy

Una deuda puede crearse con:

```text
manual installments
```

o:

```text
generated installments
```

---

# 50. Generated Installments

Input:

```text
originalAmount
installmentCount
firstDueDate
frequency
```

produce cuotas.

Después el usuario puede editar fechas/montos.

---

# 51. Manual Installments

El usuario puede definir cada cuota individualmente.

Esto permite:

```text
irregular dates

irregular amounts

informal debts
```

---

# 52. CreditCardStatement

Representa un período facturado.

Campos conceptuales:

```text
id
creditCardId
periodStart
periodEnd
closingDate
dueDate
totalAmount
minimumPayment?
paidAmount
status
createdAt
```

---

# 53. Statement Status

```text
OPEN

CLOSED

PARTIALLY_PAID

PAID

OVERDUE
```

---

# 54. Credit Card Purchase

Una compra con tarjeta será una transacción asociada a:

```text
credit card account
```

pero su impacto se interpreta como aumento de liability.

---

# 55. Credit Card Installments

Una compra en cuotas debe crear:

```text
future card obligations
```

No debe registrarse todo como cash outflow inmediato.

---

# 56. Paying Credit Card

Pagar la tarjeta desde banco:

```text
Bank Account
↓
Credit Card Liability
```

No es un nuevo gasto de consumo.

El gasto ocurrió cuando se realizó la compra.

---

# 57. Credit Card Payment Semantics

Contablemente para reportes de consumo:

```text
Purchase = expense
Payment = liability settlement
```

Esto evita doble conteo.

---

# 58. ScheduledTransaction

Representa un movimiento futuro esperado.

Campos:

```text
id
userId
accountId?
type
amount
currency
description
scheduledDate
categoryId?
status
source
createdAt
updatedAt
```

---

# 59. Scheduled Types

```text
INCOME

EXPENSE
```

---

# 60. Scheduled Status

```text
SCHEDULED

POSTED

SKIPPED

CANCELLED
```

---

# 61. Scheduled Invariant

Una `ScheduledTransaction` no afecta saldo real mientras esté:

```text
SCHEDULED
```

---

# 62. Posting Scheduled Transaction

Cuando ocurre:

```text
ScheduledTransaction
↓
Transaction
```

y guardamos:

```text
postedTransactionId
```

---

# 63. RecurringTransaction

Representa una regla que produce eventos futuros.

Campos:

```text
id
userId
type
amount
currency
accountId?
categoryId?
description
frequency
startDate
endDate?
nextOccurrence
status
createdAt
updatedAt
```

---

# 64. Recurring Frequency

```text
WEEKLY

BIWEEKLY

MONTHLY

QUARTERLY

YEARLY

CUSTOM
```

---

# 65. Recurring Status

```text
ACTIVE

PAUSED

ENDED

CANCELLED
```

---

# 66. Recurring Invariant

Una regla recurrente no debe crear:

```text
infinite posted transactions
```

Puede producir:

```text
scheduled occurrences
```

dentro de una ventana temporal.

---

# 67. FinancialObligation Concept

Necesitamos una vista conceptual unificada de obligaciones futuras.

Puede provenir de:

```text
DebtInstallment

CreditCardStatement

ScheduledExpense

RecurringExpense occurrence
```

---

# 68. FinancialObligation

No necesariamente será una tabla V1.

Puede ser una proyección/read model.

Campos conceptuales:

```text
sourceType
sourceId
description
amount
remainingAmount
dueDate
status
```

---

# 69. Benefit

Esto permite construir:

```text
Upcoming Payments
```

sin mezclar físicamente entidades distintas.

---

# 70. Budget

Representa intención de gasto.

Campos:

```text
id
userId
name
categoryId?
period
limitAmount
currency
startDate
endDate?
rolloverEnabled
status
createdAt
updatedAt
```

---

# 71. Budget Status

```text
ACTIVE

ARCHIVED
```

---

# 72. Budget Calculation

```text
spent
=
sum(relevant posted expenses/refunds)
```

No debería incluir automáticamente:

```text
future obligations
```

salvo que el producto defina una vista separada de committed budget.

---

# 73. Budget Remaining

```text
remaining
=
limit
-
spent
```

---

# 74. SavingsGoal

Representa objetivo financiero.

Campos:

```text
id
userId
name
targetAmount
currency
targetDate?
status
createdAt
updatedAt
```

---

# 75. Goal Status

```text
ACTIVE

COMPLETED

PAUSED

CANCELLED
```

---

# 76. SavingsGoalContribution

Para trazabilidad, podemos tener:

```text
id
goalId
transactionId?
amount
contributedAt
createdAt
```

---

# 77. Goal Current Amount

Derivado:

```text
sum(contributions)
```

No porcentaje editable manualmente.

---

# 78. ReservedFund

Puede aparecer V1.1.

Campos conceptuales:

```text
id
userId
name
amount
currency
accountId?
goalId?
status
```

Representa dinero apartado lógicamente.

---

# 79. Reminder

Representa notificación futura.

Campos:

```text
id
userId
sourceType
sourceId
remindAt
channel
status
createdAt
```

---

# 80. Reminder Source Types

```text
DEBT_INSTALLMENT

CREDIT_CARD_STATEMENT

SCHEDULED_TRANSACTION

BUDGET

CUSTOM
```

---

# 81. Reminder Status

```text
PENDING

SENT

CANCELLED
```

---

# 82. Reminder Invariant

Modificar reminder no modifica:

```text
dueDate
```

---

# 83. Attachment

Entidad futura para comprobantes.

Campos:

```text
id
userId
transactionId?
debtId?
storageKey
fileName
mimeType
size
createdAt
```

---

# 84. ImportBatch

Para CSV imports.

Campos:

```text
id
userId
source
fileName
status
totalRows
importedRows
duplicateRows
failedRows
createdAt
completedAt?
```

---

# 85. ImportedTransaction

Una transacción importada puede guardar:

```text
externalId?
importBatchId
sourceHash?
```

para deduplicación.

---

# 86. Projection Entities

Las proyecciones no son fuentes de verdad.

Ejemplos:

```text
AccountBalanceProjection

CashflowProjection

NetWorthProjection

UpcomingObligationsProjection
```

---

# 87. Projection Rule

Se pueden recalcular desde fuentes canónicas.

Nunca debemos perder source data para facilitar una proyección.

---

# 88. AccountBalanceProjection

Puede cachear:

```text
accountId
balance
calculatedAt
version
```

pero fuente real sigue siendo:

```text
transactions
```

---

# 89. CashflowProjection

Input:

```text
current balances

scheduled income

scheduled expenses

financial obligations
```

Output:

```text
date
projectedBalance
events
```

---

# 90. NetWorthProjection

```text
netWorth
=
assets
-
liabilities
```

por fecha.

---

# 91. SpendableMoneyProjection

Debe ser explícitamente versionada/configurable.

Conceptualmente:

```text
available balances
-
reserved funds
-
selected near-term obligations
```

---

# 92. Spendable Invariant

Nunca presentar `SpendableMoney` sin poder explicar:

```text
qué cuentas incluye

qué obligaciones descuenta

qué horizonte usa
```

---

# 93. Domain Relationships

Resumen:

```text
User
├── Accounts
│   ├── Transactions
│   └── CreditCard?
│
├── Categories
├── Tags
├── Debts
│   ├── DebtInstallments
│   └── DebtPayments
│       └── PaymentAllocations
│
├── RecurringTransactions
├── ScheduledTransactions
├── Budgets
├── SavingsGoals
├── Reminders
└── Imports
```

---

# 94. Canonical Sources of Truth

Fuentes canónicas principales:

```text
Transactions

DebtInstallments

DebtPayments

PaymentAllocations

ScheduledTransactions

RecurringRules
```

---

# 95. Derived Values

Nunca usar como única fuente editable:

```text
account balance

debt remaining

budget remaining

goal progress

net worth

projected balance

spendable money
```

---

# 96. Domain Invariant — Transfer

```text
Transfer
does not change total net worth
```

ignorando FX/fees.

---

# 97. Domain Invariant — Credit Card

```text
Credit card purchase
creates consumption/liability
```

```text
Credit card payment
settles liability
```

No contar ambos como gasto de consumo.

---

# 98. Domain Invariant — Debt

```text
DebtPayment
must reduce outstanding obligation
```

pero únicamente por el monto efectivamente asignado.

---

# 99. Domain Invariant — Scheduled

```text
ScheduledTransaction
does not change actual balance
```

hasta ser posteada.

---

# 100. Domain Invariant — Projection

```text
Projection
cannot mutate canonical finance data
```

---

# 101. Domain Invariant — Refund

```text
Refund
reduces net spending
```

y debe poder asociarse al gasto original.

---

# 102. Domain Invariant — Void

Una transacción anulada:

```text
must not affect current balance
```

La estrategia de implementación puede ser:

```text
VOIDED
```

o reversión explícita.

---

# 103. Domain Invariant — Currency

No sumar directamente:

```text
ARS + USD
```

sin conversión explícita.

---

# 104. Domain Invariant — Ownership

Una relación financiera nunca puede conectar entidades de usuarios diferentes.

Ejemplo inválido:

```text
User A transfer
→ Account of User B
```

---

# 105. Bounded Contexts

Propuesta inicial:

```text
Identity

Accounts

Ledger

Debt

Credit

Planning

Goals

Reporting

Automation

Imports

AI
```

---

# 106. Identity Context

Responsable de:

```text
User

session

preferences

base currency
```

---

# 107. Accounts Context

Responsable de:

```text
Account

CreditCard metadata

opening balance
```

---

# 108. Ledger Context

Responsable de:

```text
Transaction

Transfer

Refund

Adjustment

TransactionSplit

Categories

Tags
```

---

# 109. Debt Context

Responsable de:

```text
Debt

Installments

Payments

Allocations
```

---

# 110. Credit Context

Responsable de:

```text
CreditCard

Statements

Card Purchases

Card Payments
```

Inicialmente puede convivir con Accounts/Debt si simplifica implementación.

---

# 111. Planning Context

Responsable de:

```text
ScheduledTransactions

RecurringTransactions

Budgets

Reminders

Cashflow
```

---

# 112. Goals Context

Responsable de:

```text
SavingsGoal

Contributions

Reserved Funds
```

---

# 113. Reporting Context

Responsable de projections:

```text
balances

spending

debt

net worth

cashflow

budget
```

---

# 114. AI Context

AI es transversal.

Puede asistir con:

```text
categorization

merchant normalization

insights

anomaly explanation
```

No posee entidades financieras.

---

# 115. AI Domain Boundary

AI nunca debe escribir directamente:

```text
Transaction

DebtPayment

AccountBalance
```

sin pasar por application/domain validation.

---

# 116. Aggregate Boundaries

No cargar todo el historial financiero en memoria para modificar una entidad.

Ejemplo:

Para registrar un pago:

```text
load Debt
load relevant Installments
create Payment
create Allocations
```

No necesitamos cargar:

```text
all user transactions
```

---

# 117. Eventual Projections

Algunas vistas pueden actualizarse asincrónicamente:

```text
net worth history

monthly reports

large analytics
```

pero saldos críticos deberían reflejar movimientos de forma consistente.

---

# 118. Domain Events Conceptuales

Podemos emitir eventos internos como:

```text
TRANSACTION_POSTED

TRANSFER_CREATED

DEBT_CREATED

INSTALLMENT_PAID

DEBT_PAID

SCHEDULED_TRANSACTION_POSTED

BUDGET_LIMIT_REACHED
```

No necesitamos event sourcing.

---

# 119. Historical Integrity

Preferir historial append-only para:

```text
payments

allocations

imports

important adjustments
```

---

# 120. Editing Transactions

Editar:

```text
description

merchant

category

notes
```

es relativamente seguro.

Editar:

```text
amount

account

date
```

puede alterar balances históricos.

Debe manejarse cuidadosamente y actualizar proyecciones.

---

# 121. Deleting Transactions

Preferir:

```text
VOIDED
```

o soft deletion lógica para movimientos relevantes.

No hard delete como operación normal de usuario.

---

# 122. Debt Cancellation

Cancelar una deuda no debe borrar pagos históricos.

Cuotas futuras pueden pasar a:

```text
CANCELLED
```

según la operación.

---

# 123. Date and Time

Usar:

```text
TIMESTAMPTZ
```

para eventos con timestamp.

Para conceptos de día financiero como:

```text
dueDate
```

podemos usar:

```text
DATE
```

si la hora no tiene significado.

---

# 124. User Timezone

El usuario debe tener timezone.

Importante para:

```text
today

overdue detection

monthly reports

scheduled posting
```

---

# 125. Base Currency

Cada usuario tiene:

```text
baseCurrency
```

para reportes.

Pero cada cuenta/movimiento conserva moneda propia.

---

# 126. MVP Entity Set

Para MVP estricto:

```text
User

Account

Transaction

Category

Transfer

Debt

DebtInstallment

DebtPayment

PaymentAllocation

RecurringTransaction

ScheduledTransaction

Budget

Reminder
```

---

# 127. V1.1 Entities

Después:

```text
TransactionSplit

Tag

SavingsGoal

CreditCardStatement

Attachment

ImportBatch

ReservedFund
```

---

# 128. Implementation Principle

No crear todas las tablas desde el primer día.

Implementar por vertical slices.

Ejemplo:

```text
Accounts
↓
Transactions
↓
Transfers
↓
Debts
↓
Planning
↓
Budgets
```

---

# 129. Model Success Criterion

El modelo es correcto si puede representar sin inconsistencias:

```text
salary received

cash expense

bank transfer

credit card purchase

credit card installment purchase

credit card payment

personal loan

partial installment payment

early payment

refund

scheduled salary

recurring rent

overdue installment

budget spending

cashflow projection
```

sin contar dinero dos veces.

---

# 130. Próximo documento

El siguiente documento será:

```text
docs/02-database-schema.md
```

Debe traducir este modelo a PostgreSQL/Drizzle y definir:

```text
tables

enums

foreign keys

indexes

unique constraints

money columns

date columns

soft deletion

historical records

projection tables

transaction boundaries
```

con especial cuidado en:

```text
transactions

transfers

debt payments

payment allocations

credit cards

scheduled vs posted data
```
