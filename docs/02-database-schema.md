# Database Schema

## 1. Objetivo

Este documento traduce el modelo de dominio de finanzas personales a un esquema PostgreSQL preparado para:

* integridad financiera;
* trazabilidad;
* ownership por usuario;
* múltiples monedas;
* deudas y cuotas;
* pagos parciales;
* transferencias;
* recurrencias;
* proyecciones;
* reportes;
* evolución futura del producto.

La base de datos será:

```text
PostgreSQL
+
Drizzle ORM
```

---

# 2. Principios del esquema

## 2.1 PostgreSQL como source of truth

PostgreSQL contiene la verdad financiera.

Redis, cachés y proyecciones son auxiliares.

---

## 2.2 Exactitud monetaria

Nunca usar:

```text
FLOAT
REAL
DOUBLE PRECISION
```

para montos financieros.

---

## 2.3 Ownership explícito

Las entidades sensibles deben poder filtrarse fácilmente por:

```text
user_id
```

---

## 2.4 Historial preservado

Operaciones financieras importantes no deben eliminarse físicamente como flujo normal.

Preferimos:

```text
status
voided_at
archived_at
```

según entidad.

---

## 2.5 Derivados reconstruibles

Valores como:

```text
balance
outstanding debt
budget remaining
net worth
projected balance
```

deben derivarse de datos canónicos.

---

# 3. Naming

Base de datos:

```text
snake_case
plural tables
```

TypeScript:

```text
camelCase
```

Ejemplo:

```text
opening_balance
```

en DB:

```text
openingBalance
```

en TypeScript.

---

# 4. Primary Keys

Usar:

```text
UUID
```

para entidades principales.

Ejemplo:

```text
id UUID PRIMARY KEY
```

---

# 5. Timestamps

Usar:

```text
TIMESTAMPTZ
```

para:

```text
created_at
updated_at
posted_at
paid_at
voided_at
```

Usar:

```text
DATE
```

para:

```text
due_date
scheduled_date
opening_date
target_date
```

cuando la hora no tenga significado financiero.

---

# 6. Money Representation

Recomendación inicial:

```text
NUMERIC(20, 6)
```

para montos.

Esto permite:

```text
ARS
USD
EUR
```

y monedas con precisión distinta.

---

# 7. Why NUMERIC

Ventajas:

```text
exact arithmetic

no binary floating errors

supports currencies with varied decimals

simplifies multi-currency evolution
```

---

# 8. Currency Representation

Usar:

```text
currency_code CHAR(3)
```

siguiendo códigos ISO cuando aplique.

Ejemplo:

```text
ARS
USD
EUR
```

---

# 9. users

Tabla:

```text
users
```

Campos:

```text
id UUID PRIMARY KEY

name TEXT

email TEXT NOT NULL

timezone TEXT NOT NULL

base_currency CHAR(3) NOT NULL

created_at TIMESTAMPTZ NOT NULL

updated_at TIMESTAMPTZ NOT NULL
```

Auth puede agregar tablas separadas.

---

# 10. accounts

Tabla:

```text
accounts
```

Campos:

```text
id UUID PRIMARY KEY

user_id UUID NOT NULL

name TEXT NOT NULL

type account_type NOT NULL

currency_code CHAR(3) NOT NULL

opening_balance NUMERIC(20,6) NOT NULL DEFAULT 0

opening_date DATE NOT NULL

status account_status NOT NULL DEFAULT 'ACTIVE'

created_at TIMESTAMPTZ NOT NULL

updated_at TIMESTAMPTZ NOT NULL

archived_at TIMESTAMPTZ
```

---

# 11. account_type

Enum:

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

# 12. account_status

Enum:

```text
ACTIVE

ARCHIVED
```

---

# 13. Account Indexes

```text
INDEX(user_id)

INDEX(user_id, status)
```

---

# 14. credit_cards

Metadata especializada.

Tabla:

```text
credit_cards
```

Campos:

```text
id UUID PRIMARY KEY

user_id UUID NOT NULL

account_id UUID NOT NULL UNIQUE

credit_limit NUMERIC(20,6)

statement_closing_day SMALLINT

payment_due_day SMALLINT

minimum_payment_enabled BOOLEAN NOT NULL DEFAULT FALSE

created_at TIMESTAMPTZ NOT NULL

updated_at TIMESTAMPTZ NOT NULL
```

---

# 15. Credit Card Constraints

```text
statement_closing_day BETWEEN 1 AND 31

payment_due_day BETWEEN 1 AND 31
```

---

# 16. categories

Tabla:

```text
categories
```

Campos:

```text
id UUID PRIMARY KEY

user_id UUID NOT NULL

parent_id UUID

name TEXT NOT NULL

type category_type NOT NULL

status entity_status NOT NULL DEFAULT 'ACTIVE'

created_at TIMESTAMPTZ NOT NULL

updated_at TIMESTAMPTZ NOT NULL

archived_at TIMESTAMPTZ
```

---

# 17. category_type

Enum:

```text
EXPENSE

INCOME

BOTH
```

---

# 18. Category Constraints

```text
parent_id → categories.id
```

No permitir ciclos.

La prevención de ciclos puede realizarse inicialmente en application logic.

---

# 19. tags

Tabla:

```text
tags
```

Campos:

```text
id UUID PRIMARY KEY

user_id UUID NOT NULL

name TEXT NOT NULL

created_at TIMESTAMPTZ NOT NULL
```

Constraint:

```text
UNIQUE(user_id, name)
```

---

# 20. transactions

Tabla central:

```text
transactions
```

Campos:

```text
id UUID PRIMARY KEY

user_id UUID NOT NULL

account_id UUID NOT NULL

type transaction_type NOT NULL

status transaction_status NOT NULL DEFAULT 'POSTED'

amount NUMERIC(20,6) NOT NULL

currency_code CHAR(3) NOT NULL

description TEXT NOT NULL

merchant TEXT

category_id UUID

occurred_at TIMESTAMPTZ NOT NULL

posted_at TIMESTAMPTZ

source transaction_source NOT NULL

original_transaction_id UUID

transfer_id UUID

scheduled_transaction_id UUID

debt_payment_id UUID

metadata JSONB

notes TEXT

created_at TIMESTAMPTZ NOT NULL

updated_at TIMESTAMPTZ NOT NULL

voided_at TIMESTAMPTZ
```

---

# 21. transaction_type

Enum:

```text
INCOME

EXPENSE

TRANSFER_IN

TRANSFER_OUT

REFUND

ADJUSTMENT

CREDIT_CARD_PURCHASE

LIABILITY_PAYMENT
```

---

# 22. Why Transfer Legs Are Explicit

En lugar de:

```text
TRANSFER
```

como único movimiento ambiguo, usamos:

```text
TRANSFER_OUT
TRANSFER_IN
```

para que cada cuenta tenga un leg explícito.

Ambos están vinculados por:

```text
transfer_id
```

---

# 23. Why LIABILITY_PAYMENT

Un pago de tarjeta o deuda:

```text
LIABILITY_PAYMENT
```

no debe mezclarse conceptualmente con consumo ordinario.

Esto evita doble conteo en reportes.

---

# 24. transaction_status

```text
POSTED

VOIDED
```

Futuro:

```text
PENDING
```

---

# 25. transaction_source

```text
MANUAL

RECURRING

SCHEDULED

IMPORT

DEBT_PAYMENT

CREDIT_CARD_PURCHASE

TRANSFER

REFUND

SYSTEM_ADJUSTMENT
```

---

# 26. Transaction Amount Constraint

```text
amount > 0
```

El signo financiero se deriva de:

```text
type
```

No almacenar:

```text
-100
```

para gasto y:

```text
+100
```

para ingreso.

Esto reduce errores.

---

# 27. Transaction Currency Invariant

En V1:

```text
transactions.currency_code
=
accounts.currency_code
```

salvo operaciones cross-currency futuras.

---

# 28. Transaction Indexes

```text
INDEX(user_id, occurred_at DESC)

INDEX(account_id, occurred_at DESC)

INDEX(user_id, type)

INDEX(user_id, category_id)

INDEX(transfer_id)

INDEX(debt_payment_id)

INDEX(scheduled_transaction_id)
```

---

# 29. transaction_splits

Tabla:

```text
transaction_splits
```

Campos:

```text
id UUID PRIMARY KEY

transaction_id UUID NOT NULL

category_id UUID NOT NULL

amount NUMERIC(20,6) NOT NULL

notes TEXT

created_at TIMESTAMPTZ NOT NULL
```

---

# 30. Split Constraint

```text
amount > 0
```

La suma debe igualar la transacción cuando se usan splits completos.

Esto se valida en application layer dentro de una transaction DB.

---

# 31. transaction_tags

Join table:

```text
transaction_tags
```

Campos:

```text
transaction_id UUID NOT NULL

tag_id UUID NOT NULL
```

PK compuesta:

```text
(transaction_id, tag_id)
```

---

# 32. transfers

Tabla lógica:

```text
transfers
```

Campos:

```text
id UUID PRIMARY KEY

user_id UUID NOT NULL

from_account_id UUID NOT NULL

to_account_id UUID NOT NULL

currency_code CHAR(3) NOT NULL

amount NUMERIC(20,6) NOT NULL

occurred_at TIMESTAMPTZ NOT NULL

outgoing_transaction_id UUID NOT NULL UNIQUE

incoming_transaction_id UUID NOT NULL UNIQUE

notes TEXT

created_at TIMESTAMPTZ NOT NULL
```

---

# 33. Transfer Constraints

```text
from_account_id != to_account_id

amount > 0
```

V1:

```text
from account currency
=
to account currency
=
transfer currency
```

---

# 34. Transfer Transaction Boundary

Crear transferencia requiere transaction DB:

```text
BEGIN

create transfer identity

create outgoing leg

create incoming leg

link transfer

COMMIT
```

No permitir solo un leg persistido.

---

# 35. refunds

No necesitamos tabla separada inicialmente.

Se representa con:

```text
transactions.type = REFUND
```

y:

```text
original_transaction_id
```

---

# 36. Refund Constraint

La original debe pertenecer al mismo usuario.

Idealmente:

```text
REFUND.amount
<=
remaining refundable amount
```

Esta regla se valida en aplicación.

---

# 37. debts

Tabla:

```text
debts
```

Campos:

```text
id UUID PRIMARY KEY

user_id UUID NOT NULL

name TEXT NOT NULL

creditor TEXT

type debt_type NOT NULL

currency_code CHAR(3) NOT NULL

original_amount NUMERIC(20,6) NOT NULL

start_date DATE

status debt_status NOT NULL DEFAULT 'ACTIVE'

interest_type interest_type NOT NULL

interest_rate NUMERIC(12,8)

notes TEXT

created_at TIMESTAMPTZ NOT NULL

updated_at TIMESTAMPTZ NOT NULL

cancelled_at TIMESTAMPTZ
```

---

# 38. debt_type

```text
CREDIT_CARD

PERSONAL_LOAN

PURCHASE_INSTALLMENTS

MONEY_OWED_TO_PERSON

SERVICE_DEBT

OTHER
```

---

# 39. debt_status

```text
ACTIVE

PAID

OVERDUE

CANCELLED
```

---

# 40. interest_type

```text
NO_INTEREST

FIXED_INSTALLMENTS

MANUAL_INSTALLMENTS
```

Futuro:

```text
SIMPLE_INTEREST

AMORTIZED_LOAN

VARIABLE_RATE
```

---

# 41. Debt Constraint

```text
original_amount > 0
```

---

# 42. debt_installments

Tabla:

```text
debt_installments
```

Campos:

```text
id UUID PRIMARY KEY

debt_id UUID NOT NULL

installment_number INTEGER NOT NULL

due_date DATE NOT NULL

principal_amount NUMERIC(20,6) NOT NULL DEFAULT 0

interest_amount NUMERIC(20,6) NOT NULL DEFAULT 0

fee_amount NUMERIC(20,6) NOT NULL DEFAULT 0

total_amount NUMERIC(20,6) NOT NULL

status installment_status NOT NULL DEFAULT 'PENDING'

created_at TIMESTAMPTZ NOT NULL

updated_at TIMESTAMPTZ NOT NULL

cancelled_at TIMESTAMPTZ
```

---

# 43. Installment Constraints

```text
installment_number > 0

principal_amount >= 0

interest_amount >= 0

fee_amount >= 0

total_amount > 0
```

---

# 44. Installment Unique Constraint

```text
UNIQUE(debt_id, installment_number)
```

---

# 45. installment_status

```text
PENDING

PARTIALLY_PAID

PAID

OVERDUE

CANCELLED
```

---

# 46. Installment Remaining Amount

No almacenarlo inicialmente como source of truth.

Calcular:

```text
total_amount
-
SUM(payment_allocations.amount)
```

---

# 47. debt_payments

Tabla:

```text
debt_payments
```

Campos:

```text
id UUID PRIMARY KEY

user_id UUID NOT NULL

debt_id UUID NOT NULL

account_id UUID NOT NULL

amount NUMERIC(20,6) NOT NULL

currency_code CHAR(3) NOT NULL

paid_at TIMESTAMPTZ NOT NULL

transaction_id UUID NOT NULL UNIQUE

notes TEXT

created_at TIMESTAMPTZ NOT NULL
```

---

# 48. Debt Payment Constraint

```text
amount > 0
```

---

# 49. debt_payment_allocations

Tabla:

```text
debt_payment_allocations
```

Campos:

```text
id UUID PRIMARY KEY

payment_id UUID NOT NULL

installment_id UUID NOT NULL

amount NUMERIC(20,6) NOT NULL

created_at TIMESTAMPTZ NOT NULL
```

---

# 50. Payment Allocation Constraint

```text
amount > 0
```

---

# 51. Payment Allocation Unique

Puede permitirse múltiples allocations históricas por installment.

No necesitamos:

```text
UNIQUE(payment_id, installment_id)
```

aunque simplificarlo podría ser razonable.

Preferencia V1:

```text
UNIQUE(payment_id, installment_id)
```

y acumular por fila.

---

# 52. Allocation Invariant

En aplicación:

```text
SUM(allocations for payment)
=
payment.amount
```

V1 exige asignación completa.

---

# 53. Payment Transaction Boundary

Registrar pago:

```text
BEGIN

create liability payment transaction

create debt_payment

create allocations

validate allocation total

update installment statuses

update debt status if required

COMMIT
```

---

# 54. No External Calls Inside Payment Transaction

No realizar:

```text
OpenRouter
email
notification provider
```

antes del COMMIT.

Notificaciones pueden salir después.

---

# 55. credit_card_statements

Tabla:

```text
credit_card_statements
```

Campos:

```text
id UUID PRIMARY KEY

user_id UUID NOT NULL

credit_card_id UUID NOT NULL

period_start DATE NOT NULL

period_end DATE NOT NULL

closing_date DATE NOT NULL

due_date DATE NOT NULL

total_amount NUMERIC(20,6) NOT NULL

minimum_payment NUMERIC(20,6)

paid_amount NUMERIC(20,6) NOT NULL DEFAULT 0

status credit_card_statement_status NOT NULL

created_at TIMESTAMPTZ NOT NULL

updated_at TIMESTAMPTZ NOT NULL
```

---

# 56. credit_card_statement_status

```text
OPEN

CLOSED

PARTIALLY_PAID

PAID

OVERDUE
```

---

# 57. Statement Constraint

```text
period_start <= period_end

closing_date <= due_date

total_amount >= 0

paid_amount >= 0
```

---

# 58. Statement Purchases

Podemos asociar transacciones a statement mediante:

```text
credit_card_statement_id
```

en `transactions`.

Recomendación:

agregar columna nullable:

```text
credit_card_statement_id UUID
```

---

# 59. Credit Card Installments

Para compras en cuotas, recomendamos separar obligación de compra.

Crear tabla:

```text
credit_card_installments
```

si el flujo de tarjeta se vuelve central.

V1 simplificado puede reutilizar:

```text
Debt
+
DebtInstallment
```

con:

```text
debt.type = CREDIT_CARD
```

---

# 60. Recommendation V1

Evitar dos motores de cuotas.

Usar:

```text
Debt
DebtInstallment
DebtPayment
```

también para tarjeta.

`CreditCardStatement` actúa como agrupación temporal.

Esto reduce duplicación.

---

# 61. scheduled_transactions

Tabla:

```text
scheduled_transactions
```

Campos:

```text
id UUID PRIMARY KEY

user_id UUID NOT NULL

account_id UUID

type scheduled_transaction_type NOT NULL

amount NUMERIC(20,6) NOT NULL

currency_code CHAR(3) NOT NULL

description TEXT NOT NULL

category_id UUID

scheduled_date DATE NOT NULL

status scheduled_transaction_status NOT NULL DEFAULT 'SCHEDULED'

source scheduled_source NOT NULL

recurring_transaction_id UUID

posted_transaction_id UUID UNIQUE

notes TEXT

created_at TIMESTAMPTZ NOT NULL

updated_at TIMESTAMPTZ NOT NULL
```

---

# 62. scheduled_transaction_type

```text
INCOME

EXPENSE
```

---

# 63. scheduled_transaction_status

```text
SCHEDULED

POSTED

SKIPPED

CANCELLED
```

---

# 64. scheduled_source

```text
MANUAL

RECURRING

DEBT

CREDIT_CARD
```

---

# 65. Scheduled Constraint

```text
amount > 0
```

---

# 66. Posting Scheduled Transaction

Operación transaccional:

```text
BEGIN

verify SCHEDULED

create posted transaction

set posted_transaction_id

set status = POSTED

COMMIT
```

---

# 67. recurring_transactions

Tabla:

```text
recurring_transactions
```

Campos:

```text
id UUID PRIMARY KEY

user_id UUID NOT NULL

account_id UUID

type recurring_transaction_type NOT NULL

amount NUMERIC(20,6) NOT NULL

currency_code CHAR(3) NOT NULL

category_id UUID

description TEXT NOT NULL

frequency recurring_frequency NOT NULL

interval_value INTEGER

start_date DATE NOT NULL

end_date DATE

next_occurrence DATE

status recurring_status NOT NULL DEFAULT 'ACTIVE'

metadata JSONB

created_at TIMESTAMPTZ NOT NULL

updated_at TIMESTAMPTZ NOT NULL
```

---

# 68. recurring_transaction_type

```text
INCOME

EXPENSE
```

---

# 69. recurring_frequency

```text
WEEKLY

BIWEEKLY

MONTHLY

QUARTERLY

YEARLY

CUSTOM
```

---

# 70. recurring_status

```text
ACTIVE

PAUSED

ENDED

CANCELLED
```

---

# 71. Recurring Unique Generation

Necesitamos evitar duplicar ocurrencias.

Constraint recomendado en scheduled transactions:

```text
UNIQUE(recurring_transaction_id, scheduled_date)
```

para rows generadas por recurrencia.

---

# 72. budgets

Tabla:

```text
budgets
```

Campos:

```text
id UUID PRIMARY KEY

user_id UUID NOT NULL

name TEXT NOT NULL

category_id UUID

currency_code CHAR(3) NOT NULL

period budget_period NOT NULL

limit_amount NUMERIC(20,6) NOT NULL

start_date DATE NOT NULL

end_date DATE

rollover_enabled BOOLEAN NOT NULL DEFAULT FALSE

status entity_status NOT NULL DEFAULT 'ACTIVE'

created_at TIMESTAMPTZ NOT NULL

updated_at TIMESTAMPTZ NOT NULL

archived_at TIMESTAMPTZ
```

---

# 73. budget_period

```text
MONTHLY
```

Futuro:

```text
WEEKLY

CUSTOM
```

---

# 74. Budget Constraint

```text
limit_amount > 0
```

---

# 75. savings_goals

Tabla:

```text
savings_goals
```

Campos:

```text
id UUID PRIMARY KEY

user_id UUID NOT NULL

name TEXT NOT NULL

target_amount NUMERIC(20,6) NOT NULL

currency_code CHAR(3) NOT NULL

target_date DATE

status savings_goal_status NOT NULL DEFAULT 'ACTIVE'

created_at TIMESTAMPTZ NOT NULL

updated_at TIMESTAMPTZ NOT NULL
```

---

# 76. savings_goal_status

```text
ACTIVE

COMPLETED

PAUSED

CANCELLED
```

---

# 77. savings_goal_contributions

Tabla:

```text
savings_goal_contributions
```

Campos:

```text
id UUID PRIMARY KEY

goal_id UUID NOT NULL

transaction_id UUID

amount NUMERIC(20,6) NOT NULL

contributed_at TIMESTAMPTZ NOT NULL

created_at TIMESTAMPTZ NOT NULL
```

---

# 78. reminders

Tabla:

```text
reminders
```

Campos:

```text
id UUID PRIMARY KEY

user_id UUID NOT NULL

source_type reminder_source_type NOT NULL

source_id UUID NOT NULL

remind_at TIMESTAMPTZ NOT NULL

channel reminder_channel NOT NULL

status reminder_status NOT NULL DEFAULT 'PENDING'

sent_at TIMESTAMPTZ

created_at TIMESTAMPTZ NOT NULL
```

---

# 79. reminder_source_type

```text
DEBT_INSTALLMENT

CREDIT_CARD_STATEMENT

SCHEDULED_TRANSACTION

BUDGET

CUSTOM
```

---

# 80. reminder_channel

V1:

```text
IN_APP
```

Futuro:

```text
EMAIL

PUSH
```

---

# 81. reminder_status

```text
PENDING

SENT

CANCELLED
```

---

# 82. attachments

V1.1:

```text
attachments
```

Campos:

```text
id UUID PRIMARY KEY

user_id UUID NOT NULL

transaction_id UUID

debt_id UUID

storage_key TEXT NOT NULL

file_name TEXT NOT NULL

mime_type TEXT NOT NULL

file_size BIGINT NOT NULL

created_at TIMESTAMPTZ NOT NULL
```

---

# 83. import_batches

V1.1:

```text
import_batches
```

Campos:

```text
id UUID PRIMARY KEY

user_id UUID NOT NULL

source TEXT NOT NULL

file_name TEXT

status import_status NOT NULL

total_rows INTEGER NOT NULL DEFAULT 0

imported_rows INTEGER NOT NULL DEFAULT 0

duplicate_rows INTEGER NOT NULL DEFAULT 0

failed_rows INTEGER NOT NULL DEFAULT 0

created_at TIMESTAMPTZ NOT NULL

completed_at TIMESTAMPTZ
```

---

# 84. import_status

```text
PENDING

PROCESSING

COMPLETED

FAILED
```

---

# 85. Imported Transaction Metadata

En `transactions.metadata` puede vivir:

```json
{
  "importBatchId": "...",
  "externalId": "...",
  "sourceHash": "..."
}
```

Si importación crece, migrar a columnas explícitas.

---

# 86. Projection Tables

Las proyecciones son opcionales inicialmente.

Podemos comenzar calculando on demand.

Cuando sea necesario:

```text
account_balance_snapshots

monthly_financial_snapshots

net_worth_snapshots
```

---

# 87. account_balance_snapshots

Campos:

```text
id

user_id

account_id

snapshot_date

balance

currency_code

calculation_version

created_at
```

---

# 88. net_worth_snapshots

Campos:

```text
id

user_id

snapshot_date

asset_value

liability_value

net_worth

base_currency

calculation_version

created_at
```

---

# 89. Snapshot Rule

Snapshots:

```text
not source of truth
```

Deben poder regenerarse.

---

# 90. Spendable Money

No crear inicialmente:

```text
users.spendable_money
```

como valor mutable.

Calcular mediante query/service.

---

# 91. Account Balance

Tampoco crear inicialmente:

```text
accounts.current_balance
```

como única fuente.

Puede agregarse como proyección optimizada más adelante.

---

# 92. Balance Query

Conceptualmente:

```text
opening balance

+ POSTED incomes

- POSTED expenses

+ transfer ins

- transfer outs

+ refunds

± adjustments

- liability payments
```

según semántica de cuenta.

---

# 93. Credit Card Balance

Para cuenta `CREDIT_CARD`, el balance necesita semántica de liability.

No debe reutilizar ciegamente la fórmula de cuenta bancaria.

Recomendación:

```text
AccountBalanceCalculator
```

por `account.type`.

---

# 94. Foreign Keys

Todas las relaciones deben usar FK donde sea posible.

Ejemplos:

```text
accounts.user_id → users.id

transactions.account_id → accounts.id

debt_installments.debt_id → debts.id

payment_allocations.payment_id → debt_payments.id
```

---

# 95. Cascade Policy

Evitar cascades destructivos en datos financieros históricos.

Preferencia:

```text
ON DELETE RESTRICT
```

para entidades con historial.

---

# 96. User Deletion

Eliminar usuario debe ocurrir mediante workflow explícito.

No depender de:

```text
ON DELETE CASCADE
```

para borrar automáticamente todo el historial financiero en producción.

---

# 97. Soft Delete / Archive

Usar `archived_at` para:

```text
accounts

categories

budgets
```

Usar status para:

```text
debts

scheduled transactions

recurring transactions
```

Usar:

```text
VOIDED
```

para transacciones financieras.

---

# 98. Never Soft Delete Without Semantics

No agregar:

```text
deleted_at
```

a todas las tablas indiscriminadamente.

Cada entidad necesita semántica correcta.

---

# 99. Ownership Columns

Recomendamos `user_id` explícito en:

```text
accounts

credit_cards

categories

tags

transactions

transfers

debts

debt_payments

scheduled_transactions

recurring_transactions

budgets

savings_goals

reminders

attachments

import_batches
```

---

# 100. Why Duplicate Ownership

Aunque algunas entidades puedan derivar usuario mediante join:

```text
explicit user_id
```

mejora:

```text
authorization

query filtering

indexes

debugging
```

siempre que mantengamos invariantes de consistencia.

---

# 101. Ownership Integrity

Application layer debe impedir:

```text
transaction.user_id = A
account.user_id = B
```

Idealmente DB puede reforzarlo parcialmente con constraints compuestas en una versión posterior.

---

# 102. Row-Level Security

No es obligatorio en V1.

Podría agregarse más adelante como capa adicional.

La autorización principal inicialmente vive en application/repository layer.

---

# 103. Repository Query Rule

Preferir:

```text
WHERE id = ?
AND user_id = ?
```

en consultas privadas.

---

# 104. Index Strategy

Principales índices:

```text
transactions(user_id, occurred_at)

transactions(account_id, occurred_at)

scheduled_transactions(user_id, scheduled_date, status)

debt_installments(debt_id, due_date)

debts(user_id, status)

budgets(user_id, status)

reminders(user_id, remind_at, status)
```

---

# 105. Upcoming Payments Query

Debe poder consultar eficientemente:

```text
installments due soon

scheduled expenses due soon

credit card statements due soon
```

Podemos construir una query unificada en application/read model.

---

# 106. No Generic Obligations Table Yet

No crear inmediatamente:

```text
financial_obligations
```

si solo duplica:

```text
debt_installments

scheduled_transactions

credit_card_statements
```

Preferimos read model/projection.

---

# 107. Future Obligations Projection

Puede existir una view o query:

```text
upcoming_financial_obligations
```

conceptualmente unificando varias fuentes.

---

# 108. Database Views

V1 puede evitar materialized views inicialmente.

Cuando reportes crezcan:

```text
SQL views
```

o:

```text
materialized views
```

pueden evaluarse.

---

# 109. Transaction Boundaries — Create Expense

```text
BEGIN

validate account ownership

create transaction

create splits/tags if needed

COMMIT
```

---

# 110. Transaction Boundaries — Transfer

```text
BEGIN

validate both accounts

create transfer

create outgoing leg

create incoming leg

COMMIT
```

---

# 111. Transaction Boundaries — Debt Payment

```text
BEGIN

validate debt/account ownership

create liability payment transaction

create debt payment

create allocations

update derived statuses

COMMIT
```

---

# 112. Transaction Boundaries — Scheduled Post

```text
BEGIN

lock scheduled transaction

create actual transaction

mark schedule posted

COMMIT
```

---

# 113. Concurrency

Para operaciones críticas como:

```text
DebtPayment

ScheduledTransaction posting
```

usar locking o compare-and-set apropiado para evitar doble aplicación.

---

# 114. Example Double Payment Risk

Dos requests concurrentes podrían intentar pagar la misma cuota.

Debemos validar:

```text
remaining amount
```

dentro de la misma transacción y bloqueo adecuado.

---

# 115. Idempotency

Operaciones externas/imports/jobs deben soportar idempotency.

Ejemplos:

```text
import transaction

scheduled posting

recurring occurrence generation

notification send
```

---

# 116. Scheduled Posting Unique Constraint

`posted_transaction_id UNIQUE` ayuda a impedir doble posting.

---

# 117. Recurring Generation Constraint

```text
UNIQUE(recurring_transaction_id, scheduled_date)
```

evita generar la misma ocurrencia dos veces.

---

# 118. Notification Idempotency

Podemos usar:

```text
UNIQUE(source_type, source_id, remind_at, channel)
```

si la UX no permite duplicados idénticos.

---

# 119. Drizzle Structure

Propuesta:

```text
packages/db/src/schema/
├── identity.ts
├── accounts.ts
├── ledger.ts
├── debt.ts
├── planning.ts
├── goals.ts
├── imports.ts
└── index.ts
```

---

# 120. Repository Structure

```text
packages/db/src/repositories/
├── accounts.ts
├── transactions.ts
├── transfers.ts
├── debts.ts
├── scheduled-transactions.ts
├── recurring-transactions.ts
├── budgets.ts
└── goals.ts
```

---

# 121. Query Structure

Read models complejos:

```text
packages/db/src/queries/
├── dashboard.ts
├── account-balances.ts
├── upcoming-payments.ts
├── monthly-summary.ts
├── cashflow.ts
└── net-worth.ts
```

---

# 122. No Generic Base Repository

Evitar:

```text
BaseRepository<T>
```

Las operaciones financieras tienen invariantes distintas.

---

# 123. JSONB Usage

Usar JSONB solo para metadata flexible.

Buenos casos:

```text
import metadata

provider metadata

custom recurrence configuration
```

No guardar campos financieros estructurados en JSONB si deben consultarse o validarse.

---

# 124. Migration Strategy

Implementar schema por vertical slices.

---

# 125. Migration Phase 1

```text
users
accounts
categories
transactions
transfers
```

---

# 126. Migration Phase 2

```text
debts
debt_installments
debt_payments
debt_payment_allocations
```

---

# 127. Migration Phase 3

```text
recurring_transactions
scheduled_transactions
reminders
```

---

# 128. Migration Phase 4

```text
budgets
savings_goals
contributions
```

---

# 129. Migration Phase 5

```text
credit_card_statements
transaction_splits
tags
attachments
imports
```

---

# 130. Financial Integrity Tests

DB/integration tests obligatorios:

```text
transfer creates exactly two legs

transfer does not alter net worth

voided transaction does not affect balance

debt payment cannot exceed available allocation rules

payment allocations equal payment amount

scheduled transaction cannot post twice

recurring occurrence cannot generate twice

credit card payment does not count as consumer expense
```

---

# 131. Multi-Currency Tests

Validar:

```text
cannot transfer directly between different currencies in V1
```

salvo flujo explícito de FX.

---

# 132. Date Tests

Validar:

```text
due dates

month boundaries

timezone-sensitive posting

February

leap years

31st-day recurrence behavior
```

---

# 133. Monetary Precision Tests

Validar:

```text
0.1 + 0.2
```

sin errores binarios.

También:

```text
installment division
```

donde el total no divide exactamente.

---

# 134. Installment Rounding

Ejemplo:

```text
100 / 3
```

No crear:

```text
33.33
33.33
33.33
```

si total termina:

```text
99.99
```

La diferencia debe asignarse determinísticamente.

Ejemplo:

```text
33.33
33.33
33.34
```

---

# 135. Rounding Strategy

La estrategia debe depender de:

```text
currency precision
```

y estar centralizada.

Nunca cada feature redondea por su cuenta.

---

# 136. Financial Engine Boundary

La DB almacena datos.

Las reglas complejas deben vivir en:

```text
finance engine/application layer
```

Ejemplos:

```text
installment generation

payment allocation

balance calculation

cashflow projection

rounding
```

---

# 137. Database Must Still Protect Invariants

Aunque exista finance engine, DB debe proteger:

```text
FKs

positive amounts

unique logical identities

not-null requirements
```

---

# 138. Audit Columns

En operaciones sensibles puede ser útil agregar:

```text
created_by
```

en futuro multi-user.

No necesario para finanzas personales single-owner V1.

---

# 139. Schema Success Criterion

El schema es correcto si permite representar sin duplicación:

```text
cash expense

salary

bank transfer

refund

adjustment

credit card purchase

credit card installment purchase

credit card payment

personal loan

partial debt payment

multiple installment payment

scheduled salary

recurring rent

overdue installment

budget tracking
```

---

# 140. Próximo documento

El siguiente documento será:

```text
docs/03-money-debt-engine.md
```

Debe definir la lógica financiera determinística para:

```text
Money

Rounding

Balances

Transfers

Refunds

Debt lifecycle

Installment generation

Partial payments

Payment allocation

Credit card semantics

Recurring events

Scheduled posting

Financial invariants
```

Este documento será el núcleo matemático y operativo del producto.
