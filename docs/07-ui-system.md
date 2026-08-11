# UI System

## 1. Objetivo

Este documento define las reglas principales de interfaz para la aplicación de finanzas personales.

No pretende reemplazar un design system completo.

Su objetivo es asegurar consistencia en:

* navegación;
* jerarquía visual;
* pantallas;
* componentes;
* estados;
* formularios;
* responsive;
* accesibilidad;
* presentación de información financiera.

La UI debe ayudar al usuario a responder rápidamente:

```text
¿Qué tengo?
¿Qué debo?
¿Qué vence?
¿Qué puedo gastar?
¿Hacia dónde voy?
```

---

# 2. Principios de UI

## 2.1 Financial clarity first

La claridad financiera tiene prioridad sobre la decoración.

Evitar:

```text
charts without context

metrics without labels

ambiguous percentages

decorative cards with little information
```

Preferir:

```text
clear number

clear meaning

clear period

clear source
```

---

## 2.2 Numbers need context

Nunca mostrar únicamente:

```text
$830.000
```

Preferir:

```text
Disponible estimado
$830.000

Después de compromisos de los próximos 30 días
```

---

## 2.3 Actual vs Future must look different

La UI debe diferenciar claramente:

```text
Actual

Scheduled

Obligation

Projection
```

No deben parecer el mismo tipo de dato.

---

## 2.4 Do not rely only on color

Estados importantes deben comunicarse mediante:

```text
label

icon

text

shape
```

además del color.

Ejemplo:

```text
VENCIDO
```

no simplemente un monto rojo.

---

# 3. App Navigation

Navegación principal futura:

```text
Dashboard

Transactions

Accounts

Debts

Planning

Budgets
```

Opcional después:

```text
Goals

Reports
```

---

# 4. MVP Navigation

Durante el primer vertical slice mostrar únicamente:

```text
Dashboard

Transactions

Accounts
```

No mostrar secciones vacías o deshabilitadas.

---

# 5. Desktop Layout

Layout conceptual:

```text
┌──────────────────────────────────────────────┐
│ Sidebar │ Main Content                      │
│         │                                   │
│ Logo    │ Page Header                       │
│         │                                   │
│ Dashboard                                   │
│ Transactions                                │
│ Accounts                                    │
│ Debts                                       │
│ Planning                                    │
│ Budgets                                     │
│         │                                   │
│ Settings│                                   │
└──────────────────────────────────────────────┘
```

---

# 6. Desktop Sidebar

Debe contener:

```text
product identity

primary navigation

settings

user menu
```

Mantener pocas opciones visibles.

---

# 7. Mobile Navigation

Prioridad mobile:

```text
Dashboard

Transactions

Accounts

More
```

Puede implementarse como navegación inferior.

---

# 8. Global Quick Action

En mobile y desktop debe existir acceso rápido a:

```text
Add Transaction
```

y desde ahí:

```text
Expense

Income
```

Más adelante:

```text
Transfer

Debt Payment
```

---

# 9. Page Header Pattern

Cada página principal utiliza:

```text
Title

Optional short description

Primary action
```

Ejemplo:

```text
Transactions

Revisá y administrá tus movimientos.

[Add Transaction]
```

---

# 10. Dashboard Purpose

El dashboard no debe intentar mostrar todos los datos posibles.

Debe priorizar:

```text
current financial position

near-term commitments

recent activity

risk
```

---

# 11. Dashboard V0

Primer vertical slice:

```text
┌─────────────────────────────────────┐
│ Dinero en cuentas                   │
│ $1.250.000                          │
└─────────────────────────────────────┘

┌────────────────┐ ┌─────────────────┐
│ Ingresos       │ │ Gastos          │
│ este mes       │ │ este mes        │
│ $1.800.000     │ │ $950.000        │
└────────────────┘ └─────────────────┘

┌─────────────────────────────────────┐
│ Movimientos recientes               │
│ ...                                 │
└─────────────────────────────────────┘
```

---

# 12. Dashboard Full MVP

Cuando existan deudas y proyecciones:

```text
┌─────────────────────────────────────┐
│ Disponible estimado                 │
│ $830.000                            │
│                                     │
│ Saldo        $1.250.000             │
│ Comprometido -$420.000              │
└─────────────────────────────────────┘

┌───────────────┐ ┌───────────────────┐
│ Ingresos      │ │ Gastos            │
│ este mes      │ │ este mes          │
│ $1.800.000    │ │ $950.000          │
└───────────────┘ └───────────────────┘

┌─────────────────────────────────────┐
│ Deuda pendiente                     │
│ $680.000                            │
│ Próximo pago: $85.000 · 25 Ago     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Próximos pagos                      │
│ 12 Ago · Internet        $25.000   │
│ 15 Ago · Alquiler       $300.000   │
│ 18 Ago · Visa           $145.000   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Proyección · próximos 30 días       │
│ ...                                 │
└─────────────────────────────────────┘
```

---

# 13. Dashboard Hierarchy

Orden recomendado:

```text
1. Spendable / available position

2. Monthly summary

3. Debt

4. Upcoming obligations

5. Cashflow projection

6. Budgets
```

---

# 14. Primary Financial Card

Una card principal puede mostrar:

```text
Label

Primary amount

Supporting explanation

Optional secondary breakdown
```

Ejemplo:

```text
Disponible estimado

$830.000

Después de compromisos de los próximos 30 días

Saldo
$1.250.000

Comprometido
$420.000
```

---

# 15. Metric Card

Pattern:

```text
Label
Amount
Period/context
Optional trend
```

Ejemplo:

```text
Gastos

$950.000

Este mes
```

---

# 16. Avoid Unexplained Trends

No mostrar:

```text
↑ 17%
```

sin indicar:

```text
vs previous month
```

---

# 17. Financial Number Formatting

Todos los montos deben utilizar formatter central.

Nunca formatear montos manualmente en cada componente.

Conceptualmente:

```text
formatMoney(amount, currency, locale)
```

---

# 18. Currency Visibility

Cuando pueda existir ambigüedad:

```text
ARS 120.000

USD 500
```

o símbolo claramente asociado.

---

# 19. Multi-Currency UI

Nunca mostrar un único total como:

```text
$1.200.500
```

si proviene de:

```text
ARS
+
USD
```

sin conversión explícita.

Mostrar:

```text
ARS 1.200.000

USD 500
```

---

# 20. Income Semantics

Ingresos deben identificarse como:

```text
Income
```

y opcionalmente usar una señal visual positiva.

Ejemplo:

```text
+ $150.000
```

---

# 21. Expense Semantics

Gastos:

```text
Expense
```

Ejemplo:

```text
- $25.000
```

---

# 22. Transfer Semantics

Transferencias no deben parecer gasto.

Ejemplo:

```text
Banco → Efectivo

$100.000

Transferencia
```

---

# 23. Liability Payment Semantics

Pago de deuda:

```text
Pago de deuda

$85.000
```

No etiquetar simplemente como:

```text
Gasto
```

si eso genera confusión de consumo.

---

# 24. Refund Semantics

Mostrar:

```text
Reembolso
```

y, cuando exista:

```text
Compra original
```

como relación visible.

---

# 25. Actual vs Scheduled Styling

Actual:

```text
Posted
```

debe verse como movimiento confirmado.

Scheduled:

```text
Programado
```

debe llevar una etiqueta explícita.

---

# 26. Obligation Styling

Una obligación debe mostrar:

```text
Vence 18 Ago
```

o:

```text
Vence hoy
```

No debe parecer una transacción ya realizada.

---

# 27. Projection Styling

Toda métrica proyectada debe usar lenguaje como:

```text
Estimado

Proyectado

Esperado
```

---

# 28. Semantic Status Vocabulary

Usar consistentemente:

```text
Pendiente

Parcialmente pagado

Pagado

Vencido

Cancelado

Programado

Omitido
```

---

# 29. Critical State

Para obligaciones vencidas:

```text
Vencido
```

debe ser muy visible.

Mostrar además:

```text
fecha de vencimiento

monto pendiente

días de atraso
```

---

# 30. Warning State

Ejemplos:

```text
vence pronto

presupuesto cerca del límite

saldo proyectado bajo
```

---

# 31. Positive State

Ejemplos:

```text
paid

goal completed

budget safely below limit
```

No convertir toda cifra positiva en verde.

---

# 32. Neutral State

Usar para:

```text
scheduled

projected

informational
```

---

# 33. Accounts Page

Ruta:

```text
/accounts
```

---

# 34. Accounts Page Layout

Header:

```text
Accounts

[New Account]
```

Body:

```text
Account Cards/List
```

---

# 35. Account Card

Debe mostrar:

```text
Account Name

Type

Currency

Current Balance
```

Ejemplo:

```text
Banco Nación
Banco

ARS

$850.000
```

---

# 36. Account Type Representation

Usar icono + texto:

```text
Bank

Cash

Wallet

Savings
```

No depender solo del icono.

---

# 37. Account Detail

Ruta:

```text
/accounts/[accountId]
```

Header:

```text
Account name

Current balance
```

Secondary:

```text
Opening balance

Account type

Currency
```

---

# 38. Account Detail Actions

```text
Add Expense

Add Income

Edit

Archive
```

---

# 39. Account Transactions

Mostrar lista reciente dentro del detail.

CTA:

```text
View all transactions
```

---

# 40. Transactions Page

Ruta:

```text
/transactions
```

---

# 41. Transactions Header

```text
Transactions

[Add Transaction]
```

---

# 42. Transaction List Desktop

Columnas sugeridas:

```text
Date

Description

Category

Account

Amount
```

No agregar columnas innecesarias inicialmente.

---

# 43. Transaction List Mobile

Cada movimiento como row/card compacta:

```text
Supermarket                    -$45.000

Food · Bank

08 Aug
```

---

# 44. Transaction Direction

Monto debe ser visualmente fácil de identificar.

Ejemplo:

```text
Salary                         +$1.500.000
```

---

# 45. Transaction Filters

Desktop:

```text
Date

Account

Category

Type
```

Mobile:

usar:

```text
Filters
```

en sheet/drawer.

---

# 46. Filter Persistence

Mientras el usuario permanezca en la vista, mantener filtros.

URL query params son recomendables.

Ejemplo:

```text
/transactions?account=...&type=EXPENSE
```

---

# 47. Transaction Detail

Mostrar grupos claros:

```text
Amount

Details

Classification

Account

Dates

Notes
```

---

# 48. Transaction Detail Actions

```text
Edit

Void
```

Void debe pedir confirmación.

---

# 49. Add Transaction Interaction

Recomendación:

```text
Dialog on desktop

Bottom sheet/full screen on mobile
```

si el framework de componentes lo facilita.

---

# 50. Transaction Type Selector

Primero:

```text
Expense | Income
```

como segmented control/tabs.

---

# 51. Expense Form Hierarchy

Orden:

```text
Amount

Account

Category

Description

Date

Merchant

Notes
```

---

# 52. Income Form Hierarchy

```text
Amount

Account

Category

Description

Date

Notes
```

---

# 53. Amount Input

El monto debe ser el input visualmente más importante.

Ejemplo:

```text
$ 0,00
```

con teclado numérico apropiado en mobile.

---

# 54. Amount Validation

Errores junto al campo.

Ejemplo:

```text
Ingresá un monto mayor a cero.
```

---

# 55. Currency Context in Form

Si cuenta define moneda:

mostrar:

```text
ARS
```

cerca del monto.

No pedir moneda nuevamente si puede derivarse de la cuenta.

---

# 56. Account Selector

Mostrar:

```text
account name

type

currency
```

Ejemplo:

```text
Banco Nación
Bank · ARS
```

---

# 57. Category Selector

Separar visualmente:

```text
expense categories
```

de:

```text
income categories
```

según form.

---

# 58. Fast Category Creation

Puede ofrecer:

```text
+ Create category
```

desde selector.

Pero no debe hacer el form excesivamente complejo.

---

# 59. Date Input

Default:

```text
Today
```

Para transactions reales:

no permitir futura sin mensaje claro.

---

# 60. Form Error Summary

Si existen múltiples errores, además de errores inline puede mostrarse un mensaje general:

```text
Revisá los campos marcados.
```

---

# 61. Submit Behavior

Durante submit:

```text
disable primary action
show pending feedback
prevent double submit
```

---

# 62. Success Feedback

Después de crear:

```text
Transaction added
```

puede aparecer como toast breve.

No depender únicamente de toast para cambios importantes.

La UI debe reflejar el nuevo estado.

---

# 63. Debts Page

Cuando se implemente:

```text
/debts
```

---

# 64. Debt List Card

Mostrar:

```text
Debt Name

Creditor

Remaining Amount

Next Payment

Status
```

Ejemplo:

```text
Notebook

Mercado Libre

Pendiente
$600.000

Próxima cuota
$100.000 · 15 Ago
```

---

# 65. Debt Detail

Header:

```text
Debt Name

Remaining Debt

Status
```

Summary:

```text
Original

Paid

Remaining

Next payment
```

---

# 66. Installment List

Cada row:

```text
#3

15 Aug

$100.000

Pending
```

Si partial:

```text
$40.000 paid
$60.000 remaining
```

---

# 67. Installment Primary Action

Para cuotas no pagadas:

```text
Pay
```

---

# 68. Pay Debt Flow

Debe ser muy claro:

```text
Amount

Pay from account

Payment date

Allocation
```

---

# 69. Allocation Mode UI

V1:

```text
Apply to oldest installments

Choose manually
```

No usar términos técnicos como:

```text
FIFO allocation
```

en UI.

---

# 70. Manual Allocation UI

Mostrar cuotas con:

```text
due date

remaining amount

allocation input
```

y total:

```text
Payment
$250.000

Allocated
$250.000

Remaining to allocate
$0
```

---

# 71. Overpayment Error

Mostrar:

```text
El pago supera el saldo pendiente de la deuda.
```

---

# 72. Upcoming Payments Page

Puede vivir en:

```text
/planning
```

con tab:

```text
Upcoming
```

---

# 73. Upcoming Groups

```text
Vencidos

Hoy

Próximos 7 días

Más adelante
```

---

# 74. Upcoming Payment Row

```text
Visa

18 Ago

$145.000

Vence en 3 días
```

---

# 75. Partial Obligation UI

Mostrar:

```text
Total
$100.000

Pagado
$40.000

Pendiente
$60.000
```

---

# 76. Scheduled Page

Dentro de Planning:

```text
Scheduled
```

---

# 77. Scheduled Row

Mostrar:

```text
Date

Description

Amount

Expected type

Status
```

Ejemplo:

```text
31 Ago

Sueldo

+$1.500.000

Programado
```

---

# 78. Scheduled Actions

```text
Confirm

Edit

Skip
```

---

# 79. Confirm Scheduled Event

Confirmar convierte expectativa en realidad.

La UI debería expresar:

```text
Confirmar ingreso
```

no simplemente:

```text
Complete
```

---

# 80. Recurring Page

Dentro de Planning:

```text
Recurring
```

---

# 81. Recurring Item

Mostrar:

```text
Description

Amount

Frequency

Next occurrence

Status
```

---

# 82. Recurring Actions

```text
Edit

Pause

Resume

Cancel
```

---

# 83. Budgets Page

Ruta:

```text
/budgets
```

---

# 84. Budget Card

Mostrar:

```text
Category

Spent / Limit

Remaining

Progress
```

Ejemplo:

```text
Food

$145.000 / $200.000

$55.000 remaining
```

---

# 85. Progress Bar

Puede utilizarse para presupuesto.

Pero siempre acompañada por números.

Nunca:

```text
bar only
```

---

# 86. Budget Over Limit

Ejemplo:

```text
Entertainment

$120.000 / $100.000

$20.000 over budget
```

---

# 87. Cashflow UI

La proyección debe ser comprensible incluso sin gráfico.

Priorizar timeline primero.

---

# 88. Cashflow Summary

Mostrar:

```text
Current balance

Projected end balance

Lowest projected balance
```

---

# 89. Cashflow Timeline

```text
Today
$800.000

15 Aug · Rent
-$300.000
→ $500.000

20 Aug · Loan
-$100.000
→ $400.000

31 Aug · Salary
+$1.200.000
→ $1.600.000
```

---

# 90. Cashflow Chart

Puede añadirse después como complemento.

Nunca debe ser la única forma de entender la proyección.

---

# 91. Projection Label

Siempre incluir:

```text
Projected
```

o:

```text
Estimated
```

---

# 92. Shortfall UI

Si proyección cruza cero:

mostrar destacado:

```text
Posible falta de saldo

Tu saldo proyectado podría quedar
-$75.000

el 27 Ago
```

---

# 93. Shortfall Details

Permitir ver eventos que producen esa situación.

---

# 94. Empty States

Todos los módulos necesitan un empty state accionable.

---

# 95. Accounts Empty

```text
Todavía no tenés cuentas.

Creá tu primera cuenta para comenzar.

[Create Account]
```

---

# 96. Transactions Empty

```text
Todavía no registraste movimientos.

[Add Transaction]
```

---

# 97. Debt Empty

```text
No tenés deudas registradas.

Podés agregar una deuda para controlar cuotas y vencimientos.

[Add Debt]
```

---

# 98. Upcoming Empty

```text
No tenés pagos próximos registrados.
```

No hace falta CTA si no existe una acción obvia.

---

# 99. Budget Empty

```text
Todavía no configuraste presupuestos.

[Create Budget]
```

---

# 100. Loading States

Usar skeletons para:

```text
dashboard cards

lists

tables
```

Evitar spinner gigante para toda la aplicación cuando puede renderizarse estructura.

---

# 101. Error State

Ejemplo:

```text
No pudimos cargar tus movimientos.

[Try again]
```

No mostrar:

```text
SQL error
stack trace
internal error ID
```

al usuario salvo referencia segura si soporte lo requiere.

---

# 102. Not Found State

Para recurso inexistente o no perteneciente al usuario:

```text
No encontramos este recurso.
```

Evitar revelar:

```text
This belongs to another user.
```

---

# 103. Confirmation Dialogs

Obligatorios para:

```text
void transaction

archive account

cancel debt

cancel recurring rule
```

---

# 104. Destructive Action Copy

Debe explicar efecto.

Ejemplo:

```text
Anular este movimiento hará que deje de afectar el saldo de la cuenta.
```

---

# 105. Form Layout Desktop

Preferir formularios estrechos.

No expandir inputs financieros a toda la pantalla sin necesidad.

---

# 106. Form Layout Mobile

Inputs:

```text
full width
```

con botones principales accesibles sin layouts complejos.

---

# 107. Primary Button Rule

Una pantalla/form debe tener una acción primaria clara.

Evitar múltiples botones con igual peso.

---

# 108. Secondary Actions

Usar menor jerarquía para:

```text
Cancel

Archive

Skip

Edit secondary details
```

---

# 109. Destructive Buttons

Solo para acciones realmente destructivas o de alto impacto.

No usar semántica destructiva simplemente porque un monto es gasto.

---

# 110. Typography Hierarchy

Conceptualmente:

```text
Page title

Section title

Metric label

Metric value

Supporting text

Metadata
```

---

# 111. Financial Amount Typography

Montos principales deben ser:

```text
prominent

easy to scan

tabular when possible
```

Usar numerales tabulares si la tipografía los soporta.

---

# 112. Decimal Alignment

En tablas financieras, alinear montos consistentemente.

Preferencia:

```text
right aligned
```

---

# 113. Table Density

Evitar tablas excesivamente densas.

Información secundaria puede mostrarse como texto complementario dentro de una celda.

---

# 114. Date Formatting

Usar formato consistente.

Ejemplo:

```text
15 Ago 2026
```

o localizado según locale.

Evitar mezclar:

```text
08/15
15/08
Aug 15
```

sin criterio.

---

# 115. Relative Dates

En próximos vencimientos puede usarse:

```text
Hoy

Mañana

En 3 días
```

junto a fecha absoluta cuando sea útil.

---

# 116. Accessibility

Componentes interactivos deben soportar:

```text
keyboard

screen readers

focus indication

labels

error descriptions
```

---

# 117. Icon Accessibility

Iconos decorativos:

```text
aria-hidden
```

Iconos de acción necesitan nombre accesible.

---

# 118. Color Contrast

Estados semánticos deben mantener contraste suficiente.

Especialmente:

```text
warning

critical

muted text
```

---

# 119. Mobile Touch Targets

Acciones deben tener áreas de toque adecuadas.

Evitar iconos diminutos como única acción.

---

# 120. Responsive Tables

En mobile:

```text
table
→
stacked list
```

si una tabla requiere scroll horizontal excesivo.

---

# 121. Desktop vs Mobile Density

Desktop puede mostrar más metadata.

Mobile debe priorizar:

```text
description

amount

status

date
```

---

# 122. UI Component Inventory

Componentes reutilizables iniciales:

```text
AppShell

Sidebar

MobileNavigation

PageHeader

MoneyAmount

FinancialMetricCard

AccountCard

TransactionRow

TransactionTable

StatusBadge

EmptyState

FormField

MoneyInput

AccountSelect

CategorySelect

DateField

ConfirmDialog
```

---

# 123. Future Components

Cuando lleguen deudas/planning:

```text
DebtCard

InstallmentRow

UpcomingPaymentRow

CashflowTimeline

BudgetCard

ProgressAmount

AllocationEditor
```

---

# 124. MoneyAmount

Componente central.

Props conceptuales:

```ts
MoneyAmount {
  amount
  currency
  signMode?
  size?
}
```

Debe centralizar:

```text
formatting

currency display

sign
```

---

# 125. MoneyAmount Does Not Decide Meaning

El componente no decide:

```text
green = positive
red = negative
```

porque:

```text
debt reduction
```

puede ser económicamente positivo aunque sea cash outflow.

El contexto decide semántica visual.

---

# 126. StatusBadge

Estados soportados evolucionan según feature.

Debe usar variantes semánticas, no nombres de color.

Ejemplo:

```text
neutral

success

warning

critical

info
```

---

# 127. FinancialMetricCard

Props conceptuales:

```ts
{
  label
  value
  context?
  breakdown?
  action?
}
```

---

# 128. EmptyState

Props:

```text
title

description

optional icon

optional action
```

---

# 129. UI Data Boundary

Los componentes no deben recalcular lógica financiera.

Mal:

```text
component sums transaction amounts
```

Bien:

```text
component receives monthlyExpense
```

calculado por application/finance layer.

---

# 130. UI Does Not Infer Financial Status

Ejemplo:

La UI no debe hacer:

```text
if dueDate < today → overdue
```

si el backend ya tiene reglas completas sobre:

```text
remaining amount

timezone

cancelled state
```

Debe recibir:

```text
status = OVERDUE
```

---

# 131. Client vs Server Components

Preferir Server Components para:

```text
page data

lists

dashboard summaries
```

Client Components únicamente donde exista:

```text
interaction

form state

dialogs

filters requiring client behavior
```

---

# 132. Form State

Usar una estrategia consistente.

No tener cada feature con un patrón distinto para:

```text
pending

errors

success
```

---

# 133. URL State

Filtros y navegación relevante deberían usar URL cuando aporte:

```text
shareability

back button

refresh persistence
```

---

# 134. Toast Policy

Toast para:

```text
small successful mutation

non-blocking feedback
```

No usar toast como único lugar donde explicar un error financiero serio.

---

# 135. Modal Policy

Dialogs para operaciones cortas.

No meter formularios enormes en modal.

---

# 136. Debt Creation UI

Cuando se implemente deuda compleja, preferir flujo por pasos:

```text
Debt Details

Installment Setup

Review

Confirm
```

en lugar de un formulario gigante.

---

# 137. Installment Preview

Antes de crear deuda:

```text
Cuota 1 · 15 Ago · $100.000

Cuota 2 · 15 Sep · $100.000

...
```

Debe permitir revisar y modificar.

---

# 138. Financial Review Screens

Antes de acciones complejas como:

```text
large debt creation

manual payment allocation
```

mostrar resumen antes de confirmar.

---

# 139. UI Copy Principle

Preferir lenguaje humano.

Ejemplo:

```text
Dinero en cuentas
```

en lugar de:

```text
Liquid Assets
```

para usuario general.

---

# 140. Technical Vocabulary Boundary

Terminología como:

```text
liability settlement

posted transaction

allocation
```

puede existir internamente.

No necesariamente debe aparecer en UI.

---

# 141. Suggested User Vocabulary

```text
Cuenta

Movimiento

Ingreso

Gasto

Transferencia

Deuda

Cuota

Pago

Próximo vencimiento

Programado

Presupuesto

Disponible estimado
```

---

# 142. Explainability Links

Métricas importantes pueden tener:

```text
View details
```

Ejemplo:

```text
Deuda pendiente
$680.000

[View details]
```

---

# 143. Avoid Dashboard Overload

No mostrar inicialmente:

```text
20 cards

8 charts

10 percentages
```

El dashboard debe seguir siendo escaneable.

---

# 144. Charts Policy

Gráficos solo cuando responden una pregunta concreta.

Buenos ejemplos:

```text
Spending by category

Income vs expense over time

Cashflow balance over time

Debt reduction
```

---

# 145. Bad Chart Example

No agregar donut simplemente porque existe:

```text
account type distribution
```

si no ayuda a tomar decisiones.

---

# 146. Chart Accessibility

Todo gráfico necesita alternativa textual o tabla resumida para información relevante.

---

# 147. Dashboard Chart Priority

MVP:

```text
no chart required
```

La timeline de cashflow puede ser más útil inicialmente.

---

# 148. Dark Mode

Opcional.

No debe retrasar el MVP.

Si el starter ya lo soporta correctamente, puede mantenerse.

---

# 149. Theme Tokens

Usar tokens del sistema/component library.

Evitar estilos inline repetidos.

---

# 150. Semantic Tokens

Conceptualmente:

```text
background

surface

muted

border

text

positive

warning

critical

info
```

No atar componentes directamente a valores visuales específicos cuando sea evitable.

---

# 151. UI Test Strategy

Testing enfocado en comportamiento.

Ejemplos:

```text
user can create account

user can add expense

form displays validation

void requires confirmation

dashboard displays returned values
```

---

# 152. Do Not Test Finance Math in UI

No repetir toda la suite del finance engine en tests de componentes.

UI testea:

```text
presentation

interaction

correct wiring
```

Finance package testea matemática.

---

# 153. Critical Responsive Tests

Verificar:

```text
Dashboard mobile

Transaction list mobile

Add transaction mobile

Accounts mobile
```

---

# 154. Critical Accessibility Tests

Verificar:

```text
form labels

dialog focus

keyboard submit

error messages

navigation
```

---

# 155. First Slice UI Deliverables

Para `Accounts + Transactions` implementar:

```text
App Shell

Desktop Sidebar

Mobile Navigation

Dashboard V0

Accounts List

New Account Form

Account Detail

Transactions List

Add Transaction Form

Transaction Detail

Category Management

Empty States

Loading States

Error States
```

---

# 156. First Slice Component Set

Crear inicialmente:

```text
MoneyAmount

PageHeader

FinancialMetricCard

AccountCard

TransactionRow

TransactionTable

MoneyInput

AccountSelect

CategorySelect

StatusBadge

EmptyState

ConfirmDialog
```

---

# 157. UI Definition of Done

Una pantalla se considera terminada cuando:

```text
works on desktop

works on mobile

has loading state

has empty state

has error state

has accessible controls

uses shared money formatting

does not recalculate domain logic
```

---

# 158. Financial UI Definition of Done

Toda métrica financiera visible debe responder:

```text
What does this number mean?

What period does it cover?

What currency is it in?

Can the user understand where it came from?
```

---

# 159. MVP UX Goal

El usuario debería poder registrar un gasto cotidiano en pocos segundos.

Flujo ideal:

```text
Open app

↓

Add Transaction

↓

Expense

↓

Amount

↓

Account

↓

Category

↓

Save
```

---

# 160. Dashboard UX Goal

Al abrir la aplicación, el usuario debe captar su situación financiera sin tener que interpretar una interfaz compleja.

---

# 161. Final UI Principle

La interfaz debe priorizar:

```text
clarity
+
trust
+
speed
+
explainability
```

sobre:

```text
visual complexity
+
decorative analytics
```

---

# 162. Implementation Rule

Después de este documento:

```text
do not create more global UI architecture documents
```

Los detalles adicionales se documentarán solamente cuando una feature real lo requiera.

---

# 163. Next Step

El siguiente paso es implementar el primer vertical slice:

```text
Accounts
+
Categories
+
Transactions
+
Balances
+
Dashboard V0
```

siguiendo:

```text
00-product-foundation.md

01-domain-model.md

02-database-schema.md

03-money-debt-engine.md

04-projections-and-cashflow.md

05-mvp-roadmap.md

06-accounts-transactions-vertical-slice.md

07-ui-system.md
```
