# Accounts & Transactions Vertical Slice

## 1. Objetivo

Este documento define el primer vertical slice implementable de la aplicación de finanzas personales.

El slice debe permitir que un usuario:

```text id="tclbxe"
se registre

inicie sesión

cree una cuenta financiera

defina un saldo inicial

cree categorías

registre ingresos

registre gastos

vea el saldo actualizado

consulte movimientos recientes
```

El objetivo es completar un flujo funcional de punta a punta:

```text id="lexcir"
Auth
↓
Account
↓
Transaction
↓
Balance
↓
Dashboard
```

---

# 2. Alcance

Incluye:

```text id="6lydai"
Authentication

User preferences básicas

Accounts

Opening balances

Categories

Income transactions

Expense transactions

Transaction list

Transaction detail

Basic account balance

Basic dashboard
```

No incluye todavía:

```text id="62t0o4"
Transfers

Debts

Installments

Debt payments

Scheduled transactions

Recurring transactions

Budgets

Cashflow projections

AI

CSV imports
```

---

# 3. Definition of Success

El slice está terminado cuando un usuario puede realizar:

```text id="ggcd11"
Register
↓
Create Bank Account
↓
Opening Balance = 1,000
↓
Add Income = 500
↓
Add Expense = 200
↓
Dashboard Balance = 1,300
```

sin editar manualmente el saldo.

---

# 4. Arquitectura

Flujo general:

```text id="aj40au"
React UI

↓

Server Action / Route Handler

↓

Zod Input Validation

↓

Application Service

↓

Finance Domain Logic

↓

Repository

↓

PostgreSQL
```

---

# 5. Package Boundaries

Responsabilidades:

```text id="rfuk9e"
apps/web
→ presentation + Next.js integration

packages/db
→ persistence + repositories + queries

packages/finance
→ deterministic financial rules

packages/validation
→ shared validation primitives

packages/auth
→ authentication integration
```

---

# 6. Proposed Repository Structure

```text id="21d1hw"
apps/web/
└── src/
    ├── app/
    │   ├── (auth)/
    │   │   ├── login/
    │   │   └── register/
    │   │
    │   └── (app)/
    │       ├── layout.tsx
    │       ├── dashboard/
    │       ├── accounts/
    │       └── transactions/
    │
    ├── features/
    │   ├── accounts/
    │   │   ├── actions/
    │   │   ├── components/
    │   │   ├── queries/
    │   │   └── schemas/
    │   │
    │   ├── categories/
    │   │   ├── actions/
    │   │   ├── components/
    │   │   └── schemas/
    │   │
    │   └── transactions/
    │       ├── actions/
    │       ├── components/
    │       ├── queries/
    │       └── schemas/
    │
    └── lib/
```

---

# 7. Finance Package Structure

```text id="wlf7t8"
packages/finance/
└── src/
    ├── money/
    │   ├── money.ts
    │   ├── currency.ts
    │   └── rounding.ts
    │
    ├── accounts/
    │   ├── account-types.ts
    │   └── calculate-balance.ts
    │
    ├── transactions/
    │   ├── transaction-types.ts
    │   ├── classify-transaction.ts
    │   └── transaction-rules.ts
    │
    └── index.ts
```

---

# 8. Database Scope

Tablas requeridas inicialmente:

```text id="btm01k"
users

accounts

categories

transactions
```

Las tablas de Better Auth pueden coexistir con `users` o proveer la identidad base según integración elegida.

---

# 9. User Financial Preferences

El usuario debe tener como mínimo:

```text id="uxm9rk"
timezone

baseCurrency
```

Defaults iniciales razonables pueden definirse en onboarding.

---

# 10. Default Timezone

No inferir silenciosamente una timezone permanente del servidor.

La aplicación puede sugerir timezone desde browser y permitir confirmarla.

---

# 11. Base Currency

Durante onboarding:

```text id="do56je"
Select base currency
```

Ejemplos:

```text id="g8ffwt"
ARS

USD

EUR
```

---

# 12. Account Entity

Campos necesarios:

```text id="3slkfh"
id

userId

name

type

currencyCode

openingBalance

openingDate

status

createdAt

updatedAt

archivedAt?
```

---

# 13. Supported Account Types

Para este slice:

```text id="p3u6qc"
CASH

BANK

DIGITAL_WALLET

SAVINGS
```

No incluir todavía:

```text id="0hkbvw"
CREDIT_CARD
```

porque requiere semántica de liability.

---

# 14. Account Create Input

```ts id="3iy1da"
{
  name: string
  type: "CASH" | "BANK" | "DIGITAL_WALLET" | "SAVINGS"
  currencyCode: string
  openingBalance: DecimalInput
  openingDate: LocalDate
}
```

---

# 15. Account Validation

Validar:

```text id="23a5r2"
name not empty

supported type

valid currency code

valid money amount

valid date
```

---

# 16. Opening Balance Semantics

El saldo inicial representa:

```text id="8fz36i"
known balance at openingDate
```

No crear automáticamente una transacción `INCOME` por saldo inicial.

Así evitamos inflar ingresos históricos.

---

# 17. Account Balance Formula

Para este slice:

```text id="0yso8s"
balance
=
openingBalance
+
posted incomes
-
posted expenses
+
adjustments
```

Aunque adjustments todavía no tengan UI.

---

# 18. Account Balance Function

Función pura conceptual:

```ts id="q53fjn"
calculateAssetAccountBalance({
  openingBalance,
  transactions,
})
```

---

# 19. Transaction Scope

Tipos soportados:

```text id="2x57dq"
INCOME

EXPENSE
```

---

# 20. Transaction Entity

Campos:

```text id="mvvt8h"
id

userId

accountId

type

status

amount

currencyCode

description

merchant?

categoryId?

occurredAt

postedAt

source

notes?

createdAt

updatedAt

voidedAt?
```

---

# 21. Default Transaction Status

Las transacciones creadas manualmente en este slice nacen como:

```text id="wj0whh"
POSTED
```

---

# 22. Default Transaction Source

```text id="2vqns9"
MANUAL
```

---

# 23. Transaction Amount

Siempre:

```text id="1hddld"
amount > 0
```

El tipo define dirección.

Ejemplo:

```text id="ovzi7b"
EXPENSE amount=100
```

No:

```text id="xtor5q"
EXPENSE amount=-100
```

---

# 24. Currency Invariant

Debe cumplirse:

```text id="y4rrvk"
transaction.currencyCode
=
account.currencyCode
```

en este slice.

---

# 25. Create Income Input

```ts id="dw1cy0"
{
  accountId: string
  amount: DecimalInput
  description: string
  categoryId?: string
  occurredAt: DateTimeInput
  notes?: string
}
```

---

# 26. Create Expense Input

```ts id="i607om"
{
  accountId: string
  amount: DecimalInput
  description: string
  merchant?: string
  categoryId?: string
  occurredAt: DateTimeInput
  notes?: string
}
```

---

# 27. Transaction Ownership Validation

Antes de crear:

```text id="0rk0vj"
account.userId = currentUser.id
```

Si existe category:

```text id="i74avm"
category.userId = currentUser.id
```

---

# 28. Transaction Creation Flow

```text id="01ljqg"
validate input

↓

authenticate user

↓

load account with ownership filter

↓

load category if present

↓

validate currency and category compatibility

↓

create POSTED transaction

↓

return transaction
```

---

# 29. No Balance Mutation

Al crear una transacción:

```text id="k3br26"
do not update accounts.balance
```

El balance se deriva.

---

# 30. Category Entity

Campos:

```text id="wi2cw7"
id

userId

name

type

parentId?

status

createdAt

updatedAt

archivedAt?
```

---

# 31. Category Types

```text id="ruze58"
INCOME

EXPENSE
```

Mantenerlo simple en este slice.

---

# 32. Default Categories

Podemos crear categorías por defecto durante onboarding.

Expense:

```text id="d6914k"
Vivienda

Alimentos

Transporte

Salud

Educación

Entretenimiento

Servicios

Suscripciones

Otros
```

Income:

```text id="6b2xnr"
Sueldo

Trabajo independiente

Otros ingresos
```

---

# 33. Category Strategy

Recomendación:

crear estas categorías como:

```text id="hk2jy5"
user-owned rows
```

No como catálogo global compartido.

Eso permite editarlas sin lógica híbrida.

---

# 34. Category Creation Input

```ts id="9yuxov"
{
  name: string
  type: "INCOME" | "EXPENSE"
  parentId?: string
}
```

---

# 35. Category Compatibility

Una:

```text id="it0pwc"
EXPENSE transaction
```

no debe usar una categoría `INCOME`.

Y viceversa.

---

# 36. Category Archive

Permitir archivar.

Una categoría archivada:

```text id="f0uwwz"
remains visible on historical transactions
```

pero no aparece por defecto al crear nuevas.

---

# 37. Account Repository

Interface conceptual:

```ts id="a45hpl"
interface AccountRepository {
  findByIdForUser(accountId, userId)
  listForUser(userId)
  create(input)
  updateMetadata(...)
  archive(...)
}
```

---

# 38. Transaction Repository

```ts id="oymvsf"
interface TransactionRepository {
  findByIdForUser(transactionId, userId)
  create(input)
  listForUser(filters)
  void(...)
}
```

---

# 39. Category Repository

```ts id="sf7935"
interface CategoryRepository {
  listForUser(userId, type?)
  findByIdForUser(categoryId, userId)
  create(input)
  archive(...)
}
```

---

# 40. Balance Query

No cargar necesariamente todos los movimientos en memoria.

DB puede realizar agregación de montos:

```text id="yvd9c8"
sum income

sum expense
```

y finance engine combina valores exactos.

---

# 41. Balance Query Contract

Conceptualmente:

```ts id="xv7tzj"
{
  openingBalance
  incomeTotal
  expenseTotal
  adjustmentNet
}
```

---

# 42. Balance Result

```ts id="hbf4va"
{
  accountId
  balance
  currency
  calculatedAt
}
```

---

# 43. Account List Query

Debe devolver:

```text id="rcp9tk"
account metadata

current balance
```

sin hacer N+1 queries por cuenta.

---

# 44. Suggested SQL Shape

Utilizar agregación agrupada por:

```text id="0tuxga"
account_id
```

para todos los balances visibles.

---

# 45. Transactions List

Ruta:

```text id="zunjww"
/transactions
```

Debe mostrar:

```text id="tu1shx"
date

description

category

account

amount

type
```

---

# 46. Transactions List Ordering

Default:

```text id="2l7uy7"
occurredAt DESC
```

con secondary ordering:

```text id="po4pgk"
createdAt DESC
```

---

# 47. Transaction Filters V1

```text id="9l1gn4"
dateFrom

dateTo

accountId

categoryId

type
```

---

# 48. Pagination

No cargar historial ilimitado.

Puede usarse:

```text id="hw8d3m"
cursor pagination
```

o paginación tradicional.

Para V1, cualquiera de las dos es válida mientras sea consistente.

---

# 49. Transaction Detail

Ruta:

```text id="zt9j78"
/transactions/[transactionId]
```

Mostrar:

```text id="9kypak"
type

amount

account

category

description

merchant

occurred date

created date

source

notes
```

---

# 50. Edit Transaction

Este slice permite inicialmente editar:

```text id="jqwsg7"
description

merchant

category

notes
```

---

# 51. Amount / Account Editing

Recomendación:

no incluir en primera iteración del slice.

Modificar:

```text id="hezybq"
amount

account

financial date
```

requiere tratamiento más cuidadoso.

Puede incorporarse inmediatamente después del core.

---

# 52. Void Transaction

Debe existir acción:

```text id="9jjd4c"
Void Transaction
```

con confirmación.

---

# 53. Void Behavior

Actualizar:

```text id="ytkjgp"
status = VOIDED
voidedAt = now
```

La transacción deja de afectar balance.

---

# 54. Restore Voided

No necesario en primera iteración.

Podemos añadir más adelante.

---

# 55. Account Pages

Rutas:

```text id="u0km28"
/accounts

/accounts/new

/accounts/[accountId]
```

---

# 56. Accounts List UI

Cada card/row:

```text id="1jy6nb"
Account Name

Account Type

Currency

Current Balance
```

---

# 57. New Account UI

Campos:

```text id="lpv931"
Name

Type

Currency

Opening Balance

Opening Date
```

---

# 58. Account Detail UI

Mostrar:

```text id="js8670"
Account Name

Current Balance

Opening Balance

Recent Transactions
```

Actions:

```text id="j06uv4"
Add Income

Add Expense

Edit

Archive
```

---

# 59. Category Management UI

Puede vivir en:

```text id="2epxj8"
/settings/categories
```

o inicialmente en dialogs inline.

Recomendación:

```text id="geab3q"
/settings/categories
```

para mantener forms de transacción simples.

---

# 60. Quick Transaction Entry

Una acción global:

```text id="on72a2"
Add Transaction
```

debe estar disponible desde:

```text id="ybmjwe"
Dashboard

Transactions

Account Detail
```

---

# 61. Transaction Form Mode

Primero elegir:

```text id="4xeyp4"
Expense

Income
```

o usar un segmented control.

---

# 62. Expense Form

Campos principales:

```text id="5nqbts"
Amount

Account

Category

Description

Date
```

Opcionales:

```text id="3zefnl"
Merchant

Notes
```

---

# 63. Income Form

Campos:

```text id="gk5am5"
Amount

Account

Category

Description

Date

Notes
```

---

# 64. Form Defaults

Usar defaults útiles:

```text id="8tmkwf"
last used account

today

last/common category if appropriate
```

sin introducir automatización difícil de explicar.

---

# 65. Dashboard Scope

Ruta:

```text id="in4byc"
/dashboard
```

Este dashboard todavía es parcial.

---

# 66. Dashboard V0 Metrics

Mostrar:

```text id="sx8h2u"
Total Liquid Balance

Income This Month

Expenses This Month

Recent Transactions
```

No mostrar todavía:

```text id="1lrn1x"
Debt

Spendable

Upcoming Obligations

Cashflow
```

hasta que existan esas entidades.

---

# 67. Total Liquid Balance

Para todas las cuentas activas del slice:

```text id="11je5r"
sum balances per currency
```

---

# 68. Multi-Currency Dashboard

Si existen monedas distintas:

mostrar separado:

```text id="b46v32"
ARS $...

USD $...
```

No producir un total falso.

---

# 69. Monthly Income

Usar transacciones:

```text id="v1v0gd"
POSTED

type = INCOME

occurredAt inside user's current month
```

---

# 70. Monthly Expenses

Usar:

```text id="3dr36a"
POSTED

type = EXPENSE

occurredAt inside user's current month
```

---

# 71. User Timezone

El rango mensual debe calcularse según:

```text id="9uk7mo"
user.timezone
```

No según UTC puro.

---

# 72. Recent Transactions

Dashboard muestra por ejemplo:

```text id="w9663a"
latest 5
```

movimientos.

---

# 73. Empty Dashboard

Si no existen cuentas:

mostrar CTA:

```text id="we7tyc"
Create your first account
```

---

# 74. Empty Account

Si existe cuenta sin movimientos:

```text id="nrn5q4"
Your opening balance is $X.

Add your first income or expense.
```

---

# 75. Application Services

Crear casos de uso claros.

Ejemplos:

```text id="dx8w41"
CreateAccount

CreateCategory

CreateIncomeTransaction

CreateExpenseTransaction

VoidTransaction

GetAccountOverview

GetDashboardSummary

ListTransactions
```

---

# 76. CreateAccount Service

Responsabilidades:

```text id="7nxmqv"
validate user

normalize currency

validate opening amount

persist account
```

No debe conocer React.

---

# 77. CreateExpense Service

Responsabilidades:

```text id="908xa9"
validate account ownership

validate category ownership/type

validate amount

validate currency

persist POSTED expense
```

---

# 78. GetAccountOverview Service

Devuelve:

```ts id="ru5sfa"
{
  account
  balance
  recentTransactions
}
```

---

# 79. GetDashboardSummary

Devuelve:

```ts id="kk04yl"
{
  balancesByCurrency
  monthlyIncomeByCurrency
  monthlyExpensesByCurrency
  recentTransactions
}
```

---

# 80. Server Actions

Propuesta:

```text id="8cxv4r"
features/accounts/actions/create-account.ts

features/categories/actions/create-category.ts

features/transactions/actions/create-income.ts

features/transactions/actions/create-expense.ts

features/transactions/actions/void-transaction.ts
```

---

# 81. Server Action Rules

Cada action:

```text id="3pzz9b"
authenticate

parse with Zod

call application service

map domain error

revalidate relevant paths
```

---

# 82. No Business Logic in Actions

Evitar:

```text id="g6p0kt"
if expense then subtract
if income then add
```

dentro de Server Actions.

Eso pertenece al finance/application layer.

---

# 83. Zod Schemas

Propuesta:

```text id="rc4v9c"
createAccountSchema

createCategorySchema

createIncomeSchema

createExpenseSchema

transactionFiltersSchema
```

---

# 84. Decimal Input Validation

La UI envía montos como:

```text id="uvfq12"
string
```

Ejemplo:

```text id="81gnsu"
"1234.50"
```

No como float ya procesado.

---

# 85. Money Parsing

Pipeline:

```text id="trlzzn"
string input
↓
validated decimal
↓
Money
↓
DB numeric
```

---

# 86. Localization

La UI puede mostrar:

```text id="bk7s7y"
1.234,50
```

según locale.

Pero la capa de parsing debe distinguir presentación de representación canónica.

---

# 87. Database Migration 001

Crear:

```text id="7k0xdl"
users/preferences integration

accounts

categories

transactions
```

más enums requeridos.

---

# 88. Migration Constraints

Agregar:

```text id="jmqlen"
FKs

amount > 0

valid account status

valid transaction type/status

indexes
```

---

# 89. Indexes

Mínimo:

```text id="yvq39z"
accounts(user_id, status)

categories(user_id, status)

transactions(user_id, occurred_at DESC)

transactions(account_id, occurred_at DESC)

transactions(user_id, category_id)
```

---

# 90. Seed Data

Dev seed opcional:

```text id="9j5ye8"
demo user

cash account

bank account

sample categories

sample transactions
```

No ejecutar seed de demo automáticamente en producción.

---

# 91. Testing Layers

Necesitamos:

```text id="0pynwv"
finance unit tests

repository integration tests

application service tests

small E2E suite
```

---

# 92. Money Unit Tests

Casos:

```text id="bexrh0"
exact add

exact subtract

currency mismatch

zero formatting

large amount
```

---

# 93. Balance Unit Tests

```text id="be2860"
opening only

opening + income

opening - expense

multiple transactions

voided excluded
```

---

# 94. Example Balance Test

```text id="upkbp2"
opening = 1000

income = 500

expense = 200

voided expense = 300

expected = 1300
```

---

# 95. Repository Tests

Verificar:

```text id="hlyxl9"
ownership filters

transaction ordering

category filtering

account filtering

voided exclusions where required
```

---

# 96. Application Tests — Create Expense

Casos:

```text id="qwhrwn"
success

account not owned

category not owned

income category used for expense

zero amount

currency mismatch
```

---

# 97. Application Tests — Create Account

Casos:

```text id="s74akl"
success

invalid currency

invalid opening amount

missing name
```

---

# 98. E2E Critical Flow

```text id="udkogd"
Register

Create account:
Bank
Opening 1000

Create income:
Salary +500

Create expense:
Food -200

Open dashboard

Expected balance:
1300
```

---

# 99. E2E Ownership Flow

Con usuarios A y B:

```text id="pt42qn"
A cannot view B account

A cannot create transaction in B account

A cannot use B category
```

---

# 100. Error Codes

Application/domain errors iniciales:

```text id="xswn7v"
ACCOUNT_NOT_FOUND

CATEGORY_NOT_FOUND

CATEGORY_TYPE_MISMATCH

CURRENCY_MISMATCH

INVALID_AMOUNT

ACCOUNT_ARCHIVED

TRANSACTION_NOT_FOUND

TRANSACTION_ALREADY_VOIDED
```

---

# 101. UI Error Mapping

Ejemplo:

```text id="xdt8fa"
CATEGORY_TYPE_MISMATCH
```

→

```text id="aw9l86"
Esta categoría no corresponde a un gasto.
```

---

# 102. Loading States

Agregar:

```text id="on2qnh"
loading.tsx
```

para rutas relevantes si aporta valor.

---

# 103. Error Boundaries

Agregar error handling para:

```text id="lbf2sw"
dashboard

accounts

transactions
```

sin mostrar detalles internos de DB.

---

# 104. Form Submission State

Evitar doble submit.

Botón:

```text id="jj18nn"
disabled while pending
```

---

# 105. Mutation Feedback

Después de guardar:

```text id="qo0sfr"
close dialog or navigate

show success feedback

refresh relevant data
```

---

# 106. Account Archive Rules

No permitir seleccionar una cuenta archivada en nuevas transacciones.

Su historial sigue accesible.

---

# 107. Category Archive Rules

Igual:

```text id="b89i49"
cannot use archived category for new transaction
```

pero sigue apareciendo en movimientos históricos.

---

# 108. Transaction Date Rules

Permitir fechas pasadas.

Permitir fecha actual.

Para este slice:

```text id="6864sz"
future date
```

no debería crear `POSTED Transaction`.

Si es futura, más adelante corresponderá a:

```text id="3uwwnx"
ScheduledTransaction
```

---

# 109. Important Validation

Por lo tanto:

```text id="4wthkc"
occurredAt <= now
```

para nuevas transacciones posted manuales, salvo política explícita de pending transactions.

---

# 110. Opening Date Rule

No bloquear transacciones anteriores al `openingDate` silenciosamente.

Recomendación V1:

```text id="vzjhdk"
transaction.occurredAt >= account.openingDate
```

para preservar significado del opening balance.

---

# 111. Changing Opening Balance

Después de tener transacciones, editar opening balance altera toda la historia.

Recomendación:

permitirlo solo mediante una acción explícita con advertencia, o usar adjustment.

Para primera iteración:

```text id="aadkch"
openingBalance immutable after account creation
```

---

# 112. Changing Opening Date

También debería quedar bloqueada inicialmente una vez que existan movimientos.

---

# 113. Audit Metadata

No necesitamos auditoría empresarial completa.

Pero conservar:

```text id="qb6yv1"
createdAt

updatedAt

voidedAt

source
```

---

# 114. Dashboard Query Performance

El dashboard no debería hacer:

```text id="wi3oar"
one query per account
```

ni cargar todas las transacciones históricas.

Usar queries agregadas.

---

# 115. Account Balance Performance

V1 puede calcular on-demand.

No agregar todavía:

```text id="sqn9gu"
current_balance
```

persistido como verdad.

---

# 116. N+1 Rule

Listas de transacciones deben traer account/category mediante joins o consultas agrupadas eficientes.

---

# 117. Accessibility

Forms necesitan:

```text id="ywsefm"
labels

keyboard navigation

focus states

error association
```

---

# 118. Mobile

En mobile:

```text id="1u4t75"
transaction amount

description

account

category
```

deben ser visibles rápidamente.

---

# 119. Navigation

Sidebar desktop:

```text id="dk0zfr"
Dashboard

Transactions

Accounts
```

y placeholder futuro para:

```text id="qeh8hd"
Debts

Planning

Budgets
```

No mostrar features rotas como navegación activa.

---

# 120. Mobile Navigation

Puede comenzar con:

```text id="e4yfxg"
Dashboard

Transactions

Accounts

More
```

---

# 121. Quick Add Button

En mobile sería útil un:

```text id="qr5q8v"
+
```

para crear rápidamente:

```text id="zsvcb3"
Expense

Income
```

---

# 122. Dashboard Empty State

Primer acceso:

```text id="m65rrs"
Todavía no tenés cuentas.

Creá tu primera cuenta para empezar a organizar tus finanzas.
```

CTA:

```text id="eg1zpk"
Create Account
```

---

# 123. After First Account

Dashboard puede mostrar:

```text id="7dqxjs"
Balance

No transactions yet

Add Income

Add Expense
```

---

# 124. Account Detail Empty State

```text id="7npkda"
No hay movimientos todavía en esta cuenta.
```

Actions:

```text id="bv0foy"
Add Income

Add Expense
```

---

# 125. Transaction List Empty State

```text id="yxfs4c"
Todavía no registraste movimientos.
```

---

# 126. Feature Flags

No hace falta feature flag system complejo para este slice.

Features futuras simplemente no se exponen.

---

# 127. Observability

Loggear:

```text id="ja67yz"
requestId

operation

userId

entityId

success/failure

duration
```

Evitar loggear:

```text id="548hhi"
full notes

complete transaction history
```

---

# 128. Metrics Useful Later

Conceptualmente:

```text id="sm2r5n"
account_created

transaction_created

transaction_voided
```

No necesitamos analytics sofisticado para iniciar.

---

# 129. Security

Todas las mutaciones privadas requieren:

```text id="yv3tpt"
authenticated session
```

---

# 130. Ownership Security

Nunca:

```text id="hr0nkk"
find account by ID
then trust it
```

Preferir:

```text id="h4hn20"
find account
WHERE id = accountId
AND user_id = currentUserId
```

---

# 131. Client Trust Boundary

No confiar en:

```text id="c6ee1c"
userId

currency

category type

ownership
```

enviado desde frontend.

Resolver/verificar server-side.

---

# 132. CSRF / Auth Protection

Seguir mecanismos soportados por la integración de auth y Next.js.

No inventar tokens propios innecesariamente.

---

# 133. Database Transaction Usage

Crear una sola transacción financiera simple no requiere necesariamente una DB transaction multi-step.

Pero si crea relaciones adicionales:

```text id="xlrou0"
transaction tags

splits
```

en el futuro, debe hacerse atómicamente.

---

# 134. No AI Dependency

Este slice debe funcionar completamente sin:

```text id="6v35wb"
OpenRouter
```

---

# 135. No Redis Dependency

Este slice tampoco necesita:

```text id="h4ajxg"
Redis

BullMQ
```

---

# 136. Minimal Deployment

Puede desplegarse inicialmente con:

```text id="gql1yu"
web

postgres
```

---

# 137. Environment Variables

Mínimo:

```text id="z4p60u"
DATABASE_URL

BETTER_AUTH_SECRET

BETTER_AUTH_URL

APP_URL
```

---

# 138. Development Commands

El proyecto debería soportar:

```text id="2k0qp6"
pnpm dev

pnpm db:generate

pnpm db:migrate

pnpm lint

pnpm typecheck

pnpm test

pnpm build
```

---

# 139. Slice Acceptance Checklist

## Authentication

```text id="q37jga"
[ ] Register works
[ ] Login works
[ ] Logout works
[ ] Private routes protected
```

## Accounts

```text id="pkx066"
[ ] Create account
[ ] List accounts
[ ] View account
[ ] Correct derived balance
[ ] Archive account
```

## Categories

```text id="31g32u"
[ ] Default categories
[ ] Create category
[ ] Correct category type validation
[ ] Archive category
```

## Transactions

```text id="ug1um6"
[ ] Create income
[ ] Create expense
[ ] List transactions
[ ] Filter transactions
[ ] View transaction
[ ] Void transaction
```

## Dashboard

```text id="6jd7b6"
[ ] Liquid balances
[ ] Monthly income
[ ] Monthly expenses
[ ] Recent transactions
[ ] Multi-currency separation
```

---

# 140. Financial Acceptance Tests

## Test A — Basic Balance

```text id="dc8pxy"
Opening balance:
1000

Income:
500

Expense:
200

Expected:
1300
```

---

# 141. Test B — Void

```text id="ei7zwh"
Opening:
1000

Expense:
200

Balance:
800

Void expense

Expected:
1000
```

---

# 142. Test C — Multiple Accounts

```text id="dojdl4"
Bank:
1000

Cash:
300

Expected liquid total:
1300
```

---

# 143. Test D — Currency Separation

```text id="sv8mce"
ARS Account:
1,000,000 ARS

USD Account:
1,000 USD
```

Dashboard must not show:

```text id="0xvgkb"
1,001,000
```

as a combined balance.

---

# 144. Test E — Ownership

```text id="w1bl6v"
User A

attempts transaction using
User B account
```

Expected:

```text id="8j4jck"
ACCOUNT_NOT_FOUND
```

or equivalent non-disclosing authorization result.

---

# 145. Test F — Category Mismatch

```text id="2y9e4u"
Expense

category:
Salary / INCOME
```

Expected:

```text id="j4a28g"
CATEGORY_TYPE_MISMATCH
```

---

# 146. Test G — Future Posted Transaction

Create expense dated in future.

Expected:

```text id="oioblj"
validation failure
```

User should later use scheduled transaction functionality.

---

# 147. Test H — Archived Account

Attempt to create expense in archived account.

Expected:

```text id="ipzypa"
ACCOUNT_ARCHIVED
```

---

# 148. Definition of Done

El slice se considera terminado cuando:

```text id="lf5ixx"
a new user can register

create an account

register income

register expense

see correct balance

see correct monthly summary

inspect transaction history

void an incorrect transaction
```

y todos los cálculos permanecen consistentes.

---

# 149. Technical DoD

Debe pasar:

```text id="rf4f4p"
pnpm lint

pnpm typecheck

pnpm test

pnpm build
```

---

# 150. Database DoD

Desde DB vacía:

```text id="3pgsrx"
pnpm db:migrate
```

debe producir un esquema funcional.

---

# 151. Security DoD

Tests deben demostrar:

```text id="oxklpp"
no cross-user account access

no cross-user transaction access

no cross-user category usage
```

---

# 152. UX DoD

Debe funcionar correctamente en:

```text id="phtwo8"
desktop

mobile
```

para los flujos principales.

---

# 153. No More Architecture Before Implementation

Después de este documento:

```text id="y77o9a"
start coding
```

No crear anticipadamente:

```text id="8ox7p5"
07-transfers

08-debts

09-planning
```

hasta que el primer slice esté funcionando.

---

# 154. Next Step

El siguiente paso ya no es otro documento.

Es implementar:

```text id="qvmtkl"
Accounts
+
Categories
+
Transactions
+
Balances
+
Dashboard V0
```

sobre el starter genérico.

Después de completar ese slice, el próximo spec debería cubrir:

```text id="vl3q38"
Transfers
```

y luego:

```text id="lnxn8v"
Debt + Installments + Payments
```
