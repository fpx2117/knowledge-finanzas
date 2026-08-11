# Transfers Vertical Slice

## 1. Objetivo

Este documento define el vertical slice para transferencias entre cuentas propias del usuario.

El objetivo es permitir mover dinero entre cuentas sin:

```text
crear ingreso

crear gasto

alterar el patrimonio total

duplicar movimientos
```

Una transferencia debe conservar esta invariante:

```text
Transfer between owned accounts
does not create income or expense.
```

---

# 2. Alcance

Este slice incluye:

```text
Create Transfer

Transfer Validation

TRANSFER_OUT

TRANSFER_IN

Transfer List Representation

Account Balance Integration

Transaction History Integration

Void / Reverse Transfer

Ownership Validation

Atomic Persistence

Tests
```

No incluye todavía:

```text
Cross-Currency Transfers

Transfer Fees

External Bank Transfers

Transfers Between Users

Scheduled Transfers

Recurring Transfers
```

---

# 3. User Story

Como usuario quiero mover dinero entre mis propias cuentas para que los saldos reflejen dónde está mi dinero sin que la operación aparezca como ingreso o gasto.

Ejemplo:

```text
Banco
$1.000.000

Efectivo
$100.000
```

Transferencia:

```text
Banco → Efectivo
$200.000
```

Resultado:

```text
Banco
$800.000

Efectivo
$300.000

Total Assets
$1.100.000
```

El patrimonio total permanece igual.

---

# 4. Domain Model

La entidad lógica será:

```text
Transfer
```

Campos:

```text
id

userId

fromAccountId

toAccountId

amount

currencyCode

occurredAt

outgoingTransactionId

incomingTransactionId

notes?

createdAt
```

---

# 5. Transfer Legs

Una transferencia crea dos movimientos:

```text
TRANSFER_OUT
```

en la cuenta origen.

Y:

```text
TRANSFER_IN
```

en la cuenta destino.

Conceptualmente:

```text
Transfer
├── outgoing transaction
└── incoming transaction
```

---

# 6. Why Two Transactions

Cada cuenta necesita un movimiento explícito para que:

```text
balance(account)
```

pueda derivarse de su propio ledger.

No debemos tener una transferencia que cambie saldos mágicamente sin transacciones asociadas.

---

# 7. Transaction Types

Agregar:

```text
TRANSFER_OUT

TRANSFER_IN
```

al dominio de transacciones.

---

# 8. Transaction Source

Ambos movimientos deben tener:

```text
source = TRANSFER
```

y:

```text
transferId
```

apuntando a la transferencia lógica.

---

# 9. Preconditions

Antes de crear una transferencia validar:

```text
authenticated user

source account exists

destination account exists

both accounts belong to user

source account active

destination account active

source != destination

amount > 0

same currency in V1
```

---

# 10. Same Account

Esta operación es inválida:

```text
Banco → Banco
```

Debe devolver:

```text
TRANSFER_SAME_ACCOUNT
```

---

# 11. Ownership

Nunca aceptar:

```text
User A account
→
User B account
```

como transferencia personal.

Ambas cuentas deben pertenecer al usuario autenticado.

---

# 12. Currency Invariant

Para V1:

```text
fromAccount.currency
=
toAccount.currency
```

Si no:

```text
CROSS_CURRENCY_TRANSFER_UNSUPPORTED
```

---

# 13. Amount

El monto debe ser:

```text
> 0
```

No usar signo para determinar dirección.

Ejemplo:

```text
amount = 200
```

en ambos legs.

Los tipos:

```text
TRANSFER_OUT

TRANSFER_IN
```

determinan impacto.

---

# 14. Insufficient Balance

La política V1 debe ser explícita.

Recomendación:

para cuentas normales:

```text
do not block transfer solely because calculated balance would become negative
```

porque ciertos usuarios pueden necesitar representar:

```text
overdraft

delayed reconciliation

manual financial corrections
```

Pero la UI debe advertir:

```text
Esta transferencia dejará la cuenta con saldo negativo.
```

---

# 15. Optional Strict Balance Mode

Post-MVP podría existir:

```text
preventNegativeBalance
```

por cuenta.

No implementar en este slice.

---

# 16. Create Transfer Flow

```text
User submits transfer
↓
Authenticate
↓
Validate input
↓
Load both accounts with ownership
↓
Validate currencies
↓
Validate account states
↓
Create transfer + legs atomically
↓
Return result
```

---

# 17. Atomicity

La creación debe ocurrir en una única DB transaction.

Conceptualmente:

```text
BEGIN

create Transfer

create TRANSFER_OUT

create TRANSFER_IN

link both transactions

COMMIT
```

---

# 18. Failure Behavior

Si falla cualquiera de los pasos:

```text
ROLLBACK
```

Nunca debe quedar:

```text
TRANSFER_OUT
```

sin:

```text
TRANSFER_IN
```

o viceversa.

---

# 19. Persistence Order

Como existe una referencia circular lógica:

```text
Transfer
→ outgoingTransactionId
→ incomingTransactionId
```

puede resolverse con:

```text
generate transferId first

insert Transfer shell or IDs

insert transactions

update transfer references
```

dentro de la misma transacción.

Otra opción:

```text
transactions.transferId
```

como vínculo canónico,

y mantener IDs explícitos en Transfer solo si aportan valor.

---

# 20. Recommended V1 Schema

`transfers`:

```text
id UUID PRIMARY KEY

user_id UUID NOT NULL

from_account_id UUID NOT NULL

to_account_id UUID NOT NULL

amount NUMERIC(20,6) NOT NULL

currency_code CHAR(3) NOT NULL

occurred_at TIMESTAMPTZ NOT NULL

notes TEXT

created_at TIMESTAMPTZ NOT NULL
```

`transactions` agrega:

```text
transfer_id UUID NULL
```

---

# 21. Avoid Redundant Transaction IDs

Recomendación V1:

no guardar inicialmente:

```text
outgoing_transaction_id

incoming_transaction_id
```

en `transfers` si podemos recuperar legs mediante:

```text
transfer_id
```

y tipo.

Esto evita referencias duplicadas.

---

# 22. Transfer Constraints

DB:

```text
amount > 0

from_account_id != to_account_id
```

Application layer:

```text
same user

same currency

active accounts
```

---

# 23. Transfer Uniqueness

Cada transfer debe tener exactamente:

```text
1 TRANSFER_OUT

1 TRANSFER_IN
```

Esto puede protegerse mediante una unique constraint conceptual:

```text
UNIQUE(transfer_id, type)
```

para tipos de transferencia.

Si la tabla `transactions` contiene otros tipos, la restricción parcial puede implementarse con índice parcial PostgreSQL o validación transaccional.

---

# 24. Balance Integration

Asset account balance debe considerar:

```text
TRANSFER_IN
```

como:

```text
+ amount
```

y:

```text
TRANSFER_OUT
```

como:

```text
- amount
```

---

# 25. Total Assets Invariant

Para transferencia misma moneda:

```text
AssetTotalBefore
=
AssetTotalAfter
```

---

# 26. Monthly Income

`TRANSFER_IN` no participa de:

```text
Monthly Income
```

---

# 27. Monthly Expense

`TRANSFER_OUT` no participa de:

```text
Monthly Expenses
```

---

# 28. Cashflow Reporting

En un cashflow por cuenta:

```text
TRANSFER_IN
TRANSFER_OUT
```

sí pueden mostrarse.

En cashflow consolidado de todas las cuentas propias:

```text
exclude internal transfers
```

para no inflar entradas/salidas.

---

# 29. Transaction List

La lista de movimientos puede mostrar transfer legs.

Ejemplo cuenta origen:

```text
Transferencia a Efectivo

-$200.000
```

Cuenta destino:

```text
Transferencia desde Banco

+$200.000
```

---

# 30. Global Transaction List

En la lista global existe riesgo de mostrar la misma transferencia dos veces.

Recomendación:

cuando la vista sea consolidada:

```text
collapse transfer legs into one logical row
```

---

# 31. Global Transfer Row

Ejemplo:

```text
Banco → Efectivo

$200.000

Transferencia

08 Ago
```

---

# 32. Account Detail

En detalle de una cuenta sí mostrar el leg correspondiente.

Porque el usuario quiere entender cómo cambió ese saldo.

---

# 33. Transfer Detail

Ruta conceptual:

```text
/transfers/[transferId]
```

Puede mostrar:

```text
Amount

From Account

To Account

Date

Notes

Status
```

No es obligatoria como página separada si el detail puede abrirse desde transaction row.

---

# 34. Create Transfer UI

Acción global:

```text
Transfer
```

Disponible desde:

```text
Accounts

Account Detail

Quick Add
```

cuando el slice esté activo.

---

# 35. Transfer Form

Campos:

```text
From Account

To Account

Amount

Date

Notes
```

---

# 36. Source Account Default

Desde account detail:

```text
fromAccount
```

puede venir preseleccionada.

---

# 37. Destination Selector

No mostrar:

```text
source account
```

como opción de destino.

---

# 38. Currency Display

Después de seleccionar cuenta origen:

```text
ARS
```

debe mostrarse junto al monto.

El selector destino debe mostrar solo cuentas compatibles en V1.

---

# 39. Transfer Preview

Antes de guardar puede mostrarse:

```text
Transferir

$200.000

Banco
→
Efectivo
```

especialmente en mobile.

---

# 40. Balance Warning

Si el balance origen es:

```text
$100.000
```

y el usuario transfiere:

```text
$150.000
```

mostrar:

```text
El saldo de Banco quedará en -$50.000.
```

No bloquear en V1.

---

# 41. Date Rules

Transfer real debe cumplir:

```text
occurredAt <= now
```

Transfer futura pertenecerá después a:

```text
ScheduledTransfer
```

o scheduled financial event.

No incluir en este slice.

---

# 42. Account Opening Date

Validar:

```text
transfer date >= source openingDate

transfer date >= destination openingDate
```

para mantener semántica consistente.

---

# 43. CreateTransfer Input

Conceptualmente:

```ts
{
  fromAccountId: string
  toAccountId: string
  amount: DecimalInput
  occurredAt: DateTimeInput
  notes?: string
}
```

---

# 44. CreateTransfer Service

Crear:

```text
CreateTransfer
```

Responsabilidades:

```text
authenticate caller context

validate ownership

validate account states

validate currencies

validate amount/date

persist transfer atomically
```

---

# 45. Finance Engine

Crear reglas puras en:

```text
packages/finance/src/transfers/
```

Ejemplo:

```text
validateTransfer(...)
```

No necesita DB.

---

# 46. Suggested Finance Structure

```text
packages/finance/src/transfers/
├── validate-transfer.ts
├── transfer-types.ts
└── index.ts
```

---

# 47. Repository

Crear:

```text
TransferRepository
```

con operaciones como:

```text
findByIdForUser

listForUser

createAtomic
```

Sin embargo, la atomicidad puede coordinarla application service mediante transaction-scoped repositories.

---

# 48. No Generic Ledger Mutation

Evitar una abstracción demasiado genérica como:

```text
applyAccountDelta(accountId, amount)
```

porque permitiría cambiar saldo sin transacciones.

Todo cambio debe pasar por ledger entries.

---

# 49. Server Action

Propuesta:

```text
features/transfers/actions/create-transfer.ts
```

Responsabilidades:

```text
authenticate

Zod parse

call CreateTransfer

map errors

revalidate:
dashboard
accounts
transactions
```

---

# 50. Zod Schema

```text
createTransferSchema
```

Debe validar:

```text
fromAccountId UUID

toAccountId UUID

amount decimal string

occurredAt valid date

notes optional
```

---

# 51. Client-Side Validation

Puede detectar:

```text
same selected account

empty amount
```

para UX.

Pero server repite validación.

---

# 52. Error Codes

Agregar:

```text
TRANSFER_SAME_ACCOUNT

TRANSFER_ACCOUNT_NOT_FOUND

TRANSFER_ACCOUNT_ARCHIVED

CROSS_CURRENCY_TRANSFER_UNSUPPORTED

INVALID_TRANSFER_AMOUNT

INVALID_TRANSFER_DATE
```

---

# 53. UI Error Examples

`TRANSFER_SAME_ACCOUNT`:

```text
Elegí dos cuentas diferentes.
```

`CROSS_CURRENCY_TRANSFER_UNSUPPORTED`:

```text
Por ahora solo podés transferir entre cuentas de la misma moneda.
```

---

# 54. Editing Transfers

No implementar edición libre de transferencia en V1.

Cambiar:

```text
amount

accounts

date
```

afecta dos movimientos.

Preferir:

```text
reverse / void
+
create corrected transfer
```

---

# 55. Void vs Reverse

Una transferencia es una operación financiera histórica.

Podemos implementar V1 como:

```text
VOIDED
```

en ambos legs y transfer.

Pero esto puede alterar historia silenciosamente.

---

# 56. Recommended V1 Correction

Para el primer slice:

permitir:

```text
Void Transfer
```

si fue un error de carga.

Debe:

```text
void both legs atomically
```

y mantener historial.

---

# 57. Transfer Status

Agregar conceptualmente:

```text
POSTED

VOIDED
```

a `Transfer` o derivarlo de sus legs.

Recomendación:

guardar:

```text
status
voidedAt?
```

en transfer para consultas simples.

---

# 58. VoidTransfer Service

Flujo:

```text
load transfer with ownership

verify POSTED

load both legs

BEGIN

void transfer

void both legs

COMMIT
```

---

# 59. Void Invariant

Nunca permitir:

```text
one leg VOIDED
other leg POSTED
```

---

# 60. Void Effect

Ejemplo:

Antes:

```text
Bank 800
Cash 300
```

Void:

```text
Bank 1000
Cash 100
```

---

# 61. Account Archive

No permitir crear nueva transferencia desde/hacia:

```text
ARCHIVED
```

accounts.

Pero transferencias históricas siguen visibles.

---

# 62. Deleting Accounts

Una cuenta con transferencias históricas no debe hard-deletearse.

Aplica regla general de archive.

---

# 63. Transaction Detail

Si el usuario abre un transfer leg, mostrar:

```text
Transferencia
```

con vínculo lógico a:

```text
other account
```

---

# 64. Category

Las transferencias no tienen categoría de ingreso/gasto.

No pedir:

```text
category
```

en transfer form.

---

# 65. Merchant

No aplica normalmente.

No pedir merchant.

---

# 66. Dashboard Integration

Dashboard V0:

```text
Liquid Balance
```

debe cambiar por cuenta pero mantener total consolidado.

Ejemplo:

```text
Before:
Bank 1000
Cash 100
Total 1100

After:
Bank 800
Cash 300
Total 1100
```

---

# 67. Monthly Summary Integration

Tras transferencia:

```text
Income This Month
unchanged

Expenses This Month
unchanged
```

---

# 68. Recent Transactions

Decisión UX:

en dashboard global, preferir mostrar:

```text
one logical transfer row
```

en vez de dos legs.

---

# 69. Query Layer

Agregar queries/read models que puedan entender transferencias.

Ejemplos:

```text
listGlobalTransactions
```

puede colapsar transfer legs.

Mientras:

```text
listAccountTransactions
```

muestra el leg.

---

# 70. Read Model

Conceptualmente:

```ts
FinancialActivityItem =
  | TransactionActivity
  | TransferActivity
```

Esto permite que global activity represente correctamente operaciones compuestas.

---

# 71. Do Not Force Everything Into TransactionRow

Si la transferencia necesita:

```text
from account

to account
```

podemos crear:

```text
TransferRow
```

o extender un `FinancialActivityRow` con discriminated union.

Evitar condicionales infinitos.

---

# 72. UI Components

Agregar:

```text
TransferForm

TransferRow

AccountTransferSelect
```

Puede reutilizar:

```text
MoneyInput

DateField

ConfirmDialog
```

---

# 73. Quick Add

Después de este slice:

```text
+
```

puede mostrar:

```text
Expense

Income

Transfer
```

---

# 74. Mobile Flow

Ideal:

```text
Quick Add
↓
Transfer
↓
From
↓
To
↓
Amount
↓
Confirm
```

Debe ser corto.

---

# 75. Accessibility

Selectores de cuenta deben tener labels explícitos:

```text
Cuenta de origen

Cuenta de destino
```

No depender solo de flechas/iconos.

---

# 76. Empty State

Si solo existe una cuenta:

```text
Necesitás al menos dos cuentas para hacer una transferencia.
```

CTA:

```text
Crear otra cuenta
```

---

# 77. Testing Strategy

Necesitamos:

```text
finance unit tests

repository/application integration tests

E2E transfer flow
```

---

# 78. Unit Test — Validation

Caso:

```text
same account
```

Expected:

```text
TRANSFER_SAME_ACCOUNT
```

---

# 79. Unit Test — Currency

```text
Bank ARS
Wallet USD
```

Transfer:

```text
100
```

Expected:

```text
CROSS_CURRENCY_TRANSFER_UNSUPPORTED
```

---

# 80. Integration Test — Atomic Creation

Después de transferir:

```text
exactly one Transfer

exactly one TRANSFER_OUT

exactly one TRANSFER_IN
```

---

# 81. Integration Test — Amount Equality

```text
TRANSFER_OUT.amount
=
TRANSFER_IN.amount
=
Transfer.amount
```

---

# 82. Integration Test — Ownership

User A intenta:

```text
Account A
→
User B Account
```

Expected:

```text
not found / forbidden without disclosure
```

y:

```text
no records created
```

---

# 83. Integration Test — Atomic Failure

Simular error creando segundo leg.

Expected:

```text
no Transfer

no TRANSFER_OUT

no TRANSFER_IN
```

persistidos.

---

# 84. Balance Test

Initial:

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
Bank 800
Cash 300
```

---

# 85. Net Assets Test

Before:

```text
1100
```

After:

```text
1100
```

---

# 86. Monthly Reporting Test

Before transfer:

```text
Income = 500

Expense = 200
```

After transfer:

```text
Income = 500

Expense = 200
```

---

# 87. Void Transfer Test

Create:

```text
200 transfer
```

then void.

Expected balances return to original.

Both legs:

```text
VOIDED
```

Transfer:

```text
VOIDED
```

---

# 88. Concurrent Submission

Dos requests iguales pueden ser producto de double click.

Client debe prevenir submit doble.

Post-MVP o si se detecta riesgo real:

```text
idempotencyKey
```

puede agregarse.

---

# 89. Idempotency Candidate

Podemos preparar el service para aceptar:

```text
idempotencyKey?
```

sin hacerlo obligatorio V1.

No sobrediseñar todavía.

---

# 90. Observability

Loggear:

```text
operation = create_transfer

transferId

userId

fromAccountId

toAccountId

currency

success/failure

duration
```

Evitar loggear notas completas.

---

# 91. Metrics

Posibles:

```text
transfer_created

transfer_voided
```

No son prioritarias para producto inicialmente.

---

# 92. Database Migration

Este slice requiere:

```text
transfers table

TRANSFER_IN transaction type

TRANSFER_OUT transaction type

TRANSFER transaction source

transactions.transfer_id
```

---

# 93. Migration Safety

Si `transaction_type` usa PostgreSQL ENUM, modificarlo requiere migración cuidadosamente revisada.

No editar enum en producción manualmente.

---

# 94. Suggested Database Indexes

```text
transfers(user_id, occurred_at DESC)

transfers(from_account_id, occurred_at DESC)

transfers(to_account_id, occurred_at DESC)

transactions(transfer_id)
```

---

# 95. Foreign Keys

```text
transfers.user_id → users.id

transfers.from_account_id → accounts.id

transfers.to_account_id → accounts.id

transactions.transfer_id → transfers.id
```

---

# 96. Delete Policy

Preferir:

```text
ON DELETE RESTRICT
```

para cuentas/transfers con historial financiero.

---

# 97. Security Checklist

```text
[ ] authenticated only

[ ] source ownership checked

[ ] destination ownership checked

[ ] archived accounts rejected

[ ] same account rejected

[ ] currency checked server-side

[ ] raw userId never trusted
```

---

# 98. Financial Integrity Checklist

```text
[ ] exactly two legs

[ ] both legs same amount

[ ] both legs same currency

[ ] transfer does not affect income

[ ] transfer does not affect expense

[ ] consolidated assets preserved

[ ] both legs persisted atomically

[ ] void affects both legs atomically
```

---

# 99. UI Checklist

```text
[ ] Transfer available in quick add

[ ] From account selector

[ ] To account selector

[ ] Amount input

[ ] Currency displayed

[ ] Date input

[ ] Optional notes

[ ] Negative-balance warning

[ ] Success state

[ ] Validation errors

[ ] Mobile usable
```

---

# 100. E2E Flow

```text
Register

Create Bank
Opening = 1000

Create Cash
Opening = 100

Transfer 200
Bank → Cash

Verify:
Bank = 800
Cash = 300
Total = 1100

Verify:
Income unchanged
Expense unchanged

Void transfer

Verify:
Bank = 1000
Cash = 100
```

---

# 101. Definition of Done

El slice está terminado cuando el usuario puede:

```text
move money between two owned accounts

see correct balances

see the transfer in history

understand where money moved

void an incorrect transfer
```

sin afectar:

```text
income

expenses

net assets
```

---

# 102. Technical Definition of Done

Debe pasar:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

---

# 103. Financial Definition of Done

Debe demostrarse mediante tests:

```text
transfer preserves total assets

transfer has exactly two legs

transfer legs remain consistent

transfer cannot cross ownership

transfer cannot cross currencies in V1

void fully reverses balance effect
```

---

# 104. Scope Boundary

No implementar todavía:

```text
FX

transfer fees

scheduled transfers

recurring transfers

external recipients
```

Estas capabilities requieren nuevas reglas y tendrán specs separadas si se necesitan.

---

# 105. Next Vertical Slice

Después de completar este slice, crear:

```text
docs/12-debts-installments-payments-slice.md
```

Ese documento debe especificar:

```text
Debt Creation

Generated Installments

Manual Installments

Due Dates

Partial Payments

Early Payments

Payment Allocations

Debt Status

Installment Status

Upcoming Debt Obligations
```

y será el siguiente gran bloque financiero del producto.
