# Backup & Recovery

## 1. Objetivo

Este documento define la estrategia de backup, restauración y recuperación ante desastres de la aplicación.

El objetivo principal es proteger:

```text
financial data

billing state

user configuration

operational continuity
```

Tener backups no es suficiente.

El sistema debe poder demostrar que puede:

```text
restore

verify

recover safely
```

Principio central:

```text
A backup is only trustworthy if it can be restored and validated.
```

---

# 2. Scope

Este documento cubre:

```text
PostgreSQL backups

Point-In-Time Recovery

Backup retention

Restore procedures

Restore validation

Financial integrity checks

Disaster recovery

Accidental deletion

Database corruption

Billing recovery

Redis recovery

S3 recovery

Recovery drills
```

No cubre en profundidad:

```text
business continuity organization

legal incident notification

full regional failover

active-active databases
```

---

# 3. Recovery Priorities

Orden recomendado:

```text
1. Financial ledger

2. User authentication / ownership

3. Debts and payments

4. Scheduled / recurring state

5. Billing subscriptions

6. Budgets

7. AI telemetry

8. Cache / queue state
```

---

# 4. Source of Truth Classification

## Tier 1 — Critical

```text
PostgreSQL
```

Contiene:

```text
users

accounts

transactions

transfers

debts

installments

payments

allocations

scheduled transactions

recurring rules

budgets

billing state
```

La pérdida de esta base puede implicar pérdida financiera real para el usuario.

---

# 5. Tier 2 — Recoverable External State

```text
Mercado Pago
```

Es fuente externa para billing.

Podemos reconciliar:

```text
subscription status

payments
```

si existe divergencia local.

---

# 6. Tier 3 — Rebuildable State

```text
Redis
```

Debe contener solamente:

```text
jobs

rate limits

temporary cache

locks
```

Nunca truth financiera.

---

# 7. Tier 4 — Optional Data

```text
AI telemetry

temporary exports

derived caches
```

La aplicación debe poder funcionar aunque se pierdan.

---

# 8. Backup Strategy

PostgreSQL debe tener:

```text
automatic backups
+
restore procedure
+
validation procedure
```

---

# 9. Backup Frequency

La frecuencia debe definirse según el RPO objetivo.

Recomendación inicial:

```text
daily full backup
+
point-in-time recovery when infrastructure supports it
```

Para producción con actividad financiera frecuente:

```text
PITR strongly preferred
```

---

# 10. RPO

RPO significa:

```text
Recovery Point Objective
```

Define cuánta información reciente podemos aceptar perder.

Ejemplo:

```text
RPO = 15 minutes
```

significa que ante un desastre extremo podríamos perder hasta aproximadamente 15 minutos de datos.

---

# 11. Recommended Initial RPO

Para una aplicación financiera personal:

```text
target RPO <= 1 hour
```

Ideal:

```text
near-continuous PITR
```

si el plan de PostgreSQL lo soporta.

---

# 12. RTO

RTO significa:

```text
Recovery Time Objective
```

Define cuánto tiempo puede tardar la recuperación.

---

# 13. Recommended Initial RTO

Objetivo inicial razonable:

```text
RTO <= 4 hours
```

para un producto temprano.

A medida que crezca:

```text
reduce RTO
```

---

# 14. RPO/RTO Are Product Decisions

No deben quedar implícitos.

Documentar:

```text
current RPO

current RTO

infrastructure supporting them
```

---

# 15. Backup Retention

Definir una política explícita.

Ejemplo inicial:

```text
daily backups:
30 days

weekly backups:
12 weeks

monthly backups:
12 months
```

Ajustar según:

```text
cost

legal requirements

growth

provider capabilities
```

---

# 16. Backup Encryption

Backups deben estar cifrados:

```text
in transit

at rest
```

utilizando capacidades seguras de infraestructura.

---

# 17. Backup Access

Acceso limitado.

No todos los desarrolladores necesitan poder descargar:

```text
production database backups
```

Aplicar:

```text
least privilege
```

---

# 18. Backup Location

Idealmente los backups no dependen exclusivamente del mismo failure domain que la base primaria.

Si Railway administra backups:

documentar:

```text
where they live

how they are restored

what happens if project is deleted
```

---

# 19. Secondary Backup

A medida que el producto madure, considerar:

```text
encrypted independent backup
```

fuera del proveedor primario.

No es obligatorio para la primera release si el proveedor ofrece garantías suficientes y restore probado.

---

# 20. Backup Metadata

Registrar:

```text
backup timestamp

database version

backup identifier

retention expiration

restore test status
```

---

# 21. Do Not Store Secrets In Backup Notes

Metadata operacional nunca debe incluir:

```text
DATABASE_URL

password

API keys
```

---

# 22. Restore Types

Debemos soportar conceptualmente:

```text
Full Restore

Point-In-Time Restore

Selective Logical Recovery
```

---

# 23. Full Restore

Se utiliza cuando:

```text
database is lost

database is severely corrupted

environment must be rebuilt
```

---

# 24. Point-In-Time Restore

Se utiliza cuando:

```text
bad deployment

mass accidental deletion

corrupt bulk operation
```

ocurrió en un momento conocido.

---

# 25. Selective Recovery

Puede utilizarse cuando:

```text
small number of records corrupted
```

y es más seguro reparar datos concretos que reemplazar toda producción.

---

# 26. Never Restore Directly Over Production First

Regla:

```text
backup
↓
isolated restore environment
↓
validation
↓
production recovery
```

No sobrescribir producción inmediatamente si existe alternativa.

---

# 27. Restore Environment

Crear una DB aislada.

Ejemplo:

```text
recovery-2026-08-08
```

Nunca conectarla al tráfico de usuarios hasta validación.

---

# 28. Restore Runbook

Flujo general:

```text
1. Identify incident time

2. Stop risky writes if necessary

3. Preserve current production state

4. Select backup / PITR timestamp

5. Restore to isolated database

6. Run migrations if required

7. Run integrity checks

8. Compare with production

9. Decide recovery strategy

10. Promote / repair

11. Run smoke tests

12. Re-enable writes
```

---

# 29. Preserve Current Production

Antes de restore destructivo:

```text
snapshot current broken state
```

cuando sea posible.

Puede ser útil para:

```text
forensics

record comparison

selective recovery
```

---

# 30. Stop Writes

Ante corrupción activa:

```text
disable affected mutations
```

o poner aplicación en mantenimiento si es necesario.

No permitir que el problema siga creciendo.

---

# 31. Financial Integrity Checks

Después de restore ejecutar validaciones.

Mínimo:

```text
no negative invalid amounts

transfer legs paired

debt allocations balanced

no overpaid installments

no orphan financial rows

currencies consistent
```

---

# 32. Transfer Integrity

Para cada transfer POSTED:

```text
exactly one TRANSFER_OUT

exactly one TRANSFER_IN
```

---

# 33. Transfer Amount Integrity

Debe cumplirse:

```text
out amount
=
in amount
=
transfer amount
```

en transferencias same-currency V1.

---

# 34. Debt Payment Integrity

Para cada payment POSTED:

```text
SUM(allocations)
=
payment.amount
```

---

# 35. Installment Integrity

Debe cumplirse:

```text
allocated amount <= installment total
```

y:

```text
remaining >= 0
```

---

# 36. Debt Integrity

```text
debt remaining >= 0
```

y una deuda PAID debería tener:

```text
all non-cancelled installments remaining = 0
```

---

# 37. Scheduled Integrity

Una scheduled transaction POSTED debe tener:

```text
exactly one postedTransactionId
```

---

# 38. Recurring Integrity

No debe existir duplicado:

```text
recurringTransactionId
+
scheduledDate
```

---

# 39. Billing Integrity

Para billing:

```text
provider subscription IDs unique

provider payment IDs unique

subscription user exists

plan exists
```

---

# 40. Account Ownership Integrity

Cada:

```text
transaction

debt

budget

subscription
```

debe apuntar a usuario válido.

---

# 41. Foreign Key Checks

Preferir FK reales para evitar orphan rows.

Después del restore:

```text
verify constraints valid
```

---

# 42. Balance Validation

No validar balances contra:

```text
stored current_balance
```

porque no existe como truth.

Recalcular balances desde ledger.

---

# 43. Balance Recalculation

Para cada cuenta:

```text
opening balance
+
posted ledger effect
=
calculated current balance
```

---

# 44. Projection Validation

No necesitamos restaurar projections derivadas.

Deben poder recalcularse desde datos canónicos.

---

# 45. Cache Recovery

Después de DB restore:

```text
invalidate caches
```

si existe riesgo de que reflejen estado futuro/incorrecto.

---

# 46. Redis Recovery

Redis no necesita backup obligatorio si:

```text
all state is rebuildable
```

---

# 47. After Redis Loss

Esperado:

```text
rate limits reset

jobs may need regeneration/reconciliation

cache cold
```

Pero:

```text
financial state remains correct
```

---

# 48. Queue Recovery

Después de Redis loss:

reconstruir jobs importantes desde DB.

Ejemplos:

```text
recurring generation

pending reminders

billing reconciliation
```

---

# 49. Job Rebuild

Crear procedimientos como:

```text
enqueue missing recurring jobs

enqueue due reminders

enqueue subscription reconciliation
```

basados en DB.

---

# 50. S3 Backup

Cuando existan attachments:

S3-compatible storage puede contener:

```text
receipts

statements

exports
```

---

# 51. Storage Recovery

La DB contiene metadata.

Storage contiene object data.

Ambos deben poder correlacionarse.

---

# 52. Object Versioning

Si provider lo soporta:

```text
object versioning
```

puede reducir riesgo de deletion accidental.

---

# 53. File Retention

Debe alinearse con:

```text
user deletion

attachment deletion

backup retention
```

---

# 54. Orphan File Detection

Debe poder detectarse:

```text
DB attachment without object

object without DB attachment
```

---

# 55. Mercado Pago Recovery

Mercado Pago mantiene estado externo.

Si nuestra DB pierde parte del billing state:

podemos reconstruir mediante:

```text
provider subscription IDs

provider queries

webhook history

reconciliation
```

---

# 56. Billing Recovery Principle

No crear suscripciones nuevas para “reparar” estado local.

Primero:

```text
fetch provider truth
↓
reconcile local projection
```

---

# 57. Billing Recovery After DB Restore

Después de restore antiguo:

algunas suscripciones pueden haber cambiado externamente desde ese punto.

Por eso:

```text
reconcile all relevant subscriptions
```

antes de asumir acceso correcto.

---

# 58. Billing Reconciliation Set

Procesar:

```text
PENDING

ACTIVE

PAST_DUE

PAUSED

recently CANCELLED
```

según disponibilidad del provider.

---

# 59. Billing Payment Recovery

Consultar provider para pagos relevantes si existe divergencia.

Upsert por:

```text
providerPaymentId
```

---

# 60. Webhook Replay After Restore

No depender de que Mercado Pago vuelva a enviar todos los eventos históricos.

Reconciliation debe poder reconstruir estado actual sin replay completo.

---

# 61. OpenRouter Recovery

OpenRouter no contiene truth financiera.

No necesitamos recuperar generaciones AI para que el producto funcione.

---

# 62. AI Telemetry Loss

Puede considerarse:

```text
analytics loss
```

no financial data loss.

---

# 63. AI Suggestions

Una suggestion no confirmada:

```text
is disposable
```

---

# 64. AI Accepted Category

Una vez confirmada:

```text
transaction.categoryId
```

está en PostgreSQL y se recupera con DB.

---

# 65. Accidental Transaction Deletion

Idealmente no existe hard delete normal.

Si ocurre por bug:

```text
PITR
```

puede ser necesario.

---

# 66. Selective Transaction Recovery

Si solo pocas rows fueron borradas:

```text
restore backup to isolated DB

extract affected records

review dependencies

reinsert via controlled repair script
```

---

# 67. Never Copy Only Parent Row Blindly

Ejemplo:

restaurar `DebtPayment` sin:

```text
Transaction

PaymentAllocations
```

puede corromper estado.

Recuperar el aggregate completo.

---

# 68. Aggregate Recovery

Unidades importantes:

```text
Transfer + both legs

DebtPayment + transaction + allocations

Scheduled posting + posted transaction

Billing subscription + related payments
```

---

# 69. Repair Scripts

Todo script de producción debe soportar:

```text
dry-run
```

cuando sea razonable.

---

# 70. Repair Script Output

Debe mostrar:

```text
records scanned

records affected

changes proposed

invariants before

invariants after
```

---

# 71. Repair Approval

Cambios masivos requieren revisión humana.

No ejecutar automáticamente una reparación destructiva.

---

# 72. Idempotent Repair

Cuando sea posible:

```text
running repair twice
=
same final result
```

---

# 73. Corruption Detection

Posibles señales:

```text
negative installment remaining

unpaired transfers

duplicate scheduled posting

unexpected duplicate provider IDs
```

---

# 74. Integrity Audit Command

Crear futuro comando:

```text
pnpm finance:audit
```

---

# 75. Finance Audit

Puede verificar:

```text
transfer invariants

debt invariants

scheduled invariants

currency consistency
```

---

# 76. Read-Only Audit

Por defecto:

```text
does not modify data
```

---

# 77. Audit Output

Ejemplo:

```text
Transfers checked: 12,450
Invalid transfers: 0

Debt payments checked: 4,200
Allocation mismatches: 0
```

---

# 78. Recovery Validation Command

Crear:

```text
pnpm recovery:validate
```

o integrar validadores existentes.

---

# 79. Restore Validation Layers

Después de restore:

```text
DB connectivity

schema compatibility

foreign keys

financial invariants

auth smoke

product smoke

billing reconciliation
```

---

# 80. Schema Version

Restore puede corresponder a una versión anterior del schema.

Nunca arrancar automáticamente código nuevo contra DB restaurada sin revisar migrations.

---

# 81. Restore Migration Strategy

Si backup está atrás:

```text
restore
↓
verify source schema
↓
apply known forward migrations
↓
validate again
```

---

# 82. Never Edit Historical Migration

Una migration ya aplicada no debe modificarse para hacer que restore “funcione”.

Crear una nueva corrección.

---

# 83. Application Version Compatibility

Idealmente registrar:

```text
release/version
```

asociada temporalmente a backups importantes.

---

# 84. Release Backup

Antes de migrations de alto riesgo:

```text
create/verify recoverable backup
```

---

# 85. High-Risk Migration Examples

```text
money precision changes

transaction type migration

debt allocation rewrite

user ownership backfill
```

---

# 86. Low-Risk Migration

Ejemplo:

```text
add nullable metadata field
```

normalmente requiere menos precaución.

---

# 87. Recovery From Bad Deployment

Caso:

nuevo deploy escribe datos incorrectamente.

Procedimiento:

```text
disable affected feature

rollback code

determine corruption window

restore isolated PITR before incident

compare

selective repair or full restore
```

---

# 88. Full Restore Decision

Usar full restore si:

```text
corruption is broad

affected rows cannot be identified safely

selective repair risk > downtime risk
```

---

# 89. Selective Repair Decision

Usar si:

```text
corruption scope known

few records affected

correct state recoverable deterministically
```

---

# 90. Recovery From Account Takeover

No restaurar toda DB.

Acciones pueden incluir:

```text
invalidate sessions

reset credentials

identify unauthorized mutations

restore/reverse affected records
```

---

# 91. Unauthorized Financial Mutation

Preferir:

```text
reversal

void

controlled repair
```

antes que ocultar historia.

---

# 92. Recovery From User Mistake

Si usuario borra/anula algo mediante flujo permitido:

eso no siempre es disaster recovery.

Usar feature-level correction flow.

---

# 93. Backup Is Not Undo

No usar backups como sustituto de:

```text
void

reversal

archive
```

---

# 94. Recovery Permissions

Solo operadores autorizados deben poder:

```text
restore DB

download backup

run repair
```

---

# 95. Recovery Audit Trail

Registrar:

```text
who

when

why

backup used

commands/scripts used

result
```

---

# 96. Credentials During Recovery

Nunca copiar producción secrets a ambientes inseguros innecesariamente.

---

# 97. Isolated Restore Security

Una restauración contiene datos reales.

Debe protegerse igual que producción.

---

# 98. Local Developer Machines

No descargar production DB completa a laptops como procedimiento normal.

---

# 99. Sanitized Restore

Para debugging no productivo:

preferir:

```text
sanitized dataset
```

si no se necesita PII real.

---

# 100. Disaster Scenarios

Debemos poder responder al menos a:

```text
Postgres unavailable

Postgres data corruption

accidental mass deletion

Redis loss

worker outage

Mercado Pago webhook outage

provider state drift

S3 file loss

bad migration

credential compromise
```

---

# 101. Scenario — PostgreSQL Outage

```text
Web cannot safely process financial writes.
```

Expected:

```text
return safe errors

do not fake success
```

---

# 102. Scenario — Temporary DB Outage

No intentar almacenar movimientos en:

```text
browser

Redis
```

para “sincronizar después” en V1.

Eso aumenta riesgo.

---

# 103. Scenario — Redis Outage

Expected:

```text
core synchronous financial product continues where possible
```

Background capabilities pueden degradarse.

---

# 104. Scenario — Worker Outage

Possible impact:

```text
recurring occurrence generation delayed

reminders delayed

billing reconciliation delayed
```

Core ledger remains available.

---

# 105. Worker Recovery

Después de volver:

```text
jobs catch up idempotently
```

---

# 106. Scenario — Mercado Pago Outage

Existing local entitlements continue según estado conocido.

New subscription actions pueden fallar temporalmente.

---

# 107. Scenario — OpenRouter Outage

AI features unavailable.

Manual flows remain available.

---

# 108. Scenario — S3 Outage

Attachments unavailable.

Core finance remains usable.

---

# 109. Recovery Drill

Ejecutar periódicamente un ejercicio real.

No solamente leer documentación.

---

# 110. Initial Drill Frequency

Antes de launch:

```text
at least one full restore drill
```

Después:

```text
periodic restore drill
```

por ejemplo trimestral cuando el producto madure.

---

# 111. Restore Drill Steps

```text
choose recent backup

restore isolated DB

apply required migrations

run integrity audit

run smoke tests

record duration

record issues
```

---

# 112. Measure Actual RTO

No asumir RTO.

Durante drill medir:

```text
time to restore

time to validate

time to make service usable
```

---

# 113. Measure Actual RPO

Verificar:

```text
latest recoverable timestamp
```

contra objetivo.

---

# 114. Drill Findings

Cada problema encontrado debe producir:

```text
runbook update

automation improvement

test

infrastructure change
```

cuando corresponda.

---

# 115. Backup Monitoring

Alertar si:

```text
backup fails

backup missing

backup too old
```

---

# 116. Restore Monitoring

Registrar cuándo fue la última restauración exitosa de prueba.

---

# 117. Backup Freshness

Métrica:

```text
age of latest successful backup
```

---

# 118. Recovery Dashboard

No necesario V1.

Pero operadores deben poder conocer:

```text
last backup

last restore test

PITR availability
```

---

# 119. Billing Recovery Audit

Después de DB restore ejecutar:

```text
subscription reconciliation
```

y revisar:

```text
state mismatches

payment mismatches
```

---

# 120. Recurring Recovery Audit

Después de restore:

ejecutar:

```text
GenerateRecurringOccurrences
```

de forma idempotente para completar horizonte faltante.

---

# 121. Reminder Recovery

Recalcular reminders pendientes.

No reenviar automáticamente reminders muy antiguos sin política.

---

# 122. Stale Reminder Policy

Ejemplo:

```text
reminder was due 10 days ago
```

puede marcarse:

```text
EXPIRED / SKIPPED
```

en vez de enviar ahora.

Definir política cuando notifications sean implementadas.

---

# 123. Scheduled Transaction Recovery

Scheduled rows permanecen en DB.

No postearlas automáticamente después de restore.

---

# 124. Debt Recovery

Después de restore validar:

```text
payment allocation sums

remaining amounts

statuses
```

---

# 125. Derived Status Recovery

Estados como:

```text
OVERDUE
```

pueden recalcularse.

No son reason para restaurar backup distinto si datos base son correctos.

---

# 126. Dashboard Recovery

No necesita backup especial.

Se recalcula.

---

# 127. Cashflow Recovery

También se recalcula.

---

# 128. Budget Recovery

Budget consumption se reconstruye desde:

```text
budget config
+
transactions
```

---

# 129. Net Worth Recovery

Derivado.

No requiere snapshot para funcionar.

---

# 130. Future Snapshots

Si luego existen snapshots históricos:

siguen siendo:

```text
derived historical data
```

y pueden reconstruirse parcialmente si existe ledger completo.

---

# 131. Data Export As Secondary Safety

User export no reemplaza backup.

Pero puede aportar portabilidad.

---

# 132. Backup Integrity

Cuando provider permita checksums:

validarlos.

---

# 133. Logical Backup Validation

Al menos comprobar:

```text
backup file readable

restore succeeds

expected tables exist
```

---

# 134. Row Count Sanity Checks

Después de restore comparar:

```text
users

transactions

accounts

debts

subscriptions
```

contra valores esperados aproximados.

---

# 135. Financial Aggregate Sanity

Comparar agregados globales no sensibles si se registran operativamente.

Ejemplo:

```text
number of transactions

number of active subscriptions
```

No necesariamente montos globales.

---

# 136. Restore Smoke — Auth

Verificar:

```text
known test user can authenticate
```

en entorno seguro de prueba.

---

# 137. Restore Smoke — Account

```text
account list loads

balance calculation works
```

---

# 138. Restore Smoke — Transactions

```text
transaction history loads
```

---

# 139. Restore Smoke — Debt

```text
debt detail loads

remaining recalculates
```

---

# 140. Restore Smoke — Dashboard

```text
dashboard summary calculates
```

---

# 141. Restore Smoke — Billing

En entorno sin llamar producción accidentalmente:

verificar estructura local.

Para estado real:

usar reconciliation controlada.

---

# 142. Prevent External Side Effects During Restore Tests

Un restored production DB en staging no debe:

```text
send real emails

charge users

call production webhooks

send reminders

run production queues
```

---

# 143. Recovery Environment Flag

Config:

```text
RECOVERY_MODE=true
```

o equivalente puede deshabilitar side effects.

---

# 144. Recovery Mode

Debe impedir:

```text
billing mutations

notifications

background automation

external writes
```

durante validación.

---

# 145. Read External Provider Carefully

Puede ser útil consultar estado en recovery.

Pero no modificarlo.

---

# 146. Production Promotion

Si se decide promover restored DB:

```text
freeze writes

perform final sync/cutover

switch DATABASE_URL/service

run health

run smoke

resume writes
```

---

# 147. Lost Writes During Cutover

Debemos evitar que usuarios escriban simultáneamente en DB vieja y nueva.

Usar ventana de mantenimiento si es necesario.

---

# 148. DNS/Application Switch

En Railway probablemente se realiza mediante cambio de service/env/database attachment.

Documentar procedimiento exacto cuando infraestructura esté creada.

---

# 149. Backup Deletion

Backups expiran según retention.

Eliminar manualmente backups recientes requiere autorización especial.

---

# 150. User Deletion vs Backup Retention

Datos eliminados pueden permanecer en backup hasta que expire.

Debe estar documentado en política de privacidad.

---

# 151. Legal Hold

Si en futuro existen obligaciones legales:

retention puede variar.

No implementar sin requisito concreto.

---

# 152. Production Restore Access

Mantener lista de roles autorizados.

Ejemplo:

```text
Operations

Lead Engineer
```

según equipo.

---

# 153. Small Team Reality

Si inicialmente solo existe un operador:

documentar al menos:

```text
where credentials are

how restore works

what to do if primary operator unavailable
```

---

# 154. Emergency Documentation

El runbook debe ser accesible incluso si la aplicación está caída.

No almacenarlo únicamente dentro de la propia app.

---

# 155. Recovery Scripts In Repository

Guardar:

```text
scripts/recovery/
```

cuando existan automatizaciones.

---

# 156. Suggested Structure

```text
scripts/recovery/
├── validate-financial-integrity.ts
├── compare-restores.ts
├── reconcile-billing.ts
└── README.md
```

---

# 157. No Destructive Default

Scripts deben ejecutar por defecto:

```text
read-only / dry-run
```

cuando sea posible.

---

# 158. Explicit Apply

Cambios pueden requerir flag:

```text
--apply
```

para evitar ejecución accidental.

---

# 159. Environment Guard

Scripts de reparación deben confirmar explícitamente environment.

No permitir:

```text
production mutation
```

por error de URL.

---

# 160. Confirmation

Para operaciones destructivas:

```text
explicit production flag
+
operator confirmation
```

si son manuales.

---

# 161. Recovery Logging

Guardar reporte:

```text
timestamp

incident

backup ID

restore target

validation result

operator

actions
```

---

# 162. Incident Link

Si existe sistema de incidentes:

vincular recovery report.

---

# 163. Recovery Metrics

Medir:

```text
backup success rate

backup age

restore test success

restore duration

integrity violations
```

---

# 164. Recovery Alert Severity

Critical:

```text
no recent database backup

restore repeatedly failing

PITR unavailable unexpectedly
```

---

# 165. Deployment Gate

Cambios de alto riesgo financiero no deben desplegarse si:

```text
backup system is known broken
```

---

# 166. High-Risk Release Checklist

```text
[ ] recent backup exists

[ ] restore path known

[ ] migration reviewed

[ ] financial tests pass

[ ] rollback code path known

[ ] feature flag available when possible
```

---

# 167. Backup Checklist

```text
[ ] automated

[ ] encrypted

[ ] monitored

[ ] retained

[ ] access controlled

[ ] restore tested
```

---

# 168. Restore Checklist

```text
[ ] restore isolated first

[ ] schema compatible

[ ] migrations applied carefully

[ ] integrity audit passes

[ ] auth works

[ ] financial smoke tests pass

[ ] billing reconciled

[ ] external side effects disabled during validation
```

---

# 169. Financial Recovery Checklist

```text
[ ] transfers paired

[ ] transfer amounts match

[ ] debt allocation sums match payments

[ ] no overpaid installments

[ ] no negative debt remaining

[ ] scheduled posting unique

[ ] account balances recalculate

[ ] currencies consistent
```

---

# 170. Billing Recovery Checklist

```text
[ ] provider subscription IDs unique

[ ] provider payment IDs unique

[ ] relevant subscriptions reconciled

[ ] effective access recalculated

[ ] duplicate provider state not created
```

---

# 171. Worker Recovery Checklist

```text
[ ] recurring generation caught up

[ ] reminder policy applied

[ ] billing reconciliation queued

[ ] duplicate jobs safe
```

---

# 172. Storage Recovery Checklist

Cuando storage exista:

```text
[ ] object access works

[ ] ownership preserved

[ ] missing objects detected

[ ] orphan objects detectable
```

---

# 173. Recovery Definition of Done

La plataforma tiene una estrategia de recuperación válida cuando podemos:

```text
restore PostgreSQL

validate financial invariants

rebuild derived data

reconcile billing

recover background jobs

verify user isolation

resume traffic safely
```

---

# 174. Production Requirement

No lanzar producción con datos reales hasta haber ejecutado al menos:

```text
one successful restore drill
```

sobre un backup representativo.

---

# 175. Core Recovery Invariants

Nunca romper:

```text
PostgreSQL is the primary financial source of truth.

Redis loss must not cause financial loss.

AI telemetry loss must not affect financial truth.

Derived projections must be rebuildable.

Billing can be reconciled from Mercado Pago.

A restore is validated before promotion.

Financial repairs are deterministic and auditable.

Backups are never treated as an undo button for normal product workflows.
```

---

# 176. Next Documentation Step

Con este documento queda cerrado el bloque originalmente identificado como pendiente:

```text
11 Transfers

12 Debts / Installments / Payments

13 Planning / Recurring

14 Dashboard / Cashflow

15 Budgets

16 Billing / Mercado Pago

17 AI Categorization

18 Production Readiness

19 Security & Privacy

20 Backup & Recovery
```

A partir de este punto no conviene seguir creando documentación global indiscriminadamente.

El siguiente paso recomendado es:

```text
Implementation
```

empezando por el primer vertical slice:

```text
docs/06-accounts-transactions-vertical-slice.md
```

y avanzando en orden:

```text
06 Accounts + Transactions

11 Transfers

12 Debts

13 Planning

14 Dashboard

15 Budgets

16 Billing

17 AI
```

Los nuevos documentos deberían crearse únicamente cuando aparezca una decisión arquitectónica concreta que necesite un:

```text
ADR
```

o una feature nueva que requiera su propio vertical slice.
