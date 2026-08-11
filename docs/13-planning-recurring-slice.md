# Planning, Scheduled & Recurring Vertical Slice

## 1. Objetivo

Este documento define el vertical slice para planificación financiera futura.

El objetivo es permitir que el usuario:

```text
registre ingresos y gastos esperados

configure movimientos recurrentes

vea próximos compromisos

confirme movimientos cuando realmente ocurren

omita ocurrencias que no sucedieron
```

Este módulo conecta:

```text
actual financial state
+
future expectations
+
known obligations
```

sin mezclarlos.

---

# 2. Principio central

Mantener siempre:

```text
Posted Transaction
≠
Scheduled Transaction
≠
Recurring Rule
≠
Debt Obligation
```

Una recurrencia es una regla.

Una scheduled transaction es una ocurrencia futura.

Una posted transaction es un movimiento real.

---

# 3. Scope

Incluye:

```text
Scheduled Income

Scheduled Expense

Recurring Income

Recurring Expense

Occurrence Generation

Posting Scheduled Transactions

Skipping Occurrences

Cancelling Scheduled Transactions

Pausing Recurring Rules

Upcoming Payments Read Model

Upcoming Income Read Model

Reminder Foundation

30/90-day planning inputs

Idempotency

Tests
```

No incluye todavía:

```text
automatic bank posting

scheduled transfers

recurring transfers

AI prediction of future expenses

advanced recurrence expressions

calendar synchronization

push/email reminders
```

---

# 4. ScheduledTransaction

Entidad:

```text
ScheduledTransaction
├── id
├── userId
├── accountId
├── type
├── amount
├── currencyCode
├── description
├── categoryId?
├── scheduledDate
├── status
├── source
├── recurringTransactionId?
├── postedTransactionId?
├── notes?
├── createdAt
└── updatedAt
```

---

# 5. Scheduled Types

V1:

```text
INCOME

EXPENSE
```

---

# 6. Scheduled Status

```text
SCHEDULED

POSTED

SKIPPED

CANCELLED
```

---

# 7. Scheduled Source

```text
MANUAL

RECURRING
```

Future sources may include:

```text
DEBT

CREDIT_CARD
```

but debt installments remain first-class obligations rather than duplicated scheduled rows unless explicitly required.

---

# 8. Scheduled Transaction Semantics

Una scheduled transaction:

```text
does not affect actual balance
```

hasta que sea:

```text
POSTED
```

---

# 9. Scheduled Input

Conceptualmente:

```ts
{
  accountId: string
  type: "INCOME" | "EXPENSE"
  amount: DecimalInput
  description: string
  categoryId?: string
  scheduledDate: LocalDate
  notes?: string
}
```

---

# 10. Preconditions

Validar:

```text
authenticated user

account belongs to user

account active

category belongs to user

category type compatible

amount > 0

currency = account currency

scheduledDate is valid
```

---

# 11. Date Rule

Scheduled transaction puede ser:

```text
today

future
```

Si representa algo ya ocurrido, debería registrarse como:

```text
Posted Transaction
```

---

# 12. CreateScheduledTransaction

Application service:

```text
CreateScheduledTransaction
```

Responsabilidades:

```text
validate input

validate ownership

validate category

persist SCHEDULED event
```

No crea una transaction real.

---

# 13. Planning UI

Ruta:

```text
/planning
```

Tabs:

```text
Upcoming

Scheduled

Recurring
```

---

# 14. Scheduled List

Mostrar:

```text
Date

Description

Amount

Account

Type

Status
```

---

# 15. Scheduled Income UI

Ejemplo:

```text
31 Ago

Sueldo

+$1.500.000

Programado
```

---

# 16. Scheduled Expense UI

Ejemplo:

```text
18 Ago

Internet

-$25.000

Programado
```

---

# 17. Scheduled Actions

Para status:

```text
SCHEDULED
```

permitir:

```text
Confirm

Edit

Skip

Cancel
```

---

# 18. Confirm Semantics

`Confirm` significa:

```text
this financial event actually happened
```

Debe crear una posted transaction.

---

# 19. Posting Flow

```text
ScheduledTransaction
↓
validate still SCHEDULED
↓
create POSTED Transaction
↓
link postedTransactionId
↓
mark ScheduledTransaction POSTED
```

---

# 20. Posting Atomicity

Debe ser una única DB transaction:

```text
BEGIN

lock scheduled row

verify status = SCHEDULED

create transaction

link transaction

mark POSTED

COMMIT
```

---

# 21. Posting Idempotency

Si:

```text
postedTransactionId exists
```

un retry debe:

```text
return existing result
```

No crear duplicados.

---

# 22. Concurrent Posting

Dos requests simultáneos no pueden crear dos movimientos.

Usar:

```text
row lock
```

o equivalente más:

```text
unique relationship
```

---

# 23. Posted Transaction Source

La transaction creada debe tener:

```text
source = SCHEDULED
```

y:

```text
scheduledTransactionId
```

---

# 24. Posted Type Mapping

```text
Scheduled INCOME
→ Transaction INCOME

Scheduled EXPENSE
→ Transaction EXPENSE
```

---

# 25. Posted Amount

Por defecto:

```text
scheduled amount
```

pero el usuario puede necesitar confirmar con monto real distinto.

---

# 26. Confirm With Actual Amount

V1 recomendable:

al confirmar permitir:

```text
actualAmount
```

opcional.

Ejemplo:

```text
Expected utility bill
$30.000

Actual
$32.400
```

La scheduled occurrence conserva:

```text
expected amount = 30.000
```

y la posted transaction registra:

```text
32.400
```

---

# 27. Confirm With Actual Date

También permitir:

```text
actualOccurredAt
```

si ocurrió en fecha distinta.

---

# 28. Expected vs Actual

Nunca sobrescribir silenciosamente:

```text
scheduledDate
scheduledAmount
```

con el valor real.

Conservar ambos conceptos.

---

# 29. Skip

`SKIPPED` significa:

```text
expected event did not occur
```

No crea Transaction.

---

# 30. Skip Example

```text
Recurring gym expense
```

pero ese mes el usuario tenía una bonificación.

Puede marcar la ocurrencia:

```text
SKIPPED
```

sin destruir la regla recurrente.

---

# 31. Cancel Scheduled

`CANCELLED` significa que esa ocurrencia deja de estar prevista.

Diferencia semántica sugerida:

```text
SKIPPED
= occurrence date arrived / event did not happen

CANCELLED
= user removed expectation before occurrence
```

---

# 32. Editing Scheduled

Mientras esté:

```text
SCHEDULED
```

permitir editar:

```text
date

amount

description

account

category

notes
```

con validación completa.

---

# 33. Posted Scheduled Event

Una vez:

```text
POSTED
```

no modificar la scheduled transaction como forma de editar el movimiento real.

Editar/anular la Transaction por su flujo correspondiente.

---

# 34. RecurringTransaction

Entidad:

```text
RecurringTransaction
├── id
├── userId
├── accountId
├── type
├── amount
├── currencyCode
├── categoryId?
├── description
├── frequency
├── intervalValue
├── startDate
├── endDate?
├── nextOccurrence
├── status
├── metadata?
├── createdAt
└── updatedAt
```

---

# 35. Recurring Type

```text
INCOME

EXPENSE
```

---

# 36. Recurring Status

```text
ACTIVE

PAUSED

ENDED

CANCELLED
```

---

# 37. Frequency

V1:

```text
WEEKLY

BIWEEKLY

MONTHLY

QUARTERLY

YEARLY
```

---

# 38. CUSTOM

No implementar inicialmente salvo necesidad concreta.

Si se requiere más flexibilidad posteriormente:

```text
frequency + intervalValue
```

puede soportar algunos casos sin adoptar una expresión cron compleja.

---

# 39. Recurring Rule Is Not Money

Crear una recurring rule:

```text
does not affect balance
```

y:

```text
does not create historical transactions
```

por sí sola.

---

# 40. Recurrence Output

Una recurring rule genera:

```text
ScheduledTransaction
```

para sus próximas ocurrencias.

---

# 41. Generation Horizon

V1:

```text
90 days
```

de ocurrencias futuras.

No generar años de filas innecesarias.

---

# 42. Why Generate Occurrences

Materializar próximas ocurrencias permite:

```text
manual adjustment

skip individual occurrence

cashflow calculation

reminders

upcoming view
```

sin modificar la regla base.

---

# 43. Recurring Creation Flow

```text
Recurring Form
↓
validate rule
↓
persist RecurringTransaction
↓
generate future occurrences
↓
show upcoming
```

---

# 44. Recurring Input

```ts
{
  accountId: string
  type: "INCOME" | "EXPENSE"
  amount: DecimalInput
  description: string
  categoryId?: string
  frequency: RecurrenceFrequency
  startDate: LocalDate
  endDate?: LocalDate
  notes?: string
}
```

---

# 45. Recurrence Preconditions

```text
amount > 0

valid account

account active

category compatible

startDate valid

endDate >= startDate if provided
```

---

# 46. Monthly Recurrence

Debe preservar anchor day.

Ejemplo:

```text
31 Jan
28 Feb
31 Mar
30 Apr
```

igual que el motor de cuotas.

Preferir reutilizar una utilidad común de fechas financieras.

---

# 47. Quarterly

Conceptualmente:

```text
+ 3 calendar months
```

preservando anchor day.

---

# 48. Yearly

Conceptualmente:

```text
+ 1 calendar year
```

con manejo determinístico de:

```text
29 February
```

---

# 49. Leap Year

Regla recomendada:

```text
29 Feb 2028
→ 28 Feb 2029
→ 28 Feb 2030
→ 28 Feb 2031
→ 29 Feb 2032
```

o preservar intención de fin de febrero si así se modela.

La política debe ser centralizada y testeada.

---

# 50. Idempotent Occurrence Generation

Nunca generar dos scheduled rows para:

```text
same recurring rule
+
same occurrence date
```

---

# 51. Unique Constraint

Recomendado:

```text
UNIQUE(
  recurring_transaction_id,
  scheduled_date
)
```

para rows generadas por recurring.

---

# 52. Generator

Crear:

```text
GenerateRecurringOccurrences
```

---

# 53. Generator Algorithm

Conceptualmente:

```text
load active rule

determine generation window

calculate expected dates

for each date:
  insert if missing

advance nextOccurrence
```

---

# 54. Idempotent Retry

Ejecutar dos veces:

```text
GenerateRecurringOccurrences(ruleId)
```

debe producir el mismo conjunto final.

---

# 55. nextOccurrence

`nextOccurrence` es una optimización/estado operativo.

No debe ser la única fuente de verdad para reconstruir el calendario.

La regla base sigue siendo:

```text
startDate
frequency
endDate
```

---

# 56. Worker Integration

Cuando exista worker:

```text
Recurring Generation Job
```

puede ejecutarse diariamente.

Ejemplo:

```text
ensure every active recurring rule
has occurrences through today + 90 days
```

---

# 57. No Worker Requirement Initially

La primera implementación puede generar:

```text
on creation

on edit

on relevant page/dashboard access
```

si todavía no existe infraestructura background.

Después mover la extensión del horizonte al worker.

---

# 58. Pausing Rule

```text
ACTIVE
→
PAUSED
```

impide generar nuevas ocurrencias.

---

# 59. Existing Occurrences On Pause

Recomendación:

```text
existing SCHEDULED occurrences remain
```

No cancelarlas automáticamente.

El usuario puede decidir si siguen siendo válidas.

---

# 60. Resume

```text
PAUSED
→
ACTIVE
```

Luego extender ocurrencias faltantes dentro del horizonte.

---

# 61. Cancel Recurring Rule

```text
CANCELLED
```

significa que la regla no volverá a generar ocurrencias.

---

# 62. Future Occurrences On Cancel

Antes de confirmar cancelación, ofrecer política:

```text
Keep existing scheduled occurrences

Cancel future unposted occurrences
```

Para V1, recomiendo:

```text
cancel future SCHEDULED occurrences
```

porque coincide mejor con intención del usuario al cancelar la recurrencia.

---

# 63. Posted Occurrences

Nunca modificar:

```text
POSTED
```

cuando la recurring rule cambia o se cancela.

---

# 64. Editing Recurring Rule

Editar:

```text
amount

account

category

description

frequency

future schedule
```

solo debe afectar:

```text
future unposted occurrences
```

---

# 65. Historical Integrity

Nunca actualizar automáticamente:

```text
past POSTED transactions
```

porque cambió la regla recurrente.

---

# 66. Existing Future Occurrence Policy

Al editar regla, necesitamos política explícita.

Recomendación:

```text
regenerate future SCHEDULED occurrences
starting from an effective date
```

---

# 67. Edit Effective Date

V1 puede usar:

```text
effective immediately
```

es decir:

```text
today onward
```

No alterar ocurrencias anteriores a hoy.

---

# 68. Edit Flow

```text
User edits recurring rule
↓
validate changes
↓
update rule
↓
cancel/update future unposted occurrences
↓
regenerate horizon
```

todo con cuidado de idempotencia.

---

# 69. Recurring Detail UI

Mostrar:

```text
Description

Amount

Frequency

Account

Next occurrence

Status
```

y próximas ocurrencias.

---

# 70. Recurring List

Ejemplo:

```text
Netflix

$15.999

Mensual

Próximo: 10 Sep

Activo
```

---

# 71. Recurring Actions

```text
Edit

Pause

Resume

Cancel
```

según estado.

---

# 72. Upcoming Read Model

`Upcoming` debe unir distintas fuentes sin mezclarlas como entidades.

Fuentes MVP:

```text
DebtInstallments

Scheduled Expenses

Scheduled Income
```

---

# 73. Upcoming Financial Event

DTO conceptual:

```ts
{
  sourceType
  sourceId
  direction
  title
  date
  amount
  remainingAmount?
  currency
  status
  confidence
}
```

---

# 74. direction

```text
INFLOW

OUTFLOW
```

---

# 75. confidence

V1 conceptual:

```text
COMMITTED

EXPECTED
```

---

# 76. Debt Installment Confidence

```text
COMMITTED
```

---

# 77. Scheduled Expense Confidence

Si fue cargado manualmente como factura esperada:

```text
EXPECTED
```

o `COMMITTED` si producto luego permite marcarla como compromiso firme.

No sobrecomplicar V1.

---

# 78. Scheduled Income Confidence

```text
EXPECTED
```

---

# 79. Upcoming Payments

Debe incluir outflows:

```text
overdue debt installments

future debt installments

scheduled expenses
```

---

# 80. Upcoming Income

Puede mostrarse separadamente:

```text
scheduled income

recurring income occurrences
```

---

# 81. Upcoming Grouping

Payments:

```text
Overdue

Today

Next 7 Days

Later
```

Income:

```text
Today

Next 7 Days

Later
```

---

# 82. Avoid Double Counting Recurring Occurrences

Una recurring rule no aparece directamente.

Solo aparece su:

```text
ScheduledTransaction occurrence
```

en upcoming/cashflow.

---

# 83. Avoid Double Counting Debt

Si un debt installment se incluye directamente en Upcoming:

no crear además una scheduled expense duplicada para la misma obligación.

---

# 84. Source Identity

Cada projection/upcoming item debe mantener:

```text
sourceType
sourceId
```

para deduplicación y navegación.

---

# 85. Upcoming Action — Scheduled Expense

Actions:

```text
Confirm

Skip

Edit
```

---

# 86. Upcoming Action — Scheduled Income

Actions:

```text
Confirm

Skip

Edit
```

---

# 87. Upcoming Action — Debt Installment

Actions:

```text
Pay
```

No:

```text
Confirm
```

porque tiene otro lifecycle.

---

# 88. Dashboard Integration

Dashboard puede incorporar:

```text
Upcoming Payments
```

con top N próximos eventos.

Ejemplo:

```text
Alquiler
15 Ago
$300.000

Préstamo
20 Ago
$100.000
```

---

# 89. Cashflow Integration

Las scheduled transactions alimentan:

```text
30-day projection
```

---

# 90. Projection Rules

```text
Scheduled Income
→ INFLOW

Scheduled Expense
→ OUTFLOW

Debt Installment remaining
→ OUTFLOW
```

---

# 91. Posted Scheduled Event And Projection

Cuando scheduled becomes:

```text
POSTED
```

deja de aparecer como futuro.

La transaction real ya está incorporada al saldo actual.

---

# 92. Skipped Event And Projection

`SKIPPED`:

```text
excluded
```

de proyección.

---

# 93. Cancelled Event And Projection

También:

```text
excluded
```

---

# 94. Partial Debt Payment

Si debt installment:

```text
total 100

paid 40

remaining 60
```

Upcoming/cashflow incluye:

```text
60
```

---

# 95. Reminder Foundation

Agregar estructura mínima para recordatorios.

Entidad:

```text
Reminder
├── id
├── userId
├── sourceType
├── sourceId
├── remindAt
├── channel
├── status
├── sentAt?
└── createdAt
```

---

# 96. Reminder Sources

V1:

```text
DEBT_INSTALLMENT

SCHEDULED_TRANSACTION
```

---

# 97. Reminder Channel

Inicial:

```text
IN_APP
```

---

# 98. Reminder Status

```text
PENDING

SENT

CANCELLED
```

---

# 99. Reminder Presets

UI:

```text
On due date

1 day before

3 days before

7 days before

Custom
```

---

# 100. Reminder Time

Como `dueDate` puede ser DATE sin hora, necesitamos una hora local default.

Recomendación configurable:

```text
09:00 user local time
```

para reminders basados en día.

---

# 101. Reminder Timezone

Convertir:

```text
local financial date + local reminder time
```

a:

```text
TIMESTAMPTZ
```

usando:

```text
user.timezone
```

---

# 102. Reminder Job

Future worker:

```text
find PENDING reminders where remindAt <= now
```

Luego:

```text
create in-app notification

mark SENT
```

---

# 103. Reminder Idempotency

Un reminder no debe dispararse dos veces.

Usar:

```text
status transition
+
locking/idempotency
```

---

# 104. No Email Yet

No implementar:

```text
email

push
```

en este slice salvo que sea explícitamente requerido.

---

# 105. Planning Package Boundaries

Suggested:

```text
packages/finance/src/recurrence/
```

para matemáticas puras de fechas.

Application/database logic:

```text
apps/web / packages/db
```

para persistencia y orchestration.

---

# 106. Finance Recurrence Structure

```text
packages/finance/src/recurrence/
├── recurrence-types.ts
├── next-occurrence.ts
├── generate-occurrence-dates.ts
└── index.ts
```

---

# 107. Pure Recurrence Input

Conceptualmente:

```ts
{
  frequency
  startDate
  endDate?
  from
  through
}
```

Output:

```ts
LocalDate[]
```

---

# 108. No DB In Date Generator

El recurrence generator matemático:

```text
does not access database
```

---

# 109. Application Services

Crear:

```text
CreateScheduledTransaction

UpdateScheduledTransaction

PostScheduledTransaction

SkipScheduledTransaction

CancelScheduledTransaction

CreateRecurringTransaction

UpdateRecurringTransaction

PauseRecurringTransaction

ResumeRecurringTransaction

CancelRecurringTransaction

GenerateRecurringOccurrences
```

---

# 110. Read Services

```text
GetUpcomingPayments

GetUpcomingIncome

ListScheduledTransactions

ListRecurringTransactions
```

---

# 111. Server Actions

Propuesta:

```text
features/planning/actions/
├── create-scheduled.ts
├── post-scheduled.ts
├── skip-scheduled.ts
├── cancel-scheduled.ts
├── create-recurring.ts
├── update-recurring.ts
├── pause-recurring.ts
├── resume-recurring.ts
└── cancel-recurring.ts
```

---

# 112. Validation Schemas

```text
createScheduledSchema

postScheduledSchema

createRecurringSchema

updateRecurringSchema

upcomingFiltersSchema
```

---

# 113. Scheduled Edit Validation

No permitir editar si:

```text
status != SCHEDULED
```

Error:

```text
SCHEDULED_TRANSACTION_NOT_EDITABLE
```

---

# 114. Posting Error Codes

```text
SCHEDULED_TRANSACTION_NOT_FOUND

SCHEDULED_TRANSACTION_ALREADY_POSTED

SCHEDULED_TRANSACTION_SKIPPED

SCHEDULED_TRANSACTION_CANCELLED

SCHEDULED_TRANSACTION_INVALID_STATE

SCHEDULED_TRANSACTION_CURRENCY_MISMATCH
```

---

# 115. Recurring Error Codes

```text
RECURRING_TRANSACTION_NOT_FOUND

RECURRING_TRANSACTION_PAUSED

RECURRING_TRANSACTION_CANCELLED

INVALID_RECURRENCE

INVALID_RECURRENCE_DATE_RANGE
```

---

# 116. UI Copy — Posting

Preferir:

```text
Confirmar movimiento
```

o:

```text
Registrar como realizado
```

sobre términos técnicos como:

```text
Post transaction
```

---

# 117. UI Copy — Skip

Ejemplo:

```text
Omitir esta ocurrencia
```

y explicar:

```text
No se registrará como movimiento, pero la recurrencia continuará.
```

---

# 118. UI Copy — Pause

```text
Pausar recurrencia
```

Explicación:

```text
No se generarán nuevas ocurrencias hasta que la reactives.
```

---

# 119. Planning Empty State

```text
Todavía no tenés movimientos programados.

Podés agregar ingresos o gastos futuros para mejorar tu planificación.

[Programar movimiento]
```

---

# 120. Recurring Empty State

```text
Todavía no configuraste movimientos recurrentes.

Agregá gastos o ingresos que se repiten para evitar cargarlos manualmente.

[Crear recurrencia]
```

---

# 121. Quick Add

Después de este slice:

```text
+
```

puede ofrecer:

```text
Expense

Income

Transfer

Scheduled

Recurring
```

Mantener agrupación visual clara para no saturar.

---

# 122. Mobile Planning

Tabs deben funcionar correctamente en mobile:

```text
Upcoming

Scheduled

Recurring
```

Puede utilizarse segment control o tabs scrollables.

---

# 123. Date Display

Upcoming debe priorizar:

```text
Today

Tomorrow

In 3 days
```

acompañado por fecha absoluta cuando aporte claridad.

---

# 124. Scheduling Time Semantics

V1 scheduled financial event usa:

```text
DATE
```

como fecha financiera.

No necesita una hora de ocurrencia.

---

# 125. Posting Timestamp

Al confirmar:

```text
occurredAt
```

puede construirse según input real del usuario.

Si solo confirma fecha:

usar una política central que no invente significado intradía innecesario.

---

# 126. Database Tables

Requiere:

```text
scheduled_transactions

recurring_transactions

reminders
```

---

# 127. scheduled_transactions Constraints

```text
amount > 0

valid status

valid type

account required

currency required
```

---

# 128. Recurring Constraint

```text
amount > 0

start_date valid

end_date >= start_date when present
```

---

# 129. Unique Recurring Occurrence

Para generated scheduled rows:

```text
UNIQUE(recurring_transaction_id, scheduled_date)
```

---

# 130. posted_transaction_id

Debe ser:

```text
UNIQUE
```

para impedir que dos scheduled occurrences apunten al mismo posted transaction.

---

# 131. Indexes

Mínimo:

```text
scheduled_transactions(user_id, scheduled_date, status)

scheduled_transactions(recurring_transaction_id, scheduled_date)

recurring_transactions(user_id, status)

recurring_transactions(next_occurrence)

reminders(user_id, remind_at, status)
```

---

# 132. Ownership

Toda scheduled/recurring query debe incluir:

```text
user_id = currentUserId
```

---

# 133. Posting Ownership

Al postear:

```text
scheduled.userId
=
account.userId
=
currentUserId
```

---

# 134. Category Ownership

También validar categoría en scheduled y recurring.

---

# 135. Account Archive

Una existing scheduled transaction asociada a cuenta archivada necesita política.

Recomendación:

```text
cannot post until user selects another active account
```

No postear silenciosamente a cuenta archivada.

---

# 136. Recurring Account Archived

Si se archiva cuenta usada por recurring rule:

```text
pause recurring rule
```

o impedir archive hasta resolver dependencia.

Recomendación V1:

permitir archive y:

```text
automatically pause affected recurring rules
```

solo si se hace explícito en confirmación.

Alternativa más segura:

```text
block archive while active recurring rules exist
```

Recomendada inicialmente por menor sorpresa.

---

# 137. Scheduled Category Archived

Historical/generated scheduled item puede conservarla.

Para posting:

una categoría archivada puede seguir utilizándose si ya estaba asignada, o pedir reemplazo.

Recomendación:

```text
allow posting existing occurrence
```

porque representa una clasificación histórica ya definida.

No permitir seleccionarla para nuevas scheduled rows.

---

# 138. Recurring Category Archived

Active recurring rule no debería continuar generando nuevas rows con categoría archivada.

Al archivar categoría:

```text
pause affected recurring rules
```

o requerir cambio.

Inicialmente:

```text
block archive if active recurring rules reference it
```

es más simple y explícito.

---

# 139. Recurrence Generation Transaction

Generar múltiples ocurrencias puede hacerse en una DB transaction razonablemente pequeña.

No es necesario que todas las reglas del sistema estén en una mega transaction.

Procesar por rule.

---

# 140. Generator Concurrency

Dos workers pueden tomar la misma recurring rule.

Unique constraint:

```text
(ruleId, scheduledDate)
```

debe hacer la operación segura.

El código debe tratar unique conflict esperado como:

```text
already generated
```

no error crítico.

---

# 141. Generation Window

Ejemplo:

```text
today = Aug 8

horizon = 90 days
```

Generar hasta:

```text
Nov 6
```

según convención inclusiva central.

---

# 142. End Date

Nunca generar después de:

```text
endDate
```

---

# 143. Status ENDED

Cuando:

```text
endDate < today
```

y no quedan futuras generaciones:

podemos marcar:

```text
ENDED
```

---

# 144. No Infinite Scheduler

Una recurring rule sin endDate sigue siendo válida.

Solo materializamos ventana limitada.

---

# 145. Cashflow Confidence

Para projection V1:

```text
Debt Installment
→ COMMITTED

Scheduled Expense
→ EXPECTED

Scheduled Income
→ EXPECTED
```

Esto permite explicar por qué algunas proyecciones son menos seguras.

---

# 146. Spendable Boundary

Conservative `Spendable Money`:

puede incluir:

```text
known upcoming obligations
```

pero no debería sumar:

```text
future scheduled income
```

como disponible actual.

---

# 147. Scheduled Expense In Spendable

Si se considera compromiso:

debe existir una política explícita.

V1 recomiendo:

```text
Debt installments
→ included

Scheduled expenses
→ included in projected cashflow
```

pero no necesariamente todas en conservative spendable hasta introducir una clasificación de compromiso.

---

# 148. Testing — Scheduled Creation

Verificar:

```text
creates SCHEDULED row

does not create Transaction

does not change account balance
```

---

# 149. Testing — Posting

Scheduled expense:

```text
100
```

posting crea:

```text
EXPENSE 100
```

y balance baja 100.

---

# 150. Testing — Posting With Actual Amount

Expected:

```text
100
```

Actual:

```text
120
```

Verify:

```text
scheduled expected remains 100

posted transaction = 120
```

---

# 151. Testing — Duplicate Posting

Dos requests:

```text
Post same scheduled transaction
```

Expected:

```text
exactly one posted transaction
```

---

# 152. Testing — Skip

After skip:

```text
status = SKIPPED

no transaction

excluded from future projection
```

---

# 153. Testing — Cancel

Same:

```text
no transaction
```

and no future projection inclusion.

---

# 154. Testing — Recurring Monthly

Rule:

```text
31 Jan monthly
```

Expected:

```text
31 Jan

28/29 Feb

31 Mar

30 Apr
```

según año.

---

# 155. Testing — Idempotent Generation

Run generator twice.

Expected:

```text
no duplicate occurrences
```

---

# 156. Testing — Pause

Pause rule.

Run generator.

Expected:

```text
no new occurrences
```

---

# 157. Testing — Resume

Resume.

Generate.

Expected missing future occurrences created once.

---

# 158. Testing — Cancel Rule

No occurrences after cancellation.

Existing posted remain intact.

---

# 159. Testing — Edit Amount

Future SCHEDULED occurrences:

```text
100
```

Rule changes to:

```text
120
```

Expected future policy:

```text
future unposted occurrences reflect 120
```

past posted remain unchanged.

---

# 160. Testing — Upcoming Debt + Scheduled

Have:

```text
Debt installment 100

Scheduled rent 300
```

Upcoming must show:

```text
both
```

once each.

---

# 161. Testing — No Recurring Double Count

Recurring rent generates scheduled rent.

Upcoming:

```text
one rent occurrence
```

not:

```text
recurring rule + scheduled occurrence
```

---

# 162. Testing — User Ownership

User A cannot:

```text
post

skip

edit

pause

resume
```

User B entities.

---

# 163. Testing — Archived Account

Scheduled event attached to archived account cannot post.

---

# 164. Testing — Future Balance

Creating:

```text
Scheduled Expense 100
```

does not alter current account balance.

---

# 165. Testing — Posted Balance

After posting it:

balance decreases 100.

---

# 166. Property Tests

Useful invariants:

```text
a scheduled occurrence produces at most one posted transaction

recurring rule/date produces at most one occurrence

posted occurrence never becomes scheduled again

scheduled rows never affect actual balance

skipped rows never affect actual balance
```

---

# 167. E2E Flow — Scheduled

```text
Create Bank
Opening 1000

Schedule Expense
200
tomorrow

Verify current balance:
1000

Confirm occurrence

Verify:
balance 800
scheduled POSTED
transaction exists
```

---

# 168. E2E Flow — Recurring

```text
Create monthly rent
300

Verify future occurrences generated

Open Upcoming
see next rent

Skip one occurrence

Verify:
that occurrence excluded

next month's occurrence remains
```

---

# 169. E2E Flow — Upcoming

Create:

```text
overdue debt installment

scheduled expense today

scheduled salary next week
```

Verify correct:

```text
Payments grouping

Income grouping

source labels
```

---

# 170. Security Checklist

```text
[ ] authenticated access

[ ] account ownership

[ ] category ownership

[ ] scheduled ownership

[ ] recurring ownership

[ ] reminder ownership

[ ] no userId trusted from client

[ ] posting re-validates account
```

---

# 171. Financial Integrity Checklist

```text
[ ] scheduled never changes balance before posting

[ ] posting creates exactly one real transaction

[ ] retries cannot duplicate transaction

[ ] recurring rule never directly changes balance

[ ] recurring occurrence generation is idempotent

[ ] debt obligations are not duplicated as scheduled expenses

[ ] skipped/cancelled events are excluded from projections
```

---

# 172. UI Checklist

```text
[ ] Planning page

[ ] Upcoming tab

[ ] Scheduled tab

[ ] Recurring tab

[ ] Create scheduled form

[ ] Scheduled edit

[ ] Confirm scheduled flow

[ ] Skip confirmation

[ ] Create recurring form

[ ] Edit recurring form

[ ] Pause / Resume

[ ] Cancel recurring

[ ] Responsive states

[ ] Empty/loading/error states
```

---

# 173. Worker Checklist

When worker is enabled:

```text
[ ] recurring generation job

[ ] reminder dispatch job

[ ] idempotent retries

[ ] structured logs

[ ] no large sensitive payloads
```

---

# 174. Definition of Done

El slice está terminado cuando el usuario puede:

```text
schedule future income

schedule future expenses

confirm an expected movement

skip an expected movement

create recurring income

create recurring expenses

pause/resume recurrence

see future occurrences

see debt + scheduled obligations together
```

sin modificar balances antes de que el dinero realmente ocurra.

---

# 175. Technical DoD

Debe pasar:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

---

# 176. Financial DoD

Tests deben demostrar:

```text
scheduled != posted

recurring != transaction

posting is idempotent

generation is idempotent

future events do not alter actual balances

upcoming does not double count sources
```

---

# 177. Scope Boundary

No implementar todavía:

```text
predictive AI scheduling

automatic posting by default

calendar integration

bank synchronization

complex custom recurrence language

scheduled cross-currency transfers
```

---

# 178. Next Vertical Slice

Después de este slice, crear:

```text
docs/14-dashboard-cashflow-slice.md
```

para implementar:

```text
Dashboard Full MVP

Estimated Spendable

Outstanding Debt

Upcoming Obligations

30-Day Cashflow

Projected Minimum Balance

Projected Shortfall

Explainable Metrics
```
