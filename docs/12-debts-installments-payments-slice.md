# Debts, Installments & Payments Vertical Slice

## 1. Objetivo

Este documento define el vertical slice para administrar:

```text id="x1zopw"
deudas

cuotas

vencimientos

pagos parciales

pagos completos

pagos anticipados

asignación de pagos

estado pendiente/pagado/vencido
```

El objetivo es que el usuario pueda responder:

```text id="v2plw9"
¿Cuánto debo?

¿Qué cuota vence ahora?

¿Cuánto queda por pagar?

¿Cuánto pagué?

¿Qué pasa si pago parcialmente?
```

---

# 2. Scope

Incluye:

```text id="zv21rm"
Create Debt

Generated Installments

Manual Installments

Installment Preview

Custom Due Dates

Debt Detail

Partial Payments

Full Payments

Early Payments

Multi-Installment Payments

Payment Allocation

Debt Status

Installment Status

Upcoming Debt Obligations

Account Balance Integration

Tests
```

No incluye todavía:

```text id="5x7l7a"
advanced amortization

variable interest rates

mortgage modeling

automatic refinancing

minimum credit-card payment

compound interest engine

principal prepayment recalculation

automatic loan provider integrations
```

---

# 3. Core Domain

La deuda se modela como:

```text id="6l9bmf"
Debt
+
DebtInstallment
+
DebtPayment
+
PaymentAllocation
```

Nunca como una sola transacción.

---

# 4. Debt Entity

Campos principales:

```text id="fi44xb"
id

userId

name

creditor?

type

currencyCode

originalAmount

startDate

status

interestType

interestRate?

notes?

createdAt

updatedAt

cancelledAt?
```

---

# 5. Debt Types

V1:

```text id="c421o1"
PERSONAL_LOAN

PURCHASE_INSTALLMENTS

MONEY_OWED_TO_PERSON

SERVICE_DEBT

OTHER
```

`CREDIT_CARD` puede coexistir conceptualmente, pero el slice de tarjeta completo debería llegar después.

---

# 6. Debt Status

Estados:

```text id="6qd163"
ACTIVE

OVERDUE

PAID

CANCELLED
```

El estado debe derivarse o mantenerse sincronizado con las cuotas.

---

# 7. Installment Entity

```text id="w9xpf6"
DebtInstallment
├── id
├── debtId
├── installmentNumber
├── dueDate
├── principalAmount
├── interestAmount
├── feeAmount
├── totalAmount
├── status
├── createdAt
└── updatedAt
```

---

# 8. Installment Status

```text id="l6d1bk"
PENDING

PARTIALLY_PAID

PAID

OVERDUE

CANCELLED
```

---

# 9. Installment Remaining

Nunca guardar como truth principal:

```text id="cnkqfr"
remainingAmount
```

Debe derivarse:

```text id="9xmapg"
remainingAmount
=
totalAmount
-
SUM(payment allocations)
```

---

# 10. Debt Remaining

```text id="1z0p5x"
debtRemaining
=
SUM(remaining of all non-cancelled installments)
```

---

# 11. originalAmount vs totalPayable

No asumir:

```text id="sp14wp"
originalAmount
=
sum installment totals
```

Ejemplo:

```text id="3qfizo"
Principal
100000

Interest + fees
20000

Total payable
120000
```

`originalAmount` representa valor/principal original.

`totalPayable` puede derivarse de cuotas.

---

# 12. Debt Creation Modes

V1 debe soportar:

```text id="jybegq"
GENERATED_INSTALLMENTS

MANUAL_INSTALLMENTS
```

---

# 13. Generated Installments Input

```ts id="bxmng0"
{
  name: string
  creditor?: string
  type: DebtType
  currencyCode: CurrencyCode
  originalAmount: DecimalInput
  installmentCount: number
  firstDueDate: LocalDate
  frequency: InstallmentFrequency
  totalPayable?: DecimalInput
  notes?: string
}
```

---

# 14. Installment Frequencies

V1:

```text id="0i3m6p"
MONTHLY

WEEKLY

BIWEEKLY
```

`CUSTOM` se resuelve mediante manual installments.

---

# 15. Generated Installment Amount

Si no existen intereses/fees detallados:

```text id="rl57yk"
installment total
=
totalPayable / count
```

usando el motor central de `Money`.

---

# 16. Deterministic Rounding

Ejemplo:

```text id="1nq4ei"
100 / 3
```

Moneda con dos decimales:

```text id="5gc9lt"
33.33
33.33
33.34
```

La última cuota recibe el residuo V1.

---

# 17. Sum Invariant

Siempre:

```text id="p5zbgw"
SUM(installment.totalAmount)
=
totalPayable
```

---

# 18. Installment Date Generation

Para mensual:

```text id="opon4m"
first due date
→ anchor day
```

Ejemplo:

```text id="31j4po"
31 Jan
28 Feb
31 Mar
30 Apr
```

Preservar:

```text id="gfj7mx"
anchorDay = 31
```

---

# 19. Leap Year

Ejemplo:

```text id="tl2o9i"
31 Jan 2028

29 Feb 2028

31 Mar 2028
```

Debe estar cubierto por tests.

---

# 20. Weekly

```text id="uj8qrr"
dueDate + 7 days
```

---

# 21. Biweekly

```text id="hjf8yf"
dueDate + 14 days
```

---

# 22. Installment Preview

Nunca persistir inmediatamente después de generar.

Flujo:

```text id="0e37lx"
Debt Form
↓
Generate Preview
↓
User Reviews
↓
User Adjusts
↓
Confirm
↓
Persist Debt + Installments
```

---

# 23. Preview UI

Ejemplo:

```text id="u724nd"
Cuota 1
15 Sep
$100.000

Cuota 2
15 Oct
$100.000

Cuota 3
15 Nov
$100.000
```

---

# 24. Editable Preview

Antes de confirmar el usuario puede cambiar:

```text id="m0qcxp"
dueDate

amount
```

---

# 25. Manual Installments

Input conceptual:

```ts id="cz1518"
{
  debt: {...},
  installments: [
    {
      dueDate,
      totalAmount
    }
  ]
}
```

---

# 26. Manual Installment Rules

Validar:

```text id="vkb534"
at least 1 installment

all amounts > 0

valid due dates

currency consistent

installment numbers unique/sequential
```

---

# 27. Manual Sum

Para deuda manual:

```text id="4m8ozq"
total payable
=
sum installment totals
```

No forzar que sea igual a `originalAmount` si se documentan intereses o fees implícitos.

---

# 28. Create Debt Atomicity

Persistir en una sola DB transaction:

```text id="mwg856"
BEGIN

create Debt

create Installments

COMMIT
```

Si falla una cuota:

```text id="fj5cx2"
ROLLBACK
```

---

# 29. Debt Application Service

Crear:

```text id="032wkh"
CreateDebt
```

Responsabilidades:

```text id="ymdgs9"
validate ownership context

validate input

invoke installment generator

validate preview/confirmed installments

persist atomically
```

---

# 30. Finance Package

Agregar:

```text id="7k01bc"
packages/finance/src/debt/
```

---

# 31. Suggested Structure

```text id="8a0nhw"
packages/finance/src/debt/
├── generate-installments.ts
├── installment-dates.ts
├── installment-status.ts
├── debt-status.ts
├── allocate-payment.ts
├── debt-types.ts
└── index.ts
```

---

# 32. Pure Functions

Ejemplos:

```ts id="1vg9x3"
generateInstallments(input)

calculateInstallmentRemaining(input)

deriveInstallmentStatus(input)

deriveDebtStatus(input)

allocatePayment(input)
```

No hacen DB writes.

---

# 33. Debt Detail Route

```text id="08lev1"
/debts/[debtId]
```

---

# 34. Debt List Route

```text id="9z2zto"
/debts
```

---

# 35. New Debt Route

```text id="ya51nr"
/debts/new
```

Puede ser una página, no necesariamente modal.

---

# 36. Debt List Card

Mostrar:

```text id="at8w99"
name

creditor

remaining debt

next installment

status
```

Ejemplo:

```text id="6etxz7"
Notebook

Mercado Libre

Pendiente
$600.000

Próxima cuota
$100.000 · 15 Sep
```

---

# 37. Debt Detail Summary

Mostrar:

```text id="cg3dkm"
Original Amount

Total Payable

Paid

Remaining

Next Payment
```

---

# 38. Installment Table

Desktop:

```text id="zn3yyx"
# | Due Date | Total | Paid | Remaining | Status
```

Mobile:

```text id="aej4ab"
Cuota 3

15 Oct

$100.000

Pagado $40.000
Pendiente $60.000

Parcialmente pagada
```

---

# 39. Payment Entity

```text id="2ljfdm"
DebtPayment
├── id
├── userId
├── debtId
├── accountId
├── amount
├── currencyCode
├── paidAt
├── transactionId
├── notes?
└── createdAt
```

---

# 40. Payment Allocation

```text id="t5xxln"
PaymentAllocation
├── id
├── paymentId
├── installmentId
├── amount
└── createdAt
```

---

# 41. Payment Source Account

Todo pago requiere una cuenta asset:

```text id="1ke801"
CASH

BANK

DIGITAL_WALLET

SAVINGS
```

No permitir cuentas archivadas.

---

# 42. Payment Creates Transaction

Registrar pago crea:

```text id="8lxfot"
LIABILITY_PAYMENT
```

en la cuenta origen.

---

# 43. Liability Payment Semantics

`LIABILITY_PAYMENT`:

```text id="8tvmyk"
reduces paying account balance
```

pero no cuenta como nuevo gasto de consumo.

---

# 44. Payment Flow

```text id="2p8zds"
User starts payment
↓
Select account
↓
Enter amount
↓
Choose allocation strategy
↓
Preview allocation
↓
Confirm
↓
Create transaction + payment + allocations
```

---

# 45. Payment Preconditions

Validar:

```text id="hvj90g"
authenticated user

debt belongs to user

account belongs to user

account active

amount > 0

currency matches debt

debt not cancelled

debt remaining > 0
```

---

# 46. Payment Currency

V1:

```text id="bgm9hq"
payment currency
=
debt currency
=
paying account currency
```

Sin FX.

---

# 47. Overpayment

No permitir:

```text id="kmuz2l"
payment.amount > debtRemaining
```

V1.

Error:

```text id="krt0w2"
PAYMENT_EXCEEDS_DEBT_REMAINING
```

---

# 48. Payment Strategies

V1:

```text id="6efkgx"
OLDEST_DUE_FIRST

MANUAL
```

---

# 49. OLDEST_DUE_FIRST

Orden:

```text id="7jay8f"
dueDate ASC

installmentNumber ASC
```

Asignar hasta consumir el pago.

---

# 50. Example

Cuotas:

```text id="76e0de"
#1 remaining 100

#2 remaining 100

#3 remaining 100
```

Pago:

```text id="mxvq2s"
250
```

Resultado:

```text id="1gcz82"
#1 100

#2 100

#3 50
```

---

# 51. Manual Allocation

El usuario decide:

```text id="1ftqpj"
installmentId

allocationAmount
```

por cuota.

---

# 52. Manual Allocation Invariant

Debe cumplirse:

```text id="4h5xv9"
SUM(allocations)
=
payment.amount
```

---

# 53. Allocation Limits

Cada allocation:

```text id="0vpbde"
> 0
```

y:

```text id="8s34pt"
<= installmentRemaining
```

---

# 54. Invalid Allocation

No permitir asignar a:

```text id="eez7fj"
PAID installment

CANCELLED installment
```

---

# 55. Early Payment

Permitido:

```text id="bx8sbg"
paidAt < dueDate
```

---

# 56. Future Installments

También se puede pagar:

```text id="5rrycb"
cuotas futuras
```

sin restricción.

---

# 57. Payment Preview

Antes de persistir:

```text id="j26ocu"
Pago
$250.000

Desde
Banco Nación

Aplicación

Cuota 1
$100.000

Cuota 2
$100.000

Cuota 3
$50.000
```

---

# 58. Payment Atomicity

Debe ocurrir en una única DB transaction:

```text id="xkyiiq"
BEGIN

lock debt/installments

recalculate remaining

validate payment

create LIABILITY_PAYMENT Transaction

create DebtPayment

create PaymentAllocations

derive/update installment statuses

derive/update debt status

COMMIT
```

---

# 59. No External Calls

Dentro de esa transaction no llamar:

```text id="5n163w"
OpenRouter

Mercado Pago

email provider

Redis
```

---

# 60. Concurrent Payment Protection

Dos requests pueden intentar pagar la misma cuota.

Dentro de transaction:

```text id="64fnlx"
lock relevant installment rows
```

o equivalente.

Luego recalcular:

```text id="5qpfbs"
remaining
```

antes de crear allocations.

---

# 61. DebtPayment Repository

Crear:

```text id="mz0kfm"
DebtPaymentRepository
```

o transaction-scoped persistence helpers.

No debe permitir insertar allocations sin validar el agregado.

---

# 62. RecordDebtPayment Service

Crear:

```text id="w5qfxz"
RecordDebtPayment
```

Responsabilidades:

```text id="0hssle"
load debt

load account

lock/installment state

calculate allocation

persist transaction/payment/allocations

update derived statuses
```

---

# 63. Paying Account Balance

V1:

no bloquear necesariamente si el pago deja saldo negativo.

Mostrar warning:

```text id="9uu95r"
Este pago dejará la cuenta con saldo negativo.
```

---

# 64. Installment Status Derivation

Input:

```text id="h62mnj"
total

allocated

dueDate

cancelled

today
```

---

# 65. PAID

```text id="w0ws5h"
remaining = 0
```

→

```text id="zls7cq"
PAID
```

---

# 66. PARTIALLY_PAID

```text id="nqjv8r"
0 < remaining < total
AND dueDate >= today
```

→

```text id="n71fo4"
PARTIALLY_PAID
```

---

# 67. OVERDUE

```text id="8d8tq6"
remaining > 0
AND dueDate < today
```

→

```text id="4m7pd1"
OVERDUE
```

aunque haya pago parcial.

---

# 68. PENDING

```text id="o6ok31"
remaining = total
AND dueDate >= today
```

→

```text id="bffhtg"
PENDING
```

---

# 69. Due Today

```text id="6zw0nu"
dueDate = today
```

no está overdue.

---

# 70. Timezone

`today` se resuelve con:

```text id="5r66cm"
user.timezone
```

---

# 71. Stored vs Effective Status

La fuente real para overdue es:

```text id="67r85y"
dueDate
+
remaining
+
today
```

Si se guarda `status`, tratarlo como:

```text id="mhugzj"
maintained projection
```

No confiar ciegamente si está desactualizado.

---

# 72. Debt Status Derivation

Reglas:

```text id="5ftte9"
if cancelled
→ CANCELLED

else if all non-cancelled installments remaining = 0
→ PAID

else if any installment effective status = OVERDUE
→ OVERDUE

else
→ ACTIVE
```

---

# 73. Status Refresh

Actualizar estados:

```text id="fs7lqf"
after payment

after debt changes

during relevant queries/jobs
```

No depender exclusivamente de cron para mostrar overdue correcto.

---

# 74. Upcoming Debt Obligations

Las cuotas alimentan:

```text id="kzq87k"
Upcoming Payments
```

---

# 75. Obligation Amount

Mostrar:

```text id="9wdowc"
remaining amount
```

no el total original de la cuota.

---

# 76. Obligation Groups

```text id="ej9w0l"
Overdue

Today

Next 7 Days

Later
```

---

# 77. Overdue Row

Mostrar:

```text id="dqnd3y"
debt name

installment number

due date

remaining amount

days overdue
```

---

# 78. Partial Row

Ejemplo:

```text id="1gtujh"
Cuota 4

Total
$100.000

Pagado
$40.000

Pendiente
$60.000
```

---

# 79. Pay Action

Desde:

```text id="idb40a"
Debt Detail

Upcoming Payments
```

debe poder iniciarse:

```text id="ju6bs4"
Pay
```

---

# 80. Single-Installment Payment Shortcut

Desde una cuota:

```text id="460riq"
Pay remaining
```

puede preconfigurar:

```text id="re28vm"
amount = installmentRemaining
manual allocation = this installment
```

---

# 81. Multi-Installment Payment

Desde deuda:

```text id="92t6nm"
Make Payment
```

puede usar:

```text id="nswys5"
OLDEST_DUE_FIRST
```

o manual.

---

# 82. Pay All

Opcional V1:

```text id="fnrd87"
Pay all remaining
```

solo como shortcut que usa el mismo payment engine.

---

# 83. Debt Editing

Después de pagos, editar estructura de deuda libremente puede romper historia.

Política V1:

permitir editar solo:

```text id="nqswnq"
name

creditor

notes
```

sin tratamiento especial.

---

# 84. Installment Editing Before Payments

Si ninguna cuota tiene allocations, permitir modificar:

```text id="48s5o5"
due dates

amounts
```

mediante un flujo controlado.

---

# 85. Installment Editing After Payments

Si ya existen pagos:

```text id="38bpja"
do not allow arbitrary amount reduction below allocated amount
```

Recomendación:

bloquear edición estructural V1 y usar ajustes futuros.

---

# 86. Debt Cancellation

Permitir cancelar deuda solo mediante acción explícita.

No hard delete.

---

# 87. Cancel Debt Behavior

Si deuda no tiene pagos o el usuario confirma:

```text id="rl6rs4"
Debt → CANCELLED

future unpaid installments → CANCELLED
```

Pagos existentes quedan históricos.

---

# 88. Paid Installments on Cancel

No cambiar:

```text id="5knoqn"
PAID
```

a cancelled.

El historial de pagos permanece.

---

# 89. Cancel Warning

Mostrar:

```text id="j8unor"
Cancelar esta deuda eliminará las cuotas pendientes de tus próximos vencimientos, pero conservará el historial de pagos.
```

---

# 90. Correction of Debt Payment

No permitir:

```text id="kl1rqd"
delete payment
```

directamente.

Necesitamos una estrategia de reversión.

---

# 91. Payment Reversal Requirement

Antes de habilitar edición/anulación de pagos en producción, agregar soporte explícito:

```text id="vicw4u"
DebtPayment status
```

o:

```text id="j07ix5"
reversal relation
```

Ejemplo futuro:

```text id="8hqkgx"
POSTED

REVERSED
```

---

# 92. V1 Payment Correction Policy

Para la primera implementación:

```text id="udw1v9"
do not expose payment deletion/editing
```

hasta implementar reversal correctamente.

Esto evita corrupción financiera.

---

# 93. Schema Amendment Recommendation

Agregar a `debt_payments`:

```text id="qqisrn"
status
```

con:

```text id="ywxx0a"
POSTED

REVERSED
```

y opcionalmente:

```text id="mmkt9s"
reversed_at

reversal_transaction_id
```

si se implementa reversión en este slice.

---

# 94. Recommended Scope Decision

Para mantener el slice seguro:

```text id="drit4o"
implement payment creation now

defer payment reversal
```

pero documentar explícitamente que no se puede editar/anular un pago todavía.

---

# 95. Schema Tables

Este slice requiere:

```text id="ssish5"
debts

debt_installments

debt_payments

debt_payment_allocations
```

y en `transactions`:

```text id="qj0cvc"
LIABILITY_PAYMENT
```

---

# 96. Debt Table Constraints

```text id="9wokck"
original_amount > 0

currency required

valid type

valid status
```

---

# 97. Installment Constraints

```text id="5dvkns"
principal_amount >= 0

interest_amount >= 0

fee_amount >= 0

total_amount > 0

UNIQUE(debt_id, installment_number)
```

---

# 98. Payment Constraints

```text id="35vu51"
amount > 0

transaction_id UNIQUE
```

---

# 99. Allocation Constraints

```text id="ehix4b"
amount > 0
```

V1:

```text id="u6m3sa"
UNIQUE(payment_id, installment_id)
```

---

# 100. Indexes

Agregar:

```text id="ykpxia"
debts(user_id, status)

debt_installments(debt_id, due_date)

debt_installments(due_date, status)

debt_payments(debt_id, paid_at)

debt_payment_allocations(installment_id)
```

---

# 101. Ownership

Toda query de deuda debe partir de:

```text id="9o6tsk"
user_id = currentUserId
```

Nunca confiar solo en `debtId`.

---

# 102. Allocation Ownership

Antes de persistir allocations verificar:

```text id="plqrbk"
installment.debtId = payment.debtId
```

y deuda pertenece al usuario.

---

# 103. Payment Account Ownership

También:

```text id="pj2msp"
account.userId = currentUserId
```

---

# 104. Account Balance Integration

`LIABILITY_PAYMENT` en asset account:

```text id="abdmrj"
- amount
```

---

# 105. Monthly Expense Integration

No sumar:

```text id="lkojny"
LIABILITY_PAYMENT
```

a consumption expenses.

---

# 106. Monthly Cashflow Integration

Sí sumar:

```text id="kd0yit"
LIABILITY_PAYMENT
```

como cash outflow.

---

# 107. Dashboard Integration

Agregar gradualmente:

```text id="0jcomn"
Outstanding Debt

Next Debt Payment

Overdue Debt Amount
```

---

# 108. Outstanding Debt

Debe usar:

```text id="vm3v3n"
remaining allocations calculation
```

no `originalAmount`.

---

# 109. Debt Card

Ejemplo:

```text id="9tse6m"
Deuda pendiente

$680.000

Próximo pago
$85.000 · 25 Ago
```

---

# 110. Overdue Card

Solo si hay overdue:

```text id="1ixzp1"
Pagos vencidos

$95.000

2 cuotas
```

---

# 111. Debt List Ordering

Recomendación:

```text id="fj4uev"
OVERDUE first

then next due date

then name
```

---

# 112. Paid Debts

No mezclar por defecto con activas.

Tabs/filters:

```text id="7ixc52"
Active

Paid

Cancelled
```

---

# 113. Debt Form UX

Preferir flujo por pasos:

```text id="bnurki"
1. Debt Details

2. Installment Setup

3. Review

4. Confirm
```

---

# 114. Step 1

Campos:

```text id="nnzf18"
Name

Creditor

Type

Currency

Original Amount

Start Date
```

---

# 115. Step 2

Elegir:

```text id="zq7i65"
Generate Installments

Enter Manually
```

---

# 116. Generated Setup

Campos:

```text id="8eiv3y"
Installment Count

First Due Date

Frequency

Total Payable
```

---

# 117. Manual Setup

Tabla editable:

```text id="b7t5ue"
# | Due Date | Amount
```

con:

```text id="arhtrn"
Add Installment
```

---

# 118. Review

Mostrar:

```text id="n9zle7"
Original Amount

Total Payable

Number of Installments

First Due Date

Last Due Date
```

más lista.

---

# 119. Confirmation

Solo aquí persistir.

---

# 120. Empty Debt State

```text id="5qn86o"
No tenés deudas registradas.

Agregá préstamos, compras en cuotas u otras obligaciones para controlar pagos y vencimientos.

[Add Debt]
```

---

# 121. Payment Form UX

Campos:

```text id="l2bm7s"
Amount

Pay From

Payment Date

Allocation
```

---

# 122. Default Payment Amount

Desde cuota:

```text id="wgh30g"
remaining amount
```

Desde debt detail:

puede sugerir:

```text id="akpcme"
next installment remaining
```

pero editable.

---

# 123. Payment Success

Después de guardar mostrar:

```text id="2p5bx3"
Pago registrado.
```

y actualizar inmediatamente:

```text id="p94g1h"
account balance

debt remaining

installment statuses

upcoming payments
```

---

# 124. No Optimistic Financial State

Evitar optimistic update complejo para pagos financieros.

Preferir:

```text id="f10lbm"
server commit
↓
refresh canonical read model
```

---

# 125. Error Codes

Agregar:

```text id="8kfbn2"
DEBT_NOT_FOUND

DEBT_CANCELLED

DEBT_ALREADY_PAID

INVALID_INSTALLMENT_COUNT

INVALID_INSTALLMENT_AMOUNT

INVALID_INSTALLMENT_DATE

PAYMENT_EXCEEDS_DEBT_REMAINING

PAYMENT_ALLOCATION_MISMATCH

PAYMENT_ALLOCATION_EXCEEDS_INSTALLMENT

INSTALLMENT_NOT_FOUND

INSTALLMENT_NOT_PAYABLE

PAYMENT_CURRENCY_MISMATCH
```

---

# 126. UI Error Example

`PAYMENT_EXCEEDS_DEBT_REMAINING`:

```text id="4r3yzo"
El pago supera el saldo pendiente de la deuda.
```

---

# 127. Allocation Error

```text id="91pv1u"
El total asignado a cuotas debe coincidir con el monto del pago.
```

---

# 128. Date Error

```text id="25n4wp"
La fecha de pago no es válida.
```

---

# 129. Future Payment Date

Un pago real debe cumplir:

```text id="4gvf3p"
paidAt <= now
```

Un pago programado futuro pertenece a Planning.

---

# 130. Debt Start Date

Puede ser histórica.

No debe necesariamente coincidir con primera cuota.

---

# 131. Due Date Ordering

Las cuotas manuales no necesitan fechas estrictamente crecientes para ser técnicamente válidas, pero V1 debería requerir:

```text id="hjskdc"
dueDate non-decreasing by installment number
```

para evitar configuraciones confusas.

---

# 132. Duplicate Due Dates

Permitidas si el usuario realmente tiene varias cuotas el mismo día.

No imponer uniqueness por dueDate.

---

# 133. Payment History

Debt detail debe mostrar:

```text id="7vj4ds"
Payment Date

Amount

Account
```

y opcionalmente:

```text id="3ay9g7"
allocation summary
```

---

# 134. Payment Detail

Post-MVP o V1 si simple:

```text id="j0v4gm"
/debts/[debtId]/payments/[paymentId]
```

Mostrar:

```text id="hi4aqm"
Amount

Account

Date

Allocated Installments
```

---

# 135. Reporting Classification

Debt payments:

```text id="wbwbl7"
economicClass = LIABILITY_SETTLEMENT
```

---

# 136. Loan Proceeds

Crear una deuda no crea automáticamente dinero en una cuenta.

Ejemplo:

```text id="j0ei6z"
Personal Loan
1000000
```

puede haber implicado un ingreso de fondos, pero esto debe registrarse explícitamente como evento separado si corresponde.

---

# 137. Why No Automatic Loan Deposit

Porque una deuda también puede representar:

```text id="tb2y4h"
purchase installments

money owed to person

service debt
```

sin haber recibido efectivo.

---

# 138. Purchase Installments

Crear deuda por compra tampoco debe crear automáticamente:

```text id="fqf95r"
EXPENSE
```

sin definir el flujo de consumo.

V1 puede permitir que el usuario registre la deuda y el gasto original por separado si corresponde.

---

# 139. Reporting Limitation

Hasta que el modelo de origen de deuda esté más conectado:

```text id="6ipsp3"
debt creation
```

no debe contaminar automáticamente:

```text id="krl0zz"
monthly consumption
```

---

# 140. Credit Card Boundary

No reutilizar este slice para implementar toda la lógica de tarjeta.

Sin embargo, el motor de:

```text id="2v747o"
Installments

Payments

Allocations
```

debe ser reusable.

---

# 141. Reminder Integration

No generar reminders todavía si el módulo no existe.

Pero las cuotas deben exponer:

```text id="emrr69"
dueDate

remainingAmount

status
```

para Planning.

---

# 142. Cashflow Integration

Las cuotas futuras se convertirán en:

```text id="q8zkti"
OUTFLOW projection events
```

usando:

```text id="l8z457"
remaining amount
```

---

# 143. Avoid Double Counting Payment

Una cuota futura:

```text id="8dp912"
remaining 100
```

aparece en cashflow.

Cuando se paga:

```text id="az19ej"
LIABILITY_PAYMENT 100
```

la cuota deja de aparecer como futura.

No contar ambos después del pago.

---

# 144. Partial Payment Projection

Cuota:

```text id="mfqf4o"
total 100

paid 40

remaining 60
```

Cashflow futuro:

```text id="d13s3l"
60
```

---

# 145. Tests — Installment Generation

Casos:

```text id="61z64h"
1 installment

3 installments rounding

12 monthly

Jan 31

leap year

weekly

biweekly
```

---

# 146. Test — Rounding

Input:

```text id="kt7w2f"
100

3 installments
```

Expected:

```text id="4fpkl7"
33.33

33.33

33.34
```

---

# 147. Test — Sum

Property:

```text id="2k9hpr"
SUM(generated installments)
=
totalPayable
```

---

# 148. Tests — Partial Payment

Cuota:

```text id="8deh6q"
100
```

Pago:

```text id="ujazug"
40
```

Expected:

```text id="g7xlbw"
remaining 60

status PARTIALLY_PAID
```

---

# 149. Test — Full Payment

Cuota:

```text id="ur31sf"
100
```

Pago:

```text id="jrk686"
100
```

Expected:

```text id="p5tmqp"
remaining 0

status PAID
```

---

# 150. Test — Overdue Partial

Due yesterday:

```text id="j00opv"
total 100

paid 40
```

Expected:

```text id="jdb5fj"
remaining 60

status OVERDUE
```

---

# 151. Test — Early Payment

Due next month.

Paid today.

Expected:

```text id="xsfywt"
payment accepted

remaining decreases

status PAID if zero
```

---

# 152. Test — Oldest First

Cuotas:

```text id="5gwcj3"
100
100
100
```

Pago:

```text id="99fc83"
250
```

Expected allocations:

```text id="6lfums"
100

100

50
```

---

# 153. Test — Manual Allocation

Payment:

```text id="ym1um8"
200
```

Allocations:

```text id="7sueeg"
installment 4 = 100

installment 6 = 100
```

Expected:

```text id="kojpuq"
accepted
```

aunque installment 5 quede sin pagar.

---

# 154. Test — Over Allocation

Payment:

```text id="k7akjq"
100
```

Allocations total:

```text id="8d9few"
120
```

Expected:

```text id="xi6ne9"
PAYMENT_ALLOCATION_MISMATCH
```

---

# 155. Test — Installment Over Allocation

Remaining:

```text id="f9a7gu"
50
```

Allocation:

```text id="fx1fpj"
60
```

Expected rejection.

---

# 156. Test — Overpayment Debt

Debt remaining:

```text id="wb07be"
200
```

Payment:

```text id="ifq9v1"
250
```

Expected:

```text id="me9hmb"
PAYMENT_EXCEEDS_DEBT_REMAINING
```

---

# 157. Test — Debt Paid

After final payment:

```text id="s5mr46"
all remaining = 0
```

Expected:

```text id="2e4qsh"
Debt.status = PAID
```

---

# 158. Test — Debt Overdue

At least one installment:

```text id="iuftu2"
dueDate < today

remaining > 0
```

Expected:

```text id="bhai0g"
Debt.status = OVERDUE
```

---

# 159. Test — Ownership

User A attempts payment on User B debt.

Expected:

```text id="5a8km5"
DEBT_NOT_FOUND
```

and no records created.

---

# 160. Test — Cross User Account

Debt belongs to A.

Paying account belongs to B.

Expected rejection.

---

# 161. Test — Currency

Debt:

```text id="vk1y7f"
ARS
```

Account:

```text id="pbi32y"
USD
```

Expected:

```text id="oy7mzv"
PAYMENT_CURRENCY_MISMATCH
```

---

# 162. Test — Atomic Payment Failure

Simulate failure after transaction creation.

Expected rollback of:

```text id="ktbkg3"
LIABILITY_PAYMENT

DebtPayment

Allocations
```

---

# 163. Test — Concurrent Payment

Remaining installment:

```text id="jippxn"
100
```

Two simultaneous payments:

```text id="dhhetd"
100
100
```

Expected:

```text id="48bx7s"
only one can consume remaining amount
```

No negative remaining.

---

# 164. Property Tests

Useful invariants:

```text id="fcrq1z"
installment remaining >= 0

debt remaining >= 0

sum allocations for payment = payment amount

sum generated installments = total payable

paid installment remaining = 0
```

---

# 165. E2E Flow

```text id="07lc3f"
Register

Create Bank account
Opening 1000

Create debt
300
3 monthly installments

Verify:
3 installments of 100

Pay 150

Verify:
installment 1 paid
installment 2 partial 50
debt remaining 150

Verify bank:
850

Pay remaining 150

Verify:
all installments paid
debt PAID
bank 700
```

---

# 166. E2E Upcoming Flow

```text id="5isqvd"
Create debt with:
one overdue installment
one due today
one future
```

Verify grouping:

```text id="qeah4o"
Overdue

Today

Upcoming
```

---

# 167. Security Checklist

```text id="bkys2s"
[ ] authenticated

[ ] debt ownership

[ ] account ownership

[ ] installment belongs to debt

[ ] currency validated

[ ] archived account rejected

[ ] cancelled debt rejected for payment

[ ] raw userId ignored
```

---

# 168. Financial Integrity Checklist

```text id="v6v53y"
[ ] money exact

[ ] installment sum exact

[ ] allocations exact

[ ] payment cannot overpay

[ ] installment cannot go negative

[ ] debt cannot go negative

[ ] payment creates liability settlement transaction

[ ] payment excluded from consumption expense

[ ] payment mutation atomic

[ ] concurrency protected
```

---

# 169. UI Checklist

```text id="0wjjav"
[ ] Debt list

[ ] New debt flow

[ ] Generated installment preview

[ ] Manual installment editor

[ ] Debt detail

[ ] Installment list

[ ] Payment form

[ ] Oldest-first allocation preview

[ ] Manual allocation editor

[ ] Partial-payment representation

[ ] Overdue representation

[ ] Mobile behavior

[ ] Empty/loading/error states
```

---

# 170. Definition of Done

El slice está terminado cuando un usuario puede:

```text id="yab3wy"
create debt

generate or manually define installments

review due dates

record partial payment

record full payment

pay future installments early

allocate payment across installments

see remaining debt

see installment states

see upcoming debt obligations
```

sin inconsistencias.

---

# 171. Technical DoD

Debe pasar:

```bash id="q3uygn"
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

---

# 172. Database DoD

Desde DB vacía:

```text id="7b3el4"
debt migrations apply successfully
```

y constraints protegen:

```text id="iqd3pw"
positive amounts

unique installment numbers

payment transaction uniqueness
```

---

# 173. Financial DoD

Demostrar con tests:

```text id="mtyqw6"
partial payment correctness

early payment correctness

oldest-first correctness

manual allocation correctness

overpayment prevention

concurrent payment safety

debt status correctness

installment status correctness
```

---

# 174. Scope Boundary

No implementar todavía:

```text id="94ww6u"
variable-rate loan calculator

compound interest

loan refinancing

credit card minimum-payment logic

payment deletion without reversal model

principal prepayment amortization regeneration
```

---

# 175. Next Vertical Slice

Después de completar este slice, crear:

```text id="1ogtwp"
docs/13-planning-recurring-slice.md
```

para implementar:

```text id="xqt65m"
Scheduled Transactions

Recurring Transactions

Upcoming Payments

Occurrence Generation

Posting

Skipping

Reminders Foundation
```
