# Notifications & Alerts

## 1. Objetivo

Este documento define la arquitectura de notificaciones y alertas de la aplicación.

El sistema debe soportar inicialmente:

```text
IN_APP
REALTIME_WEB
EMAIL
WHATSAPP
```

El modelo comercial vigente es:

```text
TRIAL
+
PRO
+
EXPIRED_READ_ONLY
```

Por lo tanto, las capacidades de notificación deben considerar:

```text
Product Access State
+
User Preferences
+
Notification Rules
+
Channel Entitlements
+
Usage Limits
```

Principio central:

```text
Notification
≠
Financial Truth
```

También:

```text
Realtime Delivery
≠
Persistent Notification
```

y:

```text
Provider Delivery
≠
Domain Event
```

---

# 2. Objetivos del sistema

El sistema de notificaciones debe:

```text
inform

remind

warn

confirm
```

sin convertirse en el motor financiero.

Ejemplos:

```text
debt due soon

debt overdue

scheduled expense approaching

budget near limit

budget exceeded

cashflow risk

subscription payment failed

trial ending

AI credits low

AI credits exhausted
```

---

# 3. Notification Channels

Canales iniciales:

```text
IN_APP

REALTIME_WEB

EMAIL

WHATSAPP
```

Posibles canales futuros:

```text
WEB_PUSH

MOBILE_PUSH

SMS
```

No forman parte del MVP inicial.

---

# 4. Channel Responsibilities

## IN_APP

Canal persistente principal.

Debe permitir:

```text
notification center

unread count

mark as read

historical notifications
```

---

## REALTIME_WEB

Entrega inmediata dentro de una sesión activa.

Inicialmente:

```text
Server-Sent Events
```

SSE es suficiente porque la mayoría de eventos son:

```text
server
→
browser
```

---

## EMAIL

Proveedor inicial:

```text
Resend
```

Usado principalmente para:

```text
important financial alerts

billing

security

trial lifecycle
```

---

## WHATSAPP

Proveedor inicial:

```text
Twilio
+
WhatsApp Business Platform
```

Debe considerarse:

```text
premium

opt-in

bounded usage
```

---

# 5. Product Access Integration

Estados:

```text
TRIAL

PRO

EXPIRED_READ_ONLY
```

Cada estado tiene diferentes capacidades de entrega.

---

# 6. TRIAL Notification Access

Durante trial:

```text
IN_APP
Yes

REALTIME_WEB
Yes

EMAIL
Yes

WHATSAPP
3 total messages
```

El allowance de WhatsApp no se renueva.

---

# 7. PRO Notification Access

Durante PRO:

```text
IN_APP
Yes

REALTIME_WEB
Yes

EMAIL
Yes

WHATSAPP
20 messages / billing period
```

---

# 8. EXPIRED_READ_ONLY Notification Access

En modo expirado:

```text
Financial IN_APP generation
Limited

Realtime financial alerts
Disabled / limited

Financial EMAIL
Disabled

Financial WHATSAPP
Disabled
```

Pero siguen permitidas:

```text
billing notifications

security notifications

account lifecycle notifications

existing notification history
```

---

# 9. Notification Categories

Separar:

```text
FINANCIAL

BILLING

SECURITY

ACCOUNT

PRODUCT
```

Esto evita que una restricción comercial sobre alertas financieras bloquee mensajes esenciales.

---

# 10. Financial Notifications

Ejemplos:

```text
DEBT_DUE_SOON

DEBT_OVERDUE

SCHEDULED_TRANSACTION_DUE

BUDGET_NEAR_LIMIT

BUDGET_EXCEEDED

CASHFLOW_LOW

CASHFLOW_NEGATIVE

WEEKLY_FINANCIAL_SUMMARY

MONTHLY_FINANCIAL_SUMMARY
```

---

# 11. Billing Notifications

Ejemplos:

```text
SUBSCRIPTION_ACTIVATED

PAYMENT_FAILED

GRACE_PERIOD_STARTED

SUBSCRIPTION_CANCELLED

SUBSCRIPTION_EXPIRED
```

Estas no deben depender de:

```text
WhatsApp financial allowance

AI credits
```

---

# 12. Security Notifications

Ejemplos:

```text
NEW_LOGIN

PASSWORD_CHANGED

EMAIL_CHANGED

SECURITY_SETTING_CHANGED
```

Nunca deben bloquearse por estado comercial.

---

# 13. Account Notifications

Ejemplos:

```text
TRIAL_STARTED

TRIAL_ENDING

TRIAL_EXPIRED

ACCOUNT_EXPORT_READY

ACCOUNT_DELETION_REQUESTED
```

---

# 14. Notification Architecture

Flujo:

```text
Domain / Application Event
↓
Notification Rule Engine
↓
Notification Intent
↓
Notification Service
↓
Persist Notification
↓
Delivery Planner
↓
Channel Delivery
```

---

# 15. Notification Rule Engine

Responsabilidad:

```text
Should this notification exist?

When should it be delivered?

Which channels are eligible?

What priority does it have?
```

No debe enviar directamente mensajes.

---

# 16. Notification Intent

Objeto conceptual:

```text
type

userId

category

priority

subjectReference

occurredAt

scheduledFor

metadata
```

---

# 17. Notification Persistence

Tabla:

```text
notifications
```

Campos conceptuales:

```text
id

user_id

type

category

priority

title_key

body_key

subject_type

subject_id

scheduled_for

created_at

read_at

dismissed_at
```

---

# 18. Delivery Persistence

Tabla separada:

```text
notification_deliveries
```

Campos:

```text
id

notification_id

channel

status

provider

provider_message_id

attempt_count

last_error_code

queued_at

sent_at

delivered_at

failed_at

created_at

updated_at
```

---

# 19. Delivery Statuses

```text
PENDING

QUEUED

SENDING

SENT

DELIVERED

FAILED

CANCELLED
```

---

# 20. Persistence First

Para alertas importantes:

```text
Persist Notification
↓
Attempt Delivery
```

No:

```text
Send WhatsApp
↓
maybe store later
```

---

# 21. Realtime Is Not Source Of Truth

SSE puede fallar.

La notificación persistente sigue existiendo.

Al reconectar:

```text
reload notifications from PostgreSQL
```

---

# 22. User Preferences

Crear:

```text
notification_preferences
```

por:

```text
user

notification type

channel
```

---

# 23. Preference Fields

Conceptualmente:

```text
enabled

lead_time_minutes

quiet_hours_enabled

quiet_hours_start

quiet_hours_end
```

---

# 24. Global Channel Preferences

También permitir:

```text
emailEnabled

whatsappEnabled

realtimeEnabled
```

---

# 25. Default Preferences

Recomendación:

```text
IN_APP
enabled

REALTIME
enabled while logged in

EMAIL
enabled for important alerts

WHATSAPP
disabled until explicit opt-in
```

---

# 26. WhatsApp Requires Explicit Opt-In

Nunca activar automáticamente WhatsApp.

Requiere:

```text
valid phone number

explicit consent

channel enabled
```

---

# 27. Phone Number

Guardar en formato:

```text
E.164
```

Ejemplo conceptual:

```text
+549...
```

---

# 28. WhatsApp Trial Allowance

Durante TRIAL:

```text
3 total financial messages
```

No:

```text
3 per day
```

No:

```text
3 per month
```

---

# 29. Trial WhatsApp Purpose

Debe demostrar valor real.

Buenos usos:

```text
debt due

scheduled obligation

important cashflow warning
```

---

# 30. Trial WhatsApp Should Not Be Wasted

Evitar consumir allowance con:

```text
marketing

generic welcome messages

low-value tips
```

---

# 31. Trial Expiration WhatsApp

Recomendación inicial:

```text
do not automatically consume trial WhatsApp allowance
```

para avisar vencimiento comercial.

Preferir:

```text
IN_APP
+
EMAIL
```

---

# 32. Pro WhatsApp Allowance

```text
20 financial messages
per billing period
```

---

# 33. Pro Billing Period

Allowance debe alinearse con:

```text
current_period_start

current_period_end
```

cuando sea posible.

---

# 34. WhatsApp Usage

Crear un contador/read model basado en:

```text
eligible financial deliveries
```

No contar:

```text
billing messages
```

si en futuro se habilita WhatsApp para billing bajo otra política.

---

# 35. What Counts As WhatsApp Usage

Recomendación inicial:

consumir allowance cuando:

```text
provider accepts message for sending
```

No cuando simplemente se crea Notification Intent.

---

# 36. Provider Failure

Si Twilio rechaza el mensaje antes de aceptarlo:

```text
do not consume permanent allowance
```

---

# 37. Delivery Failure After Provider Acceptance

Si proveedor acepta y luego falla:

la política puede considerarlo consumido si existe costo real.

Debe reconciliarse según datos del provider.

---

# 38. WhatsApp Allowance Reservation

Idealmente usar:

```text
Check
↓
Reserve Allowance
↓
Send
↓
Commit / Release
```

para evitar concurrencia.

---

# 39. WhatsApp No Negative Balance

Caso:

```text
1 message remaining

two alerts simultaneously
```

solo uno puede reservar allowance.

---

# 40. WhatsApp Limit Exhaustion

Cuando:

```text
remaining = 0
```

no crear nueva delivery WhatsApp financiera.

Pero continuar:

```text
IN_APP

EMAIL

REALTIME
```

si están permitidos.

---

# 41. Limit Exhaustion Is Not Notification Failure

No registrar:

```text
FAILED
```

por no tener allowance.

Puede registrarse como:

```text
CANCELLED
```

con reason:

```text
CHANNEL_USAGE_LIMIT_REACHED
```

o no planificar la delivery.

---

# 42. Expired WhatsApp

En:

```text
EXPIRED_READ_ONLY
```

financial WhatsApp entitlement:

```text
false
```

---

# 43. Existing Allowance After Expiration

Si quedaban:

```text
8 / 20
```

al expirar Pro:

no pueden utilizarse.

El entitlement de acceso prevalece.

---

# 44. Reactivation

Al reactivar PRO:

nuevo período efectivo puede crear nuevo allowance.

No reutilizar automáticamente allowance expirado anterior.

---

# 45. Email Access — TRIAL

Trial:

```text
financial email alerts
enabled
```

sujeto a preferencias.

---

# 46. Email Access — PRO

PRO:

```text
full configurable financial email alerts
```

---

# 47. Email Access — EXPIRED

Financial emails:

```text
disabled
```

Billing/security/account emails:

```text
enabled when required
```

---

# 48. Email Provider Abstraction

Crear:

```text
EmailProvider
```

Implementación:

```text
ResendEmailProvider
```

---

# 49. Email Provider Responsibilities

```text
send transactional email

return provider ID

normalize provider errors
```

---

# 50. Email Templates

Templates versionados.

Ejemplo:

```text
debt-due:v1

budget-near-limit:v1

trial-ending:v1

payment-failed:v1
```

---

# 51. Templates Must Not Calculate Finance

Templates reciben:

```text
precomputed deterministic data
```

No deben calcular:

```text
balance

remaining debt

cashflow
```

---

# 52. Financial Values In Notifications

Todos los montos deben provenir de:

```text
Finance Engine
or
trusted Query Service
```

No de IA.

---

# 53. AI Is Not Required For Notifications

Mantener:

```text
Notification generation
≠
AI generation
```

---

# 54. Critical Notification Copy

Para alertas críticas usar templates determinísticos.

No generar copy financiero crítico con AI en tiempo real.

---

# 55. Notification Example

```text
Tu cuota vence mañana.

Monto:
$45.000

Deuda:
Préstamo personal
```

Datos precomputados.

---

# 56. Privacy

No mostrar información excesivamente sensible en:

```text
email subject

WhatsApp preview

lock-screen preview
```

---

# 57. Privacy Level

Futuro:

```text
MINIMAL

STANDARD

DETAILED
```

por usuario/canal.

No obligatorio en MVP.

---

# 58. Realtime Architecture

Endpoint sugerido:

```text
GET /api/notifications/stream
```

---

# 59. SSE Authentication

`userId` debe provenir de:

```text
authenticated session
```

Nunca de:

```text
query parameter
```

---

# 60. SSE Events

Puede emitir:

```text
notification.created

notification.updated

notification.read
```

---

# 61. Realtime UI

Actualizar:

```text
notification bell

unread count

notification list
```

---

# 62. Toasts

No convertir toda notificación realtime en toast.

Usar toast solo para eventos relevantes mientras usuario está activo.

---

# 63. Reconnect

Al reconectar:

```text
fetch unread notifications
```

desde PostgreSQL.

No depender de replay infinito del SSE stream.

---

# 64. Worker

Usar:

```text
BullMQ
+
Redis
+
Node Worker
```

para entregas asíncronas.

---

# 65. Redis Is Not Source Of Truth

Si Redis pierde datos:

```text
PostgreSQL
```

debe permitir reconstruir trabajo crítico.

---

# 66. Jobs

Ejemplos:

```text
notification-deliver-email

notification-deliver-whatsapp

notification-evaluate-debt-reminders

notification-evaluate-scheduled-items

notification-reconcile-provider-delivery
```

---

# 67. Scheduled Financial Evaluation

Algunas alertas necesitan jobs de tiempo.

Ejemplo:

```text
debt due tomorrow
```

No requieren un nuevo domain event en ese instante.

---

# 68. Event Driven Where Possible

Ejemplo:

```text
Budget calculation changes
↓
Budget threshold crossed
↓
Notification Intent
```

Pero no convertir todo el producto en arquitectura event-driven innecesaria.

---

# 69. Outbox Pattern

Para eventos críticos puede utilizarse:

```text
transactional outbox
```

cuando sea necesario asegurar:

```text
financial write committed
+
notification event not lost
```

---

# 70. Financial Writes Must Not Wait For Providers

Nunca:

```text
BEGIN financial transaction
↓
send email
↓
send WhatsApp
↓
COMMIT
```

---

# 71. Correct Pattern

```text
BEGIN
financial write
notification/outbox intent
COMMIT
↓
worker
↓
provider
```

---

# 72. Provider Failure Isolation

Una falla de:

```text
Resend

Twilio

Redis
```

no debe revertir:

```text
transaction

debt payment

budget update
```

---

# 73. Deduplication

Cada notification intent debe poder tener:

```text
dedup_key
```

Ejemplo:

```text
debt:{debtId}:installment:{installmentId}:due-1d
```

---

# 74. Duplicate Prevention

No enviar:

```text
same debt reminder
```

múltiples veces por jobs repetidos.

---

# 75. Idempotency

Workers deben ser idempotentes.

Retry:

```text
same delivery
≠
new logical notification
```

---

# 76. Email Retry

Retry solo errores transitorios.

No retry infinito para:

```text
invalid recipient

hard bounce
```

---

# 77. WhatsApp Retry

Retry según:

```text
provider error class

delivery status

rate limits
```

No repetir indiscriminadamente.

---

# 78. Provider Callback

Crear endpoints separados:

```text
/api/webhooks/resend

/api/webhooks/twilio
```

si se utilizan callbacks.

---

# 79. Webhook Authenticity

Verificar firmas/autenticidad según provider.

Nunca confiar en payload externo sin validación.

---

# 80. Resend Delivery Status

Normalizar:

```text
sent

delivered

bounced

complained

failed
```

a estados internos.

---

# 81. Twilio Delivery Status

Normalizar:

```text
queued

sent

delivered

failed

undelivered
```

---

# 82. Hard Bounce

Si email genera hard bounce:

marcar dirección/canal según política para evitar retries repetidos.

---

# 83. WhatsApp Provider Cost

El costo real:

```text
may vary
```

por:

```text
Twilio fee

Meta pricing

country

template category
```

No hardcodear costo monetario en notification domain.

---

# 84. Usage vs Monetary Cost

Mantener:

```text
WhatsApp Product Allowance
≠
Provider Monetary Cost
```

---

# 85. Pricing Integration

Current planning:

```text
TRIAL:
3 WhatsApp total

PRO:
20 WhatsApp / billing period
```

Los límites existen para proteger unit economics.

---

# 86. AI Credits Are Separate

Mantener:

```text
AI Credits
≠
WhatsApp Allowance
```

No crear un saldo genérico compartido.

---

# 87. Channel Entitlements

Ejemplos:

```text
notifications.in_app

notifications.realtime

notifications.email.financial

notifications.whatsapp.financial
```

---

# 88. TRIAL Entitlements

```text
notifications.in_app
true

notifications.realtime
true

notifications.email.financial
true

notifications.whatsapp.financial
true
```

con allowance 3.

---

# 89. PRO Entitlements

Todos:

```text
true
```

con WhatsApp allowance 20.

---

# 90. EXPIRED Entitlements

```text
notifications.in_app.history
true

notifications.email.financial
false

notifications.whatsapp.financial
false

notifications.realtime.financial
false
```

Core account/billing/security capabilities se resuelven aparte.

---

# 91. Trial Lifecycle Notifications

Ejemplos:

```text
TRIAL_ENDING_7D

TRIAL_ENDING_3D

TRIAL_ENDING_1D

TRIAL_EXPIRED
```

---

# 92. Trial Reminder Channels

Recomendación:

```text
7 days
IN_APP

3 days
IN_APP + EMAIL

1 day
IN_APP + EMAIL

expired
IN_APP + EMAIL
```

---

# 93. No Trial Countdown Spam

No enviar recordatorios diarios.

---

# 94. Trial Reminder Is Product Communication

No debe depender de alertas financieras del usuario.

---

# 95. AI Credit Notifications

Ejemplos:

```text
AI_CREDITS_LOW

AI_CREDITS_EXHAUSTED
```

---

# 96. AI Credits Low — TRIAL

Puede notificar:

```text
Te quedan 10 créditos de IA durante tu prueba.
```

---

# 97. AI Credits Low — PRO

```text
Te quedan pocos créditos de IA para este período.
```

---

# 98. AI Credit Notifications Channels

Preferir:

```text
IN_APP
```

Opcional:

```text
EMAIL
```

No usar WhatsApp por defecto para avisos de créditos.

---

# 99. Budget Alerts

Ejemplos:

```text
80%

100%
```

pero thresholds deben ser configurables.

---

# 100. Budget Notifications Do Not Change Budget

Solo informan.

---

# 101. Debt Alerts

Ejemplos:

```text
7 days before

3 days before

1 day before

due today

overdue
```

No necesariamente habilitar todos por defecto.

---

# 102. Scheduled Transaction Alerts

Ejemplos:

```text
expense due tomorrow

income expected tomorrow
```

---

# 103. Cashflow Alerts

Ejemplos:

```text
projected balance below threshold

projected negative balance
```

Siempre derivados de Finance Engine / projection services.

---

# 104. Cashflow Alert Explainability

Notification metadata puede incluir:

```text
projectedDate

projectedBalance

mainObligation
```

para que UI explique por qué se generó.

---

# 105. No Cross-Currency False Alerts

No emitir alertas agregadas incorrectas si no existe conversión FX válida.

---

# 106. Notification Priority

Ejemplo:

```text
LOW

NORMAL

HIGH

CRITICAL
```

---

# 107. Critical Is Rare

No marcar:

```text
budget at 80%
```

como CRITICAL.

---

# 108. Quiet Hours

Soportar:

```text
quiet hours
```

basadas en timezone del usuario.

---

# 109. Quiet Hours Rule

Routine notifications:

```text
must respect quiet hours
```

---

# 110. Critical Bypass

Inicialmente:

```text
no routine financial notification bypasses quiet hours
```

Evita abuso.

---

# 111. User Timezone

Usar timezone configurada por usuario.

No usar timezone del worker.

---

# 112. Scheduling

Guardar timestamps en:

```text
TIMESTAMPTZ
```

y resolver reglas en timezone del usuario.

---

# 113. Daily Jobs

No asumir:

```text
00:00 UTC
```

como inicio del día financiero del usuario.

---

# 114. Notification Center

Página/panel:

```text
Notifications
```

Mostrar:

```text
unread

all

financial

billing/account
```

sin exceso de filtros en MVP.

---

# 115. Notification Item

Debe tener:

```text
title

short body

timestamp

read state

optional action
```

---

# 116. Actions

Ejemplos:

```text
Ver deuda

Ver presupuesto

Ver planificación

Activar Pro
```

---

# 117. Notification Links

Nunca confiar en URL arbitraria desde provider payload.

Construir destinos internos controlados.

---

# 118. Read State

Acciones:

```text
markRead

markAllRead
```

---

# 119. Delete Notification

No es indispensable V1.

Puede permitir:

```text
dismiss
```

sin borrar historial operativo crítico.

---

# 120. Retention

Definir política.

Ejemplo inicial:

```text
normal notifications:
12 months
```

pero debe alinearse con privacy/storage policy.

---

# 121. Delivery Logs Retention

Los delivery logs pueden tener política diferente.

No conservar payload sensible indefinidamente.

---

# 122. Notification Content Storage

Guardar suficiente para historial, pero evitar duplicar excesivamente datos financieros sensibles.

---

# 123. Read-Only Notification History

EXPIRED_READ_ONLY puede:

```text
view historical notifications
```

---

# 124. Read-Only New Financial Notification Generation

Recomendación:

```text
disabled
```

porque no se siguen ejecutando automatizaciones premium normales.

---

# 125. Billing Notifications While Expired

Permitidas.

Ejemplo:

```text
subscription activation

payment status

reactivation confirmation
```

---

# 126. Security Notifications While Expired

Permitidas.

---

# 127. Trial Start Notification

Al iniciar:

```text
Tu prueba Pro comenzó.
```

Puede ser:

```text
IN_APP
+
EMAIL
```

---

# 128. Trial Start Does Not Consume WhatsApp

No gastar uno de los 3 mensajes.

---

# 129. Pro Activation Notification

```text
Tu suscripción Pro está activa.
```

IN_APP + EMAIL.

---

# 130. Pro Renewal Notification

No es necesario enviar éxito mensual si genera ruido.

Puede registrar billing receipt según política.

---

# 131. Payment Failure Notification

Importante:

```text
IN_APP
+
EMAIL
```

---

# 132. Grace Period Notification

```text
Tu pago no pudo procesarse.
Tu acceso Pro continúa temporalmente.
```

---

# 133. Subscription Expiration Notification

```text
Tu plan Pro finalizó.

Tus datos siguen disponibles en modo lectura.
```

---

# 134. WhatsApp Configuration UI

Settings:

```text
Notifications
→ WhatsApp
```

Debe permitir:

```text
phone number

verification if required

opt-in

alert types
```

---

# 135. WhatsApp Usage UI — TRIAL

```text
WhatsApp

1 de 3 alertas usadas durante tu prueba
```

---

# 136. WhatsApp Usage UI — PRO

```text
WhatsApp

8 de 20 alertas utilizadas

Se renuevan el ...
```

---

# 137. WhatsApp Usage UI — EXPIRED

```text
Las alertas por WhatsApp requieren una suscripción Pro activa.
```

---

# 138. Channel Fallback

Si WhatsApp no está disponible:

```text
do not lose notification
```

Intentar otros canales elegibles:

```text
IN_APP

EMAIL
```

---

# 139. No Blind Fallback

No enviar por email si usuario lo deshabilitó, salvo categoría esencial permitida por política.

---

# 140. Billing/Security Overrides

Preferencias de marketing/financial alerts no deben bloquear comunicaciones esenciales necesarias de cuenta.

---

# 141. Notification Delivery Planner

Responsabilidades:

```text
resolve access state

load preferences

check channel entitlement

check quiet hours

check allowance

create delivery rows
```

---

# 142. Order Of Checks

```text
Notification Intent
↓
Category policy
↓
Product access
↓
User preference
↓
Channel entitlement
↓
Usage allowance
↓
Quiet hours / schedule
↓
Delivery
```

---

# 143. Trial WhatsApp Example

```text
Debt due tomorrow
↓
Trial active
↓
WhatsApp opt-in true
↓
1 of 3 remaining
↓
reserve
↓
send
↓
commit usage
```

---

# 144. Expired Example

```text
Debt reminder evaluation
↓
EXPIRED_READ_ONLY
↓
financial premium notification generation disabled
```

No provider call.

---

# 145. Pro Allowance Exhausted Example

```text
Budget exceeded
↓
PRO
↓
WhatsApp 20/20
↓
skip WhatsApp
↓
deliver IN_APP + EMAIL
```

---

# 146. Usage Ledger

Puede existir:

```text
notification_channel_usage
```

o read model derivado de deliveries.

---

# 147. Preferred WhatsApp Usage Model

Para V1:

derivar uso de:

```text
committed financial WhatsApp deliveries
```

por allowance period.

Si consultas se vuelven costosas:

crear contador materializado.

---

# 148. Allowance Period

Tipos:

```text
TRIAL

BILLING_PERIOD
```

---

# 149. Trial Period Identity

Asociado a:

```text
trial_started_at
trial_ends_at
```

---

# 150. Pro Period Identity

Asociado a:

```text
billingPeriodId
```

---

# 151. Idempotent Usage

Repeated Twilio callback:

```text
must not consume allowance again
```

---

# 152. Notification Delivery Idempotency

Unique conceptual:

```text
notificationId
+
channel
```

para un delivery lógico.

---

# 153. Multiple Attempts

Retries son:

```text
delivery attempts
```

No nuevos deliveries lógicos.

---

# 154. Delivery Attempts

Opcionalmente tabla:

```text
notification_delivery_attempts
```

si se necesita historial detallado.

No obligatorio MVP.

---

# 155. Twilio Provider

Crear:

```text
WhatsAppProvider
```

Implementación:

```text
TwilioWhatsAppProvider
```

---

# 156. Provider Contract

Conceptualmente:

```ts
interface WhatsAppProvider {
  send(input): Promise<SendWhatsAppResult>
}
```

---

# 157. Template Registry

WhatsApp puede requerir templates aprobados.

Mantener registry:

```text
DEBT_DUE_SOON
→ provider template/content SID
```

---

# 158. No Template IDs In Domain Logic

Mapear en provider/template layer.

---

# 159. Template Versioning

Proveedor puede cambiar templates sin cambiar NotificationType.

---

# 160. Message Localization

Templates deben poder considerar locale del usuario.

Inicial:

```text
es
```

si ese es el mercado principal.

---

# 161. Numbers In External Messages

Formatear según locale configurada.

Pero usar cantidades previamente calculadas.

---

# 162. Realtime Security

Nunca emitir:

```text
User B notification
```

en stream de User A.

---

# 163. Authorization

Todas las queries:

```text
WHERE user_id = authenticatedUserId
```

o equivalente seguro.

---

# 164. Notification Ownership

No confiar en:

```text
notification.userId
```

enviado por frontend.

---

# 165. Mark As Read Security

Validar ownership.

---

# 166. Provider Webhook Security

Resend/Twilio callbacks:

```text
verify provider authenticity
```

antes de modificar delivery state.

---

# 167. Observability

Registrar:

```text
notification type

channel

status

attempt count

provider

latency

failure class

product access state
```

---

# 168. Do Not Log Sensitive Full Body

Evitar logs con:

```text
financial amounts

full debt names

phone numbers

message content
```

cuando no sea necesario.

---

# 169. Metrics

Mínimas:

```text
notifications created

notifications read

email sent

email delivered

email failed

WhatsApp attempted

WhatsApp delivered

WhatsApp failed

WhatsApp allowance usage

trial WhatsApp utilization
```

---

# 170. Business Metrics

Medir:

```text
WhatsApp usage per Trial

WhatsApp usage per Pro

WhatsApp cost per Pro

notification engagement

alert opt-in rate
```

---

# 171. Trial Conversion Analysis

Analizar si usuarios que reciben alertas útiles:

```text
convert more
```

pero no asumir causalidad.

---

# 172. Notification Value

Una notificación debe existir porque:

```text
it changes or supports a user decision
```

No para aumentar artificialmente engagement.

---

# 173. Avoid Notification Spam

Nunca crear:

```text
daily generic financial tips
```

solo para aumentar uso.

---

# 174. Digest Strategy

Post-MVP:

```text
weekly digest

monthly digest
```

puede reducir volumen de emails.

---

# 175. Cashflow Notifications

MVP opcional / V1.1 según roadmap.

---

# 176. Browser Web Push

Importante:

```text
REALTIME_WEB via SSE
```

solo funciona mientras existe sesión/página conectada.

Si se desea notificar cuando el sitio está cerrado:

se necesita:

```text
Browser Web Push
+
Service Worker
+
Push Subscription
+
VAPID
```

---

# 177. Web Push Scope

No forma parte del MVP actual.

Planificar post-MVP si existe necesidad real.

---

# 178. Mobile Push

Futuro si existe app móvil.

---

# 179. Email And WhatsApp Costs

Ambos deben monitorearse como costos de plataforma.

No entran al ledger financiero personal.

---

# 180. Notification Domain Separation

Mantener:

```text
Notification Usage
≠
AI Credit Ledger
≠
Personal Finance Ledger
≠
Billing Payment Ledger
```

---

# 181. Trial Cost Integration

Los mensajes trial forman parte de:

```text
Cost Per Trial
```

documentado en:

```text
docs/10.2-pricing-unit-economics.md
```

---

# 182. Pro Cost Integration

WhatsApp Pro forma parte de:

```text
Variable Product Cost Per Pro
```

---

# 183. WhatsApp Target Cost

Current planning target:

```text
≤ USD 0.30 / Pro / month
```

No es invariant técnico.

---

# 184. Trial WhatsApp Target Cost

Planning target:

```text
≤ USD 0.05 / trial
```

No es invariant técnico.

---

# 185. Provider Cost Change

Si costo sube:

revisar:

```text
allowance

notification types

provider

pricing
```

No degradar core finance.

---

# 186. Fair Use

Email/realtime pueden ser efectivamente amplios, pero siguen sujetos a:

```text
rate limits

anti-abuse

deduplication
```

---

# 187. Error Codes

Ejemplos:

```text
NOTIFICATION_CHANNEL_DISABLED

NOTIFICATION_PREFERENCE_DISABLED

NOTIFICATION_CHANNEL_NOT_ENTITLED

NOTIFICATION_USAGE_LIMIT_REACHED

NOTIFICATION_QUIET_HOURS

NOTIFICATION_PROVIDER_ERROR

NOTIFICATION_INVALID_RECIPIENT

NOTIFICATION_DUPLICATE
```

---

# 188. WhatsApp Errors

```text
WHATSAPP_NOT_OPTED_IN

WHATSAPP_INVALID_PHONE

WHATSAPP_LIMIT_REACHED

WHATSAPP_PROVIDER_ERROR
```

---

# 189. Retry Error Classification

Clasificar:

```text
TRANSIENT

PERMANENT

RATE_LIMIT

AUTHENTICATION

INVALID_RECIPIENT
```

---

# 190. Worker Retry Policy

Ejemplo conceptual:

```text
transient
→ exponential backoff

permanent
→ no retry
```

---

# 191. Dead Letter Handling

Después del máximo de retries:

```text
mark FAILED
+
observability
```

No retry infinito.

---

# 192. MVP Scope

Implementar:

```text
notifications table

delivery table

preferences

notification center

unread count

mark read

SSE realtime

email via Resend

WhatsApp via Twilio

trial WhatsApp allowance

Pro WhatsApp allowance

worker jobs

deduplication

retry handling

quiet hours

basic telemetry
```

---

# 193. MVP Financial Alerts

Inicialmente:

```text
debt due

debt overdue

scheduled transaction due

budget near limit

budget exceeded
```

---

# 194. MVP Product/Billing Alerts

```text
trial started

trial ending

trial expired

subscription activated

payment failed

subscription expired

AI credits low

AI credits exhausted
```

---

# 195. V1.1

Agregar:

```text
cashflow risk alerts

weekly summary

monthly summary

advanced timing preferences

provider delivery history UI
```

---

# 196. Post-MVP

```text
browser web push

mobile push

digests

privacy levels

advanced channel fallback

WhatsApp packs

smart notification grouping
```

---

# 197. Tests — Trial WhatsApp

```text
trial starts
↓
3 total allowance
```

Tres deliveries exitosos:

```text
remaining = 0
```

Cuarto:

```text
no WhatsApp provider call
```

---

# 198. Tests — Pro WhatsApp

```text
20 allowed per billing period
```

21st:

```text
blocked
```

---

# 199. Tests — New Billing Period

New Pro period:

```text
new allowance available
```

Exactly once.

---

# 200. Tests — Expired

```text
EXPIRED_READ_ONLY
```

financial WhatsApp:

```text
disabled
```

financial email:

```text
disabled
```

historical notifications:

```text
readable
```

---

# 201. Tests — Billing Notification While Expired

Payment/subscription email:

```text
still deliverable
```

---

# 202. Tests — Security Notification While Expired

Security email:

```text
still deliverable
```

---

# 203. Tests — Provider Failure

Financial write succeeds.

Notification delivery fails.

Financial write remains committed.

---

# 204. Tests — Duplicate Job

Same debt reminder evaluated twice:

```text
one logical notification
```

---

# 205. Tests — Quiet Hours

Routine WhatsApp/email scheduled appropriately.

---

# 206. Tests — SSE Ownership

Authenticated user receives only own notifications.

---

# 207. Tests — Allowance Concurrency

```text
1 WhatsApp remaining
+
2 simultaneous alerts
```

Only one can consume the final allowance.

---

# 208. Tests — Trial Expiration Race

If notification is evaluated after trial expiration:

financial premium delivery:

```text
not sent
```

---

# 209. Tests — Subscription Expiration Race

Same rule based on effective access at planning/execution time.

---

# 210. Delivery Revalidation

For expensive external channels, revalidate entitlement/allowance immediately before provider send if significant time may pass between planning and execution.

---

# 211. Planned Delivery After Access Changes

Example:

```text
delivery queued while PRO
↓
subscription expires
↓
job executes later
```

Re-evaluate channel entitlement.

Do not send premium financial WhatsApp if no longer allowed.

---

# 212. Billing/Security Exception

Essential category deliveries may follow their own policies.

---

# 213. Package Structure

Suggested:

```text
packages/notifications/
├── domain/
├── application/
├── rules/
├── providers/
│   ├── email/
│   │   └── resend/
│   └── whatsapp/
│       └── twilio/
├── templates/
├── usage/
└── index.ts
```

---

# 214. Web Feature

```text
apps/web/src/features/notifications/
```

---

# 215. Worker Jobs

```text
apps/worker/src/jobs/notifications/
```

---

# 216. Provider Abstractions

```text
NotificationProvider
```

puede ser demasiado genérico.

Preferir contratos específicos:

```text
EmailProvider

WhatsAppProvider
```

porque canales tienen semánticas distintas.

---

# 217. Notification Service

Responsabilidades:

```text
create notification

deduplicate

persist

request delivery planning
```

---

# 218. Delivery Planner

Responsabilidades:

```text
preferences

entitlements

limits

quiet hours

channel selection
```

---

# 219. Delivery Worker

Responsabilidades:

```text
provider execution

retry

status update

provider metadata
```

---

# 220. Finance Engine Boundary

Notification system puede consumir:

```text
trusted financial read models
```

pero no recalcula financial truth.

---

# 221. AI Boundary

Notification system no necesita OpenRouter para operar.

---

# 222. Billing Boundary

Billing genera eventos de lifecycle.

Notification system decide canales apropiados.

---

# 223. Product Access Boundary

Notification Service consulta:

```text
ProductAccessResolver / EntitlementService
```

No Mercado Pago directamente.

---

# 224. Usage Limit Boundary

WhatsApp usage pertenece al notification domain.

No al billing provider.

---

# 225. Final Access Matrix

```text
CHANNEL / STATE          TRIAL       PRO       EXPIRED

In-App financial         Yes         Yes       History / limited

Realtime financial       Yes         Yes       No / limited

Email financial          Yes         Yes       No

WhatsApp financial       3 total     20/period No

Billing in-app           Yes         Yes       Yes

Billing email            Yes         Yes       Yes

Security email           Yes         Yes       Yes
```

---

# 226. Final Core Invariants

Nunca romper:

```text
Notification
≠
Financial Truth
```

```text
Realtime
≠
Persistence
```

```text
Provider Delivery
≠
Domain Event
```

```text
AI Credits
≠
WhatsApp Usage
```

```text
Trial WhatsApp
=
bounded one-time allowance
```

```text
Pro WhatsApp
=
bounded billing-period allowance
```

```text
EXPIRED_READ_ONLY
=
no premium financial external notifications
```

---

# 227. Additional Invariants

```text
Provider failures never roll back financial writes.

Notifications remain auditable.

User preferences are respected.

WhatsApp requires explicit opt-in.

Quiet hours use user timezone.

Financial notification copy uses deterministic financial data.

AI is not required for notification delivery.

Allowance checks are server-side.

No negative WhatsApp usage balance.

Repeated jobs/webhooks do not duplicate logical deliveries.

Historical notifications remain accessible after expiration.

Billing/security/account communications remain available when necessary.
```

---

# 228. Final Architecture

```text
                   DOMAIN / APP EVENT
                           │
                           ↓
               Notification Rule Engine
                           │
                           ↓
                  Notification Intent
                           │
                           ↓
                 Notification Service
                           │
                     PostgreSQL
                           │
                           ↓
                  Delivery Planner
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
       IN_APP          REALTIME            EXTERNAL
                           │                 │
                          SSE         ┌──────┴──────┐
                                      │             │
                                    EMAIL       WHATSAPP
                                      │             │
                                    Resend         Twilio
                                                    │
                                                  Meta
```

Antes de cualquier delivery premium:

```text
Product Access
↓
Entitlement
↓
Preference
↓
Allowance
↓
Provider
```

---

# 229. Final Product Rule

El objetivo de las notificaciones no es maximizar mensajes enviados.

Es entregar:

```text
the right information

through the right channel

at the right time

with bounded cost
```

Durante el trial deben demostrar valor.

Durante Pro deben aportar retención y utilidad.

Después de la expiración deben respetar el estado read-only sin cortar comunicaciones esenciales de cuenta, seguridad o billing.
