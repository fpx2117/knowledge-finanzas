# Production Readiness

## 1. Objetivo

Este documento define los requisitos mínimos para desplegar y operar la aplicación en producción de forma segura y confiable.

El objetivo es garantizar:

```text
financial correctness

data durability

secure secrets

safe deployments

billing reliability

AI reliability

observability

recoverability
```

La producción no se considera lista únicamente porque:

```text
pnpm build
```

funcione.

---

# 2. Production Architecture

Arquitectura objetivo:

```text
Railway

├── Web
├── Worker
├── PostgreSQL
└── Redis
```

Servicios externos:

```text
Mercado Pago
OpenRouter
S3-compatible storage
```

No todos son obligatorios desde el primer release.

---

# 3. Minimum Production Deployment

La versión mínima funcional puede usar:

```text
Web
+
PostgreSQL
```

si todavía no existen:

```text
background jobs

AI

storage

recurring processing
```

---

# 4. Full Production Deployment

Cuando las capabilities estén activas:

```text
Web
+
Worker
+
PostgreSQL
+
Redis
+
OpenRouter
+
Mercado Pago
+
S3-compatible storage
```

---

# 5. Environment Separation

Mantener al menos:

```text
development

production
```

Recomendado:

```text
development

preview/staging

production
```

si el flujo de Railway lo permite.

---

# 6. Never Share Production Resources

Development no debe usar accidentalmente:

```text
production PostgreSQL

production Redis

production Mercado Pago credentials

production OpenRouter key
```

---

# 7. Environment Variable Validation

Todas las variables deben validarse al iniciar.

Usar:

```text
packages/config
```

o equivalente.

---

# 8. Required Core Variables

Ejemplo conceptual:

```text
NODE_ENV

DATABASE_URL

BETTER_AUTH_SECRET

BETTER_AUTH_URL
```

---

# 9. Optional Capability Variables

Cuando estén habilitadas:

```text
REDIS_URL

OPENROUTER_API_KEY

MERCADOPAGO_ACCESS_TOKEN

MERCADOPAGO_WEBHOOK_SECRET

S3_ENDPOINT

S3_BUCKET

S3_ACCESS_KEY_ID

S3_SECRET_ACCESS_KEY
```

---

# 10. Feature Flag Validation

Si:

```text
AI_ENABLED=true
```

entonces:

```text
OPENROUTER_API_KEY
AI_MODEL_FAST
```

deben existir.

Si:

```text
BILLING_ENABLED=true
```

entonces deben existir credenciales de billing necesarias.

---

# 11. Fail Fast

Si falta una variable crítica:

```text
application startup must fail
```

con error claro.

No arrancar parcialmente con configuración insegura.

---

# 12. Secrets

Nunca almacenar secretos en:

```text
Git

Dockerfile

client bundle

public env vars

logs
```

---

# 13. .env.example

Mantener:

```text
.env.example
```

sin valores reales.

Debe documentar:

```text
variable name

purpose

required/optional
```

---

# 14. Railway Secrets

Configurar secretos mediante variables del entorno de Railway.

No bakearlos en la imagen.

---

# 15. Production Database

PostgreSQL es la source of truth.

Debe tener:

```text
persistent storage

backups

migration discipline

restricted access
```

---

# 16. Database Connection

Usar:

```text
DATABASE_URL
```

desde backend únicamente.

No exponer conexión DB al cliente.

---

# 17. Connection Pooling

Configurar pool compatible con:

```text
Railway

Next.js runtime

worker concurrency
```

Evitar abrir una conexión nueva sin límites por request.

---

# 18. Database Migration Policy

Toda modificación de schema requiere:

```text
Drizzle schema change

migration generation

migration review

migration execution
```

---

# 19. No Manual Production Schema Changes

Evitar:

```text
ALTER TABLE
```

manual en producción sin migration registrada.

---

# 20. Migration Before Application

Un deploy que necesita nuevo schema debe coordinar:

```text
migration
↓
application deployment
```

según compatibilidad.

---

# 21. Expand / Migrate / Contract

Para cambios peligrosos usar:

```text
expand

migrate

contract
```

en lugar de cambiar schema de forma destructiva en un solo release.

---

# 22. Example Safe Migration

En vez de:

```text
rename column immediately
```

hacer:

```text
add new column
↓
write both if necessary
↓
backfill
↓
switch reads
↓
remove old column later
```

---

# 23. Financial Data Migration

Cambios que afecten:

```text
amounts

balances

payments

installments

currencies
```

requieren validaciones adicionales.

---

# 24. Migration Financial Invariants

Después de migración comprobar cuando aplique:

```text
debt remaining >= 0

installment remaining >= 0

payment allocations remain balanced

transfer legs remain paired

currencies remain consistent
```

---

# 25. Migration Rollback

No asumir que toda migration puede revertirse automáticamente.

Para cambios destructivos:

```text
restore backup
```

puede ser la única recuperación segura.

---

# 26. Database Backup

Antes de lanzamiento debe existir backup automático.

Requerimiento:

```text
scheduled backups
```

con política de retención conocida.

---

# 27. Backup Is Not Enough

Un backup no sirve si nunca se probó restaurarlo.

Debe existir:

```text
restore test
```

periódico.

---

# 28. Backup Requirements

Documentar:

```text
frequency

retention

storage location

encryption

restore procedure
```

---

# 29. Point-In-Time Recovery

Si Railway/Postgres plan lo soporta:

```text
PITR
```

es altamente recomendable para datos financieros.

---

# 30. Recovery Objectives

Antes de producción definir:

```text
RPO

RTO
```

aunque sean inicialmente aproximados.

---

# 31. Example Definitions

```text
RPO
maximum acceptable data loss window

RTO
maximum acceptable recovery duration
```

---

# 32. Financial Data Priority

Para este producto:

```text
financial ledger
```

tiene prioridad máxima de recuperación.

---

# 33. Health Endpoint

Crear:

```text
/api/health
```

---

# 34. Basic Health

Debe verificar:

```text
application running
```

y opcionalmente DB connectivity ligera.

---

# 35. Health Response

No exponer:

```text
secrets

internal stack traces

database credentials
```

---

# 36. Example

```json
{
  "status": "ok"
}
```

---

# 37. Readiness vs Liveness

Si infraestructura lo permite, diferenciar:

```text
liveness

readiness
```

Liveness:

```text
process alive
```

Readiness:

```text
ready to serve traffic
```

---

# 38. Database Health

Readiness puede ejecutar:

```text
SELECT 1
```

o equivalente ligero.

---

# 39. External Providers In Health

No hacer que:

```text
OpenRouter down
```

marque todo web como unhealthy.

AI es capability opcional.

---

# 40. Mercado Pago Health

Tampoco consultar Mercado Pago en cada health check.

Billing usa estado local + webhooks/reconciliation.

---

# 41. Deep Health

Puede existir endpoint interno:

```text
/internal/health/deep
```

protegido.

Puede verificar:

```text
database

redis

AI configuration

billing configuration
```

sin ser liveness principal.

---

# 42. Web Service

Responsabilidades:

```text
UI

Server Actions

Route Handlers

Auth

Read models

Synchronous mutations

Webhook endpoints
```

---

# 43. Worker Service

Responsabilidades:

```text
recurring generation

reminders

billing reconciliation

bulk imports

future AI batch jobs
```

---

# 44. Worker Not Required Prematurely

No desplegar worker vacío si no existen jobs.

---

# 45. Worker Process

Debe tener entrypoint separado.

Ejemplo:

```text
apps/worker
```

---

# 46. Worker Shutdown

Debe manejar:

```text
SIGTERM
```

para terminar jobs de forma controlada cuando Railway redeploya.

---

# 47. Queue

BullMQ usa:

```text
Redis
```

---

# 48. Redis Is Not Truth

Redis nunca es source of truth para:

```text
balances

payments

subscriptions

transactions
```

---

# 49. Queue Retry

Jobs deben definir:

```text
retry policy

backoff

max attempts
```

según tipo.

---

# 50. Idempotent Jobs

Obligatorio para:

```text
recurring generation

billing reconciliation

notifications

imports
```

---

# 51. Dead Letter Handling

Jobs que fallan repetidamente deben quedar observables.

Puede implementarse mediante:

```text
failed jobs

dead-letter queue

admin monitoring
```

---

# 52. Scheduled Jobs

Jobs periódicos pueden incluir:

```text
generate recurring occurrences

send reminders

billing reconciliation

expire stale pending subscriptions
```

---

# 53. Cron Strategy

Puede utilizar:

```text
Railway cron

worker scheduler

BullMQ repeatable jobs
```

Elegir una estrategia central.

No duplicar schedulers.

---

# 54. Timezone Jobs

Jobs globales operan en UTC.

Pero reglas financieras usan:

```text
user.timezone
```

---

# 55. Recurring Generation Window

No depender de ejecutar exactamente a medianoche del usuario.

El generator debe ser capaz de:

```text
catch up safely
```

---

# 56. Reminder Timing

Los reminders sí requieren conversión precisa desde:

```text
user local time
```

a:

```text
UTC timestamp
```

---

# 57. Authentication

Better Auth debe configurarse con:

```text
production URL

secure secret

secure cookies
```

---

# 58. Cookies

En producción:

```text
Secure

HttpOnly

SameSite
```

según compatibilidad de auth.

---

# 59. HTTPS

Producción debe usar:

```text
HTTPS
```

siempre.

---

# 60. Auth Redirect URLs

Validar dominios de producción.

No dejar redirects arbitrarios controlables por usuario.

---

# 61. Session Security

No almacenar información sensible innecesaria dentro de session payloads.

---

# 62. Authorization

Todo recurso financiero privado requiere ownership.

Nunca confiar en:

```text
UI hiding controls
```

como autorización.

---

# 63. IDOR Protection

Casos críticos:

```text
/accounts/:id

/transactions/:id

/debts/:id

/budgets/:id

/billing subscription
```

deben filtrar por usuario.

---

# 64. Error Leakage

Un recurso de otro usuario puede responder como:

```text
NOT_FOUND
```

para no revelar existencia.

---

# 65. Security Headers

Configurar headers apropiados:

```text
Content-Security-Policy

X-Content-Type-Options

Referrer-Policy

Permissions-Policy
```

según necesidades reales.

---

# 66. Frame Protection

Evitar clickjacking usando:

```text
frame-ancestors
```

en CSP o equivalente.

---

# 67. HSTS

Habilitar:

```text
Strict-Transport-Security
```

cuando HTTPS/domain setup sea estable.

---

# 68. CSP

Construir una CSP compatible con:

```text
Next.js

Mercado Pago redirects

S3 assets

analytics if any
```

No usar:

```text
*
```

indiscriminadamente.

---

# 69. CSRF

Server Actions/auth framework deben seguir protección apropiada.

Endpoints externos como webhooks:

```text
do not use browser session CSRF model
```

sino autenticidad del proveedor.

---

# 70. Rate Limiting

Aplicar al menos en:

```text
auth-sensitive operations

AI

billing refresh

webhook abuse-sensitive endpoints

future imports
```

---

# 71. Rate Limit Storage

Puede utilizar Redis cuando esté disponible.

---

# 72. Rate Limit Failure

No bloquear operaciones financieras críticas por una dependencia Redis caída si puede evitarse.

Diferenciar:

```text
security rate limit

product quota
```

según criticidad.

---

# 73. AI Rate Limiting

Aplicar:

```text
userId + capability
```

---

# 74. Billing Refresh Rate Limit

Evitar que usuario haga:

```text
refresh provider
```

cientos de veces.

---

# 75. Webhook Rate Limiting

No aplicar un rate limit ingenuo que descarte eventos legítimos del proveedor.

Primero verificar autenticidad e idempotencia.

---

# 76. Logging

Usar structured logs.

Campos útiles:

```text
timestamp

level

requestId

operation

userId when appropriate

entityId

duration

result
```

---

# 77. Request ID

Cada request debería tener un identificador correlacionable.

---

# 78. Job ID

Worker logs deben incluir:

```text
jobId

jobType
```

---

# 79. Sensitive Logging

Nunca loggear:

```text
password

auth token

API key

card data

CVV

raw bank credentials
```

---

# 80. Financial Logging

Evitar loggear innecesariamente:

```text
full transaction descriptions

notes

complete account histories
```

---

# 81. Billing Logging

No loggear:

```text
Mercado Pago access token

webhook secret

authorization headers
```

---

# 82. AI Logging

No guardar por defecto:

```text
raw prompt

raw transaction description

full response
```

si contiene datos privados.

---

# 83. Error Tracking

Configurar una herramienta o estrategia para capturar excepciones.

Debe permitir:

```text
stack trace

request correlation

release version
```

sin exponer secretos.

---

# 84. Financial Error Severity

Errores como:

```text
negative debt remaining

allocation mismatch

half-created transfer
```

deben tratarse como:

```text
critical
```

---

# 85. Alerting

Crear alertas operativas para:

```text
web error spike

worker failure spike

billing webhook failures

database connectivity

queue backlog
```

según infraestructura disponible.

---

# 86. Billing Alerting

Prioridad alta:

```text
Mercado Pago webhook processing failures

subscription synchronization failures
```

porque afectan ingresos y acceso.

---

# 87. AI Alerting

Alertar si:

```text
provider error rate spikes

cost spikes unexpectedly

invalid output increases
```

pero AI outage no debe tumbar producto core.

---

# 88. Metrics

Medir al menos:

```text
HTTP request rate

HTTP error rate

latency

DB query latency

job failures
```

---

# 89. Product Critical Metrics

También:

```text
transaction creation failures

debt payment failures

transfer failures

scheduled posting failures
```

---

# 90. Billing Metrics

```text
subscription starts

subscription activations

payment failures

webhook processing failures

cancellations
```

---

# 91. AI Metrics

```text
requests

failures

latency

tokens

cost

suggestion acceptance
```

---

# 92. Database Query Performance

Revisar query plans para:

```text
dashboard

transaction list

account balances

upcoming obligations

cashflow
```

---

# 93. N+1 Detection

Evitar N+1 especialmente en:

```text
dashboard

accounts

debt detail

budget overview
```

---

# 94. Index Review

Antes de producción revisar índices usados por queries reales.

No agregar índices sin necesidad porque también encarecen writes.

---

# 95. Pagination

Listados que pueden crecer deben paginar.

Especialmente:

```text
transactions

billing payments

AI generations

webhook events
```

---

# 96. Transaction Pagination

Preferir:

```text
cursor pagination
```

cuando el volumen crezca.

V1 puede usar paginación simple si es suficiente.

---

# 97. Database Transaction Boundaries

Verificar atomicidad en:

```text
Transfer

Debt Payment

Scheduled Posting

Webhook Billing Synchronization
```

---

# 98. Financial Concurrency

Antes de producción probar:

```text
double debt payment

double scheduled posting

double transfer submit
```

---

# 99. Idempotency

Operaciones externas/retriables deben tener estrategia.

Incluye:

```text
Mercado Pago webhooks

recurring generation

billing reconciliation

bulk jobs
```

---

# 100. Webhook Production URL

Mercado Pago webhook debe apuntar a endpoint:

```text
HTTPS
```

estable.

---

# 101. Webhook Verification

Antes de producción:

```text
invalid signature
→ rejected
```

```text
valid notification
→ processed
```

---

# 102. Webhook Idempotency Test

Enviar el mismo evento varias veces.

Resultado financiero/comercial debe ser idéntico.

---

# 103. Webhook Replay Safety

Eventos antiguos no deben revertir estado actual incorrectamente.

Siempre que sea apropiado:

```text
fetch current provider state
```

---

# 104. Mercado Pago Credentials

Separar:

```text
test credentials

production credentials
```

---

# 105. Production Billing Verification

Antes de abrir ventas:

```text
production plan exists

production providerPlanId correct

checkout works

webhook works

subscription activation works

cancellation works

failure state works
```

---

# 106. Billing Reconciliation

Debe existir forma manual y/o automática de:

```text
refresh subscription from provider
```

---

# 107. OpenRouter Production Key

Usar key separada para producción cuando sea posible.

---

# 108. OpenRouter Limits

Configurar:

```text
usage budget

rate limits
```

si la plataforma/proveedor lo permite.

---

# 109. Model Registry Validation

Antes de production:

```text
configured models exist

required capabilities supported
```

---

# 110. AI Kill Switch

Debe poder hacerse:

```text
AI_ENABLED=false
```

sin romper core.

---

# 111. AI Fallback

Si OpenRouter falla:

```text
manual categorization works
```

y resto de aplicación continúa.

---

# 112. AI Spend Monitoring

Revisar:

```text
daily cost

monthly cost

cost per capability

cost per Pro user
```

---

# 113. S3 Storage

Cuando attachments estén habilitados:

```text
private bucket
```

por defecto.

---

# 114. Storage Authorization

Nunca dar acceso a un archivo solo por conocer su key.

Validar ownership.

---

# 115. Signed URLs

Usar URLs temporales cuando corresponda.

---

# 116. Upload Validation

Validar:

```text
file size

mime type

extension where useful
```

---

# 117. Malware Scanning

Si se permiten archivos arbitrarios en producción pública, evaluar scanning.

No requerido para MVP sin attachments.

---

# 118. Data Retention

Antes de producción definir retención para:

```text
webhook logs

AI telemetry

application logs

uploaded files

deleted accounts
```

---

# 119. User Data Export

Diseñar al menos conceptualmente posibilidad futura de exportar:

```text
accounts

transactions

debts

budgets
```

---

# 120. Account Deletion

Antes de habilitar self-service deletion definir:

```text
what is deleted

what is retained

billing history requirements

legal retention
```

No implementar hard delete improvisado.

---

# 121. Privacy

Documentar claramente:

```text
what user data is stored

what data is sent to OpenRouter

what data is sent to Mercado Pago
```

---

# 122. External Provider Boundary

OpenRouter no necesita:

```text
billing data

full financial history
```

para categorization.

Mercado Pago no necesita:

```text
personal financial transactions

debts

budgets
```

para subscription billing.

---

# 123. Deployment Pipeline

Ideal:

```text
commit

↓
CI

↓
lint

↓
typecheck

↓
tests

↓
build

↓
deploy
```

---

# 124. CI Required Checks

Antes de merge/deploy:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

---

# 125. Migration CI

Validar que migrations:

```text
exist

are committed

apply from clean database
```

---

# 126. Integration Tests

Ejecutar al menos suite para:

```text
database repositories

financial mutations
```

en CI donde sea viable.

---

# 127. External Integration Tests

No ejecutar cobros reales ni OpenRouter real en cada CI.

Usar mocks/contracts.

---

# 128. Live Integration Tests

Puede existir pipeline manual para:

```text
Mercado Pago sandbox/test environment

OpenRouter live smoke
```

---

# 129. Deployment Strategy

Preferir deploys pequeños.

No lanzar simultáneamente:

```text
major DB rewrite

new billing

new auth

new AI
```

si puede evitarse.

---

# 130. Backward Compatibility

Durante rolling deploy, código viejo/nuevo puede coexistir brevemente.

Schema debe soportar esa transición cuando aplique.

---

# 131. Feature Flags

Usar flags para capabilities de riesgo:

```text
AI_CATEGORIZATION_ENABLED

BILLING_ENABLED

CSV_IMPORT_ENABLED
```

---

# 132. Release Gradual

Nueva feature crítica puede empezar:

```text
disabled
```

y activarse después de verificar deploy.

---

# 133. Rollback Strategy

Todo release debe tener respuesta a:

```text
¿Cómo vuelvo atrás?
```

---

# 134. Code Rollback

Puede ser:

```text
redeploy previous release
```

---

# 135. Database Rollback

No asumir:

```text
rollback migration
```

si destruyó datos.

---

# 136. Safer Database Rollback

Preferir migrations backward-compatible para que:

```text
old application
```

pueda seguir funcionando durante rollback.

---

# 137. Emergency Kill Switches

Útiles:

```text
AI_ENABLED=false

BILLING_NEW_SUBSCRIPTIONS_ENABLED=false

RECURRING_JOBS_ENABLED=false
```

sin detener toda la plataforma.

---

# 138. Billing Kill Switch

Si Mercado Pago integration presenta problemas:

```text
disable new checkout
```

pero mantener:

```text
existing entitlement reads
```

---

# 139. Worker Kill Switch

Poder pausar:

```text
recurring generation

reminders

billing reconciliation
```

independientemente.

---

# 140. Maintenance Mode

No es obligatorio inicialmente.

Puede agregarse si migraciones extraordinarias lo requieren.

---

# 141. Smoke Test After Deploy

Después de deploy comprobar:

```text
home/login loads

health ok

database reachable

auth works
```

---

# 142. Financial Smoke Test

En entorno de staging/test:

```text
create account

create income

create expense

verify balance
```

---

# 143. Transfer Smoke

Cuando esté activo:

```text
create transfer

verify both balances

verify income/expense unchanged
```

---

# 144. Debt Smoke

```text
create debt

record partial payment

verify remaining amount
```

---

# 145. Planning Smoke

```text
create scheduled expense

verify current balance unchanged

post it

verify balance changes once
```

---

# 146. Billing Smoke

```text
start test subscription

process test webhook

verify entitlement
```

---

# 147. AI Smoke

```text
request category suggestion

verify valid structured response
```

si live test está habilitado.

---

# 148. Production Seed Data

No ejecutar seed destructivo en producción.

---

# 149. Plan Catalog Seed

Puede existir migration/seed idempotente para:

```text
FREE

PRO_MONTHLY
```

---

# 150. Default Categories

También pueden generarse por usuario durante onboarding.

No insertar categorías globales privadas incorrectamente.

---

# 151. Demo/Test Accounts

No dejar credenciales demo privilegiadas en producción.

---

# 152. Admin Access

Si se crea admin interno:

```text
strong authorization

audit logs
```

---

# 153. No Direct DB Editing For Support

Evitar resolver incidentes modificando:

```text
balances

payment allocations

subscriptions
```

a mano.

Crear herramientas administrativas seguras cuando sea necesario.

---

# 154. Support Operations

Post-MVP puede incluir:

```text
refresh billing subscription

inspect webhook event

inspect failed job
```

---

# 155. Financial Corrections

Soporte no debe editar saldos directamente.

Usar:

```text
adjustments

reversals
```

cuando estén implementados.

---

# 156. Incident Severity

Ejemplos P0:

```text
cross-user data leak

financial corruption

duplicate debt payments

subscription charges duplicated due to our system
```

---

# 157. P1

```text
billing activation delayed

recurring generation broken

dashboard incorrect but ledger intact
```

---

# 158. P2

```text
AI suggestions unavailable

non-critical report issue

cosmetic UI bug
```

---

# 159. Incident Response

Para incidentes importantes:

```text
contain

disable risky capability

identify affected users/data

repair deterministically

document root cause

add regression test
```

---

# 160. Financial Repair Principle

Nunca ejecutar una corrección masiva sin:

```text
dry run

affected-record count

backup

validation query
```

---

# 161. Runbooks

Antes de producción conviene tener runbooks para:

```text
database restore

Mercado Pago webhook failure

subscription state mismatch

worker queue failure

AI provider outage
```

---

# 162. Billing Runbook

Debe responder:

```text
How do I find a subscription?

How do I refresh provider state?

How do I inspect latest webhook?

How do I verify entitlement?
```

---

# 163. Database Restore Runbook

Debe incluir:

```text
identify backup

restore to isolated environment

verify integrity

promote/replace safely
```

---

# 164. AI Outage Runbook

```text
disable AI flag if required

verify manual fallback

monitor provider status

re-enable after validation
```

---

# 165. Queue Runbook

```text
inspect failed jobs

identify retry-safe jobs

pause queue if needed

resume
```

---

# 166. Dependency Updates

No aplicar actualizaciones mayores automáticas a producción sin revisión.

Especialmente:

```text
Next.js

Drizzle

Better Auth

payment SDK

AI SDK/provider client
```

---

# 167. Lockfile

Commit:

```text
pnpm-lock.yaml
```

---

# 168. Node Version

Fijar versión de Node compatible.

Ejemplo mediante:

```text
engines

.tool-versions

.nvmrc
```

según proyecto.

---

# 169. Package Manager Version

Fijar:

```text
pnpm
```

version mediante `packageManager` si aplica.

---

# 170. Docker

Si Railway usa Docker:

```text
multi-stage build
```

recomendado.

No copiar:

```text
.env
```

dentro de imagen.

---

# 171. Non-Root Container

Cuando sea viable:

```text
run as non-root
```

---

# 172. Image Size

Evitar dependencias de desarrollo en runtime si no son necesarias.

---

# 173. Build Reproducibility

Deploy debe poder reproducirse desde:

```text
repository
+
lockfile
+
environment
```

---

# 174. Railway Configuration

Mantener:

```text
railway.toml
```

o configuración equivalente versionada cuando aporte valor.

---

# 175. Web Start Command

Debe ser explícito.

Ejemplo conceptual:

```text
pnpm --filter web start
```

---

# 176. Worker Start Command

```text
pnpm --filter worker start
```

---

# 177. Migration Command

Definir comando único:

```text
pnpm db:migrate
```

---

# 178. Migration Ownership

Solo una instancia/proceso debe ejecutar migrations de producción por deploy.

No hacer que cada web replica intente migrar simultáneamente.

---

# 179. Release Order Example

```text
1. Backup available

2. Run migration

3. Deploy web

4. Deploy worker

5. Smoke tests

6. Enable feature flag
```

---

# 180. Rollout With Billing

Para billing:

```text
deploy code

verify webhook endpoint

configure Mercado Pago

test with production/test account

enable new subscriptions
```

---

# 181. Rollout With AI

```text
deploy AI package

verify model config

live smoke test

enable AI_CATEGORIZATION_ENABLED
```

---

# 182. Monitoring After Release

Después de cada release revisar:

```text
error rate

latency

DB errors

queue failures

billing errors

AI errors
```

---

# 183. No Silent Financial Errors

Nunca atrapar una excepción financiera y continuar como si hubiera funcionado.

Ejemplo incorrecto:

```text
try payment
catch
return success
```

---

# 184. User-Safe Errors

Mostrar error amigable.

Pero registrar internamente:

```text
errorCode

requestId
```

---

# 185. Mutation Confirmation

Operaciones financieras importantes deben devolver estado confirmado desde server.

No asumir éxito solo por UI optimistic state.

---

# 186. Client Retry Safety

Si browser reintenta una mutación tras timeout:

backend debe proteger operaciones compuestas donde exista riesgo de duplicación.

---

# 187. Data Validation

Toda entrada externa:

```text
forms

webhooks

provider responses

CSV

AI outputs
```

debe validarse.

---

# 188. Provider Response Validation

No confiar ciegamente en tipos SDK.

Mapear y validar campos necesarios.

---

# 189. Production Security Review

Antes de lanzamiento revisar:

```text
auth

authorization

secrets

webhooks

rate limits

external calls

file access

billing

AI privacy
```

---

# 190. Dependency Vulnerabilities

Ejecutar revisión de dependencias periódica.

No actualizar automáticamente sin tests.

---

# 191. Financial Test Suite Release Blocker

Fallos en:

```text
Money

Balances

Transfers

Debt Payments

Installments

Cashflow
```

bloquean release.

---

# 192. Billing Test Suite Release Blocker

Si billing está habilitado:

```text
webhook verification

subscription synchronization

entitlements
```

deben pasar.

---

# 193. AI Test Failure

Si AI tests fallan pero AI puede apagarse:

se puede desplegar core con:

```text
AI_ENABLED=false
```

si decisión de release lo permite.

---

# 194. Accessibility Smoke

Antes de lanzamiento verificar:

```text
keyboard navigation

form labels

dialog focus

error announcements
```

en flujos principales.

---

# 195. Mobile Smoke

Probar al menos:

```text
Dashboard

Add Expense

Add Income

Transfer

Debt Payment

Billing
```

en viewport mobile.

---

# 196. Browser Support

Definir browsers soportados.

Como mínimo navegadores modernos compatibles con Next.js target.

---

# 197. Data Ownership Smoke

Crear dos usuarios test.

Verificar que:

```text
A cannot access B account

A cannot access B debt

A cannot access B billing
```

---

# 198. Production Launch Checklist

Antes de abrir a usuarios:

```text
[ ] production DB ready

[ ] automated backups enabled

[ ] restore procedure documented

[ ] migrations applied

[ ] auth secrets configured

[ ] HTTPS active

[ ] health endpoint works

[ ] monitoring works

[ ] error tracking works

[ ] core financial tests pass

[ ] ownership tests pass

[ ] mobile flows tested

[ ] privacy text reviewed
```

---

# 199. Billing Launch Checklist

Si billing se lanza:

```text
[ ] production Mercado Pago credentials

[ ] PRO plan mapped

[ ] pricing finalized

[ ] webhook configured

[ ] webhook signature verified

[ ] activation tested

[ ] failed payment tested

[ ] cancellation tested

[ ] entitlements server-side

[ ] reconciliation available

[ ] refund policy documented
```

---

# 200. AI Launch Checklist

Si AI se lanza:

```text
[ ] OpenRouter production key

[ ] model registry valid

[ ] structured outputs supported

[ ] AI entitlement active

[ ] rate limits active

[ ] cost monitoring active

[ ] timeout configured

[ ] manual fallback tested

[ ] privacy boundary reviewed

[ ] kill switch tested
```

---

# 201. Worker Launch Checklist

Si worker se lanza:

```text
[ ] Redis production ready

[ ] worker health observable

[ ] recurring jobs idempotent

[ ] reminder jobs idempotent

[ ] billing reconciliation idempotent

[ ] retries configured

[ ] failed jobs observable

[ ] graceful shutdown tested
```

---

# 202. Release Definition of Done

Un release está listo cuando:

```text
code is reviewed

migrations reviewed

tests pass

build passes

secrets configured

feature flags known

rollback path known

smoke tests pass
```

---

# 203. Production Definition of Done

La plataforma está lista para producción cuando podemos responder satisfactoriamente:

```text
Can we detect failures?

Can we recover the database?

Can we roll back code?

Can we prevent duplicate financial operations?

Can we disable external capabilities?

Can we trace billing state?

Can we keep user data isolated?

Can we explain critical financial results?
```

---

# 204. Core Production Invariants

Nunca romper:

```text
Database is the financial source of truth.

Redis is never the financial source of truth.

AI is never the financial source of truth.

Mercado Pago is not queried on every product request.

Provider outages must degrade gracefully.

Financial writes are atomic.

Retries are idempotent where required.

User ownership is enforced server-side.

Production secrets never reach the browser.

Backups are only trusted after restore testing.
```

---

# 205. Next Document

El siguiente documento será:

```text
docs/19-security-privacy.md
```

y profundizará específicamente:

```text
Threat Model

Authentication

Authorization

IDOR Prevention

Financial Data Classification

Encryption

Secrets

OpenRouter Privacy

Mercado Pago Privacy

Webhook Security

Logging Redaction

Data Retention

Account Deletion

Data Export

Security Testing

Incident Response
```
