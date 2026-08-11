# Security & Privacy

## 1. Objetivo

Este documento define los principios, controles y requisitos de seguridad y privacidad de la aplicación.

El producto administra información sensible como:

```text
accounts

balances

transactions

debts

payments

budgets

cashflow

billing subscriptions
```

Por lo tanto, la seguridad no puede tratarse como una capa agregada al final.

Debe formar parte de:

```text
domain design

application services

database access

UI

external integrations

operations
```

Principio central:

```text
Every financial resource is private by default.
```

---

# 2. Security Goals

La plataforma debe proteger principalmente:

```text
Confidentiality

Integrity

Availability

User Isolation

Financial Correctness

Auditability
```

---

# 3. Confidentiality

Un usuario nunca debe poder acceder a información financiera de otro usuario.

Incluye:

```text
accounts

transactions

categories

debts

installments

payments

scheduled transactions

recurring rules

budgets

AI generations

billing information
```

---

# 4. Integrity

Un atacante o error de aplicación no debe poder:

```text
modify balances directly

create partial transfers

overpay debt accidentally

duplicate scheduled posting

change another user's categories

activate Pro without verified billing state
```

---

# 5. Availability

Fallas de componentes opcionales como:

```text
OpenRouter
```

no deben inutilizar el core financiero.

Fallas temporales de:

```text
Mercado Pago
```

no deben impedir que usuarios ya activos utilicen la aplicación según su estado local conocido.

---

# 6. Trust Boundaries

Principales boundaries:

```text
Browser
↓
Web Application
↓
Database
```

y externos:

```text
OpenRouter

Mercado Pago

Redis

S3-compatible storage
```

Todo input que cruza una boundary debe tratarse como:

```text
untrusted
```

hasta validación.

---

# 7. Threat Model

Principales amenazas:

```text
Account takeover

IDOR

Broken authorization

CSRF

XSS

Injection

Credential leakage

Webhook forgery

Provider response manipulation

AI prompt injection

Data leakage to AI providers

Duplicate financial mutations

Race conditions

Sensitive logging

Unauthorized file access

Privilege escalation
```

---

# 8. Authentication

Authentication se implementa mediante:

```text
Better Auth
```

La aplicación confía en:

```text
validated server session
```

para identificar al usuario.

---

# 9. Never Trust Client User ID

Nunca aceptar:

```ts
{
  userId: "..."
}
```

del browser como autoridad.

Siempre:

```text
session
↓
currentUserId
```

---

# 10. Authentication Required

Todos los recursos financieros requieren sesión autenticada.

Excepciones públicas:

```text
landing page

pricing

auth routes

Mercado Pago webhook
```

---

# 11. Session Security

Las cookies de sesión en producción deben usar controles apropiados:

```text
Secure

HttpOnly

SameSite
```

según el mecanismo utilizado por Better Auth.

---

# 12. Session Expiration

La política debe equilibrar:

```text
security
+
usability
```

No implementar sesiones permanentes ilimitadas sin revisión.

---

# 13. Reauthentication

Acciones especialmente sensibles pueden requerir reautenticación futura:

```text
change password

change primary email

delete account

high-impact billing changes
```

No es obligatorio para todas las operaciones financieras V1.

---

# 14. Authorization

Authentication responde:

```text
Who are you?
```

Authorization responde:

```text
Can you access this resource?
```

Nunca confundir ambas.

---

# 15. Ownership Rule

Todo recurso privado debe poder relacionarse con:

```text
userId
```

directa o indirectamente.

---

# 16. Direct Ownership

Ejemplos:

```text
Account.userId

Transaction.userId

Debt.userId

Budget.userId

BillingSubscription.userId
```

---

# 17. Indirect Ownership

Ejemplo:

```text
DebtInstallment
↓
Debt
↓
User
```

Aunque sea indirecto, toda operación debe comprobar ownership.

---

# 18. Repository Pattern

Preferir métodos como:

```text
findAccountByIdForUser(accountId, userId)
```

en lugar de:

```text
findAccountById(accountId)
```

cuando se accede desde contexto de usuario.

---

# 19. IDOR Prevention

Riesgo:

```text
/accounts/UUID-B
```

User A modifica URL para intentar acceder a cuenta de User B.

La respuesta debe ser:

```text
NOT_FOUND
```

o equivalente seguro.

---

# 20. Do Not Reveal Resource Existence

No responder:

```text
403: this account belongs to another user
```

si eso revela información.

Preferir:

```text
resource not found
```

---

# 21. Nested Resource Authorization

Ejemplo:

```text
/debts/:debtId/payments/:paymentId
```

validar:

```text
payment.debtId = debt.id

debt.userId = currentUserId
```

---

# 22. Cross-Resource Validation

Al crear relación entre recursos:

```text
DebtPayment.accountId
```

validar:

```text
debt.userId
=
account.userId
=
currentUserId
```

---

# 23. Categories

Nunca aceptar que una transacción use categoría de otro usuario.

Validar:

```text
category.userId = currentUserId
```

---

# 24. Transfers

Validar:

```text
fromAccount.userId = currentUserId

toAccount.userId = currentUserId
```

No permitir transferencias internas entre usuarios.

---

# 25. Debt Payments

Validar:

```text
debt ownership

installment ownership

account ownership
```

dentro de la misma operación.

---

# 26. Billing Authorization

User A no puede:

```text
view

cancel

refresh
```

suscripción de User B.

---

# 27. Entitlements

Los feature gates también son autorización.

Nunca confiar únicamente en:

```text
hidden UI
```

---

# 28. Server-Side Entitlement Enforcement

Features premium deben validar:

```text
effective entitlement
```

en application service.

---

# 29. Input Validation

Todo input del browser debe validarse con:

```text
Zod
```

o validación equivalente.

---

# 30. Validation Layers

Idealmente:

```text
Transport Validation
↓
Application Validation
↓
Domain Validation
↓
Database Constraints
```

---

# 31. Zod Is Not Authorization

Que un UUID sea válido no significa que el recurso pertenezca al usuario.

Ejemplo:

```text
z.string().uuid()
```

solo valida formato.

Ownership sigue siendo obligatorio.

---

# 32. Database Constraints

Usar DB para proteger invariantes simples:

```text
amount > 0

unique payment IDs

unique transfer legs

foreign keys

not null
```

---

# 33. SQL Injection

Drizzle/parameterized queries deben ser el camino normal.

No construir SQL como:

```ts
`SELECT * FROM transactions WHERE id = '${input}'`
```

---

# 34. Dynamic SQL

Si en futuro existe reporting avanzado:

```text
allowlisted fields
+
parameterized values
```

Nunca permitir AI o usuario producir SQL arbitrario.

---

# 35. XSS

Datos como:

```text
transaction description

merchant

notes

category name
```

son contenido no confiable.

No renderizar HTML proporcionado por usuario sin sanitización.

---

# 36. React Rendering

Preferir rendering de texto normal.

Evitar:

```text
dangerouslySetInnerHTML
```

salvo necesidad revisada.

---

# 37. Markdown

Si en futuro AI genera markdown:

usar renderer seguro.

No permitir HTML arbitrario por defecto.

---

# 38. CSRF

Mutaciones desde browser deben utilizar mecanismos compatibles con:

```text
Next.js

Better Auth

Server Actions
```

y configuración segura de cookies/origin.

---

# 39. External Webhooks

Los webhooks no usan CSRF de sesión.

Usan:

```text
provider authenticity verification
```

---

# 40. Mercado Pago Webhook

Endpoint:

```text
/api/webhooks/mercadopago
```

es público por necesidad.

Eso no significa que sea trusted.

---

# 41. Webhook Requirements

Debe:

```text
verify authenticity

validate request shape

deduplicate

fetch trusted provider state when appropriate

process idempotently
```

---

# 42. Invalid Webhook

Si falla autenticidad:

```text
no subscription mutation

no payment mutation

no entitlement mutation
```

---

# 43. Webhook Replay

El mismo evento puede llegar múltiples veces.

Resultado:

```text
same final state
```

---

# 44. Webhook Event Ordering

No confiar en orden de llegada.

Usar:

```text
current provider state
```

cuando corresponda.

---

# 45. Mercado Pago Credentials

Secretos como:

```text
MERCADOPAGO_ACCESS_TOKEN

MERCADOPAGO_WEBHOOK_SECRET
```

deben permanecer server-side.

---

# 46. OpenRouter Credentials

```text
OPENROUTER_API_KEY
```

también server-side.

Nunca exponer en:

```text
NEXT_PUBLIC_*
```

---

# 47. Secrets Storage

En producción:

```text
Railway environment variables
```

o secret manager equivalente.

---

# 48. Secret Rotation

Debe ser posible rotar:

```text
auth secret

OpenRouter API key

Mercado Pago credentials

S3 credentials
```

sin cambios arquitectónicos.

---

# 49. Secret Logging

Nunca loggear:

```text
Authorization headers

API keys

session tokens

webhook secrets

database credentials
```

---

# 50. Environment Files

Nunca commitear:

```text
.env

.env.production
```

con secretos reales.

---

# 51. Financial Data Classification

Clasificar como altamente sensible:

```text
account names

balances

transactions

transaction descriptions

debt amounts

payment dates

cashflow

budgets

income
```

---

# 52. Identity Data

También sensible:

```text
email

name

timezone

billing identifiers
```

---

# 53. Highly Sensitive Authentication Data

Nunca persistir en logs:

```text
password

password hash outside auth storage

session secret

token
```

---

# 54. Payment Data

La aplicación debe minimizar datos de medios de pago.

Mercado Pago debe manejar la mayor parte posible de ese scope.

---

# 55. No Card Storage

No guardar:

```text
full PAN

CVV
```

en nuestra DB.

---

# 56. Billing Identifiers

Sí podemos guardar:

```text
providerSubscriptionId

providerPaymentId

providerStatus
```

porque son necesarios para reconciliación.

---

# 57. Data Minimization

Regla:

```text
Store only what the product needs.
```

No guardar datos:

```text
just in case
```

sin propósito claro.

---

# 58. OpenRouter Data Boundary

Para transaction categorization enviar solo:

```text
transaction type

description

merchant

candidate categories
```

---

# 59. Never Send To AI For Categorization

```text
account balances

debt totals

billing information

email

full transaction history

budget amounts
```

---

# 60. Capability-Specific Context

Cada AI capability debe definir explícitamente:

```text
minimum required context
```

---

# 61. AI Prompt Privacy

No incluir información de otros usuarios.

La construcción de contexto debe ocurrir después de ownership checks.

---

# 62. AI Prompt Injection

Texto financiero del usuario puede contener instrucciones maliciosas.

Ejemplo:

```text
IGNORE SYSTEM PROMPT
```

Debe ser tratado como:

```text
untrusted data
```

---

# 63. AI Output Is Untrusted

Toda respuesta AI debe pasar:

```text
schema validation

domain validation

authorization validation
```

antes de cualquier uso.

---

# 64. AI Cannot Grant Access

Un modelo nunca puede decidir:

```text
user is Pro
```

Billing/entitlements lo decide determinísticamente.

---

# 65. AI Cannot Modify Financial Truth

No permitir:

```text
AI changes balance

AI pays debt

AI posts transaction

AI changes budget
```

sin flujo explícito de aplicación y confirmación.

---

# 66. AI Writes Future Rule

Si posteriormente AI prepara una acción:

```text
AI parses
↓
Application validates
↓
Preview
↓
User confirms
↓
Application Service executes
```

---

# 67. AI Logging

Por defecto registrar metadata:

```text
capability

model

latency

tokens

status
```

No raw prompts/responses.

---

# 68. AI Retention

Si se decide guardar prompts para debugging/evaluation:

debe existir:

```text
explicit retention period

access control

privacy rationale
```

---

# 69. Provider Routing Privacy

Si OpenRouter permite seleccionar políticas relacionadas con privacidad/provider routing, configurar según requisitos definidos del producto.

No depender de defaults desconocidos sin revisión antes de producción.

---

# 70. Database Encryption In Transit

Las conexiones a PostgreSQL en producción deben utilizar configuración segura de transporte cuando la plataforma lo soporte/requiera.

---

# 71. Encryption At Rest

Usar capacidades de cifrado de almacenamiento proporcionadas por infraestructura administrada cuando estén disponibles.

---

# 72. Application-Level Encryption

No cifrar cada monto manualmente en aplicación V1.

Eso complicaría:

```text
queries

aggregations

indexes

financial reporting
```

sin resolver necesariamente el threat model principal.

---

# 73. Field-Level Encryption Candidates

Puede evaluarse posteriormente para datos especialmente sensibles no requeridos en queries.

No aplicarlo por defecto a todo el ledger.

---

# 74. Passwords

La aplicación no implementa criptografía propia de passwords.

Better Auth gestiona el mecanismo correspondiente.

---

# 75. Logs

Logs deben tratarse como sistema con datos sensibles potenciales.

---

# 76. Log Redaction

Crear estrategia para redactar:

```text
authorization

cookie

password

secret

token

apiKey
```

---

# 77. Request Bodies

No loggear request bodies completos globalmente.

Un `CreateTransaction` podría contener:

```text
merchant

notes

financial amount
```

---

# 78. Query Parameters

Revisar que URLs no contengan información extremadamente sensible cuando pueda evitarse.

---

# 79. Error Tracking

Herramientas externas de error tracking deben recibir:

```text
minimal necessary context
```

---

# 80. User ID In Logs

Puede utilizarse un identificador interno para correlación operacional.

No hace falta loggear email en cada evento.

---

# 81. Auditability

No necesitamos full event sourcing.

Sí necesitamos trazabilidad en operaciones críticas.

---

# 82. Critical Operations

Especialmente:

```text
transfer creation/void

debt payment

scheduled posting

billing subscription state change

admin actions
```

---

# 83. Audit Information

Registrar cuando aporte valor:

```text
operation

entity ID

user ID

timestamp

result

request ID
```

---

# 84. Financial Corrections

No editar saldos directamente.

Correcciones deben utilizar:

```text
void

reversal

adjustment
```

según dominio.

---

# 85. Hard Deletes

Evitar hard delete de registros financieros históricos.

---

# 86. Accounts

Preferir:

```text
ARCHIVED
```

a deletion.

---

# 87. Transactions

Preferir:

```text
VOIDED
```

cuando corresponde.

---

# 88. Transfers

Void/reversal debe afectar ambas legs.

---

# 89. Debt Payments

No habilitar delete/edit hasta tener reversal seguro.

---

# 90. Billing History

No hard delete normal de:

```text
subscription

payment

webhook processing history
```

---

# 91. User Data Deletion

Eliminar cuenta de usuario requiere una política distinta.

Debe considerar:

```text
privacy obligations

billing history

legal retention

financial data deletion
```

---

# 92. Account Deletion Flow

Antes de implementar:

```text
request deletion

reauthenticate

cancel billing if required

schedule deletion

remove/anonymize applicable data

retain only legally required data
```

---

# 93. Soft Delete Is Not Privacy Deletion

Marcar:

```text
deleted = true
```

no necesariamente satisface eliminación de datos.

Debe existir política explícita.

---

# 94. Data Export

El usuario debería poder eventualmente exportar sus datos.

Mínimo conceptual:

```text
accounts

transactions

debts

budgets

scheduled items
```

---

# 95. Export Authorization

Export debe requerir:

```text
authenticated current user
```

y solo incluir sus datos.

---

# 96. Export Generation

Para grandes datasets puede usar background job.

No necesario en MVP inicial.

---

# 97. Export File Security

Si se almacena temporalmente:

```text
private storage

short-lived signed URL

expiration
```

---

# 98. Attachments

Cuando existan attachments:

```text
Attachment.userId
```

o ownership indirecto debe ser verificable.

---

# 99. S3 Bucket

Preferir:

```text
private bucket
```

---

# 100. Object Keys

Conocer object key no debe otorgar acceso.

---

# 101. Signed URLs

URLs temporales deben expirar.

---

# 102. Upload Limits

Definir:

```text
maximum size

allowed types
```

---

# 103. File Names

No confiar en filename proporcionado por usuario como path real.

Generar identificadores propios.

---

# 104. Content Type

No confiar solo en extensión.

Validar tipo de archivo razonablemente.

---

# 105. Future OCR

Si archivos se envían a proveedor OCR/AI:

documentar explícitamente:

```text
what leaves our infrastructure
```

antes de habilitarlo.

---

# 106. Redis Security

Redis puede contener:

```text
job IDs

rate limit counters

temporary cache
```

No debe contener innecesariamente:

```text
full transaction records

secrets
```

---

# 107. Queue Payloads

Preferir:

```ts
{
  transactionId
}
```

en lugar de toda la transacción.

---

# 108. Queue Trust

Un worker debe volver a validar:

```text
resource exists

state is valid
```

al procesar.

No confiar ciegamente en payload antiguo.

---

# 109. Job Idempotency

Jobs pueden ejecutarse más de una vez.

Diseñar para:

```text
at-least-once delivery
```

cuando corresponda.

---

# 110. Recurring Generation

Constraint:

```text
UNIQUE(recurringTransactionId, scheduledDate)
```

protege duplicados.

---

# 111. Scheduled Posting

Debe producir a lo sumo una:

```text
posted Transaction
```

por scheduled item.

---

# 112. Payment Concurrency

Debt payment requiere locking/recalculation para evitar:

```text
negative remaining
```

---

# 113. Transfer Atomicity

Nunca persistir una sola leg.

---

# 114. Billing Idempotency

Webhook/payment subscription updates deben ser retry-safe.

---

# 115. Race Conditions

Debe prestarse atención especial a:

```text
double submit

browser retry

worker retry

duplicate webhook

concurrent payments
```

---

# 116. Client-Side Disable Is Not Enough

Deshabilitar botón durante submit ayuda UX.

No garantiza integridad.

Backend debe ser seguro ante duplicación.

---

# 117. Security Headers

Configurar según producción:

```text
Content-Security-Policy

X-Content-Type-Options

Referrer-Policy

Permissions-Policy

Strict-Transport-Security
```

---

# 118. Content Security Policy

CSP debe ser lo suficientemente restrictiva sin romper:

```text
Next.js

Mercado Pago flows

storage assets
```

---

# 119. No Wildcard Origins

Evitar:

```text
*
```

en configuraciones CORS/CSP sensibles salvo necesidad real.

---

# 120. CORS

La aplicación web same-origin probablemente no necesita CORS abierto.

No habilitar:

```text
Access-Control-Allow-Origin: *
```

para APIs privadas.

---

# 121. Webhook CORS

CORS no protege webhooks server-to-server.

Usar verificación del proveedor.

---

# 122. Open Redirects

Validar cualquier:

```text
returnTo

redirect
```

recibido del cliente.

Preferir paths internos allowlisted.

---

# 123. Mercado Pago Return URL

Configurar URLs conocidas.

No permitir que usuario controle arbitrariamente destination.

---

# 124. Rate Limiting

Aplicar en operaciones con riesgo de abuso:

```text
login

signup

password recovery

AI

billing refresh

file uploads
```

---

# 125. Financial Mutations

No aplicar límites que accidentalmente impidan operaciones legítimas normales.

El objetivo es evitar abuso, no degradar la experiencia.

---

# 126. Login Abuse

Auth debe proteger contra intentos automatizados razonablemente.

---

# 127. AI Abuse

Rate limit + entitlement + usage limits.

---

# 128. Billing Abuse

Evitar creación repetida de subscriptions por retries/double clicks.

---

# 129. Enumeration

Endpoints de recuperación/auth no deberían permitir enumeración trivial de emails cuando pueda evitarse.

---

# 130. Error Messages

Externos:

```text
safe

actionable

non-sensitive
```

Internos:

```text
errorCode

requestId

structured metadata
```

---

# 131. Stack Traces

Nunca devolver stack trace completo al browser en producción.

---

# 132. Provider Errors

No devolver bodies raw de:

```text
Mercado Pago

OpenRouter
```

---

# 133. Dependency Security

Mantener dependencias actualizadas con revisión.

Especial atención a:

```text
Next.js

Better Auth

Drizzle

Mercado Pago SDK

AI/OpenRouter client libraries
```

---

# 134. Lockfile

Commit:

```text
pnpm-lock.yaml
```

---

# 135. Dependency Additions

Antes de agregar nueva dependency evaluar:

```text
necessity

maintenance

security surface

bundle/runtime cost
```

---

# 136. Avoid Unnecessary SDKs

Si un proveedor puede integrarse de forma simple con cliente interno y el SDK agrega demasiado surface area, evaluar ambas opciones.

No reinventar protocolos complejos sin necesidad.

---

# 137. Production Access

Acceso humano a:

```text
Railway

database

Mercado Pago

OpenRouter

storage
```

debe limitarse a personas que realmente lo necesiten.

---

# 138. Least Privilege

Aplicar:

```text
least privilege
```

en credenciales y permisos cuando proveedor lo permita.

---

# 139. Admin Tools

No crear un endpoint como:

```text
/admin/run-sql
```

---

# 140. Support Tools

Preferir acciones explícitas:

```text
refresh subscription

retry failed job

inspect webhook
```

con autorización y auditoría.

---

# 141. Production Database Access

Acceso manual directo debe ser excepcional.

---

# 142. Security Testing

La suite debe incluir:

```text
authorization tests

IDOR tests

input validation tests

webhook verification

race-condition tests

feature gate tests
```

---

# 143. Two-User Tests

Crear siempre escenarios:

```text
User A

User B
```

y probar que A no puede acceder a recursos de B.

---

# 144. Account IDOR Test

A intenta leer:

```text
B account
```

Expected:

```text
NOT_FOUND
```

---

# 145. Transaction IDOR

Mismo principio.

---

# 146. Debt IDOR

A no puede:

```text
read

pay

cancel
```

deuda B.

---

# 147. Budget IDOR

A no puede leer/modificar budget B.

---

# 148. Billing IDOR

A no puede ver/cancelar subscription B.

---

# 149. AI Context Isolation Test

AI request de A debe contener solo:

```text
A categories
```

Nunca categorías de B.

---

# 150. Webhook Forgery Test

Request no firmada/firma incorrecta:

```text
must not modify subscription
```

---

# 151. Duplicate Webhook Test

Debe ser harmless.

---

# 152. Double Payment Test

Dos pagos concurrentes sobre remaining 100 no pueden producir:

```text
remaining = -100
```

---

# 153. Double Scheduled Posting Test

Una occurrence produce una transaction.

---

# 154. Transfer Failure Test

Error en segundo leg:

```text
0 transfer legs persisted
```

---

# 155. Data Leakage Tests

Response DTOs no deben incluir campos internos innecesarios como:

```text
provider secrets

internal hashes

other user IDs
```

---

# 156. Privacy Documentation

Antes de lanzamiento debe existir texto legal/producto que explique al menos:

```text
what data is collected

why it is used

external processors/providers

retention/deletion mechanism

user rights/contact
```

---

# 157. OpenRouter Disclosure

La política de privacidad debe informar que ciertas funciones AI pueden enviar datos necesarios a un proveedor externo de modelos.

Debe explicar la naturaleza del dato de forma comprensible.

---

# 158. Mercado Pago Disclosure

Billing requiere compartir información necesaria con Mercado Pago para procesar la suscripción.

---

# 159. Consent

No pedir consentimiento separado para cada operación técnica si no es legal/productualmente requerido.

Pero sí debe existir transparencia real sobre uso de proveedores.

---

# 160. AI Opt-Out

Si AI es opcional:

un usuario debería poder usar las funciones financieras core sin necesitar enviar transacciones a OpenRouter.

---

# 161. AI Manual Trigger

El primer slice usa:

```text
Sugerir categoría
```

lo que ya proporciona una acción explícita del usuario.

---

# 162. Data Retention

Definir por sistema.

Ejemplo:

```text
Application logs
short operational retention

AI telemetry
limited retention

Webhook event metadata
operational/audit retention

Financial records
until user deletion/policy
```

Los períodos concretos deben fijarse antes de producción según requisitos legales/producto.

---

# 163. Log Retention

No conservar logs indefinidamente sin necesidad.

---

# 164. Webhook Retention

Guardar suficiente información para:

```text
debugging

billing disputes

state reconciliation
```

sin acumular payload sensible innecesario.

---

# 165. AI Generation Retention

Metadata puede conservarse más tiempo que:

```text
raw prompts
```

porque presenta menor riesgo.

---

# 166. Data Deletion Propagation

Si se elimina usuario:

evaluar también:

```text
database

object storage

cached data

queued jobs

AI telemetry
```

---

# 167. Redis Cleanup

Datos temporales deben expirar naturalmente cuando sea posible.

---

# 168. Backups And Deletion

Backups pueden contener datos borrados hasta vencer su retención.

Esto debe formar parte de política de privacidad/retención.

---

# 169. Incident Response

Ante incidente de seguridad:

```text
detect

contain

preserve evidence

assess scope

fix

recover

notify when required

prevent recurrence
```

---

# 170. First Response

Si existe posible:

```text
cross-user leak
```

prioridad:

```text
disable affected capability
```

antes de intentar una solución estética.

---

# 171. Credential Leak

Si un secret se expone:

```text
rotate immediately
```

No basta con borrarlo del repositorio.

---

# 172. API Key Leak

Rotar:

```text
OpenRouter key

Mercado Pago credentials

S3 credentials
```

según incidente.

---

# 173. Session Compromise

Debe existir capacidad de:

```text
invalidate sessions
```

cuando framework lo permita.

---

# 174. Financial Integrity Incident

Si se detecta corrupción:

```text
stop risky writes

identify affected records

backup current state

run deterministic repair

verify invariants
```

---

# 175. No Silent Repair

Nunca modificar registros financieros masivamente sin:

```text
audit trail

dry run

record counts

verification
```

---

# 176. Billing Incident

Si webhook falla:

```text
disable new subscriptions if necessary

preserve existing local access

reconcile provider state
```

---

# 177. AI Incident

Si modelo empieza a producir resultados inválidos:

```text
disable capability
```

sin apagar el core financiero.

---

# 178. Incident Logging

Registrar:

```text
when

what happened

scope

actions taken

root cause

preventive changes
```

---

# 179. Security Severity

P0 examples:

```text
cross-user financial data exposure

unauthorized financial mutation

credential compromise

systemic financial corruption
```

---

# 180. P1

```text
billing access inconsistency

webhook processing outage

security control degraded but no confirmed leak
```

---

# 181. P2

```text
AI unavailable

minor non-sensitive information leak

non-critical security header issue
```

La severidad real depende del impacto concreto.

---

# 182. Security Review Before Production

Checklist:

```text
[ ] Authentication reviewed

[ ] Authorization reviewed

[ ] Two-user IDOR tests pass

[ ] Financial mutations atomic

[ ] Concurrency tests pass

[ ] Secrets server-only

[ ] Webhook signature validation works

[ ] Provider errors sanitized

[ ] AI context minimized

[ ] Rate limits configured

[ ] Security headers configured

[ ] Logs redacted

[ ] Database backups enabled

[ ] Restore tested
```

---

# 183. Privacy Review Before Production

```text
[ ] Data inventory documented

[ ] External processors identified

[ ] AI data flow documented

[ ] Mercado Pago data flow documented

[ ] Retention policy defined

[ ] Account deletion policy defined

[ ] Privacy policy published

[ ] Support/contact path available
```

---

# 184. AI Security Checklist

```text
[ ] API key server-only

[ ] User ownership before context building

[ ] Minimal context

[ ] Prompt injection treated as data

[ ] Structured output validated

[ ] Domain validation after AI

[ ] Entitlement checked server-side

[ ] AI can fail safely

[ ] AI cannot autonomously mutate financial truth
```

---

# 185. Billing Security Checklist

```text
[ ] Access token server-only

[ ] Webhook authenticity verified

[ ] Duplicate events idempotent

[ ] Provider resource fetched when appropriate

[ ] Subscription ownership enforced

[ ] Entitlements resolved locally

[ ] Redirect alone never grants Pro

[ ] Payment data minimized
```

---

# 186. Financial Security Checklist

```text
[ ] Exact money arithmetic

[ ] Balance derived from ledger

[ ] Transfers atomic

[ ] Debt allocations atomic

[ ] Overpayment prevented

[ ] Scheduled posting idempotent

[ ] Archived/voided data preserved

[ ] Cross-currency rules enforced
```

---

# 187. Database Security Checklist

```text
[ ] Production DB not publicly exposed unnecessarily

[ ] Credentials stored securely

[ ] Connection encryption configured where supported

[ ] Backups enabled

[ ] Restore process tested

[ ] Schema changes through migrations

[ ] No shared dev/prod database
```

---

# 188. Logging Security Checklist

```text
[ ] No passwords

[ ] No API keys

[ ] No tokens

[ ] No authorization headers

[ ] No full card data

[ ] No raw AI prompts by default

[ ] No full request bodies globally

[ ] Request IDs available
```

---

# 189. Security Definition of Done

Una feature no está completa si:

```text
works functionally
```

pero no protege:

```text
ownership

validation

secrets

retry safety
```

---

# 190. Security In Feature DoD

Toda capability nueva debe responder:

```text
Who can call this?

Which resources can they access?

What input is untrusted?

What happens on retry?

What external data leaves the system?

What is logged?

What happens on failure?
```

---

# 191. Privacy In Feature DoD

Toda integración externa debe documentar:

```text
data sent

purpose

provider

retention assumptions

fallback
```

---

# 192. Core Security Invariants

Nunca romper:

```text
Authentication does not replace authorization.

Client-provided user IDs are never authority.

Every private financial resource is user-scoped.

AI output is untrusted.

Webhook input is untrusted.

Provider redirects are not billing truth.

Secrets never reach the browser.

Logs must not become a second sensitive database.

Financial mutations must be atomic.

Retryable operations must be idempotent where required.
```

---

# 193. Core Privacy Invariants

Mantener:

```text
Collect only necessary data.

Send minimum context to external providers.

Do not send financial history to AI without a concrete capability need.

Do not send personal finance data to Mercado Pago for subscription billing.

Do not retain raw provider payloads indefinitely without purpose.

Users should retain access to their financial data even when subscription access changes.
```

---

# 194. Next Document

El siguiente documento será:

```text
docs/20-backup-recovery.md
```

y debe profundizar específicamente:

```text
Backup Policy

PostgreSQL Recovery

RPO / RTO

Restore Runbook

Point-In-Time Recovery

Restore Validation

Financial Integrity Checks

Backup Encryption

Retention

Disaster Recovery

Accidental Data Deletion

Corruption Recovery

Provider Recovery

Incident Exercises
```
