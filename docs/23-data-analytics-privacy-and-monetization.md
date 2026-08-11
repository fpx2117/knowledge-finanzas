# Data Analytics, Privacy & Monetization

## 1. Objetivo

Este documento define cómo la plataforma puede utilizar datos financieros y contextuales para producir estadísticas agregadas, benchmarks e insights de mercado respetando privacidad, consentimiento y separación de responsabilidades.

La plataforma contiene información extremadamente sensible:

```text
income

expenses

debts

cashflow

budgets

financial obligations

purchase categories

financial behavior
```

Por lo tanto:

```text
Financial Data
≠
Ordinary Product Analytics
```

y:

```text
Removing Name / Email
≠
Anonymization
```

Principio central:

```text
Raw Personal Finance Data
↓
Privacy-Controlled Analytics Pipeline
↓
Aggregated / Anonymized Statistical Product
```

Nunca:

```text
Raw Transactions
↓
External Buyer
```

---

# 2. Product Philosophy

La posible monetización estadística debe ser secundaria a:

```text
user trust

privacy

security

financial integrity
```

El producto no debe diseñarse alrededor de extraer el máximo volumen posible de información personal.

Debe aplicar:

```text
collect what is useful

minimize what is unnecessary

aggregate early

retain only what is justified
```

---

# 3. Personal Finance Data Is Highly Sensitive

Aunque algunos campos no estén clasificados legalmente como categorías especiales en todas las jurisdicciones, una combinación de:

```text
income

merchant

debt

location

age

household

spending patterns
```

puede revelar información muy íntima.

Por eso se debe aplicar un estándar interno alto de protección.

---

# 4. Three Data Layers

Separar:

```text
PRODUCT DATA

ANALYTICS DATA

EXTERNAL STATISTICAL DATA
```

---

# 5. Product Data

Es la información necesaria para operar la cuenta del usuario.

Ejemplos:

```text
accounts

transactions

debts

budgets

scheduled obligations

income

cashflow
```

Es la fuente de verdad financiera personal.

---

# 6. Analytics Data

Datos derivados para comprender:

```text
product usage

financial patterns

cohorts

benchmarks

business metrics
```

Puede seguir siendo información personal o seudonimizada.

No debe asumirse que es anónima.

---

# 7. External Statistical Data

Es información preparada específicamente para:

```text
research

benchmarking

market intelligence

commercial statistics
```

Debe pasar por controles adicionales de privacidad.

---

# 8. Anonymization vs Pseudonymization

Mantener explícitamente:

```text
Pseudonymized Data
≠
Anonymous Data
```

Ejemplo:

```text
user_id
→ SHA256(user_id)
```

sigue permitiendo vincular múltiples registros del mismo sujeto.

Eso es normalmente:

```text
pseudonymization
```

no anonimización.

---

# 9. No Hash-And-Sell Strategy

Nunca considerar suficiente:

```text
remove email
+
hash userId
+
sell rows
```

El riesgo de reidentificación permanece cuando existen atributos financieros y demográficos ricos.

---

# 10. Statistical Product Strategy

El producto comercial recomendado no es:

```text
transaction dataset
```

sino:

```text
aggregated statistical dataset
```

Ejemplo:

```text
Age:
25–34

Region:
Central

Employment:
Independent

Income:
USD-equivalent band X

Users:
4,382

Median food spending:
X

Median savings rate:
Y

Median debt burden:
Z
```

---

# 11. Minimum Aggregation Principle

La información externa debe representar:

```text
groups
```

no individuos.

---

# 12. Voluntary Statistical Profile

Crear un perfil separado:

```text
user_statistical_profiles
```

Su objetivo es agregar contexto estadístico opcional.

---

# 13. Voluntary Means Voluntary

Completarlo:

```text
must not be required
```

para usar las funciones normales de finanzas personales.

No debe afectar:

```text
TRIAL

PRO

promotions

billing

financial features
```

---

# 14. Recommended Initial Fields

Recolectar inicialmente solo:

```text
age_range

employment_status

income_range

household_size_range

region
```

Cinco variables son suficientes para producir segmentación útil sin transformar onboarding en una encuesta extensa.

---

# 15. Age Range

No pedir fecha exacta de nacimiento solo para analytics.

Usar:

```text
18–24

25–34

35–44

45–54

55–64

65+
```

---

# 16. Employment Status

Valores iniciales:

```text
EMPLOYED

SELF_EMPLOYED

BUSINESS_OWNER

STUDENT

UNEMPLOYED

RETIRED

OTHER

PREFER_NOT_TO_SAY
```

---

# 17. Income Range

Preferir bandas.

Ejemplo configurable por mercado:

```text
LOWER_BAND

LOWER_MIDDLE

MIDDLE

UPPER_MIDDLE

HIGHER
```

o rangos monetarios localizados.

---

# 18. Income Range vs Actual Income

La aplicación puede calcular ingresos registrados.

Pero:

```text
registered inflows
≠
declared household income
```

Por eso ambos conceptos no deben mezclarse.

---

# 19. Household Size

Preferir:

```text
1

2

3–4

5+
```

en lugar de detalles innecesarios.

---

# 20. Region

Preferir región administrativa amplia.

Ejemplo:

```text
province/state/department
```

o macro-región.

---

# 21. Avoid Exact Location

Para analytics externos no solicitar:

```text
street address

GPS coordinates

exact home location
```

sin una necesidad de producto independiente.

---

# 22. City

Si la ciudad es estadísticamente útil, preferir derivación:

```text
CITY_SIZE_BUCKET
```

Ejemplo:

```text
RURAL

<100K

100K–500K

500K–1M

1M+
```

antes que publicar localidad exacta.

---

# 23. Optional Future Fields

Podrían agregarse progresivamente:

```text
housing_status

household_type

dependents_range

education_level

industry

primary_financial_goal

self_reported_financial_comfort
```

---

# 24. Housing Status

Ejemplo:

```text
OWNER

MORTGAGE

RENTER

FAMILY_HOME

SHARED

OTHER
```

---

# 25. Household Type

Ejemplo:

```text
LIVING_ALONE

COUPLE

COUPLE_WITH_CHILDREN

SINGLE_PARENT

EXTENDED_FAMILY

SHARED_HOUSEHOLD

OTHER
```

---

# 26. Dependents

Preferir bandas:

```text
0

1

2

3+
```

---

# 27. Industry

Usar categorías amplias.

No preguntar empleador exacto para analytics estadísticos.

---

# 28. Financial Goal

Opciones:

```text
CONTROL_SPENDING

BUILD_EMERGENCY_FUND

REDUCE_DEBT

SAVE

BUY_HOME

INVEST

PLAN_MAJOR_PURCHASE

OTHER
```

---

# 29. Financial Comfort

Pregunta voluntaria:

```text
How do you usually finish the month?
```

Opciones:

```text
COMFORTABLE_SURPLUS

SMALL_SURPLUS

ROUGHLY_BREAK_EVEN

SOMETIMES_SHORT

OFTEN_SHORT
```

---

# 30. Why Self-Reported Variables Matter

Variables derivadas financieramente pueden describir comportamiento.

Variables declaradas pueden describir:

```text
context

intent

perception
```

La combinación produce mejores análisis sin tener que inferir atributos altamente sensibles.

---

# 31. Do Not Infer Sensitive Characteristics

Evitar intentar inferir:

```text
religion

sexual orientation

political affiliation

medical condition

ethnicity
```

a partir de merchants o patrones financieros.

---

# 32. Sensitive Merchant Categories

Las transacciones pueden revelar información sensible indirectamente.

Ejemplos:

```text
medical clinic

religious organization

political donation

specialized pharmacy
```

Estos registros requieren especial cuidado en cualquier pipeline estadístico.

---

# 33. External Exclusion Policy

Recommended:

excluir de productos comerciales externos categorías que tengan alta probabilidad de revelar información especialmente sensible.

---

# 34. Consent Model

Crear consentimiento separado para:

```text
STATISTICAL_ANALYTICS
```

y, si se desea mayor precisión:

```text
EXTERNAL_AGGREGATED_RESEARCH
```

---

# 35. Consent Is Not Terms Acceptance

Mantener:

```text
Terms Acceptance
≠
Analytics Consent
```

---

# 36. Consent Must Be Explicit

User action:

```text
checkbox / toggle
```

con explicación clara.

---

# 37. No Pre-Checked Consent

Recommended:

```text
default = false
```

para external statistical use.

---

# 38. Example Consent Copy

```text
Quiero contribuir de forma voluntaria con estadísticas financieras
agregadas para ayudar a generar estudios y benchmarks.

Mis movimientos individuales, identidad y datos de contacto
no se compartirán como registros individuales.
```

El copy legal definitivo debe ser revisado antes de producción.

---

# 39. Consent Granularity

Recommended V1:

```text
product_analytics
```

y:

```text
external_aggregated_statistics
```

como dos propósitos separados.

---

# 40. Product Analytics Consent

Su tratamiento exacto dependerá de jurisdicción y base legal.

No asumir que todo analytics requiere o no requiere consentimiento sin revisión jurídica.

---

# 41. External Monetization

Para uso comercial externo, aplicar estándar interno:

```text
explicit opt-in
```

aunque alguna jurisdicción pudiera permitir otros fundamentos.

---

# 42. Consent Table

Crear:

```text
analytics_consents
```

Campos:

```text
id

user_id

purpose

status

policy_version

granted_at

withdrawn_at

created_at
```

---

# 43. Consent History

Crear:

```text
analytics_consent_history
```

o mantener ledger append-only.

Campos:

```text
id

user_id

purpose

action

policy_version

occurred_at
```

---

# 44. Consent Actions

```text
GRANTED

WITHDRAWN
```

---

# 45. Consent Versioning

Registrar:

```text
analytics-policy:v1
```

Si el propósito cambia sustancialmente, puede ser necesaria nueva aceptación.

---

# 46. Withdrawal

El usuario debe poder retirar consentimiento desde:

```text
Settings
→ Privacy
```

---

# 47. Withdrawal Effect

Después de retiro:

```text
no new eligible personal data
```

debe ingresar al pipeline externo.

---

# 48. Already Anonymized Statistics

Una vez que un resultado sea realmente anónimo y ya no pueda vincularse razonablemente al usuario, puede no ser técnicamente posible retirar su contribución individual de agregados históricos.

Esto debe explicarse claramente en política antes del opt-in.

---

# 49. Pseudonymous Intermediate Data

Si todavía existe capacidad de vinculación:

```text
withdrawal
```

debe propagarse según política y obligaciones aplicables.

---

# 50. Statistical Profile Schema

Conceptualmente:

```text
user_statistical_profiles

user_id

age_range

employment_status

income_range

household_size_range

region_code

city_size_bucket

housing_status nullable

household_type nullable

industry_group nullable

primary_financial_goal nullable

financial_comfort nullable

updated_at
```

---

# 51. Separation

Aunque esté en misma PostgreSQL inicialmente, mantener separación lógica entre:

```text
identity/profile data
```

y:

```text
financial ledger
```

---

# 52. Statistical Fields Are Not Financial Truth

El perfil puede quedar desactualizado.

Ejemplo:

```text
employment_status
```

puede cambiar.

No usarlo para calcular balances o cashflow.

---

# 53. Progressive Collection

No pedir todos los datos durante signup.

Recommended signup:

```text
minimal required account information
```

Después:

```text
optional profile completion
```

---

# 54. Example Progressive Prompt

Después de que usuario obtenga valor:

```text
Ayudanos a mejorar los benchmarks financieros.

Completar perfil estadístico
Opcional
```

---

# 55. Never Block Core Product

Cerrar el prompt debe ser posible.

---

# 56. Incentives

Si se recompensa completar perfil:

la recompensa debe ser pequeña y no coercitiva.

Ejemplo potencial:

```text
small AI credit bonus
```

pero no necesario inicialmente.

---

# 57. No Paywalling Privacy

Nunca:

```text
consent to data commercialization
→ cheaper subscription
```

sin una revisión ética/legal muy cuidadosa.

Default recommendation:

no vincular precio de Pro al consentimiento.

---

# 58. Derived Financial Metrics

Mucho del valor estadístico puede derivarse sin pedir nuevas preguntas.

Ejemplos:

```text
monthly_spend

spend_by_category

income_variability

savings_rate

debt_service_ratio

housing_cost_ratio

subscription_spend

food_spend_ratio

transport_spend_ratio

discretionary_spend_ratio

liquid_buffer

cashflow_volatility
```

---

# 59. Derived Metrics Are Still Sensitive

El hecho de que algo sea calculado no significa que deje de ser dato personal.

Mantener protección mientras siga vinculado a un usuario.

---

# 60. Savings Rate

Ejemplo conceptual:

```text
monthly_savings
/
monthly_income
```

Finance Engine / analytics calculation debe definir exactamente inputs.

---

# 61. Debt Service Ratio

```text
monthly debt obligations
/
monthly income
```

si existe ingreso suficientemente confiable.

---

# 62. Housing Cost Ratio

```text
housing expenses
/
income
```

---

# 63. Expense Category Ratios

Ejemplo:

```text
food expenses
/
total expenses
```

---

# 64. Financial Buffer

Puede medirse como:

```text
liquid spendable amount
/
average monthly essential outflow
```

pero debe existir definición exacta documentada.

---

# 65. Statistical Metric Registry

Crear un catálogo:

```text
AnalyticsMetricRegistry
```

para evitar que cada dashboard defina métricas diferentes.

---

# 66. Metric Definition

Cada métrica debe documentar:

```text
id

name

definition

inputs

calculation_version

currency requirements

minimum data requirements
```

---

# 67. Versioning

Ejemplo:

```text
savings-rate:v1
```

Si fórmula cambia:

```text
savings-rate:v2
```

No reinterpretar silenciosamente históricos.

---

# 68. Currency

No agregar importes de monedas diferentes sin FX válido.

---

# 69. External Monetary Statistics

Para comparaciones internacionales se puede utilizar:

```text
local-currency statistics
```

o pipeline FX separado.

No utilizar conversiones financieras personales implícitas.

---

# 70. Normalized Ratios

Los ratios pueden ser más útiles que montos absolutos para comparaciones internacionales.

Ejemplo:

```text
food_spend_ratio

savings_rate

debt_service_ratio
```

---

# 71. Data Pipeline

Arquitectura:

```text
Personal Finance PostgreSQL
↓
Eligibility / Consent Filter
↓
Privacy Analytics Staging
↓
Metric Derivation
↓
Generalization / Bucketing
↓
Aggregation
↓
Privacy Thresholds
↓
Disclosure Risk Checks
↓
Statistical Dataset
↓
External Data Product
```

---

# 72. No Direct External Query On Production

Nunca permitir:

```text
external analytics customer
↓
query production database
```

---

# 73. Separate Analytics Boundary

Recommended:

```text
packages/analytics
```

y eventualmente almacenamiento/reporting separado.

---

# 74. MVP Storage

Puede comenzar con:

```text
PostgreSQL aggregate tables
```

si volumen es bajo.

No hace falta data warehouse desde día uno.

---

# 75. Future Warehouse

Cuando volumen lo justifique:

```text
warehouse / OLAP
```

puede introducirse detrás del pipeline.

---

# 76. Eligibility Filter

Solo incluir registros de usuarios que cumplan las reglas aplicables.

Para external aggregated statistics:

```text
externalAnalyticsConsent = true
```

---

# 77. Test Accounts

Excluir:

```text
staff

demo

automated tests

seed data
```

del producto estadístico.

---

# 78. Fraudulent Accounts

Excluir cuando exista señal suficientemente confiable.

---

# 79. Incomplete Data

Cada métrica debe definir mínimos.

Ejemplo:

```text
Savings Rate
requires sufficient income and expense coverage
```

---

# 80. Coverage Quality

Crear:

```text
data_coverage_score
```

opcional.

Ejemplo:

```text
LOW

MEDIUM

HIGH
```

---

# 81. Why Coverage Matters

Un usuario que registró solo 2 compras no representa su gasto mensual real.

---

# 82. Minimum Observation Period

Algunas estadísticas pueden requerir:

```text
30 days

60 days

90 days
```

de uso.

---

# 83. Cohorts

Ejemplos:

```text
age band

region

income range

employment

household size
```

---

# 84. Cohort Combination Risk

Cada dimensión adicional reduce tamaño del grupo y aumenta riesgo de identificación.

Ejemplo:

```text
Age
+
tiny city
+
rare occupation
+
very high income
+
specific debt pattern
```

puede volverse riesgoso.

---

# 85. Minimum Cohort Size

Definir:

```text
MIN_EXTERNAL_COHORT_SIZE
```

No publicar grupos debajo del threshold.

---

# 86. Example Initial Threshold

Un valor como:

```text
100 users
```

puede usarse como configuración conservadora inicial para diseño, pero no debe tratarse como garantía matemática de anonimización.

El threshold final requiere análisis de riesgo.

---

# 87. Suppression

Si cohorte:

```text
N < threshold
```

resultado:

```text
SUPPRESSED
```

---

# 88. No Exact Small Counts

No publicar:

```text
N = 3
```

para segmentos sensibles.

---

# 89. Count Bucketing

Para ciertos reportes puede publicarse:

```text
100–249 users
```

en lugar de conteo exacto.

---

# 90. Rare Category Suppression

Categorías con baja frecuencia deben combinarse como:

```text
OTHER
```

o excluirse.

---

# 91. Merchant-Level Analytics

Merchant específico aumenta riesgo.

Recommended V1 external product:

```text
category-level
```

no merchant-level.

---

# 92. Merchant Statistics Future

Solo considerar para merchants muy grandes/cohortes suficientemente amplias y tras privacy review específica.

---

# 93. Transaction-Level Exports

Prohibidos para producto externo inicial.

---

# 94. Exact Timestamp

No exportar timestamps individuales.

---

# 95. Time Aggregation

Preferir:

```text
month

quarter

week
```

según caso.

---

# 96. Exact Amounts

No exportar importes de individuos.

Agregar:

```text
median

percentiles

average when appropriate

distribution buckets
```

---

# 97. Median

Preferir frecuentemente:

```text
median
```

porque reduce impacto de outliers y comunica mejor muchas distribuciones financieras.

---

# 98. Percentiles

Ejemplo:

```text
P25

P50

P75
```

sin exponer individuos.

---

# 99. Outlier Handling

Valores extremos pueden facilitar identificación.

Aplicar:

```text
winsorization

clipping

suppression
```

cuando corresponda.

---

# 100. Threshold Configuration

Conceptualmente:

```text
MIN_COHORT_SIZE

MIN_CATEGORY_COUNT

MAX_DIMENSIONS_PER_EXPORT

MIN_OBSERVATION_DAYS
```

---

# 101. K-Anonymity

Puede utilizarse como uno de los controles de diseño:

```text
each released combination
should correspond to multiple individuals
```

pero no considerarlo una garantía suficiente por sí sola.

---

# 102. Differential Privacy

Evaluar para productos externos de mayor escala.

Especialmente útil para:

```text
repeated statistical queries

public dashboards

large statistical exports
```

---

# 103. Privacy Budget

Si se implementa differential privacy:

definir:

```text
privacy budget
```

y gobernar consultas.

No implementar de forma improvisada.

---

# 104. Repeated Query Risk

Aunque cada consulta individual parezca segura:

```text
query A
-
query B
```

puede revelar grupos pequeños.

Por eso un portal externo de consultas arbitrarias requiere controles mucho más fuertes.

---

# 105. No Arbitrary Query API In MVP

No ofrecer inicialmente:

```text
SELECT any cohort
```

a compradores.

---

# 106. Approved Data Products

Crear datasets/reportes predefinidos.

Ejemplos:

```text
Monthly Consumer Spending Index

Household Cost Benchmark

Savings Behavior Report

Debt Burden Index

Subscription Spending Report
```

---

# 107. Data Product Registry

Entidad conceptual:

```text
statistical_data_products
```

Campos:

```text
id

code

name

version

description

status

privacy_policy_version

created_at
```

---

# 108. Product Versioning

Ejemplo:

```text
consumer-spending-index:v1
```

---

# 109. External Dataset Generation

Cada release debe tener:

```text
release ID

period

data product version

privacy rules version

generation timestamp
```

---

# 110. Dataset Release

Entidad:

```text
statistical_dataset_releases
```

Campos conceptuales:

```text
id

data_product_id

period_start

period_end

status

record_count

privacy_review_status

generated_at

published_at
```

---

# 111. No Automatic External Publication Initially

Recommended:

```text
generate
↓
automated checks
↓
manual privacy review
↓
publish
```

---

# 112. Privacy Review

Antes de release:

```text
cohort size

rare combinations

outliers

sensitive categories

unexpected dimensionality
```

---

# 113. Release Status

```text
DRAFT

VALIDATING

READY_FOR_REVIEW

APPROVED

PUBLISHED

REVOKED
```

---

# 114. Buyer Does Not Receive User Identifiers

Nunca:

```text
user_id

hashed_user_id

email

phone

account_id
```

en producto externo V1.

---

# 115. No Persistent Individual Key

Especialmente importante:

no entregar un identificador que permita seguir al mismo individuo mes a mes.

---

# 116. Longitudinal Statistics

Si se necesitan:

publicar cambios a nivel cohorte.

Ejemplo:

```text
25–34 renters:
food spending index +4.2%
```

No:

```text
anonymous_person_837 monthly history
```

---

# 117. External Data Contracts

Si existe cliente externo:

el contrato debe prohibir:

```text
re-identification attempts

combining data for identification

resale outside agreed scope
```

además de requerir controles adecuados.

El texto legal debe ser revisado profesionalmente.

---

# 118. Customer Due Diligence

No vender datasets a cualquier solicitante automáticamente.

Tener proceso de:

```text
customer identity

intended use

security posture

contract acceptance
```

---

# 119. Prohibited External Uses

Internal policy should prohibit use for:

```text
individual credit decisions

insurance decisions about a person

employment decisions

individual targeting based on financial vulnerability

re-identification
```

---

# 120. No Individual Financial Scoring Product

No convertir estadísticas agregadas en:

```text
credit score for User X
```

para terceros sin construir un producto/regulatory framework completamente distinto.

---

# 121. High-Risk Use Review

Cualquier uso en:

```text
credit

insurance

employment

housing

health
```

requiere revisión específica antes de permitirlo.

---

# 122. Data Buyers

Potential low-risk categories may include:

```text
academic research

economic research

market research

retail category intelligence

aggregate fintech benchmarks
```

pero cada uso debe revisarse.

---

# 123. Data Monetization Model

Recommended:

vender:

```text
reports

indexes

benchmarks

aggregated dashboards

aggregate API endpoints
```

No:

```text
user records
```

---

# 124. Example Product — Cost Of Living

```text
Region:
X

Household:
1 person

Income band:
middle

Median monthly spending:
Housing X
Food Y
Transport Z
Services W
```

solo si cohorte supera controles.

---

# 125. Example Product — Savings Index

```text
Median savings rate

P25 savings rate

P75 savings rate

by:
age range
income range
region
```

---

# 126. Example Product — Debt Pressure

```text
Percentage with active debt

Median debt service ratio

Percentage with >30% debt burden
```

por cohortes suficientemente grandes.

---

# 127. Example Product — Subscription Economy

```text
Median recurring subscription spend

Average number of recurring subscriptions

Monthly category growth
```

---

# 128. Product Benchmark For Users

La misma infraestructura también puede devolver valor al usuario.

Ejemplo:

```text
Tu gasto en supermercado está alrededor de la mediana
de usuarios con un perfil similar.
```

---

# 129. Internal Benchmark Privacy

Incluso benchmarks dentro del producto deben usar cohort thresholds.

---

# 130. No Peer Surveillance

No mostrar:

```text
users near you spent...
```

con cohortes pequeñas.

---

# 131. Benchmark Eligibility

Puede requerir que usuario haya optado al analytics correspondiente, según política.

Decidir explícitamente.

---

# 132. Give Value Back

Buena estrategia:

los usuarios que contribuyen pueden recibir:

```text
community benchmarks

aggregate trends

financial comparisons
```

sin que eso implique vender acceso individual.

---

# 133. Analytics Consent UI

Settings:

```text
Privacy & Data
```

Sección:

```text
Anonymous / Aggregated Statistics
```

---

# 134. Example UI

```text
Contribuir a estadísticas agregadas

Ayudanos a generar benchmarks sobre hábitos financieros.
Tu participación es opcional.

[ ] Participar
```

---

# 135. Explanation Link

Mostrar:

```text
¿Qué información se utiliza?
¿Cómo se protege?
¿Para qué puede utilizarse?
¿Cómo dejo de participar?
```

---

# 136. No Dark Patterns

No usar:

```text
bright giant accept button

hidden decline

guilt wording
```

---

# 137. Consent Receipts

Usuario puede consultar:

```text
granted date

current status

policy version
```

---

# 138. Consent Withdrawal UX

Botón claro:

```text
Dejar de participar
```

---

# 139. Statistical Profile UI

```text
Perfil estadístico
Optional
```

Campos pueden tener:

```text
Prefer not to say
```

cuando corresponda.

---

# 140. Profile Deletion

Usuario puede limpiar campos opcionales.

---

# 141. Profile Changes

Nueva información se aplica a futuros cálculos según pipeline.

No reescribir necesariamente releases históricos ya anonimizados.

---

# 142. Product Account Deletion

Account deletion process must interact with analytics pipeline.

---

# 143. Deletion Before Anonymization

Personal/pseudonymous staging data debe eliminarse conforme política aplicable.

---

# 144. Truly Anonymous Historical Aggregates

Una vez desvinculados de individuos de forma efectiva, no deberían depender de una fila individual para existir.

Este supuesto requiere que la anonimización sea real y documentada.

---

# 145. Retention

Definir políticas diferentes:

```text
raw product data

analytics staging

aggregate releases

audit logs
```

---

# 146. Analytics Staging Retention

Recommended:

mantener lo mínimo necesario.

No crear un segundo archivo eterno de movimientos financieros.

---

# 147. Derived Feature Retention

Si una métrica individual intermedia ya no es necesaria:

agregar y eliminar staging según política.

---

# 148. Data Minimization

Cada nueva variable debe responder:

```text
Why do we collect this?

Which metric uses it?

How long is it retained?

Does it materially increase re-identification risk?
```

---

# 149. No “Maybe Useful Someday”

No recolectar atributos simplemente porque podrían tener valor comercial futuro.

---

# 150. Access Control

Analytics staging debe tener permisos más restrictivos que queries normales de producto.

---

# 151. Service Account Separation

Future:

```text
analytics service role
```

con acceso limitado a vistas/datasets necesarios.

---

# 152. No Analyst Production DB Access

Analistas internos no deberían necesitar acceso arbitrario a tablas raw de transacciones.

---

# 153. Privacy Views

Crear:

```text
analytics source views
```

que expongan solo campos necesarios.

---

# 154. Security Logging

Registrar:

```text
dataset generation

dataset export

external publication

admin privacy review
```

---

# 155. Export Audit

Todo dataset externo debe tener audit trail.

---

# 156. Commercial Admin Integration

Agregar en Admin:

```text
Analytics / Data Products
```

solo para roles autorizados.

---

# 157. Admin Analytics Dashboard

Mostrar:

```text
consented users

profile completion

eligible statistical population

suppressed cohorts

dataset releases
```

---

# 158. No User-Level Explorer For Commercial Team

Equipo comercial no debería poder filtrar hasta:

```text
specific individual
```

desde el analytics dashboard.

---

# 159. Internal Analyst Access

Si se requiere user-level analysis para mejorar producto:

tratarlo como analytics interno con controles diferentes.

No confundirlo con dataset externalizable.

---

# 160. Data Purpose Registry

Crear configuración/documentación:

```text
data_purposes
```

o registry en código.

Ejemplos:

```text
CORE_FINANCE

PRODUCT_ANALYTICS

EXTERNAL_AGGREGATED_STATISTICS

SECURITY

BILLING
```

---

# 161. Purpose Limitation

Una variable recopilada para:

```text
security
```

no debe reutilizarse automáticamente para monetización estadística.

---

# 162. Marketing Data

Mantener separado de:

```text
financial analytics
```

---

# 163. AI Data

Prompts y outputs de AI:

```text
not included in external statistical datasets by default
```

---

# 164. Why Exclude AI Conversation Data

Puede contener información libre altamente sensible e impredecible.

---

# 165. Notes / Free Text

Excluir:

```text
transaction notes

debt notes

assistant messages

support notes
```

de external analytics.

---

# 166. Structured Categories Only

External pipeline should operate primarily on normalized structured attributes.

---

# 167. Merchant Names

Exclude initially.

Use:

```text
category
```

or sanitized high-level merchant category.

---

# 168. Category Taxonomy

Analytics requires stable category taxonomy.

Version it.

Example:

```text
category-taxonomy:v1
```

---

# 169. User Custom Categories

Map to broad normalized analytics categories.

Never expose custom category text externally.

---

# 170. Merchant Normalization

Can help internal aggregation.

But normalized merchant remains potentially identifying/sensitive and should not automatically become external.

---

# 171. Statistical Category Example

```text
FOOD_GROCERIES

FOOD_RESTAURANTS

TRANSPORT

HOUSING

HEALTH_GENERAL

ENTERTAINMENT

UTILITIES
```

Sensitive categories may require suppression/exclusion.

---

# 172. Transaction Direction

External metrics may use:

```text
income

expense
```

but not transaction IDs.

---

# 173. Transfers

Transfers must not be counted as:

```text
spending

income
```

consistent with Finance Engine.

---

# 174. Refunds

Analytics spending metrics should respect:

```text
net spending
```

as defined by finance domain.

---

# 175. Adjustments

`ADJUSTMENT_IN` and `ADJUSTMENT_OUT` need explicit analytics rules.

Do not silently categorize them as income/expense.

---

# 176. Debt Payments

Avoid double-counting:

```text
credit purchase expense
+
card repayment expense
```

Follow finance semantics.

---

# 177. Finance Engine Remains Authority

Analytics consumes:

```text
trusted normalized financial metrics
```

not reimplemented ad-hoc transaction semantics.

---

# 178. Analytics Query Services

Create trusted services:

```text
FinancialAnalyticsQueryService
```

for metrics such as:

```text
monthly category spend

net income

debt burden

savings rate
```

---

# 179. Versioned Aggregate Jobs

Example:

```text
GenerateMonthlyFinancialAggregate:v1
```

---

# 180. User-Level Aggregate Staging

If necessary, staging might contain:

```text
analytics_user_monthly_metrics
```

Fields:

```text
analytics_subject_id

month

spend_category_ratios

income_band

savings_rate_bucket

debt_ratio_bucket
```

This is still not automatically anonymous.

---

# 181. Analytics Subject ID

If used internally:

```text
random analytics-specific identifier
```

separate from normal user ID.

Mapping must be protected.

---

# 182. Analytics Subject ID Is Pseudonymous

Never label it anonymous merely because it is random.

---

# 183. Early Aggregation

Prefer:

```text
user metrics
↓
cohort aggregate
↓
delete unnecessary user-level staging
```

over long-term granular analytics retention.

---

# 184. External Aggregate Table

Example:

```text
analytics_cohort_metrics
```

Fields:

```text
period

region_bucket

age_bucket

income_bucket

employment_bucket

metric_code

cohort_size_bucket

median_value

p25_value

p75_value

privacy_version
```

---

# 185. No Raw User Dimension

No `user_id`.

---

# 186. Data Quality

Statistics need:

```text
sample size

coverage

confidence / caveat
```

---

# 187. Sample Bias

Users of a personal-finance SaaS are not necessarily representative of the general population.

External data products must disclose this.

---

# 188. No “National Average” Without Basis

Do not label:

```text
average Argentine household
```

if sample is actually:

```text
users of our application
```

Use wording such as:

```text
among eligible platform users
```

unless appropriate statistical methodology supports broader inference.

---

# 189. Self-Selection Bias

Opt-in analytics can amplify selection bias.

Document it.

---

# 190. Missing Data

Do not silently treat:

```text
unknown income
```

as low income.

Use:

```text
UNKNOWN
```

and exclude/segment appropriately.

---

# 191. Median Sample Requirements

Metrics may require higher sample sizes depending on dimensionality and sensitivity.

---

# 192. Statistical Review

Important external reports should be reviewed for:

```text
methodology

privacy

data quality

interpretation
```

---

# 193. External Documentation

Every data product should include:

```text
methodology

population

period

definitions

limitations

privacy approach
```

---

# 194. Customer Claims

Do not let buyers claim precision not supported by dataset.

---

# 195. Data Product Pricing

Commercial pricing is separate from:

```text
PRO subscription pricing
```

Potential models:

```text
report license

dashboard subscription

aggregate API plan

custom research
```

---

# 196. No Revenue Assumption In Core Product Economics

Data monetization should not be required to make the consumer SaaS viable.

Recommended:

```text
Pro subscription economics
must stand on their own
```

---

# 197. Why

If business requires selling user data to survive:

privacy incentives become misaligned.

---

# 198. Data Monetization Revenue

Track separately:

```text
DATA_PRODUCT_REVENUE
```

from:

```text
SUBSCRIPTION_REVENUE
```

---

# 199. Data Product Costs

Include:

```text
privacy engineering

analytics infrastructure

legal review

data quality

sales

customer support
```

---

# 200. Commercial Approval

New external dataset requires:

```text
Product approval

Privacy review

Security review

Business approval
```

before release.

---

# 201. High-Risk Dataset Approval

May require:

```text
legal review
```

before external release.

---

# 202. Data Product Kill Switch

Ability to:

```text
stop publication/download/API
```

without affecting core finance.

---

# 203. Incident Response

If privacy concern discovered:

```text
disable release

identify recipients

investigate

follow incident procedure
```

---

# 204. Dataset Revocation

Mark:

```text
REVOKED
```

and prevent further downloads where technically possible.

---

# 205. Customer Contract Traceability

Know:

```text
which customer
received which release
```

---

# 206. Data Delivery

Use controlled delivery.

Avoid:

```text
public S3 bucket
```

for commercial datasets.

---

# 207. Download Logging

Record:

```text
customer

dataset release

download time
```

---

# 208. External API

Future aggregate API should expose only predefined endpoints.

Example:

```text
GET aggregate spending index
```

not arbitrary SQL-like filters.

---

# 209. Rate Limits

External statistical API needs:

```text
rate limits
```

also to reduce privacy attacks using repeated queries.

---

# 210. Query Dimension Limits

Future API can restrict:

```text
maximum dimensions

minimum cohort size

allowed filters
```

---

# 211. User Transparency

Privacy page should explain in simple language:

```text
what we collect

why

what is optional

what may contribute to aggregate statistics

what is never shared individually
```

---

# 212. No “We Never Share Data” If Commercial Aggregates Exist

Marketing/privacy copy must be accurate.

If statistical products exist, explain them honestly.

---

# 213. No “Sell Your Data” Internal Mental Model

Recommended internal framing:

```text
sell statistical products
```

not:

```text
sell user data
```

Architecture should enforce that distinction.

---

# 214. Privacy Promise

Recommended product principle:

```text
We do not sell individual financial records.
```

Only make this promise if operational architecture guarantees it.

---

# 215. User Benefit

Potential user-facing value:

```text
financial benchmarks

cost-of-living comparisons

anonymous peer trends
```

---

# 216. Statistical Profile Completion

Can progressively ask:

```text
Age range

Employment

Income range

Household size

Region
```

---

# 217. Do Not Ask All At Signup

Signup friction harms activation and is unnecessary.

---

# 218. Recommended Timing

Possible:

```text
after first 5–10 transactions
```

or:

```text
after first meaningful dashboard
```

ask whether user wants benchmarks.

---

# 219. Value Exchange

Explain:

```text
Complete your optional profile
to improve comparisons with similar households.
```

Even without external monetization, this creates direct user value.

---

# 220. Profile Completion Metric

Track:

```text
statistical_profile_completion_rate
```

---

# 221. Consent Metrics

Track:

```text
analytics_opt_in_rate

analytics_opt_out_rate

withdrawal_rate
```

---

# 222. Privacy Metrics

Track:

```text
eligible_user_count

suppressed_cohort_count

dataset_release_count

privacy_review_failures
```

---

# 223. Data Product Metrics

```text
active data customers

dataset downloads

data product revenue

renewal

customer use cases
```

---

# 224. Never Optimize Consent Through Pressure

Do not treat low opt-in as a growth problem to be solved with dark patterns.

---

# 225. Admin Permissions

Potential permissions:

```text
analytics.aggregate.read

analytics.datasets.generate

analytics.datasets.review

analytics.datasets.publish

analytics.consent.support_read
```

---

# 226. No Commercial User-Level Permission

Avoid permission:

```text
analytics.users.export_all
```

unless a legitimate internal purpose exists.

---

# 227. Audit Actions

```text
DATASET_GENERATED

DATASET_APPROVED

DATASET_PUBLISHED

DATASET_REVOKED

DATASET_DOWNLOADED

ANALYTICS_POLICY_CHANGED
```

---

# 228. Security

Analytics pipeline must follow:

```text
least privilege

encryption

secret management

audit logging

backup policy
```

---

# 229. Backup

Raw analytics staging should not expand backup exposure unnecessarily.

---

# 230. Deletion

Retention/delete procedures must include analytics stores, not just primary PostgreSQL.

---

# 231. Environments

Never include production financial data in:

```text
development

local testing

demo
```

---

# 232. Synthetic Data

Use:

```text
synthetic financial datasets
```

for development of analytics features.

---

# 233. No Production Clone For Analysts

Avoid cloning entire financial DB into analytics sandbox.

---

# 234. Test Fixtures

Generate synthetic:

```text
users

transactions

debts

statistical profiles
```

with realistic distributions.

---

# 235. Tests — Consent

User without external consent:

```text
excluded from new external analytics staging
```

---

# 236. Tests — Withdrawal

After withdrawal:

```text
future pipeline excludes user
```

---

# 237. Tests — Profile Optional

User can leave every optional statistical field empty.

Core product works normally.

---

# 238. Tests — Cohort Threshold

```text
cohort size < configured minimum
```

Expected:

```text
SUPPRESSED
```

---

# 239. Tests — Rare Category

Rare dimension/category is suppressed/generalized.

---

# 240. Tests — User IDs

External dataset contains no:

```text
userId

accountId

transactionId

hashed user identifier
```

---

# 241. Tests — Exact Transaction

No external row corresponds directly to a single transaction.

---

# 242. Tests — Merchant

Merchant names excluded in V1 external datasets.

---

# 243. Tests — Free Text

Notes/prompts/custom text excluded.

---

# 244. Tests — Currency

No invalid cross-currency aggregates.

---

# 245. Tests — Transfers

Transfers not counted as spending/income.

---

# 246. Tests — Refunds

Net spending semantics respected.

---

# 247. Tests — Credit Card Payments

No spending double-count.

---

# 248. Tests — Dataset Release

Cannot publish until:

```text
privacy validation passed
+
required approval
```

---

# 249. Tests — Revoked Dataset

Cannot be newly downloaded through controlled product.

---

# 250. Tests — Permission

Commercial operator cannot access user-level finance via analytics permissions.

---

# 251. MVP Scope

Implement:

```text
optional statistical profile

consent management

consent history

five initial profile variables

trusted derived metrics

basic analytics staging

cohort aggregation

minimum cohort suppression

dataset versioning

privacy review state

admin aggregate view

audit
```

---

# 252. MVP External Commercialization

Recommendation:

```text
DO NOT automatically enable external sales at launch
```

Build the data governance/pipeline first.

Collect consent transparently.

Validate sample size and statistical quality.

Only then create a commercial product.

---

# 253. V1.1

Add:

```text
user-facing benchmarks

additional profile variables

data quality scoring

aggregate dashboards

privacy risk tooling
```

---

# 254. Future

Potential:

```text
differential privacy

aggregate customer API

warehouse

advanced cohort analytics

academic research portal

data clean room
```

---

# 255. Explicitly Not Planned

Do not implement:

```text
raw transaction sales

hashed user transaction sales

individual financial profiles for advertisers

individual credit scoring for third parties

merchant-level user histories

location histories

AI conversation sales
```

---

# 256. Recommended Initial Statistical Profile

```text
Age Range
Employment Status
Monthly Income Range
Household Size
Region
```

All:

```text
optional
```

---

# 257. Recommended Initial External Metrics

Start with low-dimensional statistics:

```text
spending by broad category

savings rate

debt burden

housing cost ratio

recurring subscription spend
```

---

# 258. Recommended First Data Product

A sensible first experiment:

```text
Personal Finance Cost & Spending Index
```

Monthly report containing:

```text
broad expense categories

median spend ratios

savings rates

debt burden

regional trends
```

with large cohorts only.

---

# 259. Why Start With A Report

A static/versioned report is safer than an arbitrary analytics API because:

```text
queries are known

privacy can be reviewed

methodology is fixed

release can be audited
```

---

# 260. Legal Review Gate

Before external commercialization:

```text
privacy/legal review
```

is mandatory as a business launch condition.

This document defines engineering/product controls, not a determination that a particular commercialization model is lawful in every jurisdiction.

---

# 261. Core Invariants

Never break:

```text
Raw Personal Finance Data
≠
External Data Product
```

```text
Pseudonymized
≠
Anonymous
```

```text
Hashed User ID
≠
Anonymous User
```

```text
Consent
≠
Terms Acceptance
```

```text
Statistical Profile
≠
Core Product Requirement
```

```text
Derived Financial Metric
≠
Non-Personal Data
```

---

# 262. Additional Invariants

```text
External statistical participation is voluntary.

Core finance works without statistical profile completion.

Individual financial records are never sold in V1.

External datasets contain no persistent individual identifier.

External datasets use aggregation and privacy thresholds.

Small cohorts are suppressed.

Rare combinations are generalized or removed.

Free text is excluded.

AI conversations are excluded.

Sensitive inferred characteristics are not created for monetization.

Financial metrics reuse trusted finance semantics.

Every external dataset is versioned and auditable.

Commercial datasets are not generated directly from arbitrary production queries.

Consent withdrawal affects future eligible processing according to policy.

Privacy controls are server-side and pipeline-enforced.
```

---

# 263. Final Architecture

```text
                  PERSONAL FINANCE PRODUCT
                           │
                           │
                    PostgreSQL Truth
                           │
                           ↓
                  Consent / Eligibility
                           │
                           ↓
                  Analytics Source Views
                           │
                           ↓
                  Metric Derivation
                           │
                           ↓
               Generalization / Bucketing
                           │
                           ↓
                     Aggregation
                           │
                           ↓
                 Privacy Thresholds
                           │
                           ↓
               Disclosure Risk Review
                           │
                           ↓
                Statistical Data Product
                           │
             ┌─────────────┴─────────────┐
             │                           │
      User Benchmarks              External Product
```

---

# 264. Final Data Flow Rule

```text
USER FINANCIAL DATA
↓
AUTHORIZED PURPOSE
↓
MINIMIZED INPUT
↓
DERIVED METRICS
↓
AGGREGATION
↓
PRIVACY CONTROLS
↓
APPROVED STATISTICS
```

Nunca:

```text
USER FINANCIAL DATA
↓
REMOVE EMAIL
↓
SELL
```

---

# 265. Final Product Rule

La oportunidad comercial está en producir conocimiento estadístico útil, no en comercializar historiales financieros individuales.

El producto debe poder afirmar, y demostrar técnicamente:

```text
We sell statistical insights,
not individual financial histories.
```

La arquitectura debe mantener esa promesa incluso si en el futuro aumenta significativamente el valor económico de los datos.
