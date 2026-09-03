Personal Finance — Visual Design System

Status: Baseline visual design specification
Purpose: Consolidate and lock the visual language used across the dashboard screens already defined for Resumen, Cuentas, Transacciones, Presupuestos, Obligaciones, Calendario, Metas, Reportes e Insights.
Brand reference: KNOW / Knowledge, Connected — Brand Guidelines
Product reference: Personal Finance — Product Foundation

1. Visual direction

The product should feel like a personal financial control system, not an expense tracker and not a banking clone.

The interface must communicate:

clarity;

control;

trust;

financial visibility;

calm decision-making;

future awareness;

precision without visual heaviness.

The visual language inherits the KNOW system:

bright, high-key surfaces;

cobalt blue as the principal identity accent;

deep neutral typography;

translucent / atmospheric blue imagery used sparingly;

thin geometric iconography;

soft glass-like panels where useful;

strong hierarchy through spacing rather than decoration;

clean editorial composition;

modular card architecture.

The product must avoid the typical visual codes of aggressive fintech products:

no neon gradients;

no dark trading-terminal aesthetics by default;

no excessive green/red saturation;

no crypto-style visual noise;

no heavy shadows;

no skeuomorphic banking cards as the dominant UI language.

2. Design principles

2.1 Clarity before density

Financial information must be readable in seconds.

Every screen should prioritize:

current financial state;

future obligations;

decision-relevant metrics;

secondary detail;

actions.

Avoid presenting too many metrics with equal visual weight.

2.2 Calm financial interface

The product should reduce anxiety rather than amplify it.

Use:

white and warm-light surfaces;

generous spacing;

restrained status colors;

soft dividers;

short labels;

plain-language explanations.

2.3 Explainable numbers

Important financial figures must visually suggest that they can be inspected.

Recommended patterns:

info icon next to metric titles;

“Ver detalle” or chevron affordance;

breakdown drawer / details panel;

supporting subtitle explaining what the number means.

2.4 Future-aware design

The interface must visually distinguish:

posted / actual values;

scheduled values;

obligations;

projections.

Projected values should never look identical to source-of-truth balances.

Recommended convention:

solid line = actual;

dotted / dashed line = projected;

muted background = scheduled / future;

warning accent = overdue / risk.

2.5 Consistency across modules

All product areas must feel like one application.

The following remain stable across views:

sidebar;

header rhythm;

card radius;

card shadow;

typography;

data table style;

button language;

status chips;

icon containers;

chart conventions;

spacing scale.

3. Brand translation into product UI

3.1 Core brand traits

The finance product should retain the KNOW visual system through:

cobalt blue accents;

Satoshi as the primary typeface;

white / warm-white dominant backgrounds;

black / charcoal primary text;

soft gray structure;

blurred atmospheric blue imagery as an optional supporting motif;

thin-line iconography;

geometric alignment;

large negative space;

modular editorial framing.

3.2 Color balance

Use the brand system proportionally rather than painting the entire interface blue.

Recommended UI ratio:

55% white / warm white;

20% light gray surfaces;

15% cobalt / deep blue accents;

10% dark text / structural neutrals.

Status colors are additive semantic colors and must remain visually subordinate.

4. Color system

Final production values should map to the canonical KNOW brand tokens. The following names define the product-side usage model.

4.1 Brand colors

Token

Role

brand.cobalt

Primary CTA, active navigation, key chart series, selected state

brand.deepBlue

Depth, emphasis, high-contrast brand accents

brand.electricBlue

Secondary highlight, hover, focus, chart variation

brand.paleBlue

Selected surfaces, atmospheric backgrounds, subtle cards

neutral.black

Primary text

neutral.charcoal

Secondary dark text

neutral.mid

Muted labels, borders

neutral.light

Dividers, inactive controls

surface.base

Main app background

surface.card

Primary cards

surface.soft

Subtle grouped areas

4.2 Semantic colors

Token

Meaning

success

Income, positive progress, paid, healthy

danger

Expense, overdue, debt warning, negative variance

warning

Due soon, budget risk, attention needed

info

Scheduled, neutral informational state

purple

Savings, goals, transfer or secondary analytical series

Semantic colors must not replace brand identity.

4.3 Usage rules

Blue remains the principal product color.

Green should mean positive financial state, not general navigation.

Red should be reserved for negative financial conditions or money outflows.

Orange is for warnings / approaching limits.

Purple is used sparingly for comparison series, goals, or secondary categories.

Pastel backgrounds are acceptable behind semantic icons and chips.

Avoid fully saturated large backgrounds.

5. Typography

5.1 Font family

Primary: Satoshi
Fallback: Inter, Arial, sans-serif only when Satoshi is unavailable.

5.2 Typographic character

The product uses:

clean geometric sans-serif forms;

high readability;

compact financial labels;

large numeric values;

restrained weights;

strong spacing rather than heavy boldness.

5.3 Recommended hierarchy

Style

Use

Display / 32–36

Screen title where needed

H1 / 28–32

Main page title

H2 / 20–24

Large card or section title

H3 / 16–18

Card title

Body / 14–16

Main interface copy

Small / 12–13

Metadata, dates, helper text

Micro / 11–12

Table labels, chip labels

Metric XL / 28–32

Primary KPI

Metric L / 22–26

Secondary KPI

5.4 Financial figures

Use tabular numerals if available.

Keep thousands separators consistent.

Currency symbol and value should remain on one line whenever possible.

Positive and negative signs should be explicit when meaningful.

Large numbers should not rely on color alone.

6. Spacing system

Use an 8-point grid.

Recommended scale:

4   micro
8   xs
12  sm
16  md
24  lg
32  xl
40  2xl
48  3xl
64  4xl

Layout rhythm

24–32 px between major cards;

16–24 px internal card padding;

12–16 px between label and metric;

8–12 px between tightly related metadata items.

7. App shell

7.1 Desktop structure

The canonical desktop layout is:

┌───────────────┬──────────────────────────────────────────┐
│ Sidebar       │ Main workspace                           │
│               │                                          │
│ Navigation    │ Header                                   │
│               │ KPI row                                  │
│               │ Primary content grid                     │
│               │ Secondary / detail modules               │
│ Profile       │                                          │
└───────────────┴──────────────────────────────────────────┘

7.2 Sidebar

Visual characteristics:

fixed left rail;

white / warm-white background;

subtle right divider;

brand symbol at top;

icon + label navigation;

active item uses pale-blue background and cobalt text;

thin cobalt indicator line at the right edge of active item;

user profile near bottom;

settings and sync actions below / near profile depending on screen height.

Canonical sections:

Resumen

Cuentas

Transacciones

Presupuestos

Obligaciones

Calendario

Metas

Reportes

Insights

7.3 Main header

Typical structure:

page title;

short plain-language subtitle;

date / period selector;

optional filtering;

notification icon;

primary page action where relevant.

Do not overfill the header.

8. Surface system

8.1 Primary cards

Cards are the core container language.

Characteristics:

white background;

14–18 px radius;

thin low-contrast border;

extremely soft shadow;

20–24 px internal padding;

no heavy outlines;

no strong gradients except in atmospheric / insight cards.

8.2 Soft cards

Used for:

recommendations;

insights;

informational summaries;

selected states.

Characteristics:

pale blue or low-opacity neutral surface;

optional blurred blue image motif;

lower information density.

8.3 Glass-like cards

Glassmorphism is permitted only where it supports the KNOW brand language.

Use for:

promotional / insight cards;

hero panels;

overlays;

optional smart recommendations.

Avoid using glass effects for dense financial tables.

9. Buttons

9.1 Primary

cobalt fill;

white label;

10–12 px radius;

medium weight;

optional leading plus icon.

Examples:

Nueva cuenta

Nueva transacción

Nuevo presupuesto

Nueva obligación

Nueva meta

9.2 Secondary

white surface;

neutral border;

dark text;

optional cobalt icon.

9.3 Tertiary

text only;

cobalt label;

optional chevron.

Examples:

Ver detalle

Ver todas

Ver calendario

Ver análisis completo

10. Inputs and filters

10.1 Search

white surface;

subtle gray border;

search icon on left;

10–12 px radius;

placeholder in muted gray.

10.2 Dropdowns / selectors

Use for:

period;

type;

account;

category;

status;

currency.

Maintain identical height and radius across screens.

10.3 Date selector

Use calendar icon + date text + chevron.

This control appears consistently in the top-right header region.

11. KPI cards

KPI cards are used at the top of data-heavy pages.

Anatomy

LABEL                  optional info icon
VALUE                  optional semantic icon
secondary explanation
trend / comparison
optional sparkline

Visual hierarchy

metric value;

label;

supporting context;

comparison / trend.

Rules

max 4 KPI cards per first row when possible;

avoid ambiguous metrics;

never show projected data without labeling it;

trends may use green/red but should remain secondary.

12. Tables

Tables are the primary detailed-data pattern for:

accounts;

transactions;

budgets;

obligations;

reports.

Table style

white card container;

compact header row;

muted uppercase / micro labels;

subtle horizontal dividers;

no heavy vertical lines;

row hover using pale-blue surface;

icon or color marker in first column where useful;

right-aligned financial values;

status chips instead of plain text where state matters;

chevron / overflow menu in final column.

Density

Desktop tables should remain readable at approximately 44–56 px row height.

13. Status chips

Use pill-shaped chips with soft background fills.

Examples:

Activa

Pasiva

Registrada

Programada

En control

En riesgo

Al límite

Vence pronto

Al día

Vencida

Pagada

Rules:

chip color must reinforce, not carry, the entire meaning;

text must remain readable in grayscale;

do not exceed 2–3 visual chip colors per local table view unless necessary.

14. Iconography

Use thin-line geometric icons consistent with KNOW.

Icon containers

Small semantic icons can sit inside:

32–40 px rounded-square containers;

soft pastel backgrounds;

cobalt / semantic foreground.

Common icon concepts

home / summary;

bank / account;

arrows / transfer;

wallet;

card;

calendar;

target;

report;

lightbulb / insight;

bell;

filter;

search;

plus;

chevron.

Avoid thick illustrated icon sets.

15. Data visualization

Charts must be visually quiet and immediately interpretable.

15.1 Line charts

Use for:

balance evolution;

income / expense evolution;

savings evolution;

projected cashflow.

Rules:

actual = solid line;

projected = dashed / dotted line;

gridlines very light;

no unnecessary chart border;

cobalt as primary series;

semantic colors for secondary series.

15.2 Donut charts

Use for:

expense distribution;

account distribution;

budget distribution;

obligation status;

goal allocation.

Rules:

center can contain total;

legend to the right on desktop;

keep categories to a manageable count;

group minor values into “Otros”.

15.3 Bar charts

Use for:

month-over-month comparison;

category growth;

planned vs actual;

income / expenses / savings comparison.

15.4 Sparklines

Use in KPI cards for directional context only.

They are not substitutes for full analytical charts.

16. Financial semantic conventions

Income

green accent;

plus sign when helpful;

never use green for every positive action in the UI.

Expense

red accent;

negative sign when it represents actual outflow.

Transfer

blue / violet neutral state;

must not look like income or expense.

Debt / liability

red or deep neutral depending on context;

use warning color for due-soon states.

Savings / goals

green, teal, or purple depending on context;

progress is expressed primarily through percentage / bar, not decorative illustration.

Projection

blue dotted / dashed line;

explicitly labeled as estimated / projected.

17. Screen specifications

17.1 Resumen

Purpose: answer the five core questions quickly:

¿Qué tengo?

¿Qué debo?

¿Qué vence?

¿Qué puedo gastar?

¿Hacia dónde voy?

Required visual zones

Top KPI row

patrimonio neto / total balance;

dinero disponible;

obligaciones pendientes;

próximo vencimiento.

Main analytical row

projected cashflow;

spending distribution.

Supporting row

accounts;

upcoming obligations;

monthly budget.

Optional insight card

short, contextual and action-oriented.

17.2 Cuentas

Purpose: show where the user's money and liabilities live.

Structure

search + type + currency filters;

“Nueva cuenta” CTA;

KPI row:

total balance;

assets;

liabilities;

spendable money;

account table;

distribution by account;

active balance evolution;

currency summary;

selected-account detail block with recent movements.

Important distinction

Assets and liabilities should be visually separated but remain part of the same account system.

17.3 Transacciones

Purpose: search, understand and audit financial movement.

Structure

global transaction search;

filters by type, account, category, period and state;

“Nueva transacción” CTA;

KPI row:

income;

expenses;

transfers;

monthly result;

transaction table;

spending distribution;

monthly flow chart;

recurring transactions detected;

contextual insights.

Transaction type visual language

income = green;

expense = red;

transfer = blue / violet;

scheduled = muted status chip;

posted = clear registered state.

17.4 Presupuestos

Purpose: compare intention with actual spending.

Structure

filters + “Nuevo presupuesto” CTA;

KPI row:

total budget;

spent;

available;

categories at risk;

budget-by-category table;

budget distribution;

spending evolution;

alerts and recommendations;

recurring budget rules;

summary insight card.

Progress convention

under control = blue / green;

approaching limit = orange;

limit reached / exceeded = red.

17.5 Obligaciones

Purpose: make future commitments visible and actionable.

Tabs

Resumen

Todas las obligaciones

Próximos vencimientos

Pagadas

Structure

KPI row:

total obligations;

pending payment;

next 30 days;

active obligation count;

upcoming due list;

status donut;

overdue warning card;

full obligations table;

“Nueva obligación” CTA.

Key visual states

al día = green;

vence pronto = orange;

vencida = red;

pagada = neutral / green-muted.

17.6 Calendario

Purpose: show finances through time.

Header filters

Todos

Ingresos

Gastos

Obligaciones

Transferencias

Recordatorios

Main area

monthly calendar grid;

event cards inside date cells;

clear event category color coding;

month navigation.

Right rail

monthly summary;

projected balance;

upcoming due dates;

events of selected day;

optional personal-calendar connection card.

Event color model

income = green;

expenses = blue;

obligations = red;

transfers = purple;

reminders = amber.

17.7 Metas

Purpose: convert savings intentions into measurable progress.

Structure

“Nueva meta” CTA;

summary metrics:

total saved;

active goals;

closest goal;

goals list with:

name;

category;

saved / target;

progress bar;

percentage;

remaining time / date;

global goals summary;

category distribution;

actionable advice;

completed goals history.

Goal progress

Progress bars should be horizontal, clean and dominant over illustration.

17.8 Reportes

Purpose: consolidate analysis without turning the product into an accounting terminal.

Tabs

Resumen

Flujo de caja

Gastos

Ingresos

Patrimonio

Deudas

Comparativos

Structure

date range;

filter;

export;

KPI row:

total income;

total expenses;

monthly savings;

net worth;

monthly evolution chart;

expense distribution;

top categories table;

monthly cashflow breakdown;

comparative chart;

monthly insight;

quick report shortcuts.

17.9 Insights

Purpose: explain patterns and surface useful action, while keeping deterministic financial data separate from AI interpretation.

Tabs

Resumen

Gastos

Ingresos

Ahorro

Deudas

Hábitos

Structure

Financial health summary

score;

plain-language assessment;

supporting reasons.

Analytical cards

expense trend;

fastest-growing category;

savings opportunity.

Personalized insights

upcoming payments;

card usage;

goal progress;

income growth.

Primary recommendation

one actionable suggestion;

clear CTA.

AI visual rule

AI-driven explanations must look like interpretive assistance, not source-of-truth financial data.

Use:

dedicated insight card style;

sparkle / insight icon;

soft atmospheric background;

clear CTA;

no silent balance-changing controls.

18. Atmospheric imagery

The KNOW visual system uses abstract, blurred, translucent blue imagery.

In this finance product, use it only in:

insight cards;

hero / onboarding areas;

empty states;

recommendation surfaces;

promotional modules.

Do not use it behind:

tables;

detailed charts;

form fields;

transaction lists;

dense account data.

Image treatment

low saturation;

cool blue cast;

soft contrast;

high-key light;

blurred / semi-abstract subject;

no sharply defined human figures;

no stock-photo visual language.

19. Motion

Motion is subtle and functional.

Recommended timing:

hover / focus: 120–180 ms;

cards / controls: 180–250 ms;

page / panel transitions: 250–450 ms;

chart entrance: 400–800 ms;

Use easing that feels smooth and controlled.

Recommended motion patterns:

opacity + small vertical shift;

progress-bar fill;

chart line draw;

panel slide;

soft hover elevation;

status transition.

Avoid:

bouncing;

elastic motion;

excessive parallax;

large page-scale zooms.

20. Responsive behavior

Desktop

Primary target for full analytical experience.

persistent sidebar;

12-column content grid;

2–4 card columns depending on module.

Tablet

collapsible navigation rail;

KPI cards move to 2-column grid;

secondary right rail stacks below primary content;

tables may horizontally scroll.

Mobile

bottom navigation or compact drawer;

single-column cards;

charts simplified;

tables converted to list cards where appropriate;

primary action remains reachable;

summary before detail.

21. Accessibility

Contrast

primary text must meet WCAG AA;

status colors cannot be the sole communication method;

pale-blue cards must maintain readable text contrast.

Focus

All interactive elements require a visible focus state.

Recommended focus:

cobalt outline;

2 px minimum;

visible offset from element edge.

Numerics

do not rely on red/green alone;

include sign, label or chip;

charts should include labels / tooltips.

Motion

Honor reduced-motion preferences.

22. Content tone

UI copy should be:

concise;

understandable;

non-accounting-heavy;

action-oriented;

calm;

explanatory when necessary.

Preferred terms:

Dinero disponible

Deuda pendiente

Próximos pagos

Ingresos

Gastos

Presupuesto

Saldo proyectado

Metas

Obligaciones

Avoid unnecessary accounting jargon.

23. Interaction states

Every component must define:

default;

hover;

focus;

active;

disabled;

loading;

empty;

error;

success;

permission-restricted where applicable.

Loading

Use skeletons matching final card geometry.

Avoid full-page spinners unless absolutely necessary.

Empty states

Should include:

short explanation;

one primary action;

optional atmospheric KNOW visual.

Error states

Financial errors must be explicit and recoverable.

Never silently fail on:

transaction creation;

payment registration;

debt changes;

balance-affecting actions.

24. Design invariants

The following should be considered non-negotiable across implementation:

The app remains predominantly light.

Cobalt blue is the core identity color.

Satoshi is the primary typeface.

Sidebar navigation remains visually stable across modules.

Cards use the same radius, border and shadow language.

KPI values are visually dominant over labels.

Actual and projected values are visually distinguishable.

Income, expenses, transfers and obligations have consistent semantic treatments.

Tables are clean, border-light and action-oriented.

Atmospheric brand imagery is used sparingly, never behind dense data.

AI insights are visually separated from deterministic financial values.

Every primary metric can be explained or drilled into.

The interface uses plain financial language.

Desktop layouts preserve generous whitespace.

The application should feel calm, precise and trustworthy.

25. Canonical component inventory

AppShell
Sidebar
SidebarItem
UserProfile
PageHeader
DateSelector
NotificationButton
PrimaryButton
SecondaryButton
TertiaryLink
SearchInput
FilterSelect
TabBar
MetricCard
Sparkline
SectionCard
InsightCard
AlertCard
DataTable
TableRow
StatusChip
ProgressBar
DonutChart
LineChart
BarChart
Legend
AccountIcon
CategoryIcon
EmptyState
SkeletonCard
Pagination
CalendarGrid
CalendarEvent
GoalRow
ObligationRow
TransactionRow
BudgetRow

26. Implementation guidance

The design system should be encoded as reusable tokens rather than screen-specific CSS.

Recommended token layers:

foundation
├── color
├── typography
├── spacing
├── radius
├── shadow
├── border
└── motion

semantic
├── surface
├── text
├── action
├── status
└── financial

components
├── button
├── card
├── table
├── chip
├── input
├── chart
└── navigation

Avoid hardcoding visual values separately in each page.

27. Design QA checklist

Before approving any new screen, verify:

Does it look like the same product as the existing 9 screens?

Is the sidebar consistent?

Is the primary action obvious?

Are the most important numbers understandable in under 5 seconds?

Is projected data visually distinguished from actual data?

Are semantic colors used consistently?

Are cards using the canonical radius / padding / shadow?

Are tables readable without visual clutter?

Does the screen preserve enough whitespace?

Are labels written in plain financial language?

Is every critical number explainable?

Are alerts proportional to their severity?

Are AI insights visually separated from deterministic values?

Does the screen remain usable without color perception?

Does the design still feel like KNOW?

28. Final visual statement

Personal Finance should visually express the idea:

Your financial situation, made understandable.

The interface is not decorative finance software. It is a structured visual control system that helps the user understand what they have, what they owe, what is due, what they can actually spend, and where their finances are heading.

The final experience should feel:

KNOW brand clarity
+
financial trust
+
calm analytical UI
+
future-aware planning
+
consistent modular design

This document is the visual baseline for all future product screens and should be treated as the source of truth for UI consistency unless a later version explicitly supersedes it.