# KNOWLEDGE FINANCE — DESIGN SYSTEM

## 1. Visión del sistema

KNOWLEDGE Finance es una aplicación de finanzas personales cuya interfaz debe transmitir:

* claridad
* control
* confianza
* sofisticación
* precisión
* simplicidad
* estabilidad

La experiencia visual debe sentirse:

**minimalista + moderna + premium + financiera**

El usuario debería poder interpretar rápidamente:

* cuánto dinero tiene
* cuánto gastó
* cuánto ingresó
* cómo evoluciona su patrimonio
* qué categorías concentran sus gastos
* cuánto está ahorrando
* qué compromisos financieros tiene próximos
* qué acciones requieren atención

La interfaz no debe parecer:

* una app bancaria corporativa tradicional
* una plataforma de trading
* una aplicación contable
* una dashboard sobrecargada
* una fintech llena de colores

El concepto visual debe ser:

> “Calma financiera mediante claridad visual.”

---

# 2. Principios de diseño

## 2.1 Claridad antes que decoración

Cada elemento debe tener una función.

Evitar:

* gradientes innecesarios
* sombras exageradas
* demasiados colores
* bordes decorativos
* gráficos excesivamente complejos
* tarjetas dentro de tarjetas
* información secundaria compitiendo con KPIs

---

## 2.2 Jerarquía financiera

La información monetaria debe dominar visualmente.

Ejemplo:

Saldo total

$ 3.845.320

+4,8% este mes

El importe debe ser el elemento principal.

El porcentaje y contexto deben ser secundarios.

---

## 2.3 Color semántico

El azul representa KNOWLEDGE.

El verde NO representa la marca.

Debe utilizarse solamente para:

* ingresos
* rendimientos positivos
* objetivos alcanzados
* estados positivos

El rojo debe reservarse para:

* pérdidas
* gastos críticos
* errores
* estados destructivos

---

## 2.4 Progressive disclosure

No mostrar todo al mismo tiempo.

La pantalla principal muestra:

* información importante
* tendencias
* alertas
* acciones principales

El detalle aparece cuando el usuario profundiza.

---

# 3. Color System

## Brand — Knowledge Blue

El azul es el núcleo visual del producto.

Paleta propuesta:

```css
--blue-50:  #EFF6FF;
--blue-100: #DBEAFE;
--blue-200: #BFDBFE;
--blue-300: #93C5FD;
--blue-400: #60A5FA;
--blue-500: #3B82F6;
--blue-600: #2563EB;
--blue-700: #1D4ED8;
--blue-800: #1E40AF;
--blue-900: #1E3A8A;
--blue-950: #172554;
```

### Brand principal

```css
--brand: #2563EB;
```

### Brand hover

```css
--brand-hover: #1D4ED8;
```

### Brand subtle

```css
--brand-subtle: #EFF6FF;
```

### Brand border

```css
--brand-border: #BFDBFE;
```

Si KNOWLEDGE ya dispone de un HEX corporativo exacto, ese color deberá reemplazar `blue-600` y la escala deberá regenerarse alrededor de él.

---

# 4. Neutral System

Una aplicación financiera premium necesita una base neutra muy limpia.

## Light mode

```css
--background: #F8FAFC;
--surface: #FFFFFF;

--surface-secondary: #F8FAFC;
--surface-tertiary: #F1F5F9;

--foreground: #0F172A;
--foreground-secondary: #475569;
--foreground-muted: #64748B;

--border: #E2E8F0;
--border-subtle: #F1F5F9;
--border-strong: #CBD5E1;
```

La interfaz general nunca debería utilizar blanco puro indiscriminadamente.

El fondo global será ligeramente gris:

```text
#F8FAFC
```

y las superficies importantes:

```text
#FFFFFF
```

Esto crea profundidad sin depender excesivamente de sombras.

---

# 5. Colores financieros

Estos colores tienen significado funcional.

No utilizarlos decorativamente.

## Income / Positive

```css
--success: #16A34A;
--success-soft: #F0FDF4;
--success-border: #BBF7D0;
```

Uso:

* ingresos
* rentabilidad positiva
* crecimiento
* objetivo conseguido

---

## Expense / Negative

```css
--negative: #DC2626;
--negative-soft: #FEF2F2;
--negative-border: #FECACA;
```

Uso:

* gastos
* pérdidas
* caída
* errores

---

## Warning

```css
--warning: #D97706;
--warning-soft: #FFFBEB;
--warning-border: #FDE68A;
```

Uso:

* presupuesto próximo al límite
* vencimientos
* advertencias

---

## Informational

```css
--info: #2563EB;
--info-soft: #EFF6FF;
```

---

# 6. Regla fundamental de color financiero

No pintar todo un importe.

Preferir:

```text
+ $250.000
```

con el `+` o indicador semántico verde cuando la jerarquía lo permita.

Evitar convertir dashboards enteros en:

* verde
* rojo
* amarillo

Los neutros deben representar aproximadamente el 80–90% de la interfaz.

---

# 7. Dark Mode

Paleta recomendada:

```css
--background: #090E1A;

--surface: #0F172A;
--surface-secondary: #111C2E;
--surface-tertiary: #172033;

--foreground: #F8FAFC;
--foreground-secondary: #CBD5E1;
--foreground-muted: #94A3B8;

--border: #1E293B;
--border-subtle: #172033;
--border-strong: #334155;
```

Knowledge Blue deberá aumentar ligeramente su luminosidad:

```css
--brand: #3B82F6;
--brand-hover: #60A5FA;
```

Evitar:

```text
#000000
```

como fondo general.

El azul-negro genera una estética mucho más sofisticada.

---

# 8. Tipografía

## Fuente principal

Recomendación:

```text
Inter
```

Alternativa premium:

```text
Geist
```

Para Next.js recomiendo especialmente:

```text
Geist Sans
```

por su excelente funcionamiento en interfaces modernas.

---

# 9. Tipografía financiera

Los números tienen un papel especialmente importante.

Usar:

```css
font-variant-numeric: tabular-nums;
```

en:

* dinero
* porcentajes
* tablas financieras
* KPIs
* balances
* presupuestos

Esto evita que los números cambien de ancho visual.

---

# 10. Escala tipográfica

## Display financiera

```text
36px / 40px
font-weight: 600
letter-spacing: -0.03em
```

Uso:

Saldo total.

---

## H1

```text
30px / 36px
font-weight: 600
letter-spacing: -0.025em
```

---

## H2

```text
24px / 32px
font-weight: 600
```

---

## H3

```text
20px / 28px
font-weight: 600
```

---

## Body Large

```text
16px / 24px
```

---

## Body

```text
14px / 20px
```

Será el tamaño predominante de la aplicación.

---

## Small

```text
13px / 18px
```

---

## Caption

```text
12px / 16px
```

---

# 11. Pesos

Limitar principalmente a:

```text
400 Regular
500 Medium
600 Semibold
```

Evitar abusar de `700`.

Una interfaz premium necesita jerarquía, no peso visual excesivo.

---

# 12. Spacing System

Usar escala de 4px.

```text
1  = 4px
2  = 8px
3  = 12px
4  = 16px
5  = 20px
6  = 24px
8  = 32px
10 = 40px
12 = 48px
16 = 64px
```

No utilizar:

```text
13px
18px
22px
27px
```

salvo casos extremadamente justificados.

---

# 13. Layout

## Desktop

Sidebar:

```text
240px
```

o versión compacta:

```text
72px
```

Contenido:

```text
max-width: 1600px
```

Padding:

```text
24–32px
```

---

## Tablet

Padding:

```text
24px
```

---

## Mobile

Padding:

```text
16px
```

---

# 14. Grid

Dashboard:

```text
12-column grid
```

Separación:

```text
gap-6
```

Las cards principales deberán adaptarse mediante:

```text
1 columna mobile
2 columnas tablet
4 columnas desktop
```

cuando corresponda.

---

# 15. Border Radius

Una estética moderna pero no excesivamente “bubble”.

## Base

```css
--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
```

Uso recomendado:

Buttons:

```text
8px
```

Inputs:

```text
8px
```

Cards:

```text
12px
```

Dialogs:

```text
16px
```

No utilizar sistemáticamente:

```text
rounded-3xl
```

---

# 16. Borders

Border principal:

```text
1px solid var(--border)
```

Las interfaces deberían utilizar bordes para definir superficies antes que sombras.

---

# 17. Shadows

Muy sutiles.

## Small

```css
0 1px 2px rgba(15, 23, 42, 0.04)
```

## Medium

```css
0 4px 12px rgba(15, 23, 42, 0.06)
```

## Floating

```css
0 12px 32px rgba(15, 23, 42, 0.10)
```

Uso:

* dropdown
* dialog
* floating components

Las cards normales no necesitan sombras fuertes.

---

# 18. Iconografía

Recomendación:

```text
Lucide Icons
```

Usar una sola familia.

Tamaños:

```text
16px → controles pequeños
18px → botones
20px → navegación
24px → feature/icon
```

Stroke recomendado:

```text
1.75–2
```

---

# 19. Buttons

Basado en shadcn/ui.

## Primary

Background:

```text
Knowledge Blue
```

Uso:

acción principal.

Ejemplos:

```text
Agregar movimiento
Crear presupuesto
Registrar ingreso
```

---

## Secondary

Superficie neutra.

Uso:

acciones secundarias.

---

## Outline

Para acciones de menor jerarquía.

---

## Ghost

Uso principal:

* toolbar
* tablas
* icon actions
* navegación

---

## Destructive

Rojo.

Únicamente para:

```text
Eliminar
Cancelar permanentemente
Restablecer datos
```

---

# 20. Alturas

Small:

```text
32px
```

Default:

```text
40px
```

Large:

```text
44px
```

Evitar botones gigantes en interfaces de productividad.

---

# 21. Inputs

Default:

```text
height: 40px
border-radius: 8px
```

Focus:

```text
Knowledge Blue
```

Nunca eliminar `focus-visible`.

---

# 22. Currency Input

Debe existir un componente específico:

```text
CurrencyInput
```

Ejemplo:

```text
$ 125.000,00
```

Debe soportar:

* moneda
* separadores
* decimales
* valores negativos
* formateo local

---

# 23. Cards

## Base Card

```text
background: surface
border: border
radius: 12px
padding: 20–24px
```

---

# 24. Balance Card

Componente central.

Debe mostrar:

```text
Saldo total
$3.845.320

+$182.400 este mes
+4,98%
```

Puede utilizar una presencia ligeramente mayor de Knowledge Blue.

Pero evitar convertirla en una card completamente azul salvo que sea una decisión deliberada para una pantalla específica.

---

# 25. KPI Card

Ejemplo:

```text
Ingresos
$920.500
↑ 12,4%
```

Debe existir un único componente:

```text
MetricCard
```

Props potenciales:

```text
label
value
change
trend
icon
comparison
```

---

# 26. Transaction Card / Row

Debe mostrar:

```text
Netflix

Entretenimiento
10 ago

-$12.499
```

Jerarquía:

1. comercio/concepto
2. importe
3. categoría
4. fecha

---

# 27. Categorías financieras

No utilizar colores completamente aleatorios.

Construir una paleta secundaria controlada.

Ejemplo:

```text
Housing        Indigo
Food           Orange
Transport      Cyan
Entertainment  Purple
Health         Rose
Education      Blue
Shopping       Amber
Subscriptions  Violet
Income         Green
Other          Slate
```

Utilizar estos colores principalmente en:

* pequeños indicators
* chart segments
* icons
* category badges

No en backgrounds grandes.

---

# 28. Badges

Variantes:

```text
default
secondary
success
warning
destructive
outline
```

Altura aproximada:

```text
24px
```

---

# 29. Tables

Utilizar:

```text
shadcn/ui Table
```

pero construir encima:

```text
DataTable
```

para necesidades financieras.

Debe soportar:

* sorting
* filters
* pagination
* search
* selection
* column visibility
* responsive strategy

---

# 30. Tabla de movimientos

Columnas desktop:

```text
Fecha
Descripción
Categoría
Cuenta
Tipo
Monto
Acciones
```

El monto debe estar alineado a la derecha.

Utilizar:

```text
tabular-nums
```

---

# 31. Charts

La visualización financiera debe ser extremadamente limpia.

Evitar rainbow charts.

Paleta primaria:

```text
Knowledge Blue
Blue 400
Blue 300
Slate
```

Colores semánticos:

```text
green → positive
red → negative
amber → warning
```

---

# 32. Line Chart

Ideal para:

```text
Patrimonio
Saldo
Ingresos
Gastos históricos
```

Knowledge Blue como serie principal.

---

# 33. Bar Chart

Ideal para:

```text
Ingresos vs gastos
Presupuesto vs gasto
Comparativas mensuales
```

---

# 34. Donut Chart

Uso limitado:

```text
Distribución de gastos
```

Máximo recomendado:

```text
5–7 categorías visibles
```

Agrupar el resto como:

```text
Otros
```

---

# 35. Tooltips financieros

Ejemplo:

```text
Marzo 2026

Ingresos
$820.400

Gastos
$640.200

Balance
+$180.200
```

Siempre usar números completos en tooltip.

---

# 36. Sidebar

Desktop:

```text
Overview
Movimientos
Cuentas
Presupuestos
Objetivos
Reportes
```

Separación visual.

Luego:

```text
Configuración
```

---

# 37. Active Navigation

No utilizar grandes bloques azules.

Preferir:

```text
background: blue-50
text: blue-700
icon: blue-600
```

En dark mode:

```text
background: blue / 10–15%
```

---

# 38. Header

Debe contener únicamente información contextual.

Ejemplo:

```text
Dashboard

Agosto 2026          + Nuevo movimiento
```

Evitar headers excesivamente altos.

---

# 39. Page Header

Construir:

```text
PageHeader
```

Props:

```text
title
description
actions
breadcrumbs
```

---

# 40. Search

Componente:

```text
SearchInput
```

Icono izquierda.

Opcional:

```text
⌘ K
```

como shortcut.

---

# 41. Command Palette

Utilizar:

```text
shadcn/ui Command
```

Acciones:

```text
Ir a movimientos
Agregar gasto
Agregar ingreso
Crear presupuesto
Buscar transacción
Ir a cuenta
```

Esto reforzará la sensación premium/productiva.

---

# 42. Dialogs

Usar:

```text
Dialog
```

para formularios normales.

Ejemplo:

```text
Agregar movimiento
Editar cuenta
Crear categoría
```

---

# 43. Alert Dialog

Usar exclusivamente para acciones destructivas.

Ejemplo:

```text
¿Eliminar esta cuenta?
```

---

# 44. Sheet

Ideal para:

* filtros
* detalles de transacciones
* mobile navigation
* configuraciones rápidas

---

# 45. Popover

Utilizar para:

* date selectors
* account selectors
* category selectors
* pequeños filtros

---

# 46. Forms

Arquitectura recomendada:

```text
React Hook Form
+
Zod
+
shadcn Form
```

Todos los formularios deben utilizar componentes compartidos.

---

# 47. Form Field

Estructura:

```text
Label

[ Input ]

Helper text

Error
```

Nunca utilizar exclusivamente placeholder como label.

---

# 48. Estados

Todo componente asíncrono debe considerar:

```text
idle
loading
success
error
empty
```

---

# 49. Loading

Preferir:

```text
Skeleton
```

sobre spinners.

Especialmente para:

* dashboard
* cards
* tablas
* charts

---

# 50. Empty States

Ejemplo:

```text
No tenés movimientos todavía.

Registrá tu primer ingreso o gasto para comenzar
a entender tus finanzas.

[ Agregar movimiento ]
```

Debe orientar hacia una acción.

---

# 51. Error States

Evitar:

```text
Error 500
```

como única información.

Mostrar:

```text
No pudimos cargar tus movimientos.

[ Reintentar ]
```

---

# 52. Toasts

Usar:

```text
Sonner
```

Casos:

```text
Movimiento creado
Presupuesto actualizado
Cuenta eliminada
Error al guardar cambios
```

---

# 53. Financial Actions

Diferenciar claramente:

```text
Ingreso
Gasto
Transferencia
```

Pero no depender exclusivamente del color.

Utilizar también:

* iconografía
* labels
* signos + / -

---

# 54. Transactions

Ingreso:

```text
+$250.000
```

Gasto:

```text
-$32.500
```

Transferencia:

```text
$100.000
```

con icono específico.

---

# 55. Presupuestos

Componente:

```text
BudgetProgress
```

Ejemplo:

```text
Restaurantes

$72.400 de $100.000

████████░░ 72%

Quedan $27.600
```

---

# 56. Estados de presupuesto

Normal:

```text
Knowledge Blue
```

Advertencia:

```text
Amber
```

Superado:

```text
Red
```

No utilizar verde para progreso normal.

---

# 57. Goals

Componente:

```text
SavingsGoal
```

Ejemplo:

```text
Viaje

$1.250.000
de $2.000.000

62%
```

Puede utilizar Knowledge Blue como progreso.

---

# 58. Account Card

Ejemplo:

```text
Cuenta principal

Banco

$1.850.400
```

Las cuentas NO necesitan recrear tarjetas bancarias visualmente.

Mantener estética funcional.

---

# 59. Responsive Strategy

Mobile-first.

## Mobile

Priorizar:

```text
saldo
acciones
movimientos
presupuesto
```

Dashboard:

```text
1 columna
```

---

## Tablet

```text
2 columnas
```

---

## Desktop

```text
4 KPI columns
```

y grids financieros según jerarquía.

---

# 60. Mobile Navigation

En mobile evaluar navegación inferior:

```text
Inicio
Movimientos
Agregar
Presupuesto
Más
```

El botón central puede representar:

```text
+
```

para registrar rápidamente una operación.

---

# 61. Motion

Animaciones discretas.

Duración:

```text
150–250ms
```

Curva:

```text
ease-out
```

Usar para:

* hover
* dropdown
* dialog
* sidebar
* charts

Evitar animaciones decorativas permanentes.

---

# 62. Accessibility

Objetivo mínimo:

```text
WCAG 2.2 AA
```

Debe existir:

* contraste adecuado
* keyboard navigation
* `focus-visible`
* labels
* aria labels
* headings jerárquicos
* tooltips accesibles
* dialogs accesibles
* errores descriptivos

---

# 63. Focus Ring

Estándar:

```text
2px Knowledge Blue
+
2px offset
```

Debe ser claramente visible.

---

# 64. Touch Targets

Mobile:

mínimo recomendado:

```text
44 × 44px
```

---

# 65. shadcn/ui — componentes base

Adoptar inicialmente:

```text
Alert
AlertDialog
Avatar
Badge
Breadcrumb
Button
Card
Checkbox
Command
Dialog
DropdownMenu
Form
Input
Label
Pagination
Popover
Progress
RadioGroup
Select
Separator
Sheet
Skeleton
Switch
Table
Tabs
Textarea
Tooltip
```

Además:

```text
Sonner
```

---

# 66. Componentes propios

shadcn/ui debe ser la infraestructura, no todo el design system.

Construir componentes de dominio propios.

## Layout

```text
AppShell
Sidebar
Topbar
PageContainer
PageHeader
SectionHeader
```

## Financial

```text
BalanceCard
MetricCard
TransactionRow
TransactionList
Money
PercentageChange
BudgetProgress
SavingsGoal
AccountCard
CategoryBadge
FinancialChart
```

## Data

```text
DataTable
TableToolbar
FilterBar
SearchInput
DateRangePicker
PaginationControls
```

## Feedback

```text
EmptyState
ErrorState
LoadingState
ConfirmDialog
```

---

# 67. Money Component

Debe existir un componente central:

```tsx
<Money
  value={3845320}
  currency="ARS"
  variant="balance"
/>
```

Responsable de:

* formato
* moneda
* precisión
* locale
* signos
* tabular numbers

No formatear dinero manualmente en cada pantalla.

---

# 68. PercentageChange

Ejemplo:

```tsx
<PercentageChange value={4.8} />
```

Resultado:

```text
↑ 4,8%
```

Debe manejar:

```text
positive
negative
neutral
```

---

# 69. CategoryBadge

Ejemplo:

```text
● Restaurantes
```

No usar badges saturados completos.

Preferir color únicamente en:

```text
dot
icon
border sutil
```

---

# 70. Dashboard recomendado

Estructura:

```text
PageHeader

Balance Overview

┌──────────┬──────────┬──────────┬──────────┐
│ Balance  │ Ingresos │ Gastos   │ Ahorro   │
└──────────┴──────────┴──────────┴──────────┘

┌─────────────────────────────┬──────────────┐
│ Evolución financiera        │ Presupuestos │
│                             │              │
└─────────────────────────────┴──────────────┘

┌─────────────────────────────┬──────────────┐
│ Últimos movimientos         │ Gastos       │
│                             │ por categoría│
└─────────────────────────────┴──────────────┘
```

---

# 71. Screen Density

Desktop puede utilizar densidad media.

La información financiera necesita mostrar suficientes datos sin parecer una planilla Excel.

Recomendación:

Cards:

```text
20–24px padding
```

Tables:

```text
48–52px row height
```

---

# 72. Financial Privacy

Considerar una funcionalidad:

```text
Hide balances
```

Icono:

```text
Eye / EyeOff
```

Ejemplo:

```text
$ ••••••
```

Debe afectar todos los importes sensibles de forma consistente.

---

# 73. Number Formatting

Para Argentina:

```text
$ 1.250.000,50
```

No:

```text
$1,250,000.50
```

El sistema debe respetar locale.

---

# 74. Dates

Formato principal:

```text
10 ago 2026
```

Formatos relativos:

```text
Hoy
Ayer
```

solo cuando aporten claridad.

---

# 75. Financial Hierarchy

Ejemplo correcto:

```text
Patrimonio neto

$ 8.450.200

+$320.450 este mes
↑ 3,9%
```

No colocar todos los textos con igual peso.

---

# 76. Design Tokens

La aplicación debe evitar valores directos como:

```text
bg-blue-600
text-slate-700
border-slate-200
```

en componentes de dominio.

Preferir:

```text
bg-primary
text-foreground
text-muted-foreground
border-border
bg-card
text-destructive
```

---

# 77. Semantic Tokens

Base:

```css
--background
--foreground

--card
--card-foreground

--popover
--popover-foreground

--primary
--primary-foreground

--secondary
--secondary-foreground

--muted
--muted-foreground

--accent
--accent-foreground

--destructive
--destructive-foreground

--border
--input
--ring
```

---

# 78. Financial Tokens

Agregar:

```css
--financial-positive
--financial-positive-soft

--financial-negative
--financial-negative-soft

--financial-warning
--financial-warning-soft

--financial-neutral
```

---

# 79. Chart Tokens

```css
--chart-1
--chart-2
--chart-3
--chart-4
--chart-5
```

pero derivados de una paleta controlada.

---

# 80. Tailwind

Evitar valores arbitrarios:

```text
w-[437px]
p-[19px]
text-[13px]
rounded-[11px]
```

salvo que exista justificación.

El diseño debe surgir principalmente de:

```text
tokens
+
Tailwind scale
+
component variants
```

---

# 81. Variants

Utilizar:

```text
class-variance-authority
```

para componentes con múltiples variantes.

Especialmente:

```text
Button
Badge
MetricCard
Money
CategoryBadge
Status
```

---

# 82. cn()

Todos los componentes deberían utilizar una utilidad compartida:

```ts
cn()
```

basada en:

```text
clsx
+
tailwind-merge
```

---

# 83. Component Philosophy

Dividir claramente:

```text
components/ui/
```

Primitivos genéricos basados en shadcn.

```text
components/shared/
```

Patrones reutilizables de aplicación.

```text
components/finance/
```

Componentes específicos del dominio financiero.

---

# 84. Arquitectura sugerida

```text
components/

  ui/
    button.tsx
    card.tsx
    dialog.tsx
    dropdown-menu.tsx
    input.tsx
    select.tsx
    table.tsx
    tabs.tsx
    tooltip.tsx

  layout/
    app-shell.tsx
    sidebar.tsx
    topbar.tsx
    page-header.tsx

  shared/
    empty-state.tsx
    error-state.tsx
    search-input.tsx
    filter-bar.tsx
    data-table.tsx

  finance/
    money.tsx
    balance-card.tsx
    metric-card.tsx
    transaction-row.tsx
    account-card.tsx
    budget-progress.tsx
    savings-goal.tsx
    percentage-change.tsx
    category-badge.tsx
```

---

# 85. Qué NO hacer

Evitar:

* gradients por todas partes
* glassmorphism generalizado
* neon
* sombras fuertes
* tarjetas excesivamente redondeadas
* colores saturados por categoría
* fondos completamente azules
* interfaces excesivamente blancas
* textos negros puros
* iconos de múltiples familias
* tamaños arbitrarios
* spacing arbitrario
* componentes únicos para cada pantalla
* CSS manual duplicado
* modales creados manualmente
* dropdowns custom sin accesibilidad
* tablas distintas para cada sección

---

# 86. Firma visual KNOWLEDGE

La identidad de KNOWLEDGE debe aparecer mediante:

```text
Knowledge Blue
+
tipografía precisa
+
espaciado generoso
+
neutros fríos
+
bordes finos
+
microinteracciones
+
jerarquía numérica
```

No mediante decoración excesiva.

---

# 87. Sensación objetivo

La combinación visual debería acercarse conceptualmente a productos como:

```text
Linear
+
Stripe
+
modern fintech
+
personal finance dashboard
```

pero conservando una identidad propia de KNOWLEDGE basada en azul.

No copiar interfaces específicas.

Tomar como referencia únicamente:

* claridad
* densidad
* jerarquía
* precisión
* sofisticación

---

# 88. Design System Score objetivo

Al finalizar la migración, el frontend debería aspirar a:

```text
Consistencia visual       9+/10
Accesibilidad             9+/10
Reutilización             9+/10
Responsive                9+/10
Mantenibilidad            9+/10
Claridad financiera       10/10
Design System             9+/10
```

---

# 89. Principio final

Ante cualquier decisión visual preguntarse:

> ¿Esto ayuda al usuario a comprender mejor su situación financiera?

Si la respuesta es no, probablemente no debería estar en la interfaz.

La estética premium de KNOWLEDGE debe provenir principalmente de:

**precisión, jerarquía, consistencia y simplicidad.**

No de agregar más elementos visuales.
