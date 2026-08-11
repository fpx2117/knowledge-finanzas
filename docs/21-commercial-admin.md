# Commercial Admin

## 1. Objetivo

Este documento define el panel administrativo comercial de la plataforma.

Debe permitir operar:

```text
users

subscriptions

billing periods

payments

refunds

promotions

discounts

referrals

AI credits

WhatsApp allowances

product access

reconciliation
```

desde una interfaz segura, auditable y separada de la experiencia normal del usuario.

Principio central:

```text
Admin UI
≠
Direct Database Editor
```

También:

```text
Administrative Override
≠
Provider Truth
```

y:

```text
Support Action
≠
Silent Mutation
```

---

# 2. Objetivo operativo

El panel debe resolver situaciones reales como:

```text
¿Por qué este usuario no tiene Pro?

¿Su pago fue confirmado?

¿Tiene una promoción activa?

¿Se duplicó un webhook?

¿Necesito reconciliar Mercado Pago?

¿Puedo extenderle Pro por 30 días?

¿Tiene créditos IA?

¿Cuántos WhatsApp le quedan?

¿Se procesó su refund?

¿Qué código promocional utilizó?
```

sin consultas manuales directas a PostgreSQL.

---

# 3. Scope

MVP:

```text
user lookup

commercial account summary

effective access

subscription inspection

billing periods

payments

refunds

promotion grants

discount redemptions

referral status

AI credit balance/history

WhatsApp usage

reconciliation actions

manual promotional grants

audit log
```

---

# 4. Not An Internal CRM

No convertir el panel en:

```text
full CRM

marketing automation suite

support ticketing system

accounting platform
```

Su función inicial es:

```text
commercial operations
+
support diagnostics
+
controlled administrative actions
```

---

# 5. Admin Roles

El panel debe integrarse con roles administrativos.

Como mínimo:

```text
SUPPORT

ADMIN

SUPER_ADMIN
```

Los permisos exactos se documentan aparte.

---

# 6. Role Philosophy

```text
SUPPORT
→ inspect and diagnose

ADMIN
→ perform controlled commercial actions

SUPER_ADMIN
→ sensitive overrides/configuration
```

---

# 7. No Shared Admin Account

Cada operador debe tener su propia identidad.

Nunca:

```text
admin@example.com
shared password
```

---

# 8. Authentication

Admin usa Better Auth / sistema de identidad del producto.

Debe existir validación server-side de rol en cada acción.

---

# 9. Admin Surface

Rutas sugeridas:

```text
/admin

/admin/users

/admin/subscriptions

/admin/payments

/admin/promotions

/admin/discounts

/admin/referrals

/admin/ai-usage

/admin/notifications

/admin/audit
```

---

# 10. Admin Navigation

Sidebar:

```text
Overview

Users

Billing

Promotions

Discounts

Referrals

AI Usage

Notifications

Audit
```

---

# 11. Global User Search

La herramienta más importante.

Permitir búsqueda por:

```text
internal user ID

email

provider customer/subscription ID
```

Opcionalmente:

```text
phone
```

si existe y los permisos lo permiten.

---

# 12. User Search Privacy

No permitir búsquedas demasiado amplias sin necesidad.

Preferir:

```text
exact email

prefix email

known identifier
```

sobre exportar todos los usuarios.

---

# 13. User Commercial Profile

Ruta:

```text
/admin/users/:userId
```

Debe mostrar una vista consolidada.

---

# 14. Commercial Summary

Header:

```text
User

Email

Created At

Effective Access

Access Source

Trial

Subscription

Promotion

Billing Status
```

---

# 15. Effective Access

Mostrar claramente:

```text
TRIAL

PRO

EXPIRED_READ_ONLY
```

junto con:

```text
source
```

Ejemplos:

```text
PRO
Paid Subscription
```

```text
PRO
Promotion: BETA90
```

```text
TRIAL
8 days remaining
```

---

# 16. Access Resolution Debug

Muy útil incluir:

```text
Why this access?
```

Ejemplo:

```text
Paid subscription ACTIVE
→ PRO
```

o:

```text
No paid subscription
Active promotion until Sep 8
→ PRO
```

---

# 17. ProductAccessResolver Debug Output

Vista interna puede mostrar:

```text
paidSubscriptionEffective: false

promotionEffective: true

trialActive: false

resolvedState: PRO

source: PROMOTION
```

Esto reduce soporte manual.

---

# 18. Never Let Admin Directly Toggle Product State

No botón:

```text
Set PRO = true
```

No botón:

```text
Set EXPIRED = false
```

---

# 19. Correct Administrative Mechanisms

Para cambiar acceso usar:

```text
Promotional Grant

Subscription Reconciliation

Entitlement Override
```

según el caso.

---

# 20. Trial Section

Mostrar:

```text
trial_started_at

trial_ends_at

active / expired

days remaining
```

---

# 21. Trial Extension

Si se permite:

acción:

```text
Extend Trial
```

debe requerir:

```text
duration

reason
```

---

# 22. Trial Extension Should Be Exceptional

No usar como reemplazo de promociones.

Preferir:

```text
Promotional Pro Grant
```

para compensaciones o campañas.

---

# 23. Trial Extension Audit

Registrar:

```text
previous end

new end

actor

reason

timestamp
```

---

# 24. Subscription Section

Mostrar:

```text
plan

provider

provider subscription ID

normalized status

current period start

current period end

cancel at period end

past due

grace end
```

---

# 25. Provider Raw Status

Puede mostrarse a ADMIN/SUPER_ADMIN:

```text
provider_status
```

además del estado normalizado.

---

# 26. Subscription Actions

Posibles:

```text
Refresh from provider

Request cancellation

Reactivate

Open provider reference
```

según capabilities reales.

---

# 27. Refresh Subscription

Acción:

```text
Reconcile Now
```

Debe llamar:

```text
ReconcileBillingSubscription
```

No hacer update directo.

---

# 28. Reconcile UX

Mostrar:

```text
Local:
PENDING

Provider:
ACTIVE

Action:
Update local state to ACTIVE
```

idealmente después de ejecutar reconciliación.

---

# 29. Reconcile Does Not Need Manual State Choice

Admin no elige:

```text
ACTIVE
```

El provider determina el estado.

---

# 30. Subscription Cancellation

Si admin puede cancelar:

debe usar el mismo application service que usuario.

Requiere:

```text
role authorization

confirmation

optional support reason
```

---

# 31. Payments Section

Mostrar tabla:

```text
Date

Provider Payment ID

Gross

Discount

Provider Fee

Net

Status
```

---

# 32. Payment Details

Vista:

```text
billing period

coupon

provider state

refunds

webhook history
```

---

# 33. Provider Fee

Mostrar fee real si disponible.

No mostrar el supuesto 10% como si fuera real.

---

# 34. Payment Warning

Si:

```text
providerFee missing
```

puede mostrar:

```text
Provider fee unavailable
```

---

# 35. Duplicate Payment Detection

Admin debe ver warning:

```text
Possible duplicate charge
```

cuando existan múltiples pagos aprobados para el mismo período esperado.

---

# 36. Duplicate Review

Mostrar:

```text
Payment A

Payment B

same subscription

same period

same/similar amount
```

---

# 37. No Automatic Refund Button From Warning

Admin debe revisar primero.

---

# 38. Refund Section

Mostrar:

```text
refund status

amount

reason

provider refund ID

requested by

requested at

completed at
```

---

# 39. Refund Action

Para roles autorizados:

```text
Request Refund
```

---

# 40. Refund Form

Campos:

```text
amount

reason

internal note
```

Si MVP solo full refund:

```text
amount
```

puede estar bloqueado al máximo permitido.

---

# 41. Refund Confirmation

Antes de ejecutar:

```text
You are about to refund USD 7.99.
```

Mostrar:

```text
possible access impact
```

según `RefundPolicy`.

---

# 42. Refund Reason Required

Nunca permitir refund admin sin razón.

---

# 43. Refund Result

Mostrar:

```text
PENDING

APPROVED

FAILED
```

No asumir éxito por click.

---

# 44. Refund Reconciliation

Acción:

```text
Reconcile Refund
```

si estado quedó incierto.

---

# 45. Promotion Section

Mostrar:

```text
active promotional grant

source

code/campaign

starts at

ends at

usage profile
```

---

# 46. Manual Promotional Grant

Admin puede:

```text
Grant Pro Access
```

---

# 47. Grant Form

Campos:

```text
duration days

reason

AI allowance profile

WhatsApp allowance profile
```

o usar perfiles predefinidos.

---

# 48. Better Admin UX

Preferir presets:

```text
7 days

14 days

30 days

90 days
```

más:

```text
Custom
```

---

# 49. Manual Grant Source

Registrar:

```text
MANUAL_PROMOTION
```

No:

```text
PAID_SUBSCRIPTION
```

---

# 50. Grant Does Not Touch Mercado Pago

Nunca crear subscription fake.

---

# 51. Extend Promotional Grant

Acción:

```text
Extend
```

Debe mostrar:

```text
old end date

added days

new end date
```

---

# 52. Grant Revocation

Acción sensible:

```text
Revoke Promotional Access
```

requiere razón.

---

# 53. Revoking Code vs Grant

Diferenciar:

```text
disable promotion code
```

de:

```text
revoke this user's grant
```

---

# 54. Promotion Codes Admin

Ruta:

```text
/admin/promotions
```

Mostrar:

```text
code

status

duration

redeemed / max

redemption window

active grants
```

---

# 55. Create Promotion

Use form definido en documento de promotions.

---

# 56. Promotion Actions

```text
Create

Edit

Activate

Pause

Revoke
```

---

# 57. Dangerous Bulk Action

No incluir inicialmente:

```text
revoke all grants
```

como acción simple.

Si se implementa, requiere SUPER_ADMIN + confirmación fuerte.

---

# 58. Discount Admin

Ruta:

```text
/admin/discounts
```

Mostrar:

```text
code

status

discount

duration

redemptions

conversion

validity
```

---

# 59. Discount Creation

Debe incluir:

```text
economics preview
```

antes de activar.

---

# 60. Economics Preview

Ejemplo:

```text
Base price:
USD 7.99

Discount:
20%

Final:
USD 6.39

Estimated contribution:
USD 4.30
```

según assumptions actuales.

---

# 61. Economics Is Advisory

No confundir estimación con revenue real.

---

# 62. Dangerous Discount Warning

Si contribution margin estimada:

```text
< 50%
```

mostrar warning fuerte.

---

# 63. Discount Activation Permission

Puede requerir:

```text
ADMIN
```

y descuentos extremos:

```text
SUPER_ADMIN
```

---

# 64. Referral Admin

Ruta:

```text
/admin/referrals
```

Mostrar:

```text
referrer

referred user

status

conversion

reward

reward state
```

---

# 65. Referral Actions

```text
Invalidate

Retry Reward
```

No:

```text
Mark Converted
```

manualmente sin mecanismo auditado especial.

---

# 66. Conversion Truth

Referral conversion debe provenir de Billing.

---

# 67. Referral Fraud Note

Admin puede marcar:

```text
suspicious
```

o invalidar.

---

# 68. AI Credits Section

Mostrar:

```text
available credits

current period

grants

consumption

reservations

provider cost
```

---

# 69. Credit Breakdown

Ejemplo:

```text
Plan allowance:
184

Purchased:
0

Promotional:
100

Total usable:
284
```

si sistema soporta pools.

---

# 70. AI Usage History

Mostrar:

```text
timestamp

capability

credits

status

model role

provider cost
```

sin exponer prompts sensibles por defecto.

---

# 71. Manual AI Credit Adjustment

Admin puede:

```text
Add AI Credits
```

o:

```text
Remove AI Credits
```

con permisos.

---

# 72. Credit Adjustment Must Use Ledger

Crear:

```text
ADMIN_ADJUSTMENT
```

Nunca actualizar balance directo.

---

# 73. AI Adjustment Form

```text
amount

direction

reason

expiration optional
```

---

# 74. Negative Adjustment Guard

No permitir balance negativo.

---

# 75. Credit Refund

Si una operación AI tuvo error comercial:

admin puede compensar con:

```text
REFUND
```

o ajuste.

Preferir mecanismo consistente.

---

# 76. WhatsApp Usage Section

Mostrar:

```text
current allowance

used

remaining

period

opt-in state

phone status
```

---

# 77. WhatsApp Delivery History

Mostrar:

```text
notification type

date

provider status

usage counted?

failure code
```

---

# 78. No Manual Provider Message Send Initially

No agregar:

```text
Send WhatsApp Now
```

como herramienta administrativa general.

Eso crea riesgos de costo/privacidad.

---

# 79. WhatsApp Adjustment

Si fuera necesario:

podría existir compensación de allowance futura.

No es MVP.

---

# 80. Notification Diagnostics

Admin debe poder ver:

```text
last financial notifications

email deliveries

WhatsApp deliveries

delivery failures
```

---

# 81. Re-send Notification

No habilitar indiscriminadamente.

Para emails transaccionales específicos puede existir:

```text
Retry Delivery
```

si falla técnicamente.

---

# 82. Retry Is Same Logical Delivery

No crear nueva notificación si solo se reintenta.

---

# 83. Webhook Diagnostics

Admin billing view debería mostrar eventos recientes:

```text
received at

event type

resource

processing status

error
```

---

# 84. Webhook Replay

SUPER_ADMIN puede:

```text
Retry Processing
```

para eventos fallidos.

---

# 85. Replay Must Be Idempotent

Nunca:

```text
replay webhook
→ duplicate grant/refund/payment
```

---

# 86. Reconciliation Dashboard

Ruta:

```text
/admin/billing/reconciliation
```

Mostrar:

```text
stale pending subscriptions

past due needing refresh

failed webhooks

pending refunds

provider mismatches
```

---

# 87. Reconciliation Batch

V1 mejor:

```text
reconcile individual
```

Antes de crear:

```text
Reconcile Everything
```

---

# 88. Why Avoid Global Button

Reduce riesgo operativo y carga sobre provider.

---

# 89. Commercial Timeline

Dentro de usuario, mostrar timeline:

```text
Account created

Trial started

Promo redeemed

Checkout started

Pro activated

Coupon applied

Payment approved

Refund requested

Subscription cancelled
```

---

# 90. Timeline Value

Permite responder rápidamente:

```text
what happened to this account?
```

---

# 91. Timeline Source

Construir desde eventos/audit logs.

No crear segunda fuente de truth.

---

# 92. Audit Log

Ruta:

```text
/admin/audit
```

---

# 93. Audit Events

Registrar todas las acciones administrativas sensibles.

Ejemplos:

```text
PROMOTION_CREATED

PROMOTION_UPDATED

PROMOTION_GRANT_CREATED

PROMOTION_GRANT_EXTENDED

PROMOTION_GRANT_REVOKED

AI_CREDITS_ADJUSTED

SUBSCRIPTION_RECONCILED

SUBSCRIPTION_CANCEL_REQUESTED

REFUND_REQUESTED

REFUND_RECONCILED

REFERRAL_INVALIDATED
```

---

# 94. Audit Fields

```text
id

actor_user_id

action

entity_type

entity_id

target_user_id optional

before_snapshot

after_snapshot

reason

created_at
```

---

# 95. Sensitive Snapshots

No guardar secretos/provider credentials dentro del audit snapshot.

---

# 96. Reason Requirement

Acciones que deben requerir razón:

```text
manual Pro grant

grant extension

grant revocation

AI adjustment

refund

referral invalidation

entitlement override
```

---

# 97. Immutable Audit

Audit log:

```text
append-only
```

para aplicación normal.

No editar desde admin UI.

---

# 98. Admin Access Audit

También registrar:

```text
sensitive user commercial profile viewed
```

si regulación/privacidad lo requiere.

Puede postergarse según necesidad.

---

# 99. Data Minimization

Admin debe mostrar solo información necesaria para operar.

No convertirlo en:

```text
view every transaction of every user
```

por defecto.

---

# 100. Financial Data Separation

Commercial admin no necesita acceso irrestricto al contenido financiero personal.

---

# 101. Default Financial Privacy

Para SUPPORT:

mostrar:

```text
account exists

record counts maybe

system health
```

No necesariamente:

```text
merchant names

transaction amounts

debt details
```

---

# 102. Break Glass

Si en futuro soporte necesita ver datos financieros específicos:

usar:

```text
elevated audited permission
```

no acceso permanente general.

---

# 103. Impersonation

No implementar inicialmente:

```text
Login as user
```

Es muy riesgoso.

---

# 104. Future Impersonation

Si alguna vez se implementa:

```text
read-only impersonation

explicit banner

short expiry

audit

strong permission
```

---

# 105. Admin Session Security

Recommended:

```text
shorter session lifetime

re-auth for sensitive actions

MFA when available
```

---

# 106. Reauthentication

Operaciones de dinero real como refund pueden requerir:

```text
recent authentication
```

---

# 107. CSRF / Server Actions

Seguir mecanismos seguros del framework.

Toda autorización sigue siendo server-side.

---

# 108. Admin API

No crear una API admin pública general si no es necesaria.

Usar Server Actions / Route Handlers internos protegidos.

---

# 109. No Client Role Trust

Nunca:

```text
if client.role === "ADMIN"
```

como autoridad.

---

# 110. Permissions

Cada application service sensible debe declarar permiso requerido.

Ejemplo:

```text
commercial.users.read

billing.refund.execute

promotions.manage

ai.adjust

referrals.invalidate
```

---

# 111. UI Hiding Is Not Authorization

Aunque botón no aparezca:

server vuelve a verificar permiso.

---

# 112. Admin Overview

Dashboard inicial:

```text
Active Pro

Trials Active

Expired Read-Only

Promo Pro

MRR

Past Due

Refunds Pending

Failed Webhooks
```

---

# 113. Avoid Vanity Dashboard

No saturar con gráficos sin utilidad operativa.

Priorizar:

```text
exceptions

actionable queues

commercial health
```

---

# 114. Exception Queues

Muy útiles:

```text
Stale PENDING

Past Due

Failed Webhooks

Refund Pending

Duplicate Payment Warning

Failed Referral Reward

Failed AI Grant
```

---

# 115. Revenue Metrics

Mostrar:

```text
Gross MRR

Provider Fees

Net Payment Revenue
```

con definiciones claras.

---

# 116. Contribution Margin

Puede aparecer como estimate:

```text
Estimated Contribution
```

basado en configuración de unit economics.

No como accounting truth.

---

# 117. Provider Cost Data

AI y WhatsApp pueden alimentar:

```text
estimated variable cost
```

---

# 118. Analytics Integration

Admin puede mostrar resultados derivados de Product Analytics.

Pero no duplicar event storage.

---

# 119. User Lifecycle Filters

Filtrar usuarios por:

```text
TRIAL

PRO PAID

PRO PROMOTION

EXPIRED

PAST_DUE
```

---

# 120. Campaign Filters

Promotions:

```text
active

paused

expired

high utilization
```

---

# 121. Discount Filters

```text
active

expired

redemption limit reached

low margin warning
```

---

# 122. Referral Filters

```text
attributed

converted

rewarded

reward failed

invalidated
```

---

# 123. Export

Admin may need CSV export for:

```text
billing payments

promotion redemptions

referral conversions
```

---

# 124. Export Permissions

Only elevated roles.

---

# 125. Export Audit

Sensitive exports should be audited.

---

# 126. No Raw Database Export

Use curated fields.

---

# 127. Pagination

All large admin tables server-paginated.

---

# 128. Search

Use indexed fields.

Avoid expensive fuzzy search on all columns initially.

---

# 129. Sorting

Common:

```text
created_at

updated_at

status

amount
```

---

# 130. Date Handling

Display admin timezone explicitly.

Store timestamps as:

```text
TIMESTAMPTZ
```

---

# 131. User Timezone vs Admin Timezone

For lifecycle/business events:

show exact timestamp.

For user-facing scheduled dates:

optionally show user timezone context.

---

# 132. Configuration Page

SUPER_ADMIN may manage safe commercial configuration.

Examples:

```text
TRIAL_DURATION_DAYS

TRIAL_AI_CREDITS_TOTAL

TRIAL_WHATSAPP_TOTAL

PRO_AI_CREDITS_PER_PERIOD

PRO_WHATSAPP_PER_PERIOD

BILLING_GRACE_PERIOD_DAYS
```

---

# 133. Configuration Changes Are Dangerous

Do not casually expose all env variables as editable UI.

Only intentionally dynamic settings.

---

# 134. Static vs Dynamic Configuration

Some values remain deploy-time:

```text
provider credentials

webhook secrets
```

Never admin editable.

---

# 135. Commercial Configuration Audit

Every config change:

```text
before

after

actor

reason

timestamp
```

---

# 136. Effective Date

For major changes, support:

```text
effective_from
```

instead of mutating immediately.

Future enhancement.

---

# 137. Plan Catalog Admin

Initially safer to keep price:

```text
USD 7.99
```

in controlled configuration/code/database migration rather than casual admin edit.

---

# 138. Why Price Changes Need Care

Changing plan price can affect:

```text
existing subscribers

provider plan IDs

billing terms

communications
```

---

# 139. Admin Cannot Change Provider Secret

Secrets remain Railway environment variables.

---

# 140. Admin Error Handling

UI should show normalized errors.

Example:

```text
Mercado Pago could not be reached.
Local subscription was not modified.
```

---

# 141. Never Hide Partial Failure

If operation partially succeeded:

show:

```text
Provider result uncertain.
Reconciliation required.
```

---

# 142. Action Status

Sensitive asynchronous actions can have:

```text
PENDING

SUCCEEDED

FAILED

NEEDS_RECONCILIATION
```

---

# 143. Notifications For Admin

Internal alerts may go to:

```text
admin dashboard

logs

observability platform
```

No need to reuse user Notification Center initially.

---

# 144. High-Severity Alerts

Examples:

```text
Mercado Pago webhook failure spike

refund reconciliation failure

unexpected Active Pro drop

AI cost spike

WhatsApp cost spike
```

---

# 145. Operational Runbooks

Each exception queue should eventually link to a runbook.

Example:

```text
Stale Pending Subscription
→ Reconcile
→ inspect provider
→ escalate if mismatch persists
```

---

# 146. Support Notes

Optional entity:

```text
admin_user_notes
```

Could allow support to add notes.

---

# 147. Avoid Building Ticketing System

Simple notes only if clearly useful.

Otherwise integrate a support tool later.

---

# 148. Admin Note Fields

```text
user_id

author_id

note

created_at
```

---

# 149. Notes Are Not Financial Truth

Never use support notes as state.

---

# 150. Commercial Account Summary Query

Create:

```text
GetAdminCommercialUserSummary
```

which aggregates read models.

---

# 151. Summary Should Not Call Providers

Default page load uses local DB.

Provider refresh is explicit action.

---

# 152. Why

Avoid:

```text
open admin user
→ call Mercado Pago
→ call Twilio
→ call OpenRouter
```

on every page.

---

# 153. Read Model

Could create:

```text
commercial_user_summary
```

as query composition, not necessarily table.

---

# 154. User Summary Includes

```text
effective access

access source

trial

subscription

promotion

AI balance

WhatsApp usage

latest payment

refund status
```

---

# 155. Admin Commands

Write actions should call application services.

Never direct ORM mutation from React component.

---

# 156. Suggested Architecture

```text
Admin UI
↓
Admin Server Action
↓
Authorization
↓
Application Service
↓
Domain / Provider / Repository
```

---

# 157. Package Placement

Admin UI:

```text
apps/web/src/features/admin/
```

Domain/application logic stays in relevant packages.

Do not create:

```text
packages/admin-do-everything
```

---

# 158. Admin Feature Structure

```text
apps/web/src/features/admin/
├── users/
├── billing/
├── promotions/
├── discounts/
├── referrals/
├── ai/
├── notifications/
└── audit/
```

---

# 159. Shared Components

```text
AdminDataTable

AdminStatusBadge

AdminActionDialog

AdminAuditTimeline

AdminReasonField
```

---

# 160. UI Style

Commercial admin should be:

```text
dense

functional

table-first

low decoration

clear state
```

Not consumer dashboard cards everywhere.

---

# 161. Status Presentation

Use consistent semantic statuses.

Examples:

```text
ACTIVE

PENDING

PAST_DUE

FAILED

EXPIRED
```

---

# 162. Do Not Use Color Alone

Include text/icon where useful.

---

# 163. Sensitive Action Styling

Refund / revoke:

should be visually distinct but not theatrical.

---

# 164. Confirmation Dialog

Should explain exact consequence.

Example:

```text
Revoke 30-day promotional access?

The user may immediately return to read-only mode.

This does not delete their data.
```

---

# 165. Bulk Actions

MVP:

avoid destructive bulk actions.

Potential safe bulk:

```text
export selected
```

---

# 166. Admin Audit Search

Filter by:

```text
actor

target user

action

entity

date range
```

---

# 167. Retention

Admin audit should follow security/compliance retention policy.

Likely longer than normal app notification history.

---

# 168. Privacy

Admin access must be covered by privacy/security documentation.

---

# 169. Production Only Access

Consider protecting admin routes behind:

```text
role
+
application auth
```

and optionally network/SSO controls in future.

---

# 170. No Hidden Admin Backdoor

Do not support:

```text
?admin=true
```

or magic headers.

---

# 171. Tests — Support User

Can:

```text
search user

view commercial summary
```

Cannot:

```text
refund

grant Pro

adjust AI
```

depending on permission model.

---

# 172. Tests — Admin

Can perform allowed commercial operations.

---

# 173. Tests — Normal User

Cannot access:

```text
/admin
```

or admin server actions.

---

# 174. Tests — Direct Endpoint Call

Unauthorized caller rejected even if UI hidden.

---

# 175. Tests — Manual Pro Grant

Creates promotional grant.

Does not alter billing subscription.

---

# 176. Tests — Grant Extension

Changes specific grant and creates audit entry.

---

# 177. Tests — Grant Revocation

Access resolver recalculates.

Financial data remains.

---

# 178. Tests — AI Adjustment

Ledger entry created.

No direct balance mutation.

---

# 179. Tests — Refund

Calls billing application service.

Provider result persisted.

Audit created.

---

# 180. Tests — Refund Failure

No false local success.

---

# 181. Tests — Subscription Reconcile

Provider state updates normalized local state idempotently.

---

# 182. Tests — Webhook Replay

No duplicate grants/payments/refunds.

---

# 183. Tests — Reason Required

Sensitive action without reason rejected.

---

# 184. Tests — Audit

Every sensitive successful action creates audit entry.

---

# 185. Tests — Cross-Role Permission

SUPPORT cannot perform ADMIN action.

ADMIN cannot perform SUPER_ADMIN-only action.

---

# 186. Tests — User Privacy

Commercial support page does not expose unrelated personal financial detail.

---

# 187. Tests — Search Isolation

Admin search does not leak results to non-admin endpoints.

---

# 188. Observability

Admin commands log:

```text
actorId

targetUserId

command

entity

result

latency

failureCode
```

---

# 189. Admin Metrics

Track:

```text
refunds executed

manual grants

AI adjustments

reconciliations

failed admin commands
```

---

# 190. Abuse Detection

Alert on unusual patterns:

```text
admin grants excessive Pro

admin adds excessive credits

high refund volume by operator
```

---

# 191. Four-Eyes Principle

Not necessary for normal MVP operations.

Future high-value actions may require approval.

---

# 192. High-Risk Future Operations

Examples:

```text
large refund

bulk grant

large AI credit adjustment

commercial config change
```

may require:

```text
approval workflow
```

---

# 193. MVP Overview Page

Recommended widgets/tables:

```text
Active Pro

Active Trials

Promo Pro

Past Due

Refund Pending

Failed Webhooks

Stale PENDING

Recent Commercial Events
```

---

# 194. Admin Does Not Replace Observability

Use external logs/metrics for technical diagnosis.

Admin provides product/business operational context.

---

# 195. Admin Does Not Replace Database Backups

Never use audit/admin history as backup.

---

# 196. Commercial Admin Does Not Own Financial Truth

It can display:

```text
product access
billing
commercial usage
```

but does not recalculate personal finance.

---

# 197. Definition Of Done — User Search

```text
find user by email/id

open commercial summary

access protected by role
```

---

# 198. Definition Of Done — Billing

```text
inspect subscription

inspect periods/payments

reconcile subscription

inspect refund
```

---

# 199. Definition Of Done — Promotions

```text
create/manage codes

grant Pro manually

extend/revoke grant
```

---

# 200. Definition Of Done — Discounts

```text
create/manage coupon

view usage/conversions

see economic estimate
```

---

# 201. Definition Of Done — Referrals

```text
inspect attribution

inspect conversion

retry reward

invalidate suspicious referral
```

---

# 202. Definition Of Done — AI

```text
view balance/history

admin adjustment through ledger
```

---

# 203. Definition Of Done — Notifications

```text
view WhatsApp allowance

view delivery history

inspect failures
```

---

# 204. Definition Of Done — Audit

```text
all sensitive admin writes auditable
```

---

# 205. Implementation Order

Recommended:

```text
1. Admin authorization framework

2. Audit log

3. User search

4. Commercial user summary

5. Billing inspection

6. Reconciliation action

7. Promotional grants

8. AI credit adjustments

9. Refund workflow

10. Promotion code management

11. Discount management

12. Referral management

13. Notification diagnostics

14. Commercial overview dashboard
```

---

# 206. Why Audit Comes Early

No sensitive admin write should ship before audit infrastructure exists.

---

# 207. Why User Summary Comes Early

Most support cases begin with:

```text
what is the state of this user?
```

A consolidated view provides the most operational value quickly.

---

# 208. Core Invariants

Never break:

```text
Admin UI
≠
Direct DB Editor
```

```text
Admin Override
≠
Provider Truth
```

```text
Manual Pro
=
Promotional Grant
```

```text
AI Adjustment
=
Ledger Entry
```

```text
Refund
=
Billing Application Service
```

---

# 209. Additional Invariants

```text
Every sensitive administrative action is server-authorized.

Every sensitive administrative write is auditable.

Admin actions never fake Mercado Pago state.

Commercial support access does not imply unrestricted access to personal finance data.

Provider reconciliation is explicit.

User data is never deleted because Pro access changes.

UI permissions never replace backend authorization.

Secrets are never exposed in admin UI.

Support notes never become system state.
```

---

# 210. Final Architecture

```text
                      ADMIN USER
                           │
                           ↓
                      Admin UI
                           │
                           ↓
                  Permission Service
                           │
                           ↓
                 Application Services
                           │
          ┌────────────────┼────────────────┐
          │                │                │
       Billing         Promotions       AI Credits
          │                │                │
     Mercado Pago      Access Grants       Ledger
          │
          ├──────── Discounts
          │
          ├──────── Referrals
          │
          └──────── Refunds
                           │
                           ↓
                       Audit Log
```

---

# 211. Final Product Rule

El panel administrativo existe para operar excepciones y gestionar herramientas comerciales de forma segura.

La regla es:

```text
INSPECT
↓
UNDERSTAND
↓
AUTHORIZED ACTION
↓
APPLICATION SERVICE
↓
AUDIT
```

Nunca:

```text
OPEN DATABASE
↓
CHANGE VALUE
↓
HOPE IT WORKS
```
