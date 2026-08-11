# Product Analytics

## 1. Objetivo

Este documento define la estrategia de analítica de producto de la plataforma.

El objetivo es responder:

```text
¿Los usuarios activan el producto?

¿Registran suficiente información financiera?

¿Entienden su situación?

¿Convierten de Trial a Pro?

¿Retienen?

¿Usan AI?

¿Usan alertas?

¿Los referrals funcionan?

¿Los descuentos mejoran conversión?

¿Dónde abandonan?
```

Principio central:

```text
Product Analytics
≠
Financial Truth
```

También:

```text
Product Analytics
≠
External Data Monetization
```

y:

```text
Event Tracking
≠
Personal Finance Ledger
```

---

# 2. Scope

Este documento cubre:

```text
acquisition

signup

activation

trial

engagement

conversion

subscription lifecycle

retention

churn

AI usage

notifications

promotions

discounts

referrals

product funnels

feature adoption
```

No cubre:

```text
selling aggregated financial statistics
```

Eso pertenece a:

```text
docs/23-data-analytics-privacy-and-monetization.md
```

---

# 3. Analytics Philosophy

No medir todo porque sea posible.

Medir eventos que ayuden a responder:

```text
Is the product creating value?

Where does value happen?

Where do users get blocked?

What predicts conversion?

What predicts retention?
```

---

# 4. North Star Alignment

El producto busca responder:

```text
¿Qué tengo?

¿Qué debo?

¿Qué vence?

¿Qué puedo gastar?

¿Hacia dónde voy?
```

Analytics debe medir si los usuarios llegan efectivamente a esas respuestas.

---

# 5. Product Funnel

Funnel principal:

```text
LANDING
↓
SIGNUP
↓
TRIAL STARTED
↓
FIRST FINANCIAL DATA
↓
ACTIVATED
↓
ENGAGED
↓
CHECKOUT
↓
PRO
↓
RETAINED
```

---

# 6. Signup

Evento:

```text
user_signed_up
```

Properties:

```text
user_id internal

signup_method

referral_source

campaign

created_at
```

---

# 7. Trial Start

Evento:

```text
trial_started
```

Properties:

```text
trial_started_at

trial_ends_at

trial_duration_days

policy_version
```

---

# 8. First Financial Action

Evento:

```text
first_financial_record_created
```

Puede ser:

```text
account

transaction

debt

budget

scheduled item
```

---

# 9. Activation Definition

Necesitamos una definición explícita.

Recommended initial activation:

```text
user has:

1 account
+
5 transactions
+
viewed dashboard/cashflow at least once
```

dentro de:

```text
first 7 days
```

---

# 10. Why Activation Needs A Definition

Sin definición clara:

```text
signed up
```

puede confundirse con:

```text
received value
```

No son lo mismo.

---

# 11. Activation Event

```text
user_activated
```

Debe emitirse una sola vez.

---

# 12. Activation Versioning

Guardar:

```text
activation_definition_version
```

Ejemplo:

```text
activation:v1
```

Si cambia la definición:

```text
activation:v2
```

No reinterpretar históricos silenciosamente.

---

# 13. Alternative Activation Signals

Medir adicionalmente:

```text
first_account_created

first_transaction_created

first_debt_created

first_budget_created

first_cashflow_viewed
```

para entender onboarding.

---

# 14. Time To First Value

Metric:

```text
signup
→
first meaningful financial insight
```

Ejemplos:

```text
first dashboard with real data

first upcoming obligation detected

first spendable money result
```

---

# 15. TTFV

Track:

```text
TIME_TO_FIRST_VALUE
```

por cohortes.

---

# 16. Trial Funnel

```text
TRIAL STARTED
↓
ACCOUNT CREATED
↓
TRANSACTIONS ADDED
↓
DASHBOARD VIEWED
↓
BUDGET / DEBT / PLANNING USED
↓
CHECKOUT STARTED
↓
PRO ACTIVATED
```

---

# 17. Trial Conversion Rate

```text
trial users converted to paid Pro
/
eligible trial users
```

---

# 18. Trial Expiration Rate

```text
trial expired without paid Pro
/
trial started
```

---

# 19. Trial Reactivation

Track:

```text
expired_read_only
→
paid Pro
```

as separate metric.

---

# 20. Conversion Windows

Measure:

```text
same day

within 3 days

within 7 days

within 14 days

after expiry
```

---

# 21. Checkout Funnel

```text
pricing_viewed

checkout_started

checkout_redirected

subscription_pending

subscription_activated
```

---

# 22. Checkout Conversion

```text
subscription activated
/
checkout started
```

---

# 23. Checkout Failure Reasons

Track normalized reasons:

```text
provider_error

user_abandoned

payment_failed

coupon_invalid

subscription_already_active

unknown
```

---

# 24. Product Access States

Track transitions:

```text
TRIAL

PRO_PAID

PRO_PROMOTION

EXPIRED_READ_ONLY
```

---

# 25. Access Transition Event

```text
product_access_changed
```

Properties:

```text
from_state

to_state

source

reason

occurred_at
```

---

# 26. Engagement

No usar únicamente:

```text
daily login
```

como valor.

Medir acciones financieras útiles.

---

# 27. Core Engagement Events

```text
transaction_created

transaction_updated

transfer_created

debt_created

debt_payment_recorded

budget_created

scheduled_item_created

recurring_rule_created

cashflow_viewed

dashboard_viewed
```

---

# 28. Engagement Quality

Un usuario que abre 20 veces la app y no registra nada no necesariamente está más comprometido que alguien que:

```text
logs in once

reviews finances

records everything

leaves
```

---

# 29. Weekly Active Financial User

Suggested definition:

usuario que en 7 días realiza al menos una:

```text
financial write
or
meaningful financial review
```

---

# 30. Meaningful Review

Ejemplos:

```text
dashboard_viewed with sufficient data

cashflow_viewed

upcoming_obligations_viewed

budget_progress_viewed
```

---

# 31. WAU

Metric:

```text
weekly_active_financial_users
```

---

# 32. MAU

Metric:

```text
monthly_active_financial_users
```

---

# 33. Stickiness

```text
WAU / MAU
```

puede ser más útil que DAU/MAU para una app financiera que no requiere uso diario.

---

# 34. Retention

Measure:

```text
week 1

week 4

month 2

month 3

month 6

month 12
```

---

# 35. Retention Definition

No usar simplemente:

```text
logged in
```

Preferir:

```text
performed meaningful financial activity
```

---

# 36. Paid Retention

Para Pro:

```text
retained paying subscription
```

es una métrica aparte.

---

# 37. Product Retention vs Revenue Retention

Mantener:

```text
Product Retention
≠
Subscription Retention
```

---

# 38. Churn

Separar:

```text
VOLUNTARY_CHURN

INVOLUNTARY_CHURN
```

---

# 39. Voluntary Churn

Example:

```text
user requested cancellation
```

---

# 40. Involuntary Churn

Example:

```text
payment failure
↓
grace expired
```

---

# 41. Churn Reason

Track:

```text
too_expensive

not_using_enough

missing_feature

technical_issue

privacy_concern

other
```

---

# 42. Churn Timing

Measure churn at:

```text
month 1

month 2

month 3

etc.
```

---

# 43. Reactivation

Track:

```text
EXPIRED_READ_ONLY
↓
PRO
```

---

# 44. Reactivation Source

Examples:

```text
normal checkout

discount

promotion

referral

manual grant
```

---

# 45. Revenue Metrics

At minimum:

```text
Active Pro

MRR

Gross Revenue

Gateway Fees

Net Payment Revenue

Refunds

Chargebacks
```

---

# 46. Contribution Metrics

From unit economics:

```text
estimated variable product cost

estimated contribution
```

---

# 47. MRR

```text
monthly recurring subscription revenue
```

Use billing data.

Not analytics event estimates.

---

# 48. Subscription Cohorts

Group by:

```text
signup month

first Pro month

acquisition source
```

---

# 49. Trial Cohorts

Measure:

```text
trial activation

trial conversion

trial cost

trial retention
```

by cohort.

---

# 50. Acquisition Sources

Track:

```text
ORGANIC

REFERRAL

AFFILIATE

PROMOTION

PAID_CAMPAIGN

DIRECT

UNKNOWN
```

---

# 51. UTM Attribution

Persist:

```text
utm_source

utm_medium

utm_campaign

utm_content
```

where appropriate.

---

# 52. Attribution Freeze

At signup, preserve:

```text
signup attribution
```

separately from later marketing visits.

---

# 53. Referral Analytics

Track:

```text
referral_link_opened

referral_signup

referral_paid_conversion

referral_reward_granted
```

---

# 54. Referral Funnel

```text
share
↓
visit
↓
signup
↓
trial
↓
paid
↓
reward
```

---

# 55. Referral Metrics

```text
signup rate

paid conversion rate

reward cost

referral CAC

referred retention
```

---

# 56. Promotion Analytics

Track:

```text
promotion_redeemed

promotion_grant_started

promotion_grant_expired

promotion_to_paid_conversion
```

---

# 57. Promo Conversion

```text
promotional Pro users
→
paid Pro
```

---

# 58. Discount Analytics

Track:

```text
coupon_entered

coupon_validated

coupon_rejected

discount_checkout_started

discount_subscription_activated
```

---

# 59. Discount Metrics

```text
redemption rate

checkout conversion

discounted revenue

incremental conversion

retention after discount
```

---

# 60. Discount Quality

No evaluar coupon solo por:

```text
redemptions
```

También:

```text
retention

LTV

margin
```

---

# 61. AI Analytics

Track by capability:

```text
transaction.categorize

merchant.normalize

assistant.query.simple

assistant.query.complex

cashflow.explain

debt.explain

budget.explain

scenario.simulate

action.prepare

import.map
```

---

# 62. AI Execution Event

```text
ai_capability_executed
```

Properties:

```text
capability

credits_charged

success

latency

provider

model_role

provider_cost
```

---

# 63. Do Not Put Prompt Content In Product Analytics

Avoid:

```text
raw prompt

raw model output
```

inside general event analytics.

---

# 64. AI Adoption

Metrics:

```text
% users using AI

first AI use

AI users per trial

AI users per Pro
```

---

# 65. AI Trial Conversion

Compare:

```text
Trial users who used AI
vs
Trial users who did not
```

on:

```text
conversion
```

without assuming causality.

---

# 66. AI Retention

Compare retention by AI usage cohort.

---

# 67. AI Credit Utilization

```text
credits consumed
/
credits granted
```

by:

```text
TRIAL

PRO

PROMOTION
```

---

# 68. AI Exhaustion

Track:

```text
ai_credits_exhausted
```

and subsequent:

```text
upgrade

churn

continued core usage
```

---

# 69. AI Quality Signals

Potential:

```text
suggestion accepted

suggestion rejected

prepared action confirmed

prepared action discarded
```

---

# 70. Prepared Action Conversion

```text
AI prepared action
↓
user confirmed
```

Useful for evaluating real AI value.

---

# 71. Categorization Acceptance

Track:

```text
AI suggested category

user accepted

user changed
```

Do not need merchant/transaction detail in analytics event.

---

# 72. Notification Analytics

Track:

```text
notification_created

notification_delivered

notification_opened

notification_action_clicked
```

---

# 73. Channel Analytics

By:

```text
IN_APP

REALTIME_WEB

EMAIL

WHATSAPP
```

---

# 74. WhatsApp Usage Metrics

```text
trial allowance utilization

Pro allowance utilization

delivery success

cost per Pro
```

---

# 75. Notification Value

Measure whether alerts lead to useful actions.

Example:

```text
debt reminder
↓
debt payment recorded
```

within a reasonable window.

---

# 76. Do Not Overclaim Causality

A payment after reminder:

```text
may be associated
```

not necessarily caused.

---

# 77. Budget Analytics

Track:

```text
budget_created

budget_progress_viewed

budget_threshold_reached
```

---

# 78. Budget Adoption

```text
users with at least one active budget
/
active users
```

---

# 79. Debt Analytics

Track product usage:

```text
debt_created

installments_generated

debt_payment_recorded

debt_viewed
```

Not merchant-level details.

---

# 80. Planning Analytics

```text
scheduled_item_created

recurring_rule_created

upcoming_viewed

reminder_configured
```

---

# 81. Dashboard Analytics

Track:

```text
dashboard_viewed
```

with high-level state:

```text
has_accounts

has_transactions

has_debts

has_upcoming
```

No need to include balances.

---

# 82. Cashflow Analytics

Track:

```text
cashflow_viewed

cashflow_range_selected
```

No raw values required for basic product analytics.

---

# 83. Feature Adoption

For each feature:

```text
eligible users
↓
users who used feature
```

---

# 84. Adoption Window

Measure:

```text
during first 7 days

during trial

first 30 days

lifetime
```

---

# 85. Onboarding Funnel

Potential steps:

```text
account_created

opening_balance_added

first_transaction

category_configured

dashboard_viewed
```

---

# 86. Onboarding Drop-Off

Measure users who stop between each step.

---

# 87. Do Not Force Checklist Behavior

Analytics should reveal natural value path.

Not necessarily force users through every feature.

---

# 88. Product Activation Segments

Possible activated profiles:

```text
expense tracker

debt manager

planner

budget user

AI-heavy user
```

Use product behavior, not sensitive personal inference.

---

# 89. User Lifecycle State

Internal analytics concept:

```text
NEW

ACTIVATING

ACTIVATED

ENGAGED

AT_RISK

CHURNED
```

Do not use directly as financial entitlement.

---

# 90. At-Risk

Could eventually be based on:

```text
drop in meaningful activity

subscription cancellation scheduled

payment failure
```

Avoid opaque AI scoring initially.

---

# 91. Lifecycle Is Analytics

Maintain:

```text
Lifecycle State
≠
Product Access State
```

---

# 92. Event Naming Convention

Use:

```text
noun_verb
```

or consistent past tense.

Recommended:

```text
account_created

transaction_created

checkout_started

subscription_activated
```

---

# 93. Event Stability

Event names are API-like contracts.

Avoid renaming casually.

---

# 94. Event Versioning

If payload meaning changes materially:

```text
event_version
```

---

# 95. Standard Event Properties

Include where relevant:

```text
event_id

event_name

event_version

user_id internal

occurred_at

session_id optional

platform

app_version

environment
```

---

# 96. User ID

Internal analytics may use stable internal identifier.

This does not make analytics anonymous.

---

# 97. External Analytics Separation

Do not reuse raw product events directly for:

```text
external data products
```

without privacy pipeline.

---

# 98. Event Idempotency

Critical backend events should have stable:

```text
event_id
```

to avoid double-counting.

---

# 99. Server Events vs Client Events

Prefer server-side events for:

```text
subscription activated

payment approved

promotion redeemed

refund completed

AI credit consumed
```

---

# 100. Client Events

Good for:

```text
page viewed

filter changed

CTA clicked
```

but are less authoritative.

---

# 101. Billing Truth

Never calculate:

```text
paid conversion
```

from browser click.

Use normalized billing state.

---

# 102. Financial Truth

Never calculate:

```text
transaction created
```

solely from client event.

Use application service/domain event.

---

# 103. Analytics Event Pipeline

```text
Application / UI Event
↓
Analytics Adapter
↓
Event Validation
↓
Queue / Persistence
↓
Analytics Store
↓
Reports / Funnels
```

---

# 104. AnalyticsProvider

Create abstraction:

```text
AnalyticsProvider
```

Possible implementations:

```text
PostHog

Plausible + custom events

Segment-style pipeline

self-hosted analytics
```

Provider choice can remain configurable.

---

# 105. Provider Boundary

Product code calls:

```text
AnalyticsService.track()
```

not vendor SDK throughout the codebase.

---

# 106. Server Analytics

Create:

```text
ServerAnalytics
```

for authoritative events.

---

# 107. Client Analytics

Create small adapter for UI interactions.

---

# 108. No Financial Data In URLs

Do not embed:

```text
transaction amount

debt amount

merchant

account balance
```

in analytics URL/query tracking.

---

# 109. Event Validation

Use Zod schemas.

Example:

```text
subscription_activated
```

must have expected fields only.

---

# 110. Event Allowlist

Avoid arbitrary:

```text
metadata: any
```

because sensitive data can leak into analytics providers.

---

# 111. Privacy-Safe Event Design

Prefer:

```text
transaction_created
{
  transaction_type: "EXPENSE"
}
```

Not:

```text
{
  amount: "1234.22",
  merchant: "...",
  note: "..."
}
```

unless a specific internal analysis genuinely requires it.

---

# 112. Amount Buckets

If product analytics needs financial magnitude:

prefer bucket:

```text
LOW

MEDIUM

HIGH
```

or normalized range.

But only where useful.

---

# 113. No Free Text

Never include:

```text
transaction notes

AI prompts

support notes

custom category text
```

in general analytics events.

---

# 114. Data Minimization

Every event property should answer:

```text
What product question does this answer?
```

If none:

do not collect it.

---

# 115. Analytics Consent

Product analytics consent/legal basis depends on chosen implementation and jurisdiction.

Maintain integration with:

```text
analytics_consents
```

where required.

---

# 116. Essential Operational Analytics

Some internal telemetry may be necessary for:

```text
security

reliability

billing
```

and belongs to separate purpose categories.

---

# 117. Purpose Separation

Maintain:

```text
PRODUCT_ANALYTICS

SECURITY

BILLING

EXTERNAL_AGGREGATED_STATISTICS
```

as distinct purposes.

---

# 118. Dashboard Metrics

Executive product dashboard:

```text
Signups

Trials Started

Activated Users

Trial → Pro Conversion

Active Pro

MRR

Churn

WAU

AI Adoption
```

---

# 119. Acquisition Dashboard

```text
signup by source

trial conversion by source

paid conversion by source

CAC if spend data exists
```

---

# 120. Activation Dashboard

```text
activation rate

median time to activation

step drop-off

first-value time
```

---

# 121. Trial Dashboard

```text
active trials

trial age distribution

trial activation

conversion

expiration

AI utilization
```

---

# 122. Revenue Dashboard

```text
Active Pro

New Pro

MRR

Refunds

Gateway Fees

Net Payment Revenue

Voluntary Churn

Involuntary Churn
```

---

# 123. Retention Dashboard

Cohorts:

```text
signup month

Pro activation month

acquisition source
```

---

# 124. AI Dashboard

```text
active AI users

credits consumed

capability distribution

provider cost

AI cost per trial

AI cost per Pro
```

---

# 125. Notifications Dashboard

```text
notifications created

delivery rate

open rate

WhatsApp usage

email failure

alert actions
```

---

# 126. Referral Dashboard

```text
referral clicks

signups

paid conversions

rewards

referral CAC
```

---

# 127. Promotions Dashboard

```text
redemptions

active promo users

promo-to-paid conversion

promo cost
```

---

# 128. Discounts Dashboard

```text
coupon usage

paid conversion

discounted MRR

margin impact

retention
```

---

# 129. Product Health Metrics

Recommended weekly review:

```text
Activation Rate

Trial → Pro

Week 4 Retention

Paid Churn

AI Cost / Pro

WhatsApp Cost / Pro

Refund Rate
```

---

# 130. Guardrail Metrics

When optimizing conversion:

also monitor:

```text
refund rate

support volume

churn

provider costs

privacy opt-outs
```

---

# 131. North Star Candidate

Potential North Star:

```text
Monthly Financially Active Users
```

defined as users who:

```text
maintain meaningful financial data
+
review or act on their finances
```

during the month.

---

# 132. Why Not Revenue As North Star

Revenue is necessary but does not directly represent:

```text
user financial value
```

---

# 133. Why Not Transactions Created

More transactions can reflect:

```text
higher spending
```

not necessarily product value.

---

# 134. Financially Active User Definition

Suggested:

within rolling 30 days, user has at least:

```text
one meaningful financial write
or
two meaningful review sessions
```

and enough data for useful product state.

---

# 135. North Star Version

```text
financially-active-user:v1
```

---

# 136. User Value Signals

Potential:

```text
dashboard reviewed

obligation resolved

budget reviewed

cashflow reviewed

debt payment tracked

planning item confirmed
```

---

# 137. Value Events

Create registry:

```text
ProductValueEventRegistry
```

---

# 138. Avoid Gamification Metrics

No need for:

```text
streaks

daily check-ins
```

unless they demonstrably help financial behavior.

---

# 139. Experimentation

Future A/B testing may evaluate:

```text
onboarding

pricing copy

trial reminders

AI placement

checkout
```

---

# 140. Experiment Assignment

Must be stable per user.

---

# 141. Experiments Must Not Change Financial Truth

Never A/B test:

```text
finance calculation formula
```

without explicit domain versioning/testing.

---

# 142. Pricing Experiments

High caution.

Different pricing can create:

```text
billing

fairness

support
```

complexity.

Use controlled cohorts if implemented.

---

# 143. Privacy Experiments

Do not A/B test manipulative consent copy.

---

# 144. Experiment Entity

Future:

```text
experiments

experiment_assignments
```

---

# 145. Feature Flags

Can integrate with:

```text
feature flags
```

for rollout.

Feature flags are not analytics events.

---

# 146. Analytics Retention

Define retention based on purpose.

General product events do not need infinite retention.

---

# 147. Raw Event Retention

Example:

```text
12–24 months
```

depending on business need.

Final policy should be explicit.

---

# 148. Aggregate Retention

Longer-lived aggregate metrics may be preserved without raw event detail when appropriate.

---

# 149. Deletion

User deletion must propagate according to analytics privacy policy.

---

# 150. Internal Pseudonymous Analytics

If identifier remains linkable:

treat as personal/pseudonymous data.

---

# 151. Admin Analytics

Commercial Admin can display aggregates.

Avoid exposing unnecessary raw event streams.

---

# 152. Debug Event View

SUPER_ADMIN/engineering can have limited event diagnostics where necessary.

---

# 153. No Sensitive Product Explorer

Do not create UI that lets admin casually browse:

```text
every financial action by user
```

unless needed for support and appropriately permissioned.

---

# 154. Data Quality

Analytics pipeline must detect:

```text
duplicate events

missing fields

unexpected event versions

timestamp anomalies
```

---

# 155. Event Schema Registry

Recommended:

```text
packages/analytics/src/events/
```

with typed schemas.

---

# 156. Example Structure

```text
packages/analytics/
├── events/
│   ├── auth.ts
│   ├── finance.ts
│   ├── billing.ts
│   ├── ai.ts
│   ├── notifications.ts
│   └── referrals.ts
├── server/
├── client/
├── providers/
└── index.ts
```

---

# 157. Event Ownership

Each feature defines its own business events.

Analytics package defines tracking schema/infrastructure.

---

# 158. Domain Event vs Analytics Event

Maintain:

```text
Domain Event
≠
Analytics Event
```

A domain event may feed analytics, but domain should not depend on analytics provider.

---

# 159. Analytics Failure Isolation

If analytics provider is down:

```text
transaction creation

billing

debt payment
```

must still work.

---

# 160. Correct Pattern

```text
Core operation
↓
success
↓
emit/queue analytics
```

not:

```text
analytics provider
↓
must succeed
↓
core operation
```

---

# 161. Async Tracking

Critical server analytics can use queue/outbox where needed.

---

# 162. Client Analytics Failure

Should be invisible to user.

---

# 163. Session Tracking

Useful for UI flow.

Do not treat session duration as primary value metric.

---

# 164. Page Views

Track key product areas:

```text
dashboard

transactions

accounts

debts

planning

budgets

assistant

reports

billing
```

---

# 165. Search Analytics

Natural language search:

track:

```text
search executed

result success

no result
```

No raw query text by default if it may contain financial details.

---

# 166. Search Intent Classification

Can track high-level intent:

```text
spending

debt

cashflow

transaction lookup
```

if safely derived.

---

# 167. Import Analytics

Track:

```text
import_started

import_completed

import_failed

rows_imported_bucket
```

---

# 168. Import Quality

Potential:

```text
mapped automatically

user corrected
```

without storing raw CSV contents in analytics.

---

# 169. Error Analytics

Track normalized product errors:

```text
validation

provider error

access required

credits exhausted
```

---

# 170. Error Rate

Monitor by feature.

---

# 171. Access Required Events

Track:

```text
feature_blocked_by_access
```

Properties:

```text
feature

access_state
```

Useful to understand upgrade demand.

---

# 172. Read-Only Usage

Track whether expired users continue:

```text
signing in

reviewing historical data

exporting

returning to billing page
```

---

# 173. Reactivation Funnel

```text
expired login
↓
billing viewed
↓
checkout started
↓
Pro reactivated
```

---

# 174. Promotion Expiration Funnel

```text
promo ending
↓
pricing viewed
↓
paid Pro
```

---

# 175. Trial Ending Funnel

Same:

```text
trial reminder
↓
pricing viewed
↓
checkout
↓
Pro
```

---

# 176. Notification Attribution

Store:

```text
notification_id
```

when user clicks CTA.

Useful to associate:

```text
trial reminder
→
checkout
```

---

# 177. Attribution Window For Product Messaging

Can define:

```text
24h

72h
```

for reporting.

Do not treat as causal proof.

---

# 178. Data Warehouse

Not necessary at launch.

---

# 179. MVP Analytics Stack

Can start with:

```text
PostHog or equivalent
+
PostgreSQL billing/product queries
```

behind internal adapter.

---

# 180. Warehouse Trigger

Consider dedicated warehouse when:

```text
event volume grows

cross-domain queries become expensive

long cohort analyses become difficult
```

---

# 181. SQL Reporting

Authoritative financial/business metrics may still come directly from PostgreSQL read models.

---

# 182. Analytics Provider Is Not Billing Truth

Never rely solely on analytics events for:

```text
MRR

payment totals

refund totals
```

---

# 183. Analytics Provider Is Not Finance Truth

Same for:

```text
balances

spending totals

debt
```

---

# 184. Source Of Truth Matrix

```text
Financial Metrics
→ Finance Engine / PostgreSQL

Billing Metrics
→ Billing tables / provider reconciliation

Product Behavior
→ Analytics Events

AI Cost
→ AI telemetry

Notification Cost
→ Notification delivery telemetry
```

---

# 185. KPI Definitions

Create:

```text
docs/22.1-product-metrics-dictionary.md
```

future optional companion.

---

# 186. Metrics Dictionary

Each KPI should define:

```text
name

formula

source

time window

inclusions

exclusions

version
```

---

# 187. Example — Trial Conversion

```text
Numerator:
users with first effective paid Pro

Denominator:
eligible completed trials/cohort

Window:
defined cohort period
```

---

# 188. Avoid Dashboard Formula Drift

Do not let:

```text
Admin Dashboard

Notion report

SQL query

investor deck
```

all calculate conversion differently.

---

# 189. Metric Registry

Potential:

```text
ProductMetricRegistry
```

or docs-driven definitions.

---

# 190. Weekly Product Review

Recommended questions:

```text
How many users signed up?

How many activated?

How many converted?

Why did users churn?

Which features correlate with retention?

Are AI/WhatsApp costs within target?
```

---

# 191. Monthly Business Review

```text
MRR

paid growth

cohort retention

CAC

LTV

refunds

gateway fees

contribution margin

trial economics
```

---

# 192. Cohort Analysis

Always prefer cohorts over only global averages.

Example:

```text
January signups

February signups
```

---

# 193. Feature Cohorts

Compare:

```text
users with debt tracking

users with budgets

users using planning

users using AI
```

---

# 194. Correlation Caveat

Feature adoption can correlate with retention because highly engaged users adopt more features.

Do not automatically conclude feature causes retention.

---

# 195. Qualitative Feedback

Analytics should be complemented by:

```text
support feedback

cancellation feedback

user interviews
```

---

# 196. Feedback Event

Can track:

```text
feedback_submitted
```

but text should stay in appropriate system, not general analytics payload.

---

# 197. Security Analytics Separation

Security events like:

```text
failed login

suspicious access
```

belong to security observability.

Can be correlated but should retain purpose separation.

---

# 198. Production vs Development

Analytics events must include:

```text
environment
```

Test/dev events excluded from production metrics.

---

# 199. Internal Accounts

Flag:

```text
staff

demo

test
```

and exclude from business KPIs.

---

# 200. Bot Filtering

Public acquisition metrics should filter obvious bots.

---

# 201. Timezone

Business analytics should use a defined reporting timezone.

User financial dates may use user timezone.

Do not mix silently.

---

# 202. Reporting Currency

Revenue metrics may need:

```text
billing currency
```

and future normalized reporting currency.

Do not use personal-finance FX logic automatically.

---

# 203. Tests — Signup Event

Exactly once per real user signup.

---

# 204. Tests — Activation

Activation event emitted once when criteria first satisfied.

---

# 205. Tests — Duplicate Backend Event

No double counting of subscription activation.

---

# 206. Tests — Billing Source

Pro conversion comes from billing state, not checkout click.

---

# 207. Tests — Financial Event

Transaction creation analytics only after successful transaction commit.

---

# 208. Tests — Analytics Failure

Core financial operation still succeeds.

---

# 209. Tests — Sensitive Properties

Schemas reject prohibited free-text/financial fields where not allowed.

---

# 210. Tests — Internal User Exclusion

Staff/test accounts excluded from KPI views.

---

# 211. Tests — Trial Funnel

Correct:

```text
signup
trial
activation
checkout
Pro
```

sequence measurable.

---

# 212. Tests — Reactivation

Expired → Pro tracked separately from first conversion.

---

# 213. Tests — AI Usage

Credits/provider cost captured without prompt content.

---

# 214. Tests — Referral

Repeated billing webhook creates one conversion/reward analytic event.

---

# 215. Tests — Coupon

Discounted Pro remains paid conversion.

---

# 216. Tests — Promotion

Promo Pro does not count as paid Pro.

---

# 217. MVP Events

Initial minimum:

```text
user_signed_up

trial_started

account_created

transaction_created

user_activated

dashboard_viewed

cashflow_viewed

checkout_started

subscription_activated

trial_expired

subscription_cancelled

subscription_expired

user_reactivated

ai_capability_executed

ai_credits_exhausted

notification_action_clicked

promotion_redeemed

discount_applied

referral_attributed

referral_converted
```

---

# 218. MVP KPIs

```text
Signups

Activation Rate

Time To First Value

Trial → Pro Conversion

Active Pro

MRR

Week 4 Retention

Paid Churn

Reactivation Rate

AI Adoption

AI Cost / Pro

WhatsApp Cost / Pro
```

---

# 219. MVP Dashboards

```text
Acquisition

Activation

Trial

Revenue

Retention

AI

Commercial Programs
```

---

# 220. Not MVP

Postpone:

```text
complex attribution modeling

multi-touch marketing attribution

real-time warehouse

predictive churn ML

automatic user scoring

advanced experimentation platform

session replay with sensitive screens
```

---

# 221. Session Replay

Be extremely cautious.

Financial screens may contain sensitive data.

Recommended:

```text
disabled initially
```

unless robust masking and privacy review exist.

---

# 222. Heatmaps

Same caution.

Can leak sensitive financial information through captured UI context depending on provider implementation.

---

# 223. No Sensitive Replay At Launch

Do not use replay tooling on:

```text
transactions

debts

accounts

AI assistant

billing payment details
```

without explicit privacy design.

---

# 224. Recommended Launch Configuration

```text
Activation:
1 account
+ 5 transactions
+ dashboard/cashflow viewed

Trial:
14 days

Primary conversion:
first effective paid Pro

Primary retention:
meaningful financial activity

Primary revenue:
MRR

Primary product value:
Financially Active Users
```

---

# 225. Relationship With Billing

Billing supplies authoritative:

```text
subscription activation

payment

cancellation

expiration

reactivation
```

---

# 226. Relationship With Finance

Finance supplies authoritative successful financial operations.

Analytics does not recalculate balances.

---

# 227. Relationship With AI

AI telemetry supplies:

```text
capability

credits

provider cost

quality signals
```

---

# 228. Relationship With Notifications

Notifications supply delivery and action events.

---

# 229. Relationship With Promotions

Promotions supply:

```text
redemption

grant lifecycle

promo-to-paid conversion context
```

---

# 230. Relationship With Referrals

Referrals supply attribution and reward lifecycle.

---

# 231. Relationship With Data Monetization

Product Analytics:

```text
understands product behavior
```

Document 23:

```text
creates privacy-controlled aggregate statistical products
```

These must remain separate.

---

# 232. Core Invariants

Never break:

```text
Product Analytics
≠
Financial Truth
```

```text
Analytics Event
≠
Domain State
```

```text
Checkout Started
≠
Paid Conversion
```

```text
Promotion Pro
≠
Paid Pro
```

```text
Product Analytics
≠
External Statistical Dataset
```

```text
Pseudonymous Analytics
≠
Anonymous Data
```

---

# 233. Additional Invariants

```text
Analytics failures never block core finance.

Billing metrics come from billing truth.

Financial metrics come from finance truth.

Sensitive free text is excluded from general analytics.

AI prompts are not general analytics payloads.

Events are schema validated.

Critical events are idempotent.

Test/staff accounts are excluded from business KPIs.

Metric definitions are versioned.

Product access state and analytics lifecycle state remain separate.
```

---

# 234. Final Architecture

```text
                    PRODUCT
                       │
        ┌──────────────┼──────────────┐
        │              │              │
      Finance        Billing         UI
        │              │              │
        └──────────────┼──────────────┘
                       ↓
                 AnalyticsService
                       │
                       ↓
                 Event Schemas
                       │
                       ↓
                Analytics Provider
                       │
                       ↓
                Product Reporting
                       │
            ┌──────────┼──────────┐
            │          │          │
         Funnels     Cohorts     KPIs
```

Authoritative truth remains outside Analytics.

---

# 235. Final Product Rule

La analítica debe servir para entender:

```text
acquisition
↓
activation
↓
value
↓
conversion
↓
retention
```

sin convertir el producto financiero en una máquina de tracking indiscriminado.

La regla final es:

```text
TRACK WHAT ANSWERS A PRODUCT QUESTION
```

No:

```text
TRACK EVERYTHING BECAUSE WE CAN
```
