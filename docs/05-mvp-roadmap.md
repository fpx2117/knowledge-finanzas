# MVP Roadmap

## 1. Objetivo

Este documento define el orden de implementación del MVP de la aplicación de finanzas personales.

El objetivo no es construir todas las capabilities del producto desde el inicio.

El objetivo es llegar lo antes posible a un sistema que permita al usuario:

```text
registrar dinero

registrar gastos

registrar deudas

configurar cuotas

registrar pagos

ver próximos vencimientos

entender cuánto tiene

entender cuánto debe

ver una proyección financiera simple
```

El MVP debe demostrar el loop principal del producto:

```text
Registrar
   ↓
Entender
   ↓
Planificar
   ↓
Pagar
   ↓
Revisar
```

---

# 2. North Star del MVP

Al abrir la aplicación, el usuario debe poder responder:

```text
¿Qué tengo?

¿Qué debo?

¿Qué vence?

¿Qué puedo gastar?
```

La quinta pregunta:

```text
¿Hacia dónde voy?
```

comienza a responderse con el cashflow de 30 días.

---

# 3. Principio de implementación

Construir por:

```text
vertical slices
```

y no por capas técnicas aisladas.

Evitar un desarrollo como:

```text
hacer toda la DB
hacer toda la API
hacer toda la UI
hacer todos los tests
```

Preferir:

```text
Account
DB + domain + API/action + UI + tests
```

y luego avanzar a la siguiente capability.

---

# 4. Arquitectura base

La aplicación parte del starter genérico existente.

Stack:

```text
Next.js
React
TypeScript
Tailwind
shadcn/ui

PostgreSQL
Drizzle ORM

Better Auth

Zod

pnpm monorepo

Railway
```

Capabilities adicionales según necesidad:

```text
Redis
BullMQ
OpenRouter
S3-compatible storage
```

No todas son necesarias en la primera fase.

---

# 5. Estructura conceptual

```text
apps/
├── web/
└── worker/

packages/
├── config/
├── db/
├── auth/
├── validation/
├── shared/
├── finance/
├── queue/
├── ai/
└── observability/
```

El dominio financiero puro vive principalmente en:

```text
packages/finance
```

Persistencia y queries:

```text
packages/db
```

---

# 6. MVP Scope

El MVP incluye:

```text
Authentication

User financial preferences

Accounts

Opening balances

Categories

Transactions

Income

Expenses

Transfers

Debts

Debt installments

Partial payments

Early payments

Payment allocations

Scheduled transactions

Recurring transactions

Upcoming payments

Basic reminders

Dashboard

30-day cashflow projection

Basic budgets
```

---

# 7. Fuera del MVP

No implementar inicialmente:

```text
automatic bank synchronization

investment tracking

stocks

crypto

advanced FX

shared household finances

complex loan amortization

mortgages

automatic tax calculations

OCR receipts

full credit-card statement automation

AI financial advisor

predictive spending

advanced scenario planning
```

---

# 8. V1.1 Candidates

Después del MVP:

```text
CSV import

transaction splits

tags

attachments

reserved funds

savings goals

credit card statements

budget rollover

net worth history

90-day cashflow

email/push reminders
```

---

# 9. Phase 0 — Product Bootstrap

Objetivo:

tener el proyecto ejecutándose con la infraestructura base.

---

# 10. Phase 0 Deliverables

```text
monorepo

web app

database connection

authentication

environment validation

basic layout

protected application shell

health endpoint

CI

local Docker infrastructure

Railway configuration
```

---

# 11. Phase 0 User Flow

```text
Open app
↓
Register
↓
Login
↓
Reach empty dashboard
```

---

# 12. Phase 0 Acceptance Criteria

El usuario puede:

```text
crear cuenta

iniciar sesión

cerrar sesión

acceder únicamente a sus páginas privadas
```

La aplicación:

```text
connects to PostgreSQL

runs migrations

passes lint

passes typecheck

passes tests

builds successfully
```

---

# 13. Phase 0 Definition of Done

```text
pnpm install

docker compose up -d

pnpm db:migrate

pnpm dev
```

debe levantar el entorno.

Y:

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

debe pasar.

---

# 14. Phase 1 — Accounts

Objetivo:

permitir representar dónde tiene dinero el usuario.

---

# 15. Account Scope

V1:

```text
CASH

BANK

DIGITAL_WALLET

SAVINGS
```

`CREDIT_CARD` puede agregarse cuando llegue la fase específica.

---

# 16. Account Creation

El usuario define:

```text
name

type

currency

opening balance

opening date
```

---

# 17. Account List

Mostrar:

```text
name

type

currency

current balance
```

---

# 18. Account Detail

Mostrar:

```text
current balance

opening balance

recent transactions
```

---

# 19. Account Editing

Permitir editar:

```text
name
```

y metadata segura.

No permitir cambiar arbitrariamente:

```text
current balance
```

---

# 20. Account Correction

Si el usuario necesita corregir saldo:

```text
Create Adjustment
```

No editar saldo directamente.

---

# 21. Account Archive

Permitir:

```text
ARCHIVE
```

No hard delete si tiene historial.

---

# 22. Phase 1 Acceptance Criteria

Debe poder demostrarse:

```text
Create cash account
Opening balance: 1000
Current balance: 1000
```

Sin transacciones adicionales.

---

# 23. Phase 2 — Categories

Objetivo:

permitir clasificar ingresos y gastos.

---

# 24. Default Categories

Crear un set inicial opcional.

Ejemplo:

```text
Housing

Food

Transport

Health

Education

Entertainment

Services

Subscriptions

Other
```

Ingresos:

```text
Salary

Freelance

Other Income
```

---

# 25. User Categories

El usuario puede:

```text
create

rename

archive
```

categorías.

---

# 26. Category Ownership

Todas las categorías son privadas al usuario.

No depender inicialmente de categorías globales complejas.

---

# 27. Phase 3 — Transactions

Objetivo:

crear el ledger financiero principal.

---

# 28. Transaction Creation

El usuario puede registrar:

```text
Income

Expense
```

con:

```text
account

amount

currency

description

merchant

category

date

notes
```

---

# 29. Transaction List

Debe soportar:

```text
pagination

date filtering

account filtering

category filtering

type filtering
```

---

# 30. Transaction Detail

Mostrar:

```text
amount

type

account

category

date

description

merchant

source
```

---

# 31. Transaction Editing

V1 permite modificar:

```text
description

merchant

category

notes
```

También puede permitir:

```text
amount
date
account
```

pero recalculando todos los derivados afectados.

---

# 32. Transaction Void

Preferir:

```text
VOID
```

antes que hard delete.

---

# 33. Balance Integration

Después de crear:

```text
INCOME
```

el balance sube.

Después de:

```text
EXPENSE
```

el balance baja.

---

# 34. Phase 3 Core Test

```text
Opening balance
1000

Income
+500

Expense
-200

Expected balance
1300
```

---

# 35. Phase 4 — Transfers

Objetivo:

mover dinero entre cuentas sin contaminar ingresos/gastos.

---

# 36. Transfer Flow

Usuario selecciona:

```text
From Account

To Account

Amount

Date
```

---

# 37. Transfer Result

Sistema crea:

```text
Transfer

TRANSFER_OUT

TRANSFER_IN
```

atómicamente.

---

# 38. Transfer Acceptance

Ejemplo:

```text
Bank
1000

Cash
100
```

Transfer:

```text
Bank → Cash
200
```

Resultado:

```text
Bank
800

Cash
300

Total assets
1100
```

---

# 39. Phase 5 — Debts

Objetivo:

representar obligaciones financieras.

---

# 40. Debt Creation

El usuario define:

```text
name

creditor

type

currency

original amount

start date

installment strategy
```

---

# 41. Debt Creation Modes

V1:

```text
GENERATED_INSTALLMENTS

MANUAL_INSTALLMENTS
```

---

# 42. Generated Installments

Input:

```text
total amount

installment count

first due date

frequency
```

---

# 43. Generated Preview

Antes de persistir:

```text
show installments
```

Ejemplo:

```text
1 · 15 Aug · 100
2 · 15 Sep · 100
3 · 15 Oct · 100
```

El usuario puede modificar:

```text
date

amount
```

---

# 44. Manual Installments

Permitir:

```text
add installment

remove installment

change amount

change due date
```

antes de confirmar.

---

# 45. Debt Detail

Mostrar:

```text
original amount

remaining debt

paid amount

next installment

installment list
```

---

# 46. Installment States

Mostrar:

```text
Pending

Partially Paid

Paid

Overdue
```

---

# 47. Overdue Detection

Debe depender de:

```text
dueDate
remainingAmount
user timezone
```

---

# 48. Phase 5 Acceptance

Crear deuda:

```text
1200

12 installments
```

Debe generar exactamente:

```text
12
```

cuotas cuya suma sea:

```text
1200
```

---

# 49. Phase 6 — Debt Payments

Objetivo:

registrar correctamente pagos parciales y completos.

---

# 50. Payment Flow

Usuario entra a deuda.

Selecciona:

```text
Pay
```

Luego:

```text
account

amount

date

allocation
```

---

# 51. Allocation Modes

V1:

```text
OLDEST_DUE_FIRST

MANUAL
```

---

# 52. Oldest First Example

Cuotas:

```text
100
100
100
```

Pago:

```text
250
```

Resultado:

```text
100 PAID

100 PAID

50 / 100 PARTIALLY_PAID
```

---

# 53. Manual Allocation

Usuario puede seleccionar:

```text
Cuota 5
100

Cuota 6
100
```

aunque sean futuras.

---

# 54. Payment Transaction

Registrar pago crea:

```text
LIABILITY_PAYMENT
```

en la cuenta utilizada.

---

# 55. Payment Integrity

Crear en una única DB transaction:

```text
financial transaction

debt payment

allocations

status updates
```

---

# 56. Debt Paid

Cuando remaining total llegue a:

```text
0
```

deuda pasa a:

```text
PAID
```

---

# 57. Phase 6 Critical Tests

```text
partial payment

full installment payment

multiple installment payment

early payment

overpayment rejection

concurrent payment protection
```

---

# 58. Phase 7 — Upcoming Payments

Objetivo:

hacer visibles las obligaciones.

---

# 59. Upcoming View

Agrupar:

```text
Overdue

Today

Next 7 Days

Later
```

---

# 60. Obligation Sources V1

Inicialmente:

```text
DebtInstallments

ScheduledExpenses
```

Después:

```text
CreditCardStatements

RecurringOccurrences
```

---

# 61. Upcoming Row

Mostrar:

```text
due date

title

remaining amount

source

status
```

---

# 62. Upcoming Action

Desde una cuota:

```text
Pay
```

Desde scheduled expense:

```text
Post
Skip
Edit
```

---

# 63. Phase 7 Value Milestone

En este momento el producto ya puede responder:

```text
¿Qué debo?

¿Qué vence?
```

---

# 64. Phase 8 — Scheduled Transactions

Objetivo:

representar ingresos y gastos futuros esperados.

---

# 65. Scheduled Types

```text
INCOME

EXPENSE
```

---

# 66. Scheduled Creation

Campos:

```text
description

amount

currency

date

account

category
```

---

# 67. Scheduled Does Not Affect Balance

Hasta que:

```text
POST
```

---

# 68. Posting

Al confirmar:

```text
ScheduledTransaction
↓
Transaction
```

---

# 69. Skip

Permitir:

```text
SKIPPED
```

sin eliminar la historia.

---

# 70. Phase 9 — Recurring Transactions

Objetivo:

evitar registrar manualmente obligaciones repetitivas.

---

# 71. Recurring Examples

```text
Salary

Rent

Internet

Netflix

Insurance
```

---

# 72. Frequencies V1

```text
WEEKLY

BIWEEKLY

MONTHLY

QUARTERLY

YEARLY
```

`CUSTOM` puede quedar V1.1 si complica demasiado.

---

# 73. Recurring Rule

Debe generar:

```text
ScheduledTransaction
```

no transacciones reales.

---

# 74. Recurrence Horizon

Generar ocurrencias hasta:

```text
90 days
```

como ventana operativa inicial.

---

# 75. Recurring Worker

Puede utilizar worker/BullMQ para:

```text
generate future occurrences

send reminders
```

Pero la creación inicial puede hacerse sin worker si simplifica el MVP.

---

# 76. Idempotency

No generar dos veces:

```text
ruleId + scheduledDate
```

---

# 77. Phase 10 — Dashboard

Objetivo:

responder rápidamente el estado financiero actual.

---

# 78. Dashboard V1

Mostrar:

```text
Liquid Balance

Income This Month

Expenses This Month

Outstanding Debt

Upcoming Payments

Estimated Spendable

30-Day Cashflow
```

---

# 79. Dashboard Layout

Conceptualmente:

```text
Financial Overview
────────────────────────

Available
Debt
Spendable

This Month
Income
Expenses
Result

Upcoming Payments

30-Day Projection
```

---

# 80. Balance Card

Mostrar:

```text
Total liquid balance
```

con desglose opcional por cuenta.

---

# 81. Debt Card

Mostrar:

```text
Total debt

next payment

overdue amount
```

---

# 82. Spendable Card

Mostrar:

```text
Liquid balance

minus near-term obligations

estimated spendable
```

---

# 83. Dashboard Explainability

Cada card debe permitir:

```text
View details
```

para entender de dónde sale el total.

---

# 84. Phase 11 — Cashflow Projection

Objetivo:

responder qué puede ocurrir con la liquidez en próximos 30 días.

---

# 85. Inputs

```text
current liquid balance

scheduled incomes

scheduled expenses

debt installments
```

---

# 86. Output

```text
timeline

ending projected balance

minimum projected balance

first shortfall date
```

---

# 87. Cashflow UI

Ejemplo:

```text
Today
$800,000

Aug 15
Rent
-$300,000

Aug 20
Loan
-$100,000

Aug 31
Salary
+$1,200,000
```

---

# 88. Negative Projection

Si existe:

```text
projected balance < 0
```

mostrar alerta.

---

# 89. No Auto Advice

No decir:

```text
take a loan
sell an asset
invest differently
```

como acción automática.

Mostrar:

```text
cashflow risk
```

y datos relevantes.

---

# 90. Phase 12 — Budgets

Objetivo:

permitir controlar gasto por categoría.

---

# 91. Budget V1

Inicialmente:

```text
monthly
category-based
```

---

# 92. Budget Creation

Usuario define:

```text
category

monthly limit

currency
```

---

# 93. Budget Calculation

Usar:

```text
posted consumption expenses
-
refunds
```

---

# 94. Budget Status

Mostrar:

```text
spent

remaining

percentage
```

---

# 95. Budget Alerts

Estados visuales:

```text
normal

near limit

over limit
```

---

# 96. Phase 13 — Basic Reminders

Objetivo:

permitir recordar vencimientos.

---

# 97. Reminder V1

Fuentes:

```text
DebtInstallment

ScheduledTransaction
```

---

# 98. Reminder Options

```text
due date

1 day before

3 days before

7 days before

custom
```

---

# 99. Reminder Channel

V1:

```text
IN_APP
```

---

# 100. Email / Push

Queda:

```text
V1.1
```

---

# 101. Phase 14 — Financial Hardening

Antes de considerar el MVP terminado, ejecutar una fase específica de integridad.

---

# 102. Hardening Areas

```text
money precision

rounding

timezone

ownership

concurrency

idempotency

voiding

refund handling

overdue rules

financial reporting classification
```

---

# 103. Ownership Tests

Intentar:

```text
user A accesses account B

user A pays debt B

user A references category B
```

Todo debe fallar.

---

# 104. Concurrency Tests

Especialmente:

```text
two debt payments simultaneously

same scheduled transaction posted twice
```

---

# 105. Monetary Tests

```text
100 / 3

large amounts

six-decimal DB precision

zero amount rejection

negative amount rejection
```

---

# 106. Date Tests

```text
month end

Jan 31

February

leap year

year end

timezone boundaries
```

---

# 107. Phase 15 — UX Hardening

Después de corrección financiera:

```text
empty states

loading states

error states

mobile layouts

keyboard navigation

accessible forms

confirmation dialogs
```

---

# 108. Empty Dashboard

Un usuario nuevo no debe ver:

```text
$0 everywhere
```

sin orientación.

Mostrar un onboarding simple:

```text
1. Create your first account
2. Set opening balance
3. Add your first transaction
4. Add a debt if you have one
```

---

# 109. Fast Entry

Registrar un gasto debe requerir pocos pasos.

Ideal:

```text
amount
account
category
description
```

con defaults razonables.

---

# 110. Mobile Priority

Finanzas personales tendrán uso frecuente desde móvil.

Priorizar responsive design desde el inicio.

---

# 111. Navigation V1

Propuesta:

```text
Dashboard

Transactions

Accounts

Debts

Planning

Budgets
```

---

# 112. Planning Section

Agrupa:

```text
Upcoming

Scheduled

Recurring
```

---

# 113. Phase 16 — Observability

Antes de producción:

```text
structured logging

request IDs

error tracking

health endpoints

worker health

DB health
```

---

# 114. Sensitive Data Logging

Nunca loggear por defecto:

```text
full transaction descriptions

complete financial history

auth tokens

bank-like secrets
```

---

# 115. Phase 17 — Production Deployment

Railway layout:

```text
Railway Project
├── web
├── worker
├── postgres
└── redis
```

Worker y Redis pueden activarse cuando reminders/recurrence lo requieran.

---

# 116. Deployment MVP Minimal

Primer deployment puede ser:

```text
web
+
postgres
```

si:

```text
recurring generation
reminders
```

se resuelven inicialmente desde web/cron compatible.

---

# 117. Deployment Full MVP

Con automation:

```text
web

worker

postgres

redis
```

---

# 118. Environment Variables

Ejemplos:

```text
DATABASE_URL

BETTER_AUTH_SECRET

BETTER_AUTH_URL

APP_URL

REDIS_URL
```

AI/storage solo si se activan:

```text
OPENROUTER_API_KEY

S3_ENDPOINT

S3_BUCKET

S3_ACCESS_KEY_ID

S3_SECRET_ACCESS_KEY
```

---

# 119. AI In MVP

AI no es necesaria para validar el core del producto.

Recomendación:

```text
AI = V1.1
```

---

# 120. Why AI Later

Primero debemos asegurar:

```text
correct balances

correct debts

correct payments

correct projections
```

Después agregar:

```text
categorization suggestions

insights

merchant normalization
```

---

# 121. Storage In MVP

S3 tampoco es obligatorio para core.

Se activa cuando implementemos:

```text
attachments

receipts

imports
```

---

# 122. Recommended Implementation Order

Orden final:

```text
0. Bootstrap

1. Accounts

2. Categories

3. Transactions

4. Transfers

5. Debts

6. Debt Payments

7. Upcoming Payments

8. Scheduled Transactions

9. Recurring Transactions

10. Dashboard

11. Cashflow Projection

12. Budgets

13. Reminders

14. Financial Hardening

15. UX Hardening

16. Observability

17. Production Deployment
```

---

# 123. Why Debt Before Dashboard

El dashboard depende de:

```text
balances
+
debt
+
future obligations
```

Implementarlo demasiado temprano produciría métricas incompletas.

---

# 124. Why Recurrence Before Cashflow

Cashflow necesita:

```text
future events
```

Por eso:

```text
scheduled
+
recurring
```

deben existir antes.

---

# 125. Why Budgets After Cashflow

Budget es importante, pero no define la integridad financiera central.

Core priority:

```text
money
debt
obligations
cashflow
```

---

# 126. Vertical Slice 1

Primer slice funcional completo:

```text
Authentication
+
Account
+
Income/Expense
+
Balance
```

---

# 127. Vertical Slice 1 Demo

Usuario:

```text
creates Bank account
```

con:

```text
opening balance = 1000
```

registra:

```text
salary +500

food -100
```

dashboard básico muestra:

```text
balance 1400
```

---

# 128. Vertical Slice 2

```text
Multiple Accounts
+
Transfers
```

---

# 129. Vertical Slice 3

```text
Debt
+
Installments
+
Payments
```

---

# 130. Vertical Slice 4

```text
Scheduled
+
Recurring
+
Upcoming
```

---

# 131. Vertical Slice 5

```text
Dashboard
+
Cashflow
+
Budgets
```

---

# 132. Feature Definition of Done

Una feature no está terminada solo porque existe UI.

Debe incluir:

```text
schema

migration

domain validation

ownership validation

application service

UI

error handling

tests
```

---

# 133. Financial Feature DoD

Además debe incluir:

```text
money precision tests

recalculation behavior

reporting impact

projection impact

historical behavior
```

cuando corresponda.

---

# 134. Repository Rule

No acceder directamente a Drizzle desde componentes React.

Flujo:

```text
UI
↓
Server Action / Handler
↓
Application Service
↓
Repository / Query
↓
Database
```

---

# 135. Finance Engine Rule

Cálculos:

```text
UI
X
DB query scattered logic
X
```

Preferir:

```text
Application Service
↓
Finance Engine
```

---

# 136. Validation Rule

Todo input externo pasa por:

```text
Zod
```

antes del dominio.

---

# 137. Transaction Boundary Rule

Operaciones multi-entidad deben usar DB transaction.

Especialmente:

```text
Transfer

Debt Payment

Scheduled Posting
```

---

# 138. Testing Pyramid

V1:

```text
many finance unit tests

repository integration tests

application-service tests

few high-value E2E flows
```

---

# 139. Critical E2E Flow 1

```text
register
↓
create account
↓
add income
↓
add expense
↓
verify balance
```

---

# 140. Critical E2E Flow 2

```text
create two accounts
↓
transfer
↓
verify both balances
↓
verify total unchanged
```

---

# 141. Critical E2E Flow 3

```text
create debt
↓
generate installments
↓
pay partially
↓
verify remaining
↓
pay rest
↓
verify installment paid
```

---

# 142. Critical E2E Flow 4

```text
create scheduled salary
↓
create recurring rent
↓
open cashflow
↓
verify projection
```

---

# 143. Critical E2E Flow 5

```text
create monthly budget
↓
record expenses
↓
record refund
↓
verify remaining budget
```

---

# 144. MVP Completion Criteria

El MVP está listo cuando un usuario real puede:

```text
create accounts

record income and expenses

move money between accounts

create debts

configure installments

record partial/full debt payments

see upcoming obligations

schedule future money

configure recurring money

see current balance

see outstanding debt

see estimated spendable money

see 30-day cashflow

use basic budgets
```

sin inconsistencias financieras conocidas.

---

# 145. Technical Completion Criteria

Debe pasar:

```text
pnpm lint

pnpm typecheck

pnpm test

pnpm build
```

---

# 146. Database Completion Criteria

Debe existir:

```text
migration from empty DB

seed/dev data

rollback/recovery strategy

indexes for core queries
```

---

# 147. Security Completion Criteria

Debe verificarse:

```text
authentication

ownership

server-only secrets

input validation

authorization on every private mutation
```

---

# 148. Production Completion Criteria

Debe existir:

```text
health endpoint

error visibility

backup strategy

migration deployment process

environment validation

deployment documentation
```

---

# 149. Product Validation Before V1.1

Antes de agregar muchas features, observar:

```text
Do users register expenses?

Do users create debts?

Do they check upcoming payments?

Do they understand spendable money?

Do they return to the dashboard?

Do they use cashflow?
```

---

# 150. Avoid Premature Features

No avanzar rápidamente a:

```text
AI

OCR

bank sync

investments

advanced charts
```

si el core todavía no genera uso recurrente.

---

# 151. MVP Success Signal

Una señal fuerte de valor sería:

```text
user returns before payment dates
```

para revisar:

```text
upcoming obligations
+
available cash
+
cashflow
```

---

# 152. Documentation Rule After MVP Roadmap

A partir de este punto:

```text
do not create architecture documents by anticipation
```

Crear solo:

```text
vertical slice specs

ADRs when a real architecture decision appears

feature specs for complex flows
```

---

# 153. Next Implementation Document

El siguiente documento será:

```text
docs/06-accounts-transactions-vertical-slice.md
```

Debe especificar el primer slice real:

```text
Authentication context

Accounts

Categories

Income

Expenses

Balances

Transaction list

Dashboard starter
```

incluyendo:

```text
routes

UI screens

server actions

repositories

finance functions

validation schemas

tests

acceptance criteria
```

---

# 154. Implementation Starts After 06

Después de:

```text
docs/06-accounts-transactions-vertical-slice.md
```

la recomendación es comenzar código.

Los siguientes documentos se crearán únicamente cuando el slice correspondiente vaya a implementarse.

---

# 155. Final MVP Principle

El MVP no necesita saber todo sobre las finanzas del usuario.

Necesita hacer extremadamente bien esto:

```text
Know what exists.

Know what was spent.

Know what is owed.

Know what is due.

Know what happens next.
```
# MVP Roadmap

## 1. Objetivo

Este documento define el orden de implementación del MVP de la aplicación de finanzas personales.

El objetivo no es construir todas las capabilities del producto desde el inicio.

El objetivo es llegar lo antes posible a un sistema que permita al usuario:

```text
registrar dinero

registrar gastos

registrar deudas

configurar cuotas

registrar pagos

ver próximos vencimientos

entender cuánto tiene

entender cuánto debe

ver una proyección financiera simple
```

El MVP debe demostrar el loop principal del producto:

```text
Registrar
   ↓
Entender
   ↓
Planificar
   ↓
Pagar
   ↓
Revisar
```

---

# 2. North Star del MVP

Al abrir la aplicación, el usuario debe poder responder:

```text
¿Qué tengo?

¿Qué debo?

¿Qué vence?

¿Qué puedo gastar?
```

La quinta pregunta:

```text
¿Hacia dónde voy?
```

comienza a responderse con el cashflow de 30 días.

---

# 3. Principio de implementación

Construir por:

```text
vertical slices
```

y no por capas técnicas aisladas.

Evitar un desarrollo como:

```text
hacer toda la DB
hacer toda la API
hacer toda la UI
hacer todos los tests
```

Preferir:

```text
Account
DB + domain + API/action + UI + tests
```

y luego avanzar a la siguiente capability.

---

# 4. Arquitectura base

La aplicación parte del starter genérico existente.

Stack:

```text
Next.js
React
TypeScript
Tailwind
shadcn/ui

PostgreSQL
Drizzle ORM

Better Auth

Zod

pnpm monorepo

Railway
```

Capabilities adicionales según necesidad:

```text
Redis
BullMQ
OpenRouter
S3-compatible storage
```

No todas son necesarias en la primera fase.

---

# 5. Estructura conceptual

```text
apps/
├── web/
└── worker/

packages/
├── config/
├── db/
├── auth/
├── validation/
├── shared/
├── finance/
├── queue/
├── ai/
└── observability/
```

El dominio financiero puro vive principalmente en:

```text
packages/finance
```

Persistencia y queries:

```text
packages/db
```

---

# 6. MVP Scope

El MVP incluye:

```text
Authentication

User financial preferences

Accounts

Opening balances

Categories

Transactions

Income

Expenses

Transfers

Debts

Debt installments

Partial payments

Early payments

Payment allocations

Scheduled transactions

Recurring transactions

Upcoming payments

Basic reminders

Dashboard

30-day cashflow projection

Basic budgets
```

---

# 7. Fuera del MVP

No implementar inicialmente:

```text
automatic bank synchronization

investment tracking

stocks

crypto

advanced FX

shared household finances

complex loan amortization

mortgages

automatic tax calculations

OCR receipts

full credit-card statement automation

AI financial advisor

predictive spending

advanced scenario planning
```

---

# 8. V1.1 Candidates

Después del MVP:

```text
CSV import

transaction splits

tags

attachments

reserved funds

savings goals

credit card statements

budget rollover

net worth history

90-day cashflow

email/push reminders
```

---

# 9. Phase 0 — Product Bootstrap

Objetivo:

tener el proyecto ejecutándose con la infraestructura base.

---

# 10. Phase 0 Deliverables

```text
monorepo

web app

database connection

authentication

environment validation

basic layout

protected application shell

health endpoint

CI

local Docker infrastructure

Railway configuration
```

---

# 11. Phase 0 User Flow

```text
Open app
↓
Register
↓
Login
↓
Reach empty dashboard
```

---

# 12. Phase 0 Acceptance Criteria

El usuario puede:

```text
crear cuenta

iniciar sesión

cerrar sesión

acceder únicamente a sus páginas privadas
```

La aplicación:

```text
connects to PostgreSQL

runs migrations

passes lint

passes typecheck

passes tests

builds successfully
```

---

# 13. Phase 0 Definition of Done

```text
pnpm install

docker compose up -d

pnpm db:migrate

pnpm dev
```

debe levantar el entorno.

Y:

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

debe pasar.

---

# 14. Phase 1 — Accounts

Objetivo:

permitir representar dónde tiene dinero el usuario.

---

# 15. Account Scope

V1:

```text
CASH

BANK

DIGITAL_WALLET

SAVINGS
```

`CREDIT_CARD` puede agregarse cuando llegue la fase específica.

---

# 16. Account Creation

El usuario define:

```text
name

type

currency

opening balance

opening date
```

---

# 17. Account List

Mostrar:

```text
name

type

currency

current balance
```

---

# 18. Account Detail

Mostrar:

```text
current balance

opening balance

recent transactions
```

---

# 19. Account Editing

Permitir editar:

```text
name
```

y metadata segura.

No permitir cambiar arbitrariamente:

```text
current balance
```

---

# 20. Account Correction

Si el usuario necesita corregir saldo:

```text
Create Adjustment
```

No editar saldo directamente.

---

# 21. Account Archive

Permitir:

```text
ARCHIVE
```

No hard delete si tiene historial.

---

# 22. Phase 1 Acceptance Criteria

Debe poder demostrarse:

```text
Create cash account
Opening balance: 1000
Current balance: 1000
```

Sin transacciones adicionales.

---

# 23. Phase 2 — Categories

Objetivo:

permitir clasificar ingresos y gastos.

---

# 24. Default Categories

Crear un set inicial opcional.

Ejemplo:

```text
Housing

Food

Transport

Health

Education

Entertainment

Services

Subscriptions

Other
```

Ingresos:

```text
Salary

Freelance

Other Income
```

---

# 25. User Categories

El usuario puede:

```text
create

rename

archive
```

categorías.

---

# 26. Category Ownership

Todas las categorías son privadas al usuario.

No depender inicialmente de categorías globales complejas.

---

# 27. Phase 3 — Transactions

Objetivo:

crear el ledger financiero principal.

---

# 28. Transaction Creation

El usuario puede registrar:

```text
Income

Expense
```

con:

```text
account

amount

currency

description

merchant

category

date

notes
```

---

# 29. Transaction List

Debe soportar:

```text
pagination

date filtering

account filtering

category filtering

type filtering
```

---

# 30. Transaction Detail

Mostrar:

```text
amount

type

account

category

date

description

merchant

source
```

---

# 31. Transaction Editing

V1 permite modificar:

```text
description

merchant

category

notes
```

También puede permitir:

```text
amount
date
account
```

pero recalculando todos los derivados afectados.

---

# 32. Transaction Void

Preferir:

```text
VOID
```

antes que hard delete.

---

# 33. Balance Integration

Después de crear:

```text
INCOME
```

el balance sube.

Después de:

```text
EXPENSE
```

el balance baja.

---

# 34. Phase 3 Core Test

```text
Opening balance
1000

Income
+500

Expense
-200

Expected balance
1300
```

---

# 35. Phase 4 — Transfers

Objetivo:

mover dinero entre cuentas sin contaminar ingresos/gastos.

---

# 36. Transfer Flow

Usuario selecciona:

```text
From Account

To Account

Amount

Date
```

---

# 37. Transfer Result

Sistema crea:

```text
Transfer

TRANSFER_OUT

TRANSFER_IN
```

atómicamente.

---

# 38. Transfer Acceptance

Ejemplo:

```text
Bank
1000

Cash
100
```

Transfer:

```text
Bank → Cash
200
```

Resultado:

```text
Bank
800

Cash
300

Total assets
1100
```

---

# 39. Phase 5 — Debts

Objetivo:

representar obligaciones financieras.

---

# 40. Debt Creation

El usuario define:

```text
name

creditor

type

currency

original amount

start date

installment strategy
```

---

# 41. Debt Creation Modes

V1:

```text
GENERATED_INSTALLMENTS

MANUAL_INSTALLMENTS
```

---

# 42. Generated Installments

Input:

```text
total amount

installment count

first due date

frequency
```

---

# 43. Generated Preview

Antes de persistir:

```text
show installments
```

Ejemplo:

```text
1 · 15 Aug · 100
2 · 15 Sep · 100
3 · 15 Oct · 100
```

El usuario puede modificar:

```text
date

amount
```

---

# 44. Manual Installments

Permitir:

```text
add installment

remove installment

change amount

change due date
```

antes de confirmar.

---

# 45. Debt Detail

Mostrar:

```text
original amount

remaining debt

paid amount

next installment

installment list
```

---

# 46. Installment States

Mostrar:

```text
Pending

Partially Paid

Paid

Overdue
```

---

# 47. Overdue Detection

Debe depender de:

```text
dueDate
remainingAmount
user timezone
```

---

# 48. Phase 5 Acceptance

Crear deuda:

```text
1200

12 installments
```

Debe generar exactamente:

```text
12
```

cuotas cuya suma sea:

```text
1200
```

---

# 49. Phase 6 — Debt Payments

Objetivo:

registrar correctamente pagos parciales y completos.

---

# 50. Payment Flow

Usuario entra a deuda.

Selecciona:

```text
Pay
```

Luego:

```text
account

amount

date

allocation
```

---

# 51. Allocation Modes

V1:

```text
OLDEST_DUE_FIRST

MANUAL
```

---

# 52. Oldest First Example

Cuotas:

```text
100
100
100
```

Pago:

```text
250
```

Resultado:

```text
100 PAID

100 PAID

50 / 100 PARTIALLY_PAID
```

---

# 53. Manual Allocation

Usuario puede seleccionar:

```text
Cuota 5
100

Cuota 6
100
```

aunque sean futuras.

---

# 54. Payment Transaction

Registrar pago crea:

```text
LIABILITY_PAYMENT
```

en la cuenta utilizada.

---

# 55. Payment Integrity

Crear en una única DB transaction:

```text
financial transaction

debt payment

allocations

status updates
```

---

# 56. Debt Paid

Cuando remaining total llegue a:

```text
0
```

deuda pasa a:

```text
PAID
```

---

# 57. Phase 6 Critical Tests

```text
partial payment

full installment payment

multiple installment payment

early payment

overpayment rejection

concurrent payment protection
```

---

# 58. Phase 7 — Upcoming Payments

Objetivo:

hacer visibles las obligaciones.

---

# 59. Upcoming View

Agrupar:

```text
Overdue

Today

Next 7 Days

Later
```

---

# 60. Obligation Sources V1

Inicialmente:

```text
DebtInstallments

ScheduledExpenses
```

Después:

```text
CreditCardStatements

RecurringOccurrences
```

---

# 61. Upcoming Row

Mostrar:

```text
due date

title

remaining amount

source

status
```

---

# 62. Upcoming Action

Desde una cuota:

```text
Pay
```

Desde scheduled expense:

```text
Post
Skip
Edit
```

---

# 63. Phase 7 Value Milestone

En este momento el producto ya puede responder:

```text
¿Qué debo?

¿Qué vence?
```

---

# 64. Phase 8 — Scheduled Transactions

Objetivo:

representar ingresos y gastos futuros esperados.

---

# 65. Scheduled Types

```text
INCOME

EXPENSE
```

---

# 66. Scheduled Creation

Campos:

```text
description

amount

currency

date

account

category
```

---

# 67. Scheduled Does Not Affect Balance

Hasta que:

```text
POST
```

---

# 68. Posting

Al confirmar:

```text
ScheduledTransaction
↓
Transaction
```

---

# 69. Skip

Permitir:

```text
SKIPPED
```

sin eliminar la historia.

---

# 70. Phase 9 — Recurring Transactions

Objetivo:

evitar registrar manualmente obligaciones repetitivas.

---

# 71. Recurring Examples

```text
Salary

Rent

Internet

Netflix

Insurance
```

---

# 72. Frequencies V1

```text
WEEKLY

BIWEEKLY

MONTHLY

QUARTERLY

YEARLY
```

`CUSTOM` puede quedar V1.1 si complica demasiado.

---

# 73. Recurring Rule

Debe generar:

```text
ScheduledTransaction
```

no transacciones reales.

---

# 74. Recurrence Horizon

Generar ocurrencias hasta:

```text
90 days
```

como ventana operativa inicial.

---

# 75. Recurring Worker

Puede utilizar worker/BullMQ para:

```text
generate future occurrences

send reminders
```

Pero la creación inicial puede hacerse sin worker si simplifica el MVP.

---

# 76. Idempotency

No generar dos veces:

```text
ruleId + scheduledDate
```

---

# 77. Phase 10 — Dashboard

Objetivo:

responder rápidamente el estado financiero actual.

---

# 78. Dashboard V1

Mostrar:

```text
Liquid Balance

Income This Month

Expenses This Month

Outstanding Debt

Upcoming Payments

Estimated Spendable

30-Day Cashflow
```

---

# 79. Dashboard Layout

Conceptualmente:

```text
Financial Overview
────────────────────────

Available
Debt
Spendable

This Month
Income
Expenses
Result

Upcoming Payments

30-Day Projection
```

---

# 80. Balance Card

Mostrar:

```text
Total liquid balance
```

con desglose opcional por cuenta.

---

# 81. Debt Card

Mostrar:

```text
Total debt

next payment

overdue amount
```

---

# 82. Spendable Card

Mostrar:

```text
Liquid balance

minus near-term obligations

estimated spendable
```

---

# 83. Dashboard Explainability

Cada card debe permitir:

```text
View details
```

para entender de dónde sale el total.

---

# 84. Phase 11 — Cashflow Projection

Objetivo:

responder qué puede ocurrir con la liquidez en próximos 30 días.

---

# 85. Inputs

```text
current liquid balance

scheduled incomes

scheduled expenses

debt installments
```

---

# 86. Output

```text
timeline

ending projected balance

minimum projected balance

first shortfall date
```

---

# 87. Cashflow UI

Ejemplo:

```text
Today
$800,000

Aug 15
Rent
-$300,000

Aug 20
Loan
-$100,000

Aug 31
Salary
+$1,200,000
```

---

# 88. Negative Projection

Si existe:

```text
projected balance < 0
```

mostrar alerta.

---

# 89. No Auto Advice

No decir:

```text
take a loan
sell an asset
invest differently
```

como acción automática.

Mostrar:

```text
cashflow risk
```

y datos relevantes.

---

# 90. Phase 12 — Budgets

Objetivo:

permitir controlar gasto por categoría.

---

# 91. Budget V1

Inicialmente:

```text
monthly
category-based
```

---

# 92. Budget Creation

Usuario define:

```text
category

monthly limit

currency
```

---

# 93. Budget Calculation

Usar:

```text
posted consumption expenses
-
refunds
```

---

# 94. Budget Status

Mostrar:

```text
spent

remaining

percentage
```

---

# 95. Budget Alerts

Estados visuales:

```text
normal

near limit

over limit
```

---

# 96. Phase 13 — Basic Reminders

Objetivo:

permitir recordar vencimientos.

---

# 97. Reminder V1

Fuentes:

```text
DebtInstallment

ScheduledTransaction
```

---

# 98. Reminder Options

```text
due date

1 day before

3 days before

7 days before

custom
```

---

# 99. Reminder Channel

V1:

```text
IN_APP
```

---

# 100. Email / Push

Queda:

```text
V1.1
```

---

# 101. Phase 14 — Financial Hardening

Antes de considerar el MVP terminado, ejecutar una fase específica de integridad.

---

# 102. Hardening Areas

```text
money precision

rounding

timezone

ownership

concurrency

idempotency

voiding

refund handling

overdue rules

financial reporting classification
```

---

# 103. Ownership Tests

Intentar:

```text
user A accesses account B

user A pays debt B

user A references category B
```

Todo debe fallar.

---

# 104. Concurrency Tests

Especialmente:

```text
two debt payments simultaneously

same scheduled transaction posted twice
```

---

# 105. Monetary Tests

```text
100 / 3

large amounts

six-decimal DB precision

zero amount rejection

negative amount rejection
```

---

# 106. Date Tests

```text
month end

Jan 31

February

leap year

year end

timezone boundaries
```

---

# 107. Phase 15 — UX Hardening

Después de corrección financiera:

```text
empty states

loading states

error states

mobile layouts

keyboard navigation

accessible forms

confirmation dialogs
```

---

# 108. Empty Dashboard

Un usuario nuevo no debe ver:

```text
$0 everywhere
```

sin orientación.

Mostrar un onboarding simple:

```text
1. Create your first account
2. Set opening balance
3. Add your first transaction
4. Add a debt if you have one
```

---

# 109. Fast Entry

Registrar un gasto debe requerir pocos pasos.

Ideal:

```text
amount
account
category
description
```

con defaults razonables.

---

# 110. Mobile Priority

Finanzas personales tendrán uso frecuente desde móvil.

Priorizar responsive design desde el inicio.

---

# 111. Navigation V1

Propuesta:

```text
Dashboard

Transactions

Accounts

Debts

Planning

Budgets
```

---

# 112. Planning Section

Agrupa:

```text
Upcoming

Scheduled

Recurring
```

---

# 113. Phase 16 — Observability

Antes de producción:

```text
structured logging

request IDs

error tracking

health endpoints

worker health

DB health
```

---

# 114. Sensitive Data Logging

Nunca loggear por defecto:

```text
full transaction descriptions

complete financial history

auth tokens

bank-like secrets
```

---

# 115. Phase 17 — Production Deployment

Railway layout:

```text
Railway Project
├── web
├── worker
├── postgres
└── redis
```

Worker y Redis pueden activarse cuando reminders/recurrence lo requieran.

---

# 116. Deployment MVP Minimal

Primer deployment puede ser:

```text
web
+
postgres
```

si:

```text
recurring generation
reminders
```

se resuelven inicialmente desde web/cron compatible.

---

# 117. Deployment Full MVP

Con automation:

```text
web

worker

postgres

redis
```

---

# 118. Environment Variables

Ejemplos:

```text
DATABASE_URL

BETTER_AUTH_SECRET

BETTER_AUTH_URL

APP_URL

REDIS_URL
```

AI/storage solo si se activan:

```text
OPENROUTER_API_KEY

S3_ENDPOINT

S3_BUCKET

S3_ACCESS_KEY_ID

S3_SECRET_ACCESS_KEY
```

---

# 119. AI In MVP

AI no es necesaria para validar el core del producto.

Recomendación:

```text
AI = V1.1
```

---

# 120. Why AI Later

Primero debemos asegurar:

```text
correct balances

correct debts

correct payments

correct projections
```

Después agregar:

```text
categorization suggestions

insights

merchant normalization
```

---

# 121. Storage In MVP

S3 tampoco es obligatorio para core.

Se activa cuando implementemos:

```text
attachments

receipts

imports
```

---

# 122. Recommended Implementation Order

Orden final:

```text
0. Bootstrap

1. Accounts

2. Categories

3. Transactions

4. Transfers

5. Debts

6. Debt Payments

7. Upcoming Payments

8. Scheduled Transactions

9. Recurring Transactions

10. Dashboard

11. Cashflow Projection

12. Budgets

13. Reminders

14. Financial Hardening

15. UX Hardening

16. Observability

17. Production Deployment
```

---

# 123. Why Debt Before Dashboard

El dashboard depende de:

```text
balances
+
debt
+
future obligations
```

Implementarlo demasiado temprano produciría métricas incompletas.

---

# 124. Why Recurrence Before Cashflow

Cashflow necesita:

```text
future events
```

Por eso:

```text
scheduled
+
recurring
```

deben existir antes.

---

# 125. Why Budgets After Cashflow

Budget es importante, pero no define la integridad financiera central.

Core priority:

```text
money
debt
obligations
cashflow
```

---

# 126. Vertical Slice 1

Primer slice funcional completo:

```text
Authentication
+
Account
+
Income/Expense
+
Balance
```

---

# 127. Vertical Slice 1 Demo

Usuario:

```text
creates Bank account
```

con:

```text
opening balance = 1000
```

registra:

```text
salary +500

food -100
```

dashboard básico muestra:

```text
balance 1400
```

---

# 128. Vertical Slice 2

```text
Multiple Accounts
+
Transfers
```

---

# 129. Vertical Slice 3

```text
Debt
+
Installments
+
Payments
```

---

# 130. Vertical Slice 4

```text
Scheduled
+
Recurring
+
Upcoming
```

---

# 131. Vertical Slice 5

```text
Dashboard
+
Cashflow
+
Budgets
```

---

# 132. Feature Definition of Done

Una feature no está terminada solo porque existe UI.

Debe incluir:

```text
schema

migration

domain validation

ownership validation

application service

UI

error handling

tests
```

---

# 133. Financial Feature DoD

Además debe incluir:

```text
money precision tests

recalculation behavior

reporting impact

projection impact

historical behavior
```

cuando corresponda.

---

# 134. Repository Rule

No acceder directamente a Drizzle desde componentes React.

Flujo:

```text
UI
↓
Server Action / Handler
↓
Application Service
↓
Repository / Query
↓
Database
```

---

# 135. Finance Engine Rule

Cálculos:

```text
UI
X
DB query scattered logic
X
```

Preferir:

```text
Application Service
↓
Finance Engine
```

---

# 136. Validation Rule

Todo input externo pasa por:

```text
Zod
```

antes del dominio.

---

# 137. Transaction Boundary Rule

Operaciones multi-entidad deben usar DB transaction.

Especialmente:

```text
Transfer

Debt Payment

Scheduled Posting
```

---

# 138. Testing Pyramid

V1:

```text
many finance unit tests

repository integration tests

application-service tests

few high-value E2E flows
```

---

# 139. Critical E2E Flow 1

```text
register
↓
create account
↓
add income
↓
add expense
↓
verify balance
```

---

# 140. Critical E2E Flow 2

```text
create two accounts
↓
transfer
↓
verify both balances
↓
verify total unchanged
```

---

# 141. Critical E2E Flow 3

```text
create debt
↓
generate installments
↓
pay partially
↓
verify remaining
↓
pay rest
↓
verify installment paid
```

---

# 142. Critical E2E Flow 4

```text
create scheduled salary
↓
create recurring rent
↓
open cashflow
↓
verify projection
```

---

# 143. Critical E2E Flow 5

```text
create monthly budget
↓
record expenses
↓
record refund
↓
verify remaining budget
```

---

# 144. MVP Completion Criteria

El MVP está listo cuando un usuario real puede:

```text
create accounts

record income and expenses

move money between accounts

create debts

configure installments

record partial/full debt payments

see upcoming obligations

schedule future money

configure recurring money

see current balance

see outstanding debt

see estimated spendable money

see 30-day cashflow

use basic budgets
```

sin inconsistencias financieras conocidas.

---

# 145. Technical Completion Criteria

Debe pasar:

```text
pnpm lint

pnpm typecheck

pnpm test

pnpm build
```

---

# 146. Database Completion Criteria

Debe existir:

```text
migration from empty DB

seed/dev data

rollback/recovery strategy

indexes for core queries
```

---

# 147. Security Completion Criteria

Debe verificarse:

```text
authentication

ownership

server-only secrets

input validation

authorization on every private mutation
```

---

# 148. Production Completion Criteria

Debe existir:

```text
health endpoint

error visibility

backup strategy

migration deployment process

environment validation

deployment documentation
```

---

# 149. Product Validation Before V1.1

Antes de agregar muchas features, observar:

```text
Do users register expenses?

Do users create debts?

Do they check upcoming payments?

Do they understand spendable money?

Do they return to the dashboard?

Do they use cashflow?
```

---

# 150. Avoid Premature Features

No avanzar rápidamente a:

```text
AI

OCR

bank sync

investments

advanced charts
```

si el core todavía no genera uso recurrente.

---

# 151. MVP Success Signal

Una señal fuerte de valor sería:

```text
user returns before payment dates
```

para revisar:

```text
upcoming obligations
+
available cash
+
cashflow
```

---

# 152. Documentation Rule After MVP Roadmap

A partir de este punto:

```text
do not create architecture documents by anticipation
```

Crear solo:

```text
vertical slice specs

ADRs when a real architecture decision appears

feature specs for complex flows
```

---

# 153. Next Implementation Document

El siguiente documento será:

```text
docs/06-accounts-transactions-vertical-slice.md
```

Debe especificar el primer slice real:

```text
Authentication context

Accounts

Categories

Income

Expenses

Balances

Transaction list

Dashboard starter
```

incluyendo:

```text
routes

UI screens

server actions

repositories

finance functions

validation schemas

tests

acceptance criteria
```

---

# 154. Implementation Starts After 06

Después de:

```text
docs/06-accounts-transactions-vertical-slice.md
```

la recomendación es comenzar código.

Los siguientes documentos se crearán únicamente cuando el slice correspondiente vaya a implementarse.

---

# 155. Final MVP Principle

El MVP no necesita saber todo sobre las finanzas del usuario.

Necesita hacer extremadamente bien esto:

```text
Know what exists.

Know what was spent.

Know what is owed.

Know what is due.

Know what happens next.
```
