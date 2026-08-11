# Billing Mercado Pago — Vertical Slice

## 1. Objetivo

Este documento define la implementación vertical del flujo de suscripción paga mediante Mercado Pago.

El slice debe implementar:

```text
TRIAL
↓
Start Pro Checkout
↓
Mercado Pago
↓
PENDING
↓
Provider Confirmation
↓
PRO
```

y también:

```text
TRIAL EXPIRES
↓
EXPIRED_READ_ONLY
```

o:

```text
PRO ENDS
↓
EXPIRED_READ_ONLY
```

Este documento implementa las decisiones definidas en:

```text
docs/10-billing-subscriptions-mercadopago.md
docs/10.1-subscription-plans-and-limits.md
docs/10.2-pricing-unit-economics.md
docs/08.1-ai-credits-and-usage.md
docs/09-notifications-alerts.md
```

---

# 2. Alcance del slice

Este slice incluye:

```text
trial lifecycle integration

Pro checkout

Mercado Pago subscription creation

local subscription persistence

webhook processing

provider reconciliation

effective access resolution

trial → Pro transition

expired → Pro reactivation

Pro → expired transition

billing period creation

AI period grant trigger

WhatsApp allowance period integration

billing settings UI

pricing/upgrade UI

tests
```

---

# 3. Fuera de alcance

No implementar todavía:

```text
annual plan

multiple paid tiers

credit packs

WhatsApp add-ons

coupon system

family plans

refund automation

complex chargeback workflows

manual invoicing

usage-based billing
```

---

# 4. Comercial Model

El producto tiene:

```text
TRIAL
14 days
```

seguido de:

```text
PRO_MONTHLY
USD 7.99 / month
```

Si el usuario no tiene acceso pago efectivo:

```text
EXPIRED_READ_ONLY
```

---

# 5. Important Separation

Mantener:

```text
Billing Plan
≠
Product Access State
```

Billing plan:

```text
PRO_MONTHLY
```

Product access states:

```text
TRIAL

PRO

EXPIRED_READ_ONLY
```

---

# 6. Trial Is Not Billing

No crear subscription provider para trial.

El trial pertenece al producto.

Campos mínimos existentes o requeridos:

```text
trial_started_at

trial_ends_at
```

---

# 7. Billing Domain

Entidades principales:

```text
BillingSubscription

BillingPeriod

BillingPayment

BillingWebhookEvent
```

---

# 8. BillingSubscription Schema

Tabla conceptual:

```text
billing_subscriptions
```

Campos:

```text
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

created_at
updated_at
```

---

# 9. Plan Code

V1:

```text
PRO_MONTHLY
```

No guardar:

```text
TRIAL
```

como plan de Mercado Pago.

---

# 10. Provider

Inicialmente:

```text
MERCADO_PAGO
```

Diseñar para futura sustitución mediante `BillingProvider`.

---

# 11. Subscription Status

Normalizar:

```text
PENDING

ACTIVE

PAST_DUE

PAUSED

CANCELLED

EXPIRED
```

El código de producto no debe depender de strings externos de Mercado Pago.

---

# 12. BillingPeriod

Crear tabla:

```text
billing_periods
```

Campos:

```text
id

subscription_id

starts_at

ends_at

status

provider_reference

created_at
updated_at
```

---

# 13. Why BillingPeriod Exists

Necesitamos una entidad estable para:

```text
AI credit grants

WhatsApp allowances

renewal audit

usage reporting

idempotency
```

---

# 14. BillingPeriod Status

Ejemplo:

```text
PENDING

ACTIVE

CLOSED

FAILED
```

---

# 15. BillingPayment

Tabla:

```text
billing_payments
```

Campos:

```text
id

user_id
subscription_id
billing_period_id

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

# 16. Money Representation

Billing debe utilizar tipos exactos.

No:

```text
JS Number
```

para cálculos financieros relevantes.

Seguir estrategia decimal/exact money del proyecto.

---

# 17. Pricing

El precio viene de:

```text
Billing Plan Catalog
```

Ejemplo conceptual:

```ts
PRO_MONTHLY = {
  price: "7.99",
  currency: "USD",
  interval: "MONTH"
}
```

El ejemplo es conceptual.

No duplicar precio por toda la aplicación.

---

# 18. Provider Price Mapping

Mantener mapping:

```text
PRO_MONTHLY
↓
MERCADO_PAGO_PRO_MONTHLY_PLAN_ID
```

o equivalente según API final elegida.

---

# 19. BillingProvider

Contrato:

```ts
interface BillingProvider {
  createSubscription(
    input: CreateSubscriptionInput
  ): Promise<CreateSubscriptionResult>

  getSubscription(
    providerSubscriptionId: string
  ): Promise<ProviderSubscription>

  cancelSubscription(
    providerSubscriptionId: string
  ): Promise<ProviderCancellationResult>

  getPayment?(
    providerPaymentId: string
  ): Promise<ProviderPayment>
}
```

---

# 20. MercadoPagoBillingProvider

Implementación:

```text
MercadoPagoBillingProvider
```

Debe encargarse exclusivamente de detalles de Mercado Pago.

---

# 21. Application Services

Crear:

```text
StartProSubscription

RefreshSubscriptionState

HandleMercadoPagoWebhook

CancelProSubscription

ReconcileBillingSubscription

GetBillingSummary
```

---

# 22. StartProSubscription

Responsabilidades:

```text
authenticate user

resolve effective access

prevent duplicate active subscription

check existing pending subscription

create/reuse local pending record

call provider

store provider subscription ID

return checkout URL
```

---

# 23. Start Subscription Input

No aceptar:

```text
userId
```

como autoridad desde cliente.

Derivar usuario de sesión autenticada.

---

# 24. Start Subscription Flow

```text
User clicks Activar Pro
↓
Server Action
↓
StartProSubscription
↓
Existing ACTIVE?
   → reject/already active
↓
Existing usable PENDING?
   → reuse
↓
Create local PENDING
↓
MercadoPagoBillingProvider.createSubscription()
↓
Persist provider ID
↓
Return checkout URL
```

---

# 25. Idempotency

Double click:

```text
Activar Pro
Activar Pro
```

no puede crear dos subscriptions.

---

# 26. Suggested Idempotency Key

Conceptual:

```text
userId
+
PRO_MONTHLY
+
active checkout attempt
```

La implementación concreta puede usar:

```text
idempotency_key
```

persistido.

---

# 27. Existing Active Subscription

Si usuario ya es PRO:

```text
StartProSubscription
```

debe retornar error normalizado:

```text
BILLING_SUBSCRIPTION_ALREADY_ACTIVE
```

---

# 28. Existing Pending

Si existe:

```text
PENDING
```

reciente y válida:

preferir reutilizarla.

---

# 29. Pending Timeout

Configuración conceptual:

```text
BILLING_PENDING_TTL
```

Si excede el tiempo:

```text
reconcile
```

antes de crear nueva.

---

# 30. Checkout Redirect

Después de obtener checkout URL:

frontend redirige a provider.

No modificar acceso local todavía.

---

# 31. Return URL

Route:

```text
/billing/return
```

puede recibir parámetros de provider.

Estos parámetros son:

```text
UX hints
```

no source of truth.

---

# 32. Return Page

Mostrar inicialmente:

```text
Estamos verificando tu suscripción.
```

---

# 33. Never Activate From Query Params

No implementar:

```text
if searchParams.status === "approved":
    setPro()
```

---

# 34. Refresh On Return

La página puede llamar:

```text
RefreshSubscriptionState
```

para consultar provider inmediatamente.

---

# 35. Short Polling

Mientras espera:

```text
poll local billing summary
```

durante un intervalo limitado.

---

# 36. Pending UX

Mientras sigue pendiente:

```text
Tu suscripción todavía está siendo verificada.
```

Mantener estado previo:

```text
TRIAL
```

o:

```text
EXPIRED_READ_ONLY
```

---

# 37. Webhook Endpoint

Crear:

```text
POST /api/webhooks/mercadopago
```

---

# 38. Webhook Authentication

Debe verificarse usando mecanismo oficial aplicable a la integración final.

Nunca confiar ciegamente en el body.

---

# 39. Webhook Persistence First

Crear:

```text
billing_webhook_events
```

antes de procesar efectos.

---

# 40. WebhookEvent Fields

```text
id

provider

provider_event_id

event_type

external_resource_id

payload_hash

status

received_at

processed_at

error_code
```

---

# 41. Event Status

```text
RECEIVED

PROCESSING

PROCESSED

FAILED

IGNORED
```

---

# 42. Webhook Deduplication

Cuando exista stable provider event ID:

unique:

```text
provider
+
provider_event_id
```

---

# 43. Webhook Processing

Flujo:

```text
Receive
↓
Verify
↓
Persist/deduplicate
↓
Extract provider resource ID
↓
Fetch current provider resource
↓
Normalize
↓
Apply local transition
↓
Create/update billing period
↓
Emit internal lifecycle event
↓
Mark processed
```

---

# 44. Fetch Current Provider State

Preferir consultar provider en lugar de confiar únicamente en contenido del webhook.

---

# 45. Provider Normalization

Crear:

```text
normalizeMercadoPagoSubscription()
```

Resultado:

```text
providerSubscriptionId

status

periodStart

periodEnd

cancelAtPeriodEnd

providerUpdatedAt
```

---

# 46. Apply Subscription State

Application service debe decidir:

```text
local state update
```

de forma idempotente.

---

# 47. Out-Of-Order Event Protection

No degradar un estado más reciente con un evento viejo.

Comparar:

```text
provider updated timestamp
```

o equivalente cuando exista.

---

# 48. ACTIVE Transition

Cuando subscription pasa a:

```text
ACTIVE
```

debe garantizarse un billing period activo.

---

# 49. Billing Period Upsert

Unique conceptual:

```text
subscriptionId
+
periodStart
+
periodEnd
```

---

# 50. New Pro Activation

Primera activación:

```text
TRIAL
↓
ACTIVE subscription
↓
BillingPeriod ACTIVE
↓
Effective Access = PRO
```

---

# 51. Expired Reactivation

```text
EXPIRED_READ_ONLY
↓
ACTIVE subscription
↓
BillingPeriod ACTIVE
↓
Effective Access = PRO
```

---

# 52. Access Is Derived

No es obligatorio guardar:

```text
users.is_pro
```

No crear boolean duplicado si puede derivarse correctamente.

---

# 53. ProductAccessResolver

Resolver:

```text
if effectivePaidSubscription:
    PRO

else if trialActive:
    TRIAL

else:
    EXPIRED_READ_ONLY
```

---

# 54. Effective Paid Subscription

Debe considerar:

```text
ACTIVE

PAST_DUE within grace
```

según política.

---

# 55. Grace Period

Configuración:

```text
BILLING_GRACE_PERIOD_DAYS
```

---

# 56. PAST_DUE Resolution

```text
PAST_DUE
+
within grace
→ PRO
```

```text
PAST_DUE
+
outside grace
→ EXPIRED_READ_ONLY
```

---

# 57. No Trial Grace

```text
trialEndsAt passed
+
no effective Pro
→ EXPIRED_READ_ONLY
```

---

# 58. Pro Activation Side Effects

Al activarse un nuevo billing period:

```text
BillingPeriodActivated
```

debe disparar integraciones idempotentes.

---

# 59. AI Grant Integration

Listener/application handler:

```text
BillingPeriodActivated
↓
GrantProPeriodCredits
```

---

# 60. AI Grant

Inicialmente:

```text
300 credits
```

por billing period.

---

# 61. AI Grant Idempotency

Unique conceptual:

```text
userId
+
billingPeriodId
+
PRO_PERIOD_GRANT
```

---

# 62. WhatsApp Period Integration

Notification domain usa:

```text
billingPeriodId
```

para contar allowance.

Inicialmente:

```text
20 financial WhatsApp messages
```

por período.

---

# 63. No WhatsApp Grant Duplication

No hace falta crear necesariamente un ledger de grant.

Pero el período debe ser estable y único.

---

# 64. Activation Notification

Al activarse Pro:

```text
SUBSCRIPTION_ACTIVATED
```

a Notification Service.

Preferir:

```text
IN_APP
+
EMAIL
```

---

# 65. Subscription Payment

Si provider informa pago:

persistir en:

```text
billing_payments
```

---

# 66. Payment Is Platform Billing

No crear:

```text
transactions
```

en personal finance.

---

# 67. Payment Fee

Persistir si provider lo informa:

```text
provider_fee
```

---

# 68. Actual Net Payment

Persistir:

```text
net_amount
```

si provider lo expone.

---

# 69. Do Not Recalculate Fee As 10%

El 10% pertenece a:

```text
planning / unit economics
```

No a reconciliación operativa.

---

# 70. Renewal

Cuando provider confirma nuevo período:

```text
existing subscription
↓
new BillingPeriod
↓
ACTIVE
↓
AI grant
↓
new WhatsApp usage window
```

---

# 71. Renewal Does Not Recreate Subscription

Mantener subscription principal.

Agregar nuevo período.

---

# 72. Duplicate Renewal Event

No puede:

```text
create two periods
```

ni:

```text
grant 600 AI credits
```

---

# 73. Payment Failure

Cuando provider informa falla:

normalizar estado.

Posibles efectos:

```text
PAST_DUE
```

---

# 74. Payment Failure Notification

Emitir:

```text
PAYMENT_FAILED
```

---

# 75. Grace Period UI

Mostrar:

```text
No pudimos procesar tu pago.

Tu acceso Pro continúa temporalmente.
```

si corresponde.

---

# 76. Grace Expiration

Cuando termina grace sin recuperación:

```text
PRO
↓
EXPIRED_READ_ONLY
```

---

# 77. Expiration Does Not Delete Data

Nunca modificar:

```text
accounts

transactions

debts

budgets

planning
```

por expiración comercial.

---

# 78. Expired Effects

El access resolver hace que:

```text
financial writes blocked

AI blocked

premium external financial notifications blocked
```

---

# 79. Scheduled Automation After Expiration

Jobs de planning deben revalidar entitlement antes de ejecutar escrituras.

---

# 80. Existing Historical Data

Sigue legible.

---

# 81. CancelProSubscription

Application service:

```text
CancelProSubscription
```

Debe:

```text
authenticate user

load owned effective subscription

invoke provider cancellation

refresh provider state

persist normalized result
```

---

# 82. Cancellation Semantics

No asumir todavía:

```text
cancel at period end
```

sin confirmar API exacta.

---

# 83. Provider Semantics

La implementación final debe reflejar comportamiento real de Mercado Pago.

---

# 84. Cancellation UI

Solo prometer:

```text
continúa hasta fecha X
```

si eso realmente está soportado.

---

# 85. Cancellation Event

Emitir según estado efectivo:

```text
SUBSCRIPTION_CANCELLED
```

---

# 86. End Of Access

Cuando deja de ser efectiva:

```text
SUBSCRIPTION_EXPIRED
```

y:

```text
Effective Access = EXPIRED_READ_ONLY
```

---

# 87. RefreshSubscriptionState

Use case para:

```text
return page

settings refresh

support/manual reconciliation
```

---

# 88. Refresh Security

Usuario solo puede refrescar su propia subscription.

---

# 89. Refresh Provider Call

Puede consultar Mercado Pago.

No debe crear subscription nueva.

---

# 90. Reconciliation Job

Worker:

```text
reconcile-billing-subscriptions
```

---

# 91. Reconciliation Candidates

```text
PENDING old enough

PAST_DUE

recently changed

provider sync overdue
```

---

# 92. Reconciliation Frequency

Configurable.

No necesita ejecutarse constantemente para subscriptions estables.

---

# 93. Reconciliation Result

```text
fetch provider
↓
normalize
↓
apply local state
↓
update periods/payments
```

---

# 94. Provider Outage

Si provider falla:

```text
do not globally invalidate PRO
```

---

# 95. Existing Pro During Outage

Conservar estado local efectivo.

---

# 96. New Checkout During Outage

Falla de forma controlada.

```text
No pudimos iniciar la suscripción.
Intentá nuevamente más tarde.
```

---

# 97. Reconciliation Failure

Registrar observability.

Retry según política.

---

# 98. Billing Summary Query

Crear:

```text
GetBillingSummary
```

Resultado conceptual para TRIAL:

```text
accessState: TRIAL

trialEndsAt

daysRemaining

subscription: null

canStartCheckout: true
```

---

# 99. Billing Summary — PRO

```text
accessState: PRO

plan: PRO_MONTHLY

status: ACTIVE

currentPeriodStart

currentPeriodEnd

cancelAtPeriodEnd
```

---

# 100. Billing Summary — EXPIRED

```text
accessState: EXPIRED_READ_ONLY

subscriptionStatus: CANCELLED | EXPIRED | null

canStartCheckout: true
```

---

# 101. Pending Summary

```text
accessState: TRIAL | EXPIRED_READ_ONLY

subscriptionStatus: PENDING

checkoutPending: true
```

---

# 102. Pricing Page

CTA:

```text
Probar gratis
```

si usuario no está registrado.

Para trial:

```text
Activar Pro
```

Para expired:

```text
Activar Pro
```

Para Pro:

```text
Gestionar suscripción
```

---

# 103. Settings — Trial

```text
Prueba Pro

8 días restantes

Después:
USD 7.99 / mes

[Activar Pro]
```

---

# 104. Settings — Pending

```text
Estamos verificando tu suscripción.
```

---

# 105. Settings — Pro

```text
Plan Pro

USD 7.99 / mes

Próxima renovación:
[date]

[Gestionar suscripción]
```

---

# 106. Settings — Expired

```text
Tu acceso de prueba terminó.

Tus datos siguen disponibles en modo lectura.

[Activar Pro]
```

---

# 107. Server Actions

Suggested:

```text
startProSubscriptionAction()

refreshSubscriptionAction()

cancelProSubscriptionAction()
```

---

# 108. Validation

Usar Zod para inputs.

Pero recordar:

la mayoría de campos críticos vienen de sesión/DB, no frontend.

---

# 109. Route Handlers

```text
/api/webhooks/mercadopago

/billing/return
```

---

# 110. Feature Structure

Suggested:

```text
apps/web/src/features/billing/
├── actions/
├── components/
├── queries/
├── schemas/
└── views/
```

---

# 111. Package Structure

```text
packages/billing/src/
├── domain/
│   ├── subscription.ts
│   ├── billing-period.ts
│   ├── payment.ts
│   └── statuses.ts
├── application/
│   ├── start-pro-subscription.ts
│   ├── refresh-subscription.ts
│   ├── cancel-subscription.ts
│   ├── handle-webhook.ts
│   └── reconcile-subscription.ts
├── providers/
│   └── mercadopago/
├── plans/
├── repositories/
└── index.ts
```

---

# 112. Database Indexes

Minimum:

```text
billing_subscriptions(user_id)

billing_subscriptions(provider_subscription_id)

billing_subscriptions(status)

billing_periods(subscription_id)

billing_periods(starts_at, ends_at)

billing_payments(provider_payment_id)

billing_webhook_events(provider, provider_event_id)
```

---

# 113. Uniqueness

Provider subscription ID:

```text
unique when non-null
```

---

# 114. Active Subscription Constraint

Application + DB strategy must prevent multiple simultaneous effective Pro subscriptions.

---

# 115. Concurrency Scenario

Two checkout requests simultaneously.

Expected:

```text
one effective pending checkout
```

not two subscriptions.

---

# 116. Transactions

DB transitions should be atomic locally.

Do not keep DB transaction open across provider network request longer than necessary.

---

# 117. External Call Pattern

Prefer:

```text
create local intent/pending
COMMIT

provider call

update local result
```

with reconciliation if process crashes.

---

# 118. Partial Failure — Local Created, Provider Call Fails

Keep traceable state.

Could mark:

```text
FAILED
```

or pending-with-error according to model.

Do not silently delete audit trail.

---

# 119. Partial Failure — Provider Created, Local Update Fails

Reconciliation must recover via:

```text
idempotency key
provider reference
webhook
```

---

# 120. Provider Idempotency

Use provider-supported idempotency headers/keys when available in final API.

---

# 121. Webhook Side Effects

Do not directly insert AI credit rows from webhook handler internals.

Prefer:

```text
billing transition
↓
internal application event/port
↓
AI credit service
```

---

# 122. Same For Notifications

```text
billing event
↓
Notification Service
```

---

# 123. No Distributed Transaction

Do not attempt transaction spanning:

```text
PostgreSQL
Mercado Pago
OpenRouter
Twilio
```

---

# 124. Eventual Consistency

Billing integrations are eventually consistent.

UX should account for short pending windows.

---

# 125. Audit Events

Record:

```text
checkout started

provider subscription created

subscription activated

billing period activated

payment approved

payment failed

subscription cancelled

subscription expired

reconciliation executed
```

---

# 126. Observability

Structured logs:

```text
userId

localSubscriptionId

providerSubscriptionId

billingPeriodId

operation

normalizedStatus

providerStatus

result
```

---

# 127. Sensitive Data

No log:

```text
access token

webhook secret

full payment instrument info

unnecessary provider payload
```

---

# 128. Metrics

```text
billing_checkout_started_total

billing_checkout_failed_total

billing_subscriptions_active

billing_subscriptions_pending

billing_payment_failures

billing_webhook_processed_total

billing_webhook_failed_total

billing_reconciliation_failed_total
```

---

# 129. Business Metrics

Provide data for:

```text
Active Pro

MRR

Gateway fees

Net payment revenue

Trial conversion

Expired reactivation
```

---

# 130. Trial Conversion Event

If access before activation is TRIAL:

```text
TRIAL_CONVERTED_TO_PRO
```

---

# 131. Reactivation Event

If previous access is EXPIRED_READ_ONLY:

```text
EXPIRED_REACTIVATED_TO_PRO
```

---

# 132. Trial Credits Integration

Trial AI grant occurs outside this slice's billing lifecycle.

Billing does not create it.

---

# 133. Pro Credits Integration

On new active billing period:

```text
GrantProPeriodCredits
```

---

# 134. Credit Grant Failure

Billing period activation must remain valid even if AI grant temporarily fails.

Do not roll back paid subscription.

---

# 135. Credit Grant Recovery

Retry idempotently.

---

# 136. WhatsApp Integration Failure

Same principle.

Billing remains active.

Notification allowance/read model can reconcile.

---

# 137. Notification Failure

Subscription activation must not fail because email could not be sent.

---

# 138. Entitlement Integration

Application services requiring paid access call:

```text
EntitlementService
```

Not:

```text
BillingRepository
```

directly.

---

# 139. Finance Engine Isolation

Finance Engine has no concept of:

```text
Mercado Pago

subscription

trial

Pro
```

---

# 140. Access Enforcement Example

Creating transaction:

```text
Server Action
↓
EntitlementService.require("transactions.create")
↓
Application Service
↓
Finance Domain
```

---

# 141. Trial Expiration

No billing worker required to switch state exactly at second 0.

ProductAccessResolver derives it from:

```text
trialEndsAt
```

---

# 142. Trial Expiry Notifications

Worker may emit:

```text
TRIAL_ENDING

TRIAL_EXPIRED
```

but effective access does not depend on notification job.

---

# 143. Subscription Expiration

Billing state must be reconciled through provider + local periods.

---

# 144. User Data After Subscription End

Still available read-only.

---

# 145. Data Export

Remains available.

---

# 146. Billing Access

Remains available.

---

# 147. Security Access

Remains available.

---

# 148. Tests — Start Checkout During Trial

Given:

```text
TRIAL active
```

When:

```text
start Pro
```

Then:

```text
PENDING created
checkout URL returned
access remains TRIAL
```

---

# 149. Tests — Start Checkout When Expired

Expected:

```text
PENDING
+
EXPIRED_READ_ONLY remains
```

until active.

---

# 150. Tests — Active Confirmation

Provider confirms ACTIVE.

Expected:

```text
subscription ACTIVE

billing period ACTIVE

effective access PRO

AI grant once

activation event once
```

---

# 151. Tests — Return URL Spoofing

Given:

```text
?status=approved
```

but provider PENDING.

Expected:

```text
not Pro
```

---

# 152. Tests — Duplicate Start

Two concurrent actions.

Expected:

```text
one logical pending subscription
```

---

# 153. Tests — Duplicate Webhook

Expected:

```text
no duplicate period

no duplicate AI grant

no duplicate activation notification
```

---

# 154. Tests — Out-Of-Order Webhook

Older state cannot incorrectly overwrite newer provider state.

---

# 155. Tests — Payment Fee

If provider reports:

```text
gross = 7.99
fee = 0.81
net = 7.18
```

persist actual values.

Do not overwrite with assumed 10%.

---

# 156. Tests — Trial Expired While Pending

```text
trial active
↓
checkout
↓
PENDING
↓
trial expires
```

Expected:

```text
EXPIRED_READ_ONLY
```

until provider confirms ACTIVE.

---

# 157. Tests — PAST_DUE Within Grace

Expected:

```text
PRO
```

---

# 158. Tests — PAST_DUE Outside Grace

Expected:

```text
EXPIRED_READ_ONLY
```

---

# 159. Tests — Provider Outage

Existing ACTIVE local subscription:

```text
PRO remains
```

---

# 160. Tests — Billing Period Renewal

New period:

```text
one period

one AI grant

new WhatsApp window
```

---

# 161. Tests — Ownership

User A cannot:

```text
cancel

refresh

inspect
```

User B subscription.

---

# 162. Tests — Reconciliation

Missed webhook:

```text
local PENDING

provider ACTIVE
```

reconciliation produces:

```text
ACTIVE + PRO
```

---

# 163. Tests — AI Grant Failure

Provider subscription ACTIVE.

AI grant throws.

Expected:

```text
subscription remains ACTIVE
```

Grant retried later.

---

# 164. Tests — Notification Failure

Same isolation.

---

# 165. Tests — Cancellation

Implement according to verified Mercado Pago semantics.

---

# 166. Definition Of Done — Domain

```text
subscription statuses normalized

billing period implemented

payment entity implemented

provider abstraction implemented
```

---

# 167. Definition Of Done — Checkout

```text
trial user can start checkout

expired user can start checkout

duplicate checkout prevented

active Pro cannot create duplicate subscription
```

---

# 168. Definition Of Done — Activation

```text
provider confirmation required

return URL cannot grant access

local state becomes ACTIVE

effective state resolves PRO
```

---

# 169. Definition Of Done — Webhooks

```text
verified

persisted

deduplicated

idempotent

replay safe
```

---

# 170. Definition Of Done — Renewal

```text
billing period created once

AI period grant once

WhatsApp usage period available
```

---

# 171. Definition Of Done — Expiration

```text
subscription end resolves read-only

no financial data deleted

AI blocked

premium financial external notifications blocked
```

---

# 172. Definition Of Done — Reconciliation

```text
missed webhook recoverable

stale pending recoverable

provider outage handled gracefully
```

---

# 173. Definition Of Done — UI

```text
trial state

pending state

Pro state

past-due state

expired read-only state
```

all represented.

---

# 174. Definition Of Done — Security

```text
server-side ownership

no client userId trust

no query-param activation

provider webhook verified

secrets server-only
```

---

# 175. Definition Of Done — Observability

```text
structured logs

billing metrics

webhook failure visibility

reconciliation visibility
```

---

# 176. Implementation Order

Recommended:

```text
1. Billing schema

2. BillingPlan catalog

3. BillingProvider interface

4. MercadoPagoBillingProvider

5. StartProSubscription

6. Billing summary query

7. Checkout UI

8. Return page

9. Webhook persistence

10. Webhook processing

11. ProductAccessResolver integration

12. BillingPeriod

13. AI grant hook

14. Notification hooks

15. Reconciliation worker

16. Cancellation

17. Past-due/grace

18. Production hardening
```

---

# 177. First Vertical Happy Path

La primera versión funcional debe probar:

```text
new user
↓
TRIAL
↓
click Activar Pro
↓
Mercado Pago checkout
↓
subscription confirmed
↓
PRO
↓
can continue financial writes
```

---

# 178. First Failure Path

También:

```text
TRIAL
↓
checkout
↓
payment/provider not confirmed
↓
trial expires
↓
EXPIRED_READ_ONLY
```

---

# 179. Reactivation Path

```text
EXPIRED_READ_ONLY
↓
Activar Pro
↓
provider confirms
↓
PRO
↓
existing financial data immediately usable again
```

---

# 180. Renewal Path

```text
PRO period A
↓
renewal
↓
period B
↓
new allowances
↓
PRO continues
```

---

# 181. End Path

```text
PRO
↓
subscription no longer effective
↓
EXPIRED_READ_ONLY
↓
data remains readable
```

---

# 182. Important Economic Rule

Current planning:

```text
Gross price:
USD 7.99

Expected gateway planning rate:
10%
```

Pero billing debe registrar valores reales cuando provider los expone.

---

# 183. No Profit Calculation In Billing Domain

Billing stores:

```text
gross amount

provider fee

net amount
```

Pero:

```text
contribution margin

CAC

LTV
```

pertenecen a analytics/business economics.

---

# 184. No Trial Cost Calculation In Billing

Trial economics pertenece a:

```text
docs/10.2-pricing-unit-economics.md
```

---

# 185. No Feature Limit Logic In MercadoPagoProvider

Provider no sabe:

```text
300 AI credits

20 WhatsApp

financial write entitlement
```

---

# 186. No Access Logic In UI

UI refleja el access state recibido del server.

---

# 187. Core Invariants

Nunca romper:

```text
TRIAL
≠
Mercado Pago Subscription
```

```text
EXPIRED_READ_ONLY
≠
Billing Plan
```

```text
Checkout Redirect
≠
PRO Access
```

```text
PENDING
≠
PRO
```

```text
Billing Payment
≠
Personal Finance Transaction
```

```text
Provider Fee Assumption
≠
Actual Provider Fee
```

---

# 188. Additional Invariants

```text
One effective paid subscription per user.

One billing period per real provider period.

Repeated webhook does not duplicate side effects.

Provider outage does not globally invalidate access.

Subscription expiration never deletes user financial data.

AI grant failure does not roll back paid access.

Notification failure does not roll back paid access.

Features never query Mercado Pago directly.

Financial Engine never knows about subscription state.
```

---

# 189. Final Slice Architecture

```text
                     USER
                      │
                      ↓
              Billing UI / Actions
                      │
                      ↓
            Billing Application Layer
                      │
             ┌────────┴─────────┐
             │                  │
      Local Billing DB     BillingProvider
             │                  │
             │            Mercado Pago
             │                  │
             └────────┬─────────┘
                      ↓
            Normalized Billing State
                      │
                 BillingPeriod
                      │
                      ↓
            ProductAccessResolver
                      │
           ┌──────────┼──────────┐
           │          │          │
        TRIAL        PRO     EXPIRED_READ_ONLY
                      │
             ┌────────┴────────┐
             │                 │
        AI Period Grant   Notification Period
```

---

# 190. Final Rule

Mercado Pago determina el estado externo del cobro.

Billing normaliza y persiste ese estado.

`ProductAccessResolver` determina si el usuario está en:

```text
TRIAL
PRO
EXPIRED_READ_ONLY
```

Las features consultan entitlements.

Nunca Mercado Pago directamente.

El slice se considera completo cuando:

```text
TRIAL
→ checkout
→ provider confirmation
→ PRO
```

funciona de extremo a extremo, y tanto:

```text
trial expiration
```

como:

```text
subscription expiration
```

terminan correctamente en:

```text
EXPIRED_READ_ONLY
```

sin pérdida de datos.
