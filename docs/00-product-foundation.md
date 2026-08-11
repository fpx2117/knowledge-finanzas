# Product Foundation

## 1. Nombre conceptual

Nombre temporal del producto:

```text
Personal Finance
```

El nombre comercial podrá definirse más adelante.

Este documento describe el producto independientemente de su marca.

---

# 2. Visión

Construir una plataforma de finanzas personales que permita a una persona comprender y gestionar, desde un único lugar:

```text
qué dinero tiene

qué dinero debe

qué gastos realizó

qué ingresos recibió

qué obligaciones tiene pendientes

qué pagos vencen próximamente

qué parte de su dinero ya está comprometida

cuánto puede gastar realmente

cuánto puede ahorrar

cómo está evolucionando su situación financiera
```

La aplicación no debe limitarse a registrar gastos pasados.

Debe funcionar como un:

```text
Personal Financial Control System
```

centrado en:

```text
money
+
obligations
+
time
+
planning
```

---

# 3. Problema

Las finanzas personales suelen encontrarse fragmentadas entre:

```text
cuentas bancarias

efectivo

billeteras digitales

tarjetas de crédito

préstamos

compras en cuotas

servicios

suscripciones

notas

calendarios

planillas

aplicaciones bancarias
```

Esto genera una visión incompleta de la situación financiera.

Una persona puede observar:

```text
Saldo actual:
$1.000.000
```

pero tener:

```text
Alquiler
$300.000

Tarjeta
$220.000

Préstamo
$100.000

Servicios
$80.000

Cuotas
$150.000
```

Por lo tanto:

```text
tener $1.000.000
```

no significa necesariamente:

```text
poder gastar $1.000.000
```

La plataforma debe hacer visible esa diferencia.

---

# 4. Propuesta de valor

El producto reúne en un único sistema:

```text
cuentas

saldos

ingresos

gastos

transferencias

categorías

subcategorías

etiquetas

presupuestos

deudas

cuotas

tarjetas de crédito

préstamos

vencimientos

pagos parciales

pagos anticipados

obligaciones recurrentes

ingresos previstos

gastos programados

metas de ahorro

fondos reservados

proyección de flujo de caja

patrimonio neto

reportes

alertas

insights
```

La propuesta central es:

> Saber cuánto dinero tenés, cuánto debés, qué vence, qué parte de tu dinero está comprometida y cuánto realmente podés utilizar.

---

# 5. North Star

El producto debe responder cinco preguntas fundamentales:

```text
¿Qué tengo?

¿Qué debo?

¿Qué vence?

¿Qué puedo gastar?

¿Hacia dónde voy?
```

Toda feature importante debería contribuir a responder al menos una de estas preguntas.

---

# 6. Usuario objetivo

Inicialmente, el producto está pensado para:

```text
personas que administran sus propias finanzas

empleados

profesionales

trabajadores independientes

estudiantes

personas con varias cuentas

personas con tarjetas de crédito

personas pagando préstamos

personas con compras en cuotas

personas que desean ahorrar

personas que quieren anticipar problemas de liquidez
```

No se requiere conocimiento contable.

La interfaz debe utilizar lenguaje financiero comprensible.

---

# 7. No es contabilidad empresarial

El producto está diseñado inicialmente para:

```text
personal finances
```

No para:

```text
contabilidad empresarial

facturación comercial

gestión de proveedores

impuestos empresariales

nómina

inventario

contabilidad corporativa
```

Algunos conceptos financieros pueden coincidir, pero la experiencia está orientada a individuos.

---

# 8. Principios de producto

## 8.1 Claridad

Los números deben tener significado evidente.

Nunca mostrar métricas sin poder explicar su origen.

---

## 8.2 Control del usuario

El usuario mantiene control sobre:

```text
cuentas

fechas

montos

categorías

cuotas

vencimientos

recordatorios

presupuestos

metas

reglas recurrentes
```

Las automatizaciones ayudan.

No reemplazan el control del usuario.

---

## 8.3 Matemática determinística

Los cálculos financieros críticos deben ser determinísticos.

La IA nunca será la fuente de verdad para:

```text
saldos

deuda pendiente

cuotas pagadas

patrimonio neto

presupuesto restante

flujo de caja

intereses calculados

obligaciones pendientes
```

---

## 8.4 El futuro importa

La plataforma debe combinar:

```text
pasado
+
presente
+
futuro
```

No basta con explicar:

```text
en qué gastaste
```

También debe anticipar:

```text
qué tendrás que pagar
```

---

## 8.5 Explicabilidad

Todo número financiero importante debería poder desglosarse.

Ejemplo:

```text
Deuda pendiente
$680.000
```

debería poder abrir:

```text
Visa
$250.000

Préstamo
$300.000

Notebook
$130.000
```

---

## 8.6 Corrección antes que automatización

Una automatización incorrecta puede destruir confianza.

Prioridad:

```text
correctness
>
convenience
```

---

# 9. Core Financial Loop

El loop principal del producto será:

```text
Registrar
   ↓
Clasificar
   ↓
Entender
   ↓
Planificar
   ↓
Cumplir obligaciones
   ↓
Ahorrar
   ↓
Revisar
   ↓
Ajustar
```

Desde la perspectiva de datos:

```text
Transactions
      ↓
Balances
      ↓
Obligations
      ↓
Budgets
      ↓
Cashflow Projection
      ↓
Goals
      ↓
Insights
```

---

# 10. Modelo financiero conceptual

La plataforma debe distinguir claramente:

```text
Assets

Liabilities

Income

Expenses

Transfers

Obligations

Scheduled Transactions

Payments

Refunds

Adjustments

Projections
```

---

# 11. Posted Transaction vs Scheduled vs Obligation

Esta separación es fundamental.

```text
Posted Transaction
≠
Scheduled Transaction
≠
Financial Obligation
≠
Projection
```

Ejemplo:

```text
Compra ya pagada
→ Posted Transaction

Sueldo esperado el día 31
→ Scheduled Transaction

Cuota que vence el próximo mes
→ Financial Obligation

Saldo estimado dentro de 20 días
→ Projection
```

No deben mezclarse como si fueran el mismo concepto.

---

# 12. Assets

Representan valor financiero positivo controlado por el usuario.

Ejemplos iniciales:

```text
efectivo

cuenta bancaria

billetera digital

cuenta de ahorro
```

Post-MVP:

```text
inversiones

activos financieros
```

---

# 13. Liabilities

Representan obligaciones financieras pendientes.

Ejemplos:

```text
tarjeta de crédito

préstamo

compra en cuotas

dinero adeudado a una persona

servicio pendiente

otras deudas
```

---

# 14. Income

Representa entradas de dinero.

Ejemplos:

```text
sueldo

honorarios

ventas

pensión

alquiler recibido

intereses

otros ingresos
```

---

# 15. Expenses

Representan consumo o salida económica.

Ejemplos:

```text
alimentos

alquiler

transporte

salud

educación

entretenimiento

servicios

suscripciones
```

---

# 16. Transfers

Mover dinero entre cuentas propias no es un ingreso ni un gasto.

Ejemplo:

```text
Banco
-$100.000

Billetera
+$100.000
```

El patrimonio total no cambia.

---

# 17. Refunds

Un reembolso o devolución no debe tratarse necesariamente como ingreso ordinario.

Ejemplo:

```text
Compra
-$50.000

Devolución
+$50.000
```

El reporte debería poder identificarlo como:

```text
refund
```

para no inflar ingresos reales.

---

# 18. Adjustments

La aplicación debe permitir correcciones financieras.

Ejemplos:

```text
saldo inicial incorrecto

transacción duplicada

monto mal ingresado

movimiento anulado
```

La corrección debe conservar trazabilidad.

No debemos modificar silenciosamente historia financiera importante sin dejar evidencia.

---

# 19. Accounts

Las cuentas representan lugares donde existe dinero o crédito.

Tipos iniciales:

```text
CASH

BANK

DIGITAL_WALLET

SAVINGS

CREDIT_CARD
```

Post-MVP:

```text
INVESTMENT
```

---

# 20. Account Balance

El balance de una cuenta debe derivarse de:

```text
initial balance
+
posted transactions
+
transfers
+
adjustments
```

No debe convertirse en un número arbitrario que cambia independientemente de sus movimientos.

---

# 21. Saldo inicial

El usuario puede comenzar utilizando la aplicación sin importar toda su historia.

Por eso una cuenta puede tener:

```text
openingBalance
```

con:

```text
openingDate
```

A partir de allí, el sistema calcula el resto.

---

# 22. Dinero disponible

Debemos distinguir:

```text
Account Balance
```

de:

```text
Spendable Money
```

Ejemplo:

```text
Saldo total
$1.000.000

Fondos reservados
-$200.000

Obligaciones próximas
-$450.000

Disponible estimado
$350.000
```

---

# 23. Fondos reservados

El usuario puede reservar dinero sin moverlo físicamente de cuenta.

Ejemplos:

```text
impuestos

vacaciones

seguro anual

emergencias

matrícula
```

Conceptualmente:

```text
Reserved Funds
```

No necesariamente serán una entidad V1, pero el modelo debe poder incorporarlos.

---

# 24. Patrimonio neto

Una métrica importante del producto será:

```text
Net Worth
=
Assets
-
Liabilities
```

Ejemplo:

```text
Activos
$5.000.000

Deudas
-$1.800.000

Patrimonio neto
$3.200.000
```

Debe poder mostrarse su evolución en el tiempo.

---

# 25. Transaction

`Transaction` será una de las entidades centrales.

Representará movimientos financieros ya ocurridos.

Tipos principales:

```text
INCOME

EXPENSE

TRANSFER

REFUND

ADJUSTMENT
```

---

# 26. Fechas de una transacción

Una operación puede necesitar distinguir:

```text
occurredAt

postedAt
```

Ejemplo:

Compra realizada:

```text
10/08
```

pero registrada/impactada:

```text
12/08
```

V1 puede simplificar inicialmente, pero el dominio no debe impedirlo.

---

# 27. Transaction splitting

Una transacción puede corresponder a varias categorías.

Ejemplo:

```text
Compra supermercado
$100.000
```

dividida en:

```text
Alimentos
$65.000

Limpieza
$20.000

Farmacia
$15.000
```

Esto se denomina:

```text
Split Transaction
```

No es obligatorio en el primer vertical slice, pero debe estar contemplado.

---

# 28. Categories

Las transacciones pueden clasificarse.

Ejemplos:

```text
Housing

Food

Transport

Health

Education

Entertainment

Services

Subscriptions

Debt Payments

Savings

Income
```

---

# 29. Subcategories

Debe ser posible una jerarquía simple.

Ejemplo:

```text
Food
├── Supermarket
├── Restaurants
└── Delivery
```

---

# 30. Tags

Además de categorías estructuradas, el usuario podrá utilizar etiquetas libres.

Ejemplos:

```text
vacaciones

mudanza

universidad

trabajo

familia
```

Tags y categorías cumplen funciones diferentes.

---

# 31. Merchant

Una transacción puede tener:

```text
merchant
```

Ejemplos:

```text
Carrefour

Uber

Netflix

Mercado Libre
```

Esto permitirá:

```text
search

reports

AI categorization

subscription detection
```

---

# 32. Deudas

Las deudas son entidades de primera clase.

No deben representarse simplemente como una categoría de gasto.

Una deuda puede incluir:

```text
acreedor

monto original

saldo pendiente

moneda

fecha inicial

cuotas

intereses

pagos

estado

notas
```

---

# 33. Tipos de deuda

Inicialmente:

```text
CREDIT_CARD

PERSONAL_LOAN

PURCHASE_INSTALLMENTS

MONEY_OWED_TO_PERSON

SERVICE_DEBT

OTHER
```

Post-MVP:

```text
MORTGAGE

AUTO_LOAN

VARIABLE_RATE_LOAN
```

---

# 34. Lifecycle de deuda

Estados conceptuales:

```text
ACTIVE

PAID

OVERDUE

CANCELLED
```

Una deuda puede estar activa aunque algunas cuotas individuales estén pagadas.

---

# 35. Installments

Una deuda puede dividirse en:

```text
1..N
```

cuotas.

Cada cuota debe existir como obligación independiente.

Campos conceptuales:

```text
installmentNumber

dueDate

principalAmount

interestAmount

feeAmount

totalAmount

paidAmount

remainingAmount

status
```

---

# 36. Estados de cuota

```text
PENDING

PARTIALLY_PAID

PAID

OVERDUE

CANCELLED
```

---

# 37. Fechas de cuotas

El sistema puede generar fechas automáticamente.

Ejemplo:

```text
Primera cuota:
15/08

Frecuencia:
MONTHLY

Cantidad:
12
```

genera:

```text
15/08
15/09
15/10
...
```

---

# 38. Fechas manuales

El usuario debe poder modificar cualquier fecha.

Ejemplo:

```text
Cuota 1
15/08

Cuota 2
21/09

Cuota 3
10/11
```

El producto no debe asumir que todas las deudas siguen calendarios perfectos.

---

# 39. Pagos parciales

Una cuota puede tener múltiples pagos.

Ejemplo:

```text
Cuota:
$200.000

Pago:
$50.000

Pago:
$100.000

Pendiente:
$50.000
```

No usar únicamente:

```text
paid = true
```

---

# 40. Debt Payment

Los pagos deben registrarse como entidades separadas.

Conceptualmente:

```text
DebtPayment
├── amount
├── paymentDate
├── account
├── installment?
└── transaction
```

---

# 41. Payment Allocation

Un pago puede asignarse a:

```text
una cuota concreta
```

o potencialmente a:

```text
varias cuotas
```

Ejemplo:

```text
Pago:
$300.000

Aplicación:
Cuota 3 → $100.000
Cuota 4 → $100.000
Cuota 5 → $100.000
```

Esto debe poder modelarse correctamente.

---

# 42. Pago anticipado

El usuario puede adelantar cuotas.

Ejemplo:

```text
Cuotas pendientes:
4, 5, 6, 7

Usuario paga:
4, 5 y 6 hoy
```

La proyección futura debe recalcularse inmediatamente.

---

# 43. Pago extraordinario a capital

Post-MVP, préstamos más avanzados pueden permitir:

```text
extra principal payment
```

que reduzca:

```text
capital pendiente
```

y potencialmente cambie:

```text
cuotas futuras
```

según reglas del préstamo.

---

# 44. Deuda pendiente

Debe ser derivada.

Conceptualmente:

```text
Outstanding Debt
=
Total Outstanding Obligations
-
Applied Payments
```

No debe mantenerse como fuente de verdad editable sin relación con cuotas y pagos.

---

# 45. Intereses V1

Casos iniciales:

```text
NO_INTEREST

FIXED_INSTALLMENTS

MANUAL_INSTALLMENTS
```

---

# 46. Intereses futuros

Post-MVP:

```text
SIMPLE_INTEREST

AMORTIZED_LOAN

VARIABLE_RATE
```

El cálculo debe ser determinístico y testeable.

---

# 47. Tarjetas de crédito

Las tarjetas requieren un modelo específico.

Una tarjeta debe contemplar:

```text
credit limit

available credit

statement closing date

payment due date
```

---

# 48. Fecha de cierre

La tarjeta tiene:

```text
statementClosingDay
```

Ejemplo:

```text
cierra el día 25
```

Las compras realizadas antes/después del cierre pueden corresponder a distintos períodos.

---

# 49. Fecha de vencimiento

La tarjeta también tiene:

```text
paymentDueDay
```

Ejemplo:

```text
vence el día 5
```

Cerrar y vencer son conceptos diferentes.

---

# 50. Credit Card Statement

Conceptualmente:

```text
Statement
├── periodStart
├── periodEnd
├── closingDate
├── dueDate
├── total
├── minimumPayment?
├── paidAmount
└── status
```

No es obligatorio implementar el modelo completo en el primer MVP, pero debe quedar contemplado.

---

# 51. Compras con tarjeta

Una compra puede ser:

```text
single payment
```

o:

```text
installments
```

---

# 52. Compra en cuotas con tarjeta

Ejemplo:

```text
Notebook
$1.200.000

12 cuotas
$100.000
```

Debe crear compromisos futuros.

---

# 53. Compra vs cashflow

Debemos distinguir:

```text
Purchase Value
```

de:

```text
Current Cash Outflow
```

Ejemplo:

```text
Valor de compra:
$1.200.000

Salida de dinero este mes:
$100.000

Compromiso futuro:
$1.100.000
```

---

# 54. Pago de tarjeta

Pagar una tarjeta es una salida real desde otra cuenta.

Ejemplo:

```text
Cuenta bancaria
-$300.000

Tarjeta
reducción de deuda $300.000
```

No debe duplicar el gasto original en reportes de consumo.

---

# 55. Pago mínimo

Post-MVP se podrá contemplar:

```text
minimum payment
```

y:

```text
financed remainder
```

con reglas explícitas.

No debe improvisarse con IA.

---

# 56. Préstamos

Un préstamo tendrá:

```text
principal

interest rules

installments

payments

outstanding principal

status
```

V1 puede manejar préstamos mediante cuotas explícitas.

Modelos amortizados complejos quedan para evolución posterior.

---

# 57. Recurring Transactions

La aplicación debe soportar reglas recurrentes.

Ejemplos:

```text
alquiler

sueldo

Netflix

internet

seguro

gimnasio

pensión
```

---

# 58. Recurring Types

```text
INCOME

EXPENSE
```

Post-MVP puede ampliarse.

---

# 59. Frequencies

Inicialmente:

```text
WEEKLY

BIWEEKLY

MONTHLY

QUARTERLY

YEARLY

CUSTOM
```

---

# 60. Scheduled Transaction

Una regla recurrente no debe crear movimientos contabilizados infinitamente hacia el futuro.

Debe generar:

```text
scheduled occurrences
```

o proyectarlas dinámicamente.

---

# 61. Scheduled vs Posted

Ejemplo:

```text
Sueldo esperado:
31/08
$1.500.000
```

es:

```text
Scheduled Income
```

Cuando realmente se cobra:

```text
Posted Income
```

---

# 62. Gastos programados únicos

Además de recurrencias, el usuario puede crear:

```text
Scheduled Expense
```

por única vez.

Ejemplo:

```text
Seguro anual
15/10
$400.000
```

---

# 63. Future Obligations

Obligaciones futuras pueden provenir de:

```text
debt installments

credit card statements

scheduled expenses

recurring expenses
```

La aplicación debe poder consolidarlas.

---

# 64. Upcoming Payments

Una vista principal debe mostrar:

```text
Hoy

Esta semana

Este mes

Próximos 30 días
```

con obligaciones ordenadas cronológicamente.

---

# 65. Overdue

Una obligación está vencida cuando:

```text
dueDate < currentDate
AND
remainingAmount > 0
```

Debe derivarse automáticamente.

---

# 66. Reminders

El usuario puede configurar recordatorios.

Ejemplos:

```text
día del vencimiento

1 día antes

3 días antes

7 días antes

fecha personalizada
```

---

# 67. Multiple Reminders

Una misma obligación puede tener:

```text
7 días antes

1 día antes

día del vencimiento
```

---

# 68. Reminder vs Due Date

Nunca confundir:

```text
reminderAt
```

con:

```text
dueDate
```

---

# 69. Budgets

El usuario puede definir presupuestos.

Ejemplo:

```text
Food
$250.000 / month

Transport
$100.000 / month

Entertainment
$80.000 / month
```

---

# 70. Budget Period

Inicialmente:

```text
MONTHLY
```

Post-MVP:

```text
WEEKLY

CUSTOM
```

---

# 71. Budget Remaining

```text
Budget Remaining
=
Budget Limit
-
Relevant Posted Expenses
```

Las obligaciones futuras no necesariamente deben descontarse del mismo indicador.

---

# 72. Budget vs Commitment

Un presupuesto es intención.

Una obligación es compromiso.

```text
Budget
≠
Financial Obligation
```

---

# 73. Budget Rollover

Post-MVP podemos soportar:

```text
unused budget rollover
```

Ejemplo:

```text
Julio disponible:
$20.000

Agosto:
$100.000 + $20.000
```

---

# 74. Envelope / Reserved Budget

Post-MVP podría existir un modelo tipo:

```text
envelope
```

o:

```text
sinking fund
```

para reservar dinero hacia objetivos concretos.

---

# 75. Savings Goals

El usuario puede crear metas.

Ejemplo:

```text
Viaje

Objetivo:
$2.000.000

Actual:
$750.000

Fecha:
15/12
```

---

# 76. Goal Progress

Debe derivarse de aportes asociados o saldo reservado.

No debe ser solamente un porcentaje editable.

---

# 77. Emergency Fund

Una meta especial posible:

```text
Emergency Fund
```

La aplicación puede mostrar:

```text
months of expenses covered
```

post-MVP.

---

# 78. Cashflow Projection

Una capability central será proyectar:

```text
current balances
+
scheduled income
-
scheduled expenses
-
financial obligations
```

a través del tiempo.

---

# 79. Example Projection

```text
Hoy
$900.000

15 Ago
Alquiler
-$300.000

18 Ago
Visa
-$120.000

25 Ago
Préstamo
-$100.000

31 Ago
Sueldo
+$1.500.000
```

---

# 80. Projection Horizon

V1:

```text
next 30 days
```

Posteriormente:

```text
60 days

90 days

custom
```

---

# 81. Projection Is Not Truth

Una proyección depende de eventos futuros.

Debe mostrarse como:

```text
estimated
```

no como saldo garantizado.

---

# 82. Projected Shortfall

Si:

```text
projectedBalance < 0
```

la aplicación puede alertar:

```text
Con los ingresos y obligaciones registrados, tu saldo podría quedar negativo antes del próximo ingreso.
```

---

# 83. Spendable Money

Una de las métricas más útiles será:

```text
Spendable Money
```

Conceptualmente puede considerar:

```text
available balances
-
reserved funds
-
selected upcoming obligations
```

La definición exacta debe ser configurable y explicable.

---

# 84. Spendable vs Net Worth

No confundir:

```text
Net Worth
```

con:

```text
Spendable Money
```

Una persona puede tener patrimonio positivo y poca liquidez disponible.

---

# 85. Reports

V1 debería cubrir:

```text
income vs expenses

expenses by category

monthly evolution

account balances

outstanding debt

upcoming payments

budget vs actual

cashflow projection
```

---

# 86. Net Worth Report

Post-MVP:

```text
Net Worth Over Time
```

debe mostrar evolución histórica.

---

# 87. Debt Report

Mostrar:

```text
total debt

debt by creditor

debt by type

monthly required payments

debt reduction over time
```

---

# 88. Spending Report

Mostrar:

```text
by category

by merchant

by account

by period
```

---

# 89. Search

Permitir búsqueda por:

```text
description

merchant

category

tag

account

amount

date
```

---

# 90. Filters

Inicialmente:

```text
date range

account

category

type

amount range

status
```

---

# 91. CSV Import

La importación será una capability importante.

Puede entrar en:

```text
V1.1
```

o temprano si la carga manual genera demasiado friction.

---

# 92. Import Flow

```text
Upload CSV
 ↓
Detect Columns
 ↓
Map Fields
 ↓
Preview
 ↓
Validate
 ↓
Detect Duplicates
 ↓
Confirm
 ↓
Persist
```

---

# 93. Duplicate Detection

Debe existir una estrategia para detectar:

```text
same imported transaction twice
```

Señales posibles:

```text
external ID

account

date

amount

description hash
```

Nunca borrar automáticamente un movimiento dudoso sin confirmación.

---

# 94. Reconciliation

Post-MVP:

```text
reconciliation
```

permitirá comparar:

```text
system balance
```

con:

```text
bank/account balance
```

y resolver diferencias.

---

# 95. Attachments

Post-MVP o V1.1, permitir:

```text
receipt

invoice

photo

PDF
```

asociados a una transacción o deuda.

Los archivos viven en Object Storage.

---

# 96. Dashboard

El dashboard debe responder inmediatamente las preguntas centrales.

Ejemplo:

```text
Resumen

Dinero en cuentas
$1.250.000

Deuda pendiente
$680.000

Comprometido próximos 30 días
$420.000

Disponible estimado
$830.000
```

---

# 97. Dashboard Monthly Summary

```text
Agosto

Ingresos
$1.800.000

Gastos
$950.000

Resultado
+$850.000
```

---

# 98. Dashboard Upcoming Payments

```text
Próximos pagos

12 Ago
Internet
$25.000

15 Ago
Alquiler
$300.000

18 Ago
Visa
$145.000

25 Ago
Préstamo
$85.000
```

---

# 99. Dashboard Budget

```text
Presupuesto

Food
$145.000 / $200.000

Transport
$50.000 / $80.000
```

---

# 100. Dashboard Alerts

Ejemplos:

```text
Tenés 3 pagos esta semana.

Una cuota está vencida.

Gastaste el 92% del presupuesto de Food.

Tu saldo proyectado podría quedar negativo el 27/08.
```

---

# 101. Calendar / Timeline

La aplicación debería incorporar una vista temporal.

Puede comenzar como:

```text
Financial Timeline
```

antes que un calendario completo.

---

# 102. Timeline Example

```text
12 Ago
Internet
-$25.000

15 Ago
Alquiler
-$300.000

18 Ago
Tarjeta
-$145.000

31 Ago
Sueldo
+$1.500.000
```

---

# 103. Multiple Currencies

Cada cuenta puede tener:

```text
currency
```

Ejemplos:

```text
ARS

USD

EUR
```

---

# 104. Base Currency

El usuario tendrá una:

```text
baseCurrency
```

para reportes consolidados.

---

# 105. FX V1

V1 puede evitar conversiones automáticas complejas.

Puede mostrar balances separados:

```text
ARS
$1.000.000

USD
US$2.000
```

---

# 106. FX Post-MVP

Más adelante se podrá incorporar:

```text
exchange rates

historical rates

converted net worth
```

con fuentes explícitas y trazables.

---

# 107. Money Representation

Nunca usar:

```text
binary floating point
```

como representación financiera principal.

Preferir:

```text
integer minor units
```

cuando corresponda,

o:

```text
exact decimal
```

según la moneda y el caso.

La estrategia debe ser consistente en todo el sistema.

---

# 108. Precision

La arquitectura debe soportar monedas que no tengan exactamente dos decimales.

No hardcodear:

```text
cents = always 2 decimals
```

en todo el dominio.

---

# 109. Artificial Intelligence

La IA será opcional y asistiva.

Gateway:

```text
OpenRouter
```

---

# 110. AI Use Cases

Casos útiles:

```text
categorization suggestions

merchant normalization

subscription detection

transaction description cleanup

spending pattern explanations

anomaly detection assistance

financial summaries
```

---

# 111. AI Categorization

Ejemplo:

```text
UBER *TRIP
```

puede sugerir:

```text
Transport > Ride Sharing
```

Pero el usuario puede corregirlo.

---

# 112. AI Insights

Ejemplo:

```text
Gastaste 22% más en delivery este mes que tu promedio de los últimos tres meses.
```

El porcentaje debe calcularse determinísticamente.

La IA puede explicar el resultado.

---

# 113. AI Boundaries

La IA nunca debe:

```text
alterar balances directamente

crear pagos falsos

marcar cuotas como pagadas sin evidencia

cambiar montos sin confirmación

inventar movimientos

decidir automáticamente inversiones

convertirse en fuente de verdad financiera
```

---

# 114. Privacy

Los datos financieros son altamente sensibles.

Debemos minimizar:

```text
logging

AI context

third-party exposure

analytics payloads
```

---

# 115. AI Privacy

Enviar únicamente los campos necesarios.

Ejemplo para categorizar:

```text
merchant

description

optional amount context
```

No enviar:

```text
entire financial history
```

si no es necesario.

---

# 116. Security

Desde V1:

```text
authentication

server-side authorization

ownership validation

secure secrets

safe file access

rate limiting where useful

input validation

secure error handling
```

---

# 117. Ownership

Todo dato financiero pertenece al usuario.

Ejemplos:

```text
accounts

transactions

categories

debts

installments

payments

budgets

goals

reminders
```

Nunca confiar en IDs provenientes del cliente sin verificar ownership.

---

# 118. Export

El usuario debería poder exportar sus datos.

Post-MVP o V1.1:

```text
CSV

JSON
```

Esto mejora:

```text
portability

trust

backup
```

---

# 119. Account Deletion

El producto debe contemplar eliminación de cuenta y datos.

Esto requiere una política clara sobre:

```text
financial records

attachments

AI logs

backups
```

antes de producción pública.

---

# 120. Auditability

No necesitamos contabilidad empresarial completa.

Pero debemos mantener trazabilidad suficiente para entender:

```text
qué movimiento cambió qué saldo

qué pago afectó qué cuota

qué transferencia conectó qué cuentas

qué ajuste corrigió qué error
```

---

# 121. Historical Integrity

Cuando una operación financiera cambia, debemos decidir si:

```text
edit existing record
```

o:

```text
create reversal/adjustment
```

según importancia.

No toda corrección necesita contabilidad de doble entrada, pero no debemos perder historia crítica.

---

# 122. Notifications

Tipos futuros:

```text
payment due soon

payment overdue

budget almost reached

budget exceeded

projected negative balance

goal milestone

unusual spending
```

---

# 123. Notification Channels

Inicialmente:

```text
in-app
```

Después:

```text
email

push
```

---

# 124. MVP

El MVP debe permitir:

```text
Authentication

Accounts

Opening balances

Transactions

Income

Expenses

Transfers

Categories

Basic subcategories

Debts

Installments

Manual installment dates

Partial payments

Early installment payments

Recurring income

Recurring expenses

Scheduled transactions

Upcoming obligations

Reminders

Basic budgets

Dashboard

30-day cashflow projection

Basic reports
```

---

# 125. Strong MVP Option

Si queremos reducir scope inicial sin romper la visión:

```text
Accounts

Transactions

Categories

Debts

Installments

Payments

Recurring Transactions

Upcoming Payments

Dashboard

Cashflow Projection
```

son el núcleo irreducible.

---

# 126. MVP Core Flow

```text
Register
 ↓
Create Account
 ↓
Set Opening Balance
 ↓
Add Income
 ↓
Add Expenses
 ↓
Create Debt
 ↓
Configure Installments
 ↓
See Upcoming Payments
 ↓
Record Payment
 ↓
See Updated Debt
 ↓
See Cashflow
```

---

# 127. MVP Debt Flow

```text
Create Debt

Notebook
$1.200.000

12 installments

First Due Date
15/08

Frequency
Monthly
```

El sistema genera cuotas.

El usuario puede:

```text
edit dates

edit amounts

make partial payment

pay early

mark/cancel obligations correctly
```

---

# 128. MVP Dashboard Requirements

Debe mostrar al menos:

```text
Total Balance

Income This Month

Expenses This Month

Outstanding Debt

Upcoming Payments

Projected Balance

Budget Status
```

---

# 129. Fuera del MVP

No incluir inicialmente:

```text
automatic bank synchronization

investment portfolio tracking

stocks

crypto

tax preparation

business accounting

shared household accounts

complex mortgage amortization

automatic FX

credit score

financial advisor AI

full double-entry accounting UI
```

---

# 130. V1.1 Candidates

Después del MVP:

```text
CSV imports

split transactions

tags

refund workflows

attachments

credit card statement management

budget rollover

reserved funds

better reminders

financial timeline
```

---

# 131. Post-MVP Candidates

```text
bank integrations

receipt OCR

advanced loan amortization

shared household finances

investment tracking

multiple currencies with FX

net worth history

advanced forecasting

subscription management

reconciliation
```

---

# 132. Product Metrics

Métricas útiles:

```text
accounts created

transactions recorded

debts created

installments tracked

payments recorded

weekly active users

cashflow views

budget usage

return rate
```

---

# 133. Activation

Una posible definición de usuario activado:

```text
created account
+
recorded transactions
+
configured at least one future obligation
```

Esto demuestra uso real del núcleo.

---

# 134. Retention Signal

La métrica más importante no será:

```text
transactions created once
```

sino:

```text
user returns to check and manage finances
```

---

# 135. Core Product Loop

```text
Record Money
      ↓
Understand Position
      ↓
See Upcoming Obligations
      ↓
Plan Spending
      ↓
Record Payments
      ↓
Review Evolution
      ↓
Return
```

---

# 136. Product Language

Preferir lenguaje común.

Ejemplos:

```text
Dinero disponible

Deuda pendiente

Próximos pagos

Ingresos

Gastos

Presupuesto

Saldo proyectado
```

Evitar jerga contable innecesaria.

---

# 137. Trust as a Feature

La confianza es una de las características principales del producto.

El usuario debe confiar en que:

```text
los saldos cierran

las transferencias no duplican gastos

las cuotas son correctas

los pagos se aplican correctamente

los vencimientos se muestran

las proyecciones pueden explicarse
```

---

# 138. Core Financial Invariants

Desde el diseño inicial debemos respetar:

```text
Transfer between owned accounts
does not create income or expense.

Debt payment
reduces liability
and produces actual cash outflow.

Refund
does not necessarily count as ordinary income.

Scheduled transaction
does not affect actual balance until posted.

Projection
never changes source-of-truth data.

AI output
never changes balances without validated user action.
```

---

# 139. Product Success Criterion

El producto será exitoso cuando una persona pase de pensar:

```text
"No sé cuánto puedo gastar porque tengo varias cosas pendientes."
```

a poder abrir la aplicación y ver:

```text
Tengo:
$1.000.000

Debo:
$600.000

Vence en próximos 30 días:
$300.000

Fondos reservados:
$100.000

Disponible estimado:
$600.000

Próximo ingreso:
$1.500.000 el 31/08

Saldo proyectado al 31/08:
$1.800.000
```

y comprender cómo se obtuvo cada cifra.

---

# 140. Product Identity

La plataforma no es únicamente:

```text
Expense Tracker
```

Tampoco es simplemente:

```text
Budget App
```

Es:

```text
Personal Financial Control System
```

que integra:

```text
current money

past activity

future obligations

planning

debt

cashflow

goals
```

---

# 141. Architecture Principle

El producto debe mantener la separación:

```text
Actual Transactions
≠
Future Obligations
≠
Scheduled Events
≠
Projections
```

y también:

```text
Balance
≠
Spendable Money
≠
Net Worth
```

Estas separaciones son fundamentales para evitar números engañosos.

---

# 142. Final North Star

Al abrir la aplicación, el usuario debería responder en pocos segundos:

```text
¿Qué tengo?

¿Qué debo?

¿Qué vence?

¿Qué puedo gastar?

¿Hacia dónde voy?
```

---

# 143. Próximo documento

El siguiente documento será:

```text
docs/01-domain-model.md
```

Debe formalizar:

```text
User

Account

Transaction

TransactionSplit

Category

Tag

Transfer

Debt

DebtInstallment

DebtPayment

PaymentAllocation

CreditCard

CreditCardStatement

RecurringTransaction

ScheduledTransaction

Budget

SavingsGoal

Reminder

Attachment
```

y definir:

```text
ownership

relationships

money representation

transaction lifecycle

debt lifecycle

installment lifecycle

payment allocation

credit card behavior

scheduled vs posted behavior

financial invariants
```
