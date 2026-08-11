# Billing & Subscriptions — Mercado Pago

## 1. Objetivo

Este documento define la arquitectura de billing y suscripciones de la aplicación usando Mercado Pago como proveedor inicial.

El modelo comercial actual es:

```text id="ew3mnr"
TRIAL
+
PRO_MONTHLY
+
EXPIRED_READ_ONLY
```

El trial es interno al producto.

Mercado Pago interviene únicamente cuando el usuario intenta activar una suscripción paga.

Principio central:

```text id="5ejyn2"
Product Access State
≠
Billing Provider State
```

Y:

```text id="g4yvpp"
TRIAL
≠
Mercado Pago Subscription
```

---

# 2. Commercial Model

Estados efectivos del producto:

```text id="hxm624"
TRIAL

PRO

EXPIRED_READ_ONLY
```

Plan pago:

```text id="x84rwv"
PRO_MONTHLY
```

Precio inicial:

```text id="kfzazh"
USD 7.99 / month
```

o equivalente localizado configurado comercialmente.

---

# 3. Product Access vs Billing

El producto debe resolver acceso mediante:

```text id="yrzt2z"
ProductAccessResolver
```

No mediante llamadas directas a Mercado Pago.

Flujo conceptual:

```text id="714f5v"
User
↓
ProductAccessResolver
↓
Billing State
+
Trial State
↓
Effective Access
```

---

# 4. Effective Access Resolution

Orden recomendado:

```text id="m3yz4s"
if effective Pro subscription:
    PRO

else if trialActive:
    TRIAL

else:
    EXPIRED_READ_ONLY
```

---

# 5. Trial Lifecycle

Cuando un usuario se registra:

```text id="6w6jp4"
trial_started_at
trial_ends_at
```

El trial:

```text id="6q7mlc"
lasts 14 days
```

y no requiere tarjeta inicialmente.

---

# 6. Trial Is Internal

No crear en Mercado Pago:

```text id="o8gaqd"
free subscription
```

ni:

```text id="4y5jjq"
zero-value subscription
```

para representar el trial.

El trial pertenece al dominio interno del producto.

---

# 7. Billing Begins When User Upgrades

Flujo:

```text id="11ugx1"
TRIAL or EXPIRED_READ_ONLY
↓
User chooses Pro
↓
StartSubscription
↓
Mercado Pago
↓
Subscription pending
```

---

# 8. Checkout Redirect Is Not Pro

Mantener:

```text id="fnjkcz"
Checkout Redirect
≠
PRO Access
```

Volver desde Mercado Pago no activa el plan.

---

# 9. Activation Source of Truth

PRO se activa cuando:

```text id="2v5piq"
provider state
```

ha sido:

```text id="a4z4xz"
verified
+
normalized
+
persisted locally
```

---

# 10. Billing Bounded Context

El dominio de billing debe permanecer separado de finanzas personales.

```text id="rye49e"
Platform Billing
≠
Personal Finance
```

---

# 11. User Subscription Payment

El pago de la suscripción SaaS:

```text id="20jexq"
BillingPayment
```

no debe crear automáticamente:

```text id="8kzef0"
Personal Finance Transaction
```

El usuario puede registrarlo manualmente si desea reflejarlo en sus finanzas personales.

---

# 12. Billing Entities

Modelo principal:

```text id="abgs5o"
BillingPlan

BillingSubscription

BillingPayment

BillingWebhookEvent
```

Opcional:

```text id="sri0tk"
BillingEntitlementOverride
```

---

# 13. Billing Plan

Plan inicial:

```text id="139wz2"
PRO_MONTHLY
```

Campos conceptuales:

```text id="v71r59"
id

code

name

price

currency

billing_interval

provider_plan_id

active
```

---

# 14. Pricing

El precio debe provenir del catálogo de billing.

No hardcodear:

```text id="l3a8kv"
7.99
```

en:

```text id="9cn2ab"
UI

features

entitlement checks
```

---

# 15. Billing Subscription

Campos conceptuales:

```text id="ytgj4y"
id

user_id

plan_code

provider

provider_subscription_id

status

current_period_start

current_period_end

cancel_at_period_end

cancelled_at

provider_payload_version

created_at

updated_at
```

---

# 16. Internal Subscription Status

Normalizar estados externos a:

```text id="4rv0nh"
PENDING

ACTIVE

PAST_DUE

PAUSED

CANCELLED

EXPIRED
```

Opcional:

```text id="m7juvt"
INCOMPLETE
```

si resulta necesario según API seleccionada.

---

# 17. Provider State Normalization

Mercado Pago puede tener nomenclatura diferente.

Crear:

```text id="nl3i6h"
normalizeProviderSubscriptionStatus()
```

El resto de la aplicación usa únicamente estados internos.

---

# 18. One Effective Paid Subscription

V1:

```text id="7qrryn"
one effective paid subscription per user
```

No permitir múltiples Pro activos simultáneamente.

---

# 19. Start Subscription

Application service:

```text id="6ihwgs"
StartProSubscription
```

Flujo:

```text id="ee21sj"
Authenticated user
↓
Validate current state
↓
Create local PENDING subscription
↓
Call Mercado Pago
↓
Persist provider subscription ID
↓
Return checkout/init URL
```

---

# 20. Create Local First

Recomendación:

crear estado local:

```text id="oabrlx"
PENDING
```

antes de depender completamente de la respuesta externa.

Esto permite trazabilidad e idempotencia.

---

# 21. Idempotency

`StartProSubscription` debe ser idempotente.

Evitar:

```text id="j6iqny"
double-click
↓
two subscriptions
```

---

# 22. Existing Pending Subscription

Si ya existe una PENDING reciente:

```text id="7wwu1h"
reuse or reconcile
```

antes de crear otra.

---

# 23. Stale Pending

Definir política para:

```text id="9yiwyn"
stale PENDING subscriptions
```

Ejemplo:

```text id="36k7i1"
older than configurable threshold
```

pueden ser reconciliadas o marcadas expiradas.

---

# 24. Webhook Endpoint

Crear endpoint dedicado:

```text id="7ljyu0"
POST /api/webhooks/mercadopago
```

No requiere sesión de usuario.

---

# 25. Webhook Is Untrusted Input

Todo payload externo:

```text id="3zj6p0"
must be validated
```

No usar directamente sus campos para otorgar acceso.

---

# 26. Webhook Authenticity

Verificar autenticidad con el mecanismo oficial soportado por Mercado Pago para la API seleccionada.

No confiar únicamente en:

```text id="7mxg1w"
source IP
```

---

# 27. Persist Webhook Event

Antes de procesar completamente:

```text id="08aa25"
persist event
```

en:

```text id="cr0srz"
billing_webhook_events
```

---

# 28. Webhook Event Fields

Conceptualmente:

```text id="hhxlzh"
id

provider

provider_event_id

event_type

external_resource_id

status

payload_hash

received_at

processed_at

error_code
```

---

# 29. Webhook Deduplication

Unique:

```text id="m0528y"
provider
+
provider_event_id
```

cuando provider ofrezca identificador estable.

Si no:

usar estrategia de dedup documentada.

---

# 30. Provider Resource Fetch

No confiar únicamente en el payload del webhook.

Flujo preferido:

```text id="mu1dcb"
Webhook
↓
Validate authenticity
↓
Extract resource ID
↓
Fetch current resource from Mercado Pago
↓
Normalize
↓
Update local state
```

---

# 31. Provider Reality Wins

Cuando existe conflicto entre:

```text id="qn67jf"
redirect state

old webhook

local stale state
```

y:

```text id="1h56xl"
current provider resource
```

la realidad actual del provider debe prevalecer, salvo incidentes conocidos.

---

# 32. Out-of-Order Webhooks

Los eventos pueden llegar:

```text id="jbt6ij"
late

duplicated

out of order
```

El procesamiento debe comparar estado/version/timestamps antes de degradar información más reciente.

---

# 33. Webhook Processing Must Be Idempotent

Procesar el mismo evento dos veces no puede:

```text id="au71ze"
activate twice

grant AI credits twice

grant WhatsApp allowance twice
```

---

# 34. Billing Payment

Crear:

```text id="cy9o6o"
billing_payments
```

Campos conceptuales:

```text id="avb6kk"
id

user_id

subscription_id

provider_payment_id

status

gross_amount

currency

provider_fee

net_amount

paid_at

created_at

updated_at
```

---

# 35. Payment Status

Normalizar:

```text id="f211t0"
PENDING

APPROVED

REJECTED

REFUNDED

CANCELLED
```

según comportamiento real del provider.

---

# 36. Provider Fee

Cuando esté disponible:

guardar:

```text id="i5epgp"
provider_fee
```

Esto permite comparar costo real con el supuesto de:

```text id="nq9j81"
10%
```

usado en pricing.

---

# 37. Net Amount

Si Mercado Pago informa monto neto:

```text id="gjo18r"
persist it
```

No recalcularlo ciegamente como:

```text id="fgozkd"
gross × 0.90
```

El 10% es un supuesto de negocio.

El provider reportado es dato operativo real.

---

# 38. Pricing Assumption vs Billing Reality

Mantener:

```text id="a7b0pt"
Assumed Gateway Rate
≠
Actual Provider Fee
```

---

# 39. Effective Pro

`ACTIVE` normalmente concede:

```text id="657xzj"
PRO
```

---

# 40. Pending

`PENDING`:

```text id="kt128o"
does not grant Pro
```

El usuario mantiene:

```text id="0fvqm8"
TRIAL
```

si todavía está activo.

Si el trial expiró:

```text id="d5z8en"
EXPIRED_READ_ONLY
```

hasta confirmación.

---

# 41. Past Due

`PAST_DUE` puede mantener temporalmente PRO si existe:

```text id="1tvsfq"
grace period
```

---

# 42. Grace Period

Configuración:

```text id="xq30xp"
BILLING_GRACE_PERIOD_DAYS
```

La duración exacta es decisión comercial/configuración.

---

# 43. Grace State Resolution

Conceptualmente:

```text id="cx9ywf"
PAST_DUE
+
within grace
→ PRO

PAST_DUE
+
outside grace
→ EXPIRED_READ_ONLY
```

---

# 44. Trial Does Not Get Grace

Cuando termina el trial:

```text id="v16kgo"
TRIAL
↓
EXPIRED_READ_ONLY
```

No usar grace automáticamente.

---

# 45. Subscription Cancellation

Semántica exacta debe alinearse con la API real de Mercado Pago.

Dos posibilidades:

```text id="1b207r"
cancel at period end
```

o:

```text id="7lehf6"
immediate cancellation
```

---

# 46. Provider Semantics Win

La UI debe representar el comportamiento real soportado por Mercado Pago.

No prometer:

```text id="7vqu5c"
“seguís con Pro hasta fin de mes”
```

si el provider cancela inmediatamente.

---

# 47. Cancellation ADR

La semántica exacta de cancelación debe documentarse en ADR cuando la API seleccionada esté verificada.

---

# 48. Cancel At Period End

Si soportado:

```text id="p7jbk9"
cancel_at_period_end = true
```

pero:

```text id="0mt7om"
EffectiveProductAccess = PRO
```

hasta `current_period_end`.

---

# 49. Immediate Cancellation

Si provider cancela inmediatamente:

```text id="id6l8e"
ProductAccessResolver
```

debe reflejarlo según política/grace definida.

---

# 50. Expiration

Cuando Pro deja de ser efectivo:

```text id="qqou8h"
PRO
↓
EXPIRED_READ_ONLY
```

Nunca:

```text id="bkrgzh"
PRO
↓
DELETE DATA
```

---

# 51. Entitlements

Billing no debe realizar feature checks directamente.

Flujo:

```text id="v4mi6j"
Billing
↓
Effective Access
↓
EntitlementService
↓
Feature
```

---

# 52. Billing Does Not Know Every Feature

Billing responde:

```text id="6xfhuv"
which paid plan is effective?
```

Entitlements responden:

```text id="0x6yiz"
what can this user do?
```

---

# 53. AI Grant Integration

Cuando PRO se activa para un nuevo período:

```text id="wzxnjy"
Billing Period Activated
↓
AI Credit Grant
```

---

# 54. AI Monthly Grant

Inicialmente:

```text id="mtjo6n"
300 AI credits
per Pro billing period
```

Definido en:

```text id="7qcz0b"
docs/08.1-ai-credits-and-usage.md
```

---

# 55. AI Grant Idempotency

Unique conceptual:

```text id="ua63j7"
userId
+
billingPeriodId
+
PRO_AI_GRANT
```

---

# 56. Repeated Webhook

Nunca:

```text id="8jcb6p"
same period webhook × 3
↓
900 credits
```

Debe seguir siendo:

```text id="yeylvd"
300
```

---

# 57. Trial AI Grant

Trial grant:

```text id="wgqb6v"
50 credits total
```

No proviene de Billing/Mercado Pago.

Proviene del lifecycle del trial.

---

# 58. WhatsApp Allowance Integration

PRO:

```text id="6rmep7"
20 WhatsApp alerts
per billing period
```

---

# 59. WhatsApp Allowance Is Not Mercado Pago Entity

Mercado Pago no debe conocer el allowance.

Billing únicamente comunica:

```text id="rc6yha"
effective plan / billing period
```

al sistema de notifications.

---

# 60. Renewal

Cuando comienza un nuevo período:

```text id="6w0n62"
renewal confirmed
↓
new billing period
↓
new AI grant
↓
new WhatsApp allowance
```

---

# 61. Renewal Idempotency

Una renovación no puede generar múltiples períodos internos por eventos repetidos.

---

# 62. Period Identity

Necesitamos una referencia estable:

```text id="lr5edi"
provider period ID
```

si existe.

Si no:

usar combinación controlada:

```text id="5w2vtf"
subscriptionId
+
currentPeriodStart
+
currentPeriodEnd
```

---

# 63. Billing Period Entity

Opcionalmente crear:

```text id="bn93bk"
billing_periods
```

Campos:

```text id="5z5p9j"
id

subscription_id

starts_at

ends_at

status

provider_reference

created_at
```

Esto puede simplificar grants e historial.

---

# 64. Recommended Billing Period Entity

Para este producto:

```text id="tb2m4c"
recommended
```

porque:

```text id="0wkam4"
AI credits

WhatsApp allowances

pricing analytics
```

dependen del período.

---

# 65. Trial Conversion

Registrar evento:

```text id="svf06e"
TRIAL_CONVERTED_TO_PRO
```

cuando un usuario con trial activo obtiene PRO efectivo.

---

# 66. Post-Trial Conversion

También registrar:

```text id="ozjffw"
EXPIRED_REACTIVATED_TO_PRO
```

si activa después de haber expirado.

---

# 67. Billing Analytics

Registrar:

```text id="20eax2"
checkout_started

subscription_created

subscription_activated

payment_approved

payment_failed

subscription_past_due

subscription_cancelled

subscription_expired
```

---

# 68. Trial Analytics Separation

Eventos:

```text id="9rqygg"
trial_started

trial_expired

trial_converted
```

pertenecen a lifecycle/product analytics, no exclusivamente a Mercado Pago.

---

# 69. Failed Payment

Un pago fallido no debe:

```text id="tjyapd"
delete subscription history
```

Actualizar estado.

---

# 70. Payment Retry

Si Mercado Pago maneja retries automáticos:

reflejar provider state.

No implementar un segundo sistema de cobranza paralelo sin necesidad.

---

# 71. Retry Notifications

Puede generar:

```text id="22270k"
billing payment failed notification
```

mediante Notification Service.

---

# 72. Billing Notifications

Ejemplos:

```text id="uj4a5o"
Subscription activated

Payment failed

Grace period started

Subscription cancelled

Subscription expired
```

---

# 73. Billing Notifications Ignore Commercial Channel Limits

Mensajes críticos de cuenta/billing:

```text id="pt3mc7"
must remain deliverable
```

por canales permitidos de cuenta.

No depender de:

```text id="jtn1b5"
AI credits
```

ni límites financieros normales.

---

# 74. WhatsApp Billing Messages

No usar WhatsApp automáticamente para billing en V1 salvo consentimiento, template y política explícita.

Email + in-app son suficientes inicialmente.

---

# 75. Billing Email

Proveedor:

```text id="jhjg5v"
Resend
```

puede enviar:

```text id="qdvt0t"
subscription activated

payment failed

subscription cancelled
```

---

# 76. Platform Billing Emails

Estos emails no deben bloquearse porque:

```text id="mvhk30"
financial email alerts disabled
```

Son categoría funcional separada.

---

# 77. BillingProvider Abstraction

Crear:

```text id="dwjlbr"
BillingProvider
```

---

# 78. BillingProvider Contract

Conceptualmente:

```ts id="2qfycn"
interface BillingProvider {
  createSubscription(input): Promise<CreateSubscriptionResult>

  getSubscription(externalId): Promise<ProviderSubscription>

  cancelSubscription(externalId): Promise<...>

  getPayment?(externalId): Promise<ProviderPayment>
}
```

El contrato exacto depende de la API final.

---

# 79. MercadoPagoBillingProvider

Implementación:

```text id="tfitiz"
MercadoPagoBillingProvider
```

Responsabilidades:

```text id="zq50ih"
authentication

subscription creation

resource retrieval

cancellation

response normalization

provider errors

idempotency mapping
```

---

# 80. No Mercado Pago Imports In Features

Incorrecto:

```text id="zv5fac"
Pricing Page
↓
Mercado Pago SDK
```

Correcto:

```text id="1gqyo2"
Pricing Page
↓
StartProSubscription
↓
BillingService
↓
BillingProvider
```

---

# 81. Packages

Suggested:

```text id="cw2tv0"
packages/billing/
└── src/
    ├── domain/
    ├── application/
    ├── plans/
    ├── providers/
    │   └── mercadopago/
    ├── entitlements/
    ├── reconciliation/
    ├── errors.ts
    └── index.ts
```

---

# 82. Plans Package

```text id="zg9bbl"
plans/
├── catalog.ts
├── pricing.ts
└── provider-mapping.ts
```

---

# 83. Access Resolver Location

Puede vivir en:

```text id="l9brk6"
packages/billing
```

o aplicación compartida.

Pero debe poder consultar:

```text id="23h8sf"
trial state
+
billing state
```

sin hacer provider calls.

---

# 84. No Provider Call On Every Request

Nunca:

```text id="m96lwr"
CreateTransaction
↓
Mercado Pago API
```

---

# 85. Local Projection

La aplicación utiliza:

```text id="5v5by7"
local normalized billing state
```

para acceso.

---

# 86. Reconciliation

Crear proceso periódico:

```text id="6q249c"
BillingReconciliationJob
```

---

# 87. Reconciliation Responsibilities

Buscar:

```text id="fx9k5j"
PENDING stale

PAST_DUE

recently changed subscriptions

subscriptions needing confirmation
```

y consultar provider.

---

# 88. Reconciliation Is Safety Net

Webhooks son principal mecanismo de actualización.

Reconciliation:

```text id="7y8is5"
repairs missed events
```

---

# 89. Provider Outage

Si Mercado Pago está caído:

```text id="ekm7th"
existing local Pro users
```

deben conservar acceso según estado local.

No bajar a todos a read-only.

---

# 90. Provider Outage And New Checkout

Un usuario puede no poder iniciar checkout.

Mostrar error:

```text id="0a1m44"
No pudimos iniciar la suscripción en este momento.
```

No afectar su trial/read-only actual.

---

# 91. Access During Provider Outage

No hacer verificación síncrona obligatoria.

Mantener:

```text id="4wve47"
local effective access
```

---

# 92. Security

Provider credentials:

```text id="zw4h2v"
server only
```

---

# 93. Environment Variables

Conceptualmente:

```text id="u31u96"
BILLING_ENABLED

MERCADOPAGO_ACCESS_TOKEN

MERCADOPAGO_WEBHOOK_SECRET

MERCADOPAGO_PRO_MONTHLY_PLAN_ID

BILLING_GRACE_PERIOD_DAYS
```

Más variables según API final.

---

# 94. Sandbox vs Production

Separar claramente:

```text id="i9rah1"
test credentials

production credentials
```

Nunca mezclar subscriptions de prueba con producción.

---

# 95. Webhook Environment Isolation

Eventos sandbox no deben modificar producción.

---

# 96. Secrets

No registrar:

```text id="csohxj"
access tokens

webhook secrets

sensitive provider payload
```

en logs.

---

# 97. PII

Guardar únicamente información de billing necesaria.

No almacenar:

```text id="gzgq9b"
card number

CVV
```

---

# 98. Card Data

Nunca debe pasar por nuestros servidores si la integración permite checkout/provider-hosted collection.

---

# 99. Error Codes

Normalizar:

```text id="7k2yb0"
BILLING_DISABLED

BILLING_PROVIDER_ERROR

BILLING_SUBSCRIPTION_ALREADY_ACTIVE

BILLING_SUBSCRIPTION_PENDING

BILLING_SUBSCRIPTION_NOT_FOUND

BILLING_PAYMENT_FAILED

BILLING_WEBHOOK_INVALID

BILLING_WEBHOOK_DUPLICATE

BILLING_RECONCILIATION_FAILED
```

---

# 100. UI — Trial

Settings:

```text id="pm538y"
Prueba Pro

8 días restantes

[Activar Pro]
```

---

# 101. UI — Expired

```text id="pvfio2"
Tu período de prueba terminó.

Tus datos siguen disponibles en modo lectura.

[Activar Pro]
```

---

# 102. UI — Checkout Pending

```text id="f1jtce"
Estamos verificando tu suscripción.
```

No:

```text id="2rb4rr"
¡Ya sos Pro!
```

hasta confirmación.

---

# 103. UI — Pro Active

```text id="fv6lt6"
Plan Pro

USD 7.99 / mes

Próxima renovación:
...
```

---

# 104. UI — Past Due

```text id="jj7jhi"
No pudimos procesar tu último pago.
```

Si hay grace:

```text id="u2kf6s"
Tu acceso Pro continúa temporalmente.
```

---

# 105. UI — Cancellation

Debe mostrar semántica real:

```text id="8wkoqb"
Tu suscripción finaliza el ...
```

o:

```text id="icob0c"
Tu suscripción fue cancelada.
```

según provider/política.

---

# 106. Pricing Page

Mostrar:

```text id="0oob5c"
14 días gratis

Después:
USD 7.99 / mes
```

---

# 107. No Fake Free Plan

Eliminar:

```text id="iupj4r"
FREE
```

de pricing comercial.

---

# 108. Trial Copy

Recomendación:

```text id="hb3q1y"
Probá todas las funciones durante 14 días.

No necesitás tarjeta.
```

---

# 109. Billing Period Usage

Settings puede mostrar:

```text id="r9n8an"
IA
184 / 300

WhatsApp
8 / 20
```

pero Billing no calcula esos usages directamente.

---

# 110. Entitlement Integration

Billing expone:

```text id="jcv9fz"
effectivePlan
```

EntitlementService compone:

```text id="791d84"
plan
+
access state
+
feature configuration
```

---

# 111. Trial Access Integration

Trial no depende de Mercado Pago.

---

# 112. Expired Access Integration

Read-only tampoco depende de un plan externo.

---

# 113. Payment Processing Fee

Para business analytics:

registrar si posible:

```text id="6fk18k"
grossAmount

providerFee

netAmount
```

---

# 114. 10% Pricing Assumption

Mantener documentado:

```text id="l7r9gq"
pricing planning assumption:
10%
```

pero no usarlo como valor real de conciliación de pagos.

---

# 115. Business Metrics

Billing debe permitir medir:

```text id="on5h6o"
Active Pro

New Pro

Cancellations

Past Due

Gross MRR

Gateway Fees

Net Payment MRR
```

---

# 116. Trial Conversion Metrics

Combinado con Product Access:

```text id="8tcoid"
Trial → Pro

Expired → Pro
```

---

# 117. No Manual Grant From Redirect

Ni UI ni route handler de return debe poder hacer:

```text id="i6enj3"
setUserPro(true)
```

---

# 118. Return Route

Puede:

```text id="4xpdeu"
display status

trigger safe provider refresh

poll local subscription
```

pero no confiar en parámetros de query para activar acceso.

---

# 119. Provider Refresh

Si el usuario vuelve del checkout:

```text id="k1h42y"
RefreshSubscriptionState
```

puede consultar provider.

Eso mejora UX sin reemplazar webhook.

---

# 120. Polling

La UI puede hacer polling corto de:

```text id="41j8uh"
local subscription state
```

mientras espera confirmación.

---

# 121. No Infinite Poll

Limitar polling y ofrecer:

```text id="1g6rw1"
Refresh
```

o fallback.

---

# 122. Refunds

La política comercial exacta puede estar pendiente.

Billing debe poder registrar:

```text id="hqfrn6"
REFUNDED
```

sin asumir automáticamente cómo afecta acceso.

---

# 123. Refund Access Policy

Crear decisión comercial explícita antes de implementar refunds automáticos complejos.

---

# 124. Chargebacks

Si provider los expone:

tratar como evento billing separado.

No mezclar con finanzas personales.

---

# 125. Subscription Upgrade

Actualmente solo existe un tier pago.

No hay upgrade Pro→higher tier en V1.

---

# 126. Subscription Downgrade

Principal downgrade:

```text id="rkumkw"
PRO
↓
EXPIRED_READ_ONLY
```

cuando finaliza acceso.

---

# 127. Future Annual Plan

Puede agregarse:

```text id="ji1qfn"
PRO_YEARLY
```

manteniendo mismos entitlements.

---

# 128. Monthly vs Annual Access

Ambos resolverían:

```text id="teirtl"
PRO
```

El producto no necesita saber frecuencia para habilitar una feature.

---

# 129. Grandfathered Pricing

Puede existir:

```text id="hfv2iu"
PRO_LEGACY
```

a nivel billing/catalog.

Sigue resolviendo:

```text id="7n8skv"
PRO
```

para entitlements.

---

# 130. Pricing Version

Persistir:

```text id="p76hpi"
planCode

price/version
```

cuando sea necesario para auditoría.

---

# 131. Tests — Trial to Pro

```text id="4xv9et"
active trial
↓
checkout
↓
provider pending
↓
still TRIAL
↓
provider active
↓
PRO
```

---

# 132. Tests — Expired to Pro

```text id="y78vi3"
EXPIRED_READ_ONLY
↓
checkout
↓
PENDING
↓
still read-only
↓
provider active
↓
PRO
```

---

# 133. Tests — Duplicate Webhook

```text id="3j138l"
same activation webhook twice
```

Expected:

```text id="zoa3sm"
one subscription transition

one AI grant

one period

no duplicate allowance
```

---

# 134. Tests — Failed Payment

```text id="z65c2n"
renewal fails
↓
PAST_DUE
↓
grace policy
↓
eventual EXPIRED_READ_ONLY
```

---

# 135. Tests — Provider Outage

Existing Pro:

```text id="vges4t"
remains usable
```

New checkout:

```text id="vtfrvy"
fails gracefully
```

---

# 136. Tests — Return Route Attack

Manipulating:

```text id="50xrqr"
?status=approved
```

cannot grant Pro.

---

# 137. Tests — User Isolation

User A cannot:

```text id="kk7svu"
read

cancel

refresh
```

User B subscription.

---

# 138. Tests — Trial Expiration

Trial expiry without subscription:

```text id="5z3cym"
→ EXPIRED_READ_ONLY
```

No billing record required.

---

# 139. Tests — Cancellation

Depends on verified provider semantics.

Must cover:

```text id="f5ag6w"
cancel request

local pending state

provider update

effective access
```

---

# 140. Production Readiness

Before launch:

```text id="tzhj71"
production credentials configured

webhook reachable

webhook authenticity verified

plan/provider IDs correct

checkout tested

activation tested

renewal tested

failure tested

cancellation tested

reconciliation tested
```

---

# 141. Reconciliation Job

Must be safe to rerun.

---

# 142. Webhook Replay

Must be safe to replay.

---

# 143. Billing Recovery

Database restore must reconcile provider reality after recovery.

Do not reconstruct paid status solely from old webhook history.

---

# 144. Mercado Pago Is External Recoverable State

Per backup strategy:

```text id="fwps6y"
PostgreSQL billing projection
+
Mercado Pago current state
```

can be reconciled.

---

# 145. No New Subscription During Recovery Repair

Do not create replacement subscriptions merely to repair local state.

Fetch and reconcile existing provider resources.

---

# 146. Observability

Logs:

```text id="o3jth1"
subscriptionId

userId internal

provider resource ID

event type

normalized status

processing result
```

Avoid sensitive payload dumps.

---

# 147. Metrics

```text id="59jdv8"
webhook success rate

reconciliation failures

pending age

subscription activations

payment failures

provider latency
```

---

# 148. Alerts

Alert if:

```text id="108thb"
webhooks failing

reconciliation failing

large stale pending count

unexpected active subscription drop

provider API unavailable
```

---

# 149. Admin Support

Support can:

```text id="xcnr1q"
view normalized billing state

trigger reconciliation

view provider IDs
```

But should not casually:

```text id="28yo5t"
manually set ACTIVE
```

without an audited override mechanism.

---

# 150. Manual Access Override

If required for support:

use:

```text id="dl343g"
Entitlement Override
```

with expiration and reason.

Do not forge Mercado Pago state.

---

# 151. Core Billing Invariants

Never break:

```text id="0vcltk"
TRIAL
≠
Billing Subscription
```

```text id="fthik2"
EXPIRED_READ_ONLY
≠
Billing Plan
```

```text id="3quyvw"
Checkout Redirect
≠
PRO Access
```

```text id="4obgbq"
PENDING
≠
PRO
```

```text id="f0g22b"
Billing Payment
≠
Personal Finance Transaction
```

```text id="offd1g"
Mercado Pago
≠
Entitlement Service
```

---

# 152. Data Invariants

```text id="9vmbbe"
Subscription cancellation does not delete financial data.

Trial expiration does not delete financial data.

Repeated webhooks do not duplicate grants.

Billing provider outages do not invalidate all local Pro access.

Provider fees are stored separately from personal finance.

AI/WhatsApp allowances are tied idempotently to effective periods.
```

---

# 153. Access Invariants

```text id="h9l4m9"
TRIAL
→ full temporary access

PRO
→ full paid access

EXPIRED_READ_ONLY
→ historical/read access
```

---

# 154. Pricing Invariant

Current commercial assumption:

```text id="jvpxha"
PRO_MONTHLY
USD 7.99
```

and:

```text id="22sy96"
effective gateway planning cost
10%
```

Actual billing fees must be reconciled from provider data when available.

---

# 155. Final Architecture

```text id="o04ktz"
                     USER
                      │
             ProductAccessResolver
                      │
          ┌───────────┴───────────┐
          │                       │
       Trial State           Billing State
          │                       │
          │                 Billing Service
          │                       │
          │                BillingProvider
          │                       │
          │                Mercado Pago
          │                       │
          └───────────┬───────────┘
                      ↓
             Effective Access
                      │
              EntitlementService
                      │
          ┌───────────┼────────────┐
          │           │            │
       Finance       AI      Notifications
```

Mercado Pago administra la ejecución del cobro.

Billing mantiene una proyección local confiable.

Product Access combina billing y trial.

Entitlements controlan capacidades.

Ninguna feature financiera consulta Mercado Pago directamente.
