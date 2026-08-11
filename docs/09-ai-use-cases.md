# AI Use Cases

## 1. Objetivo

Este documento define los casos de uso de inteligencia artificial para la aplicación de finanzas personales.

La IA debe aportar valor en tareas donde ayude a:

```text
clasificar

explicar

resumir

detectar patrones

reducir carga manual

facilitar consultas
```

La IA no debe reemplazar el motor financiero determinístico.

Regla central:

```text
AI assists.
Finance Engine decides.
User confirms financial actions.
```

---

# 2. Categorías de uso

Los casos de uso se agrupan en:

```text
Transaction Intelligence

Financial Insights

Planning Assistance

Debt Assistance

Natural Language Interaction

Automation Assistance

Document / Import Intelligence
```

---

# 3. Prioridades

Usaremos cuatro niveles:

```text
P0
Alta prioridad para primera integración AI

P1
Muy útil después del core

P2
Mejora importante pero no esencial

P3
Avanzado / futuro
```

---

# 4. Risk Levels

Cada capability tendrá nivel de riesgo:

```text
LOW
→ solo lectura / sugerencia

MEDIUM
→ puede preparar cambios

HIGH
→ afecta información financiera canónica
```

La IA no ejecutará autónomamente casos `HIGH`.

---

# 5. Use Case 1 — Transaction Categorization

Priority:

```text
P0
```

Risk:

```text
LOW
```

Objetivo:

sugerir una categoría para una transacción.

Ejemplo:

```text
UBER *TRIP
```

→

```text
Transport > Ride Sharing
```

Input:

```ts
{
  description: string
  merchant?: string
  transactionType: "EXPENSE" | "INCOME"
  availableCategories: Category[]
}
```

Output:

```ts
{
  categoryId: string | null
  confidence: number
  reason?: string
}
```

La IA solamente puede seleccionar entre categorías proporcionadas.

Nunca puede inventar un `categoryId`.

---

# 6. UX — Categorization

Mostrar:

```text
Sugerencia IA

Transporte

[Usar categoría]
```

El usuario puede:

```text
Aceptar

Cambiar

Ignorar
```

No modificar silenciosamente la transacción en V1.

---

# 7. Use Case 2 — Merchant Normalization

Priority:

```text
P0
```

Risk:

```text
LOW
```

Objetivo:

convertir descripciones difíciles de leer en nombres comprensibles.

Ejemplo:

```text
MP*SPOTIFYAB1234
```

→

```text
Spotify
```

Otro ejemplo:

```text
UBER *TRIP HELP.UBER.COM
```

→

```text
Uber
```

Input:

```ts
{
  rawDescription: string
  currentMerchant?: string
}
```

Output:

```ts
{
  normalizedMerchant: string | null
  confidence: number
}
```

El valor original nunca se elimina.

---

# 8. Use Case 3 — Transaction Description Cleanup

Priority:

```text
P1
```

Risk:

```text
LOW
```

Objetivo:

crear una descripción más legible.

Ejemplo:

```text
MERCADOPAGO*CARREFOUR394934
```

→

```text
Compra en Carrefour
```

Debe conservarse:

```text
rawDescription
```

junto con:

```text
normalizedDescription
```

si se persiste.

---

# 9. Use Case 4 — Category Learning Suggestions

Priority:

```text
P1
```

Risk:

```text
LOW
```

Objetivo:

usar decisiones anteriores del usuario para mejorar futuras sugerencias.

Ejemplo:

El usuario corrige varias veces:

```text
Starbucks
Food → Coffee
```

El sistema puede aprender una regla:

```text
merchant = Starbucks
→ Coffee
```

La arquitectura recomendada es:

```text
User Rules
↓
Historical Patterns
↓
AI
```

La IA debe ser fallback, no la única estrategia.

---

# 10. Use Case 5 — Subscription Detection

Priority:

```text
P1
```

Risk:

```text
LOW
```

Objetivo:

detectar pagos repetitivos que probablemente representen suscripciones.

Ejemplo:

```text
Netflix
$15.999

05 Jan
05 Feb
05 Mar
```

Resultado:

```text
Posible suscripción detectada:
Netflix · mensual
```

---

# 11. Subscription Flow

Preferir:

```text
Deterministic Pattern Detection
↓
AI Interpretation
↓
Suggestion
↓
User Confirmation
↓
RecurringTransaction
```

La IA no crea automáticamente la recurrencia.

---

# 12. Use Case 6 — Recurring Expense Detection

Priority:

```text
P1
```

Risk:

```text
LOW
```

Similar a subscription detection, pero más amplio.

Ejemplos:

```text
Rent

Insurance

Gym

Internet

School fees
```

Output:

```ts
{
  recurring: boolean
  suggestedFrequency?: string
  confidence: number
}
```

---

# 13. Use Case 7 — Recurring Income Detection

Priority:

```text
P1
```

Risk:

```text
LOW
```

Detectar ingresos repetidos.

Ejemplo:

```text
Salary
```

aparece aproximadamente una vez por mes.

Sugerencia:

```text
¿Querés registrar este ingreso como recurrente?
```

---

# 14. Use Case 8 — Spending Insight

Priority:

```text
P0
```

Risk:

```text
LOW
```

Objetivo:

explicar métricas calculadas por el finance engine.

Input:

```ts
{
  currentPeriod: {
    food: 180000
  },
  previousPeriod: {
    food: 120000
  },
  computedChangePercent: 50
}
```

Output:

```text
Este mes gastaste un 50% más en alimentos que el mes anterior.
```

La IA no calcula el 50%.

Recibe el dato ya calculado.

---

# 15. Use Case 9 — Monthly Financial Summary

Priority:

```text
P1
```

Risk:

```text
LOW
```

Objetivo:

generar un resumen financiero mensual fácil de entender.

Input:

```text
Income

Consumption Expenses

Debt Payments

Top Spending Categories

Budget Status

Outstanding Debt

Upcoming Obligations
```

Output ejemplo:

```text
Este mes tus ingresos superaron los gastos de consumo.

La categoría con mayor gasto fue Alimentos.

También redujiste $120.000 de deuda.

Tenés $280.000 en pagos previstos durante los próximos 30 días.
```

---

# 16. Monthly Summary Requirements

El resumen debe:

```text
usar únicamente métricas proporcionadas

no inventar movimientos

no inventar tendencias

no dar recomendaciones financieras no solicitadas
```

---

# 17. Use Case 10 — Spending Pattern Detection

Priority:

```text
P1
```

Risk:

```text
LOW
```

Objetivo:

explicar patrones interesantes.

Ejemplos:

```text
gasto creciente en delivery

mayor gasto durante fines de semana

incremento sostenido de suscripciones

reducción de transporte

aumento de gastos médicos
```

La detección numérica debería ser determinística cuando sea posible.

La IA interpreta y presenta.

---

# 18. Use Case 11 — Unusual Spending Explanation

Priority:

```text
P2
```

Risk:

```text
LOW
```

El sistema detecta previamente una anomalía:

```text
Restaurant expense
$180.000

Typical restaurant expense
$30.000
```

La IA puede generar:

```text
Este movimiento es considerablemente mayor que tus gastos habituales en restaurantes.
```

No debe afirmar fraude.

---

# 19. Fraud Boundary

Nunca mostrar automáticamente:

```text
Esta transacción es fraudulenta.
```

Preferir:

```text
Este movimiento es inusual respecto de tu historial.
```

La IA no es sistema antifraude bancario.

---

# 20. Use Case 12 — Budget Explanation

Priority:

```text
P1
```

Risk:

```text
LOW
```

Input:

```text
Food budget:
200000

Spent:
180000

Remaining:
20000

Days remaining:
12
```

Output:

```text
Usaste el 90% del presupuesto de alimentos y todavía quedan 12 días del mes.
```

Los números los calcula el engine.

---

# 21. Use Case 13 — Budget Trend Insight

Priority:

```text
P2
```

Risk:

```text
LOW
```

Ejemplo:

```text
En los últimos tres meses superaste el presupuesto de entretenimiento.
```

La IA puede explicar el patrón.

No debe cambiar el presupuesto automáticamente.

---

# 22. Use Case 14 — Cashflow Explanation

Priority:

```text
P1
```

Risk:

```text
LOW
```

Input:

```text
Current Balance

Upcoming Obligations

Expected Income

Projected Minimum Balance

Projected End Balance
```

Output ejemplo:

```text
Tu saldo actual alcanza para cubrir los pagos registrados hasta el 25 de agosto.

Antes de tu próximo ingreso, el saldo mínimo proyectado es de $85.000.
```

---

# 23. Use Case 15 — Projected Shortfall Explanation

Priority:

```text
P1
```

Risk:

```text
LOW
```

El motor detecta:

```text
Projected balance:
-$75.000

Date:
27 Aug
```

AI:

```text
Con los movimientos previstos, podrías tener un faltante aproximado de $75.000 el 27 de agosto.
```

Debe decir:

```text
podrías

proyectado

estimado
```

No presentar el futuro como certeza.

---

# 24. Use Case 16 — Debt Summary

Priority:

```text
P1
```

Risk:

```text
LOW
```

Input:

```text
Total Debt

Paid Amount

Remaining Amount

Upcoming Installments

Overdue Installments
```

Output:

```text
Tenés $680.000 de deuda pendiente.

La próxima cuota es de $85.000 y vence el 25 de agosto.

No tenés cuotas vencidas.
```

---

# 25. Use Case 17 — Debt Progress Explanation

Priority:

```text
P2
```

Risk:

```text
LOW
```

Ejemplo:

```text
Desde que registraste este préstamo redujiste el saldo pendiente en un 35%.
```

El porcentaje debe provenir del motor financiero.

---

# 26. Use Case 18 — Debt Payment Scenario Explanation

Priority:

```text
P3
```

Risk:

```text
MEDIUM
```

Usuario pregunta:

```text
¿Qué pasa si pago tres cuotas hoy?
```

El sistema ejecuta una simulación determinística.

AI solamente explica:

```text
Si pagás las cuotas 4, 5 y 6 hoy, tu salida inmediata sería de $300.000 y tus compromisos de los próximos tres meses disminuirían en ese mismo monto.
```

No modifica datos.

---

# 27. Use Case 19 — Financial Assistant

Priority:

```text
P2
```

Risk:

```text
LOW
```

Crear un asistente read-only que responda preguntas sobre las finanzas del usuario.

Ejemplos:

```text
¿Cuánto gasté este mes?

¿Cuánto gasté en delivery?

¿Cuánto debo?

¿Qué vence esta semana?

¿Cuál fue mi mayor gasto?

¿Cuánto gasté en Uber este año?
```

---

# 28. Assistant Architecture

```text
User Question
↓
Intent Detection
↓
Financial Tool
↓
Deterministic Result
↓
AI Explanation
```

---

# 29. Assistant Financial Tools

Inicialmente:

```text
getAccountBalances

getMonthlyIncome

getMonthlyExpenses

getSpendingByCategory

getSpendingByMerchant

getOutstandingDebt

getUpcomingPayments

getBudgetStatus

getCashflowProjection
```

---

# 30. No Arbitrary SQL

El AI assistant no tendrá:

```text
executeSQL
```

No debe construir consultas arbitrarias contra producción.

Usar herramientas explícitas.

---

# 31. Use Case 20 — Natural Language Transaction Search

Priority:

```text
P2
```

Risk:

```text
LOW
```

Ejemplos:

```text
Mostrame todos los gastos de supermercado de julio.

Buscá las compras mayores a $100.000.

Mostrame gastos de Uber de los últimos tres meses.
```

Primero resolver mediante:

```text
structured intent
+
SQL filters
```

No usar embeddings cuando un filtro estructurado es suficiente.

---

# 32. Use Case 21 — Semantic Search

Priority:

```text
P3
```

Risk:

```text
LOW
```

Para consultas menos estructuradas:

```text
gastos relacionados con vacaciones

compras relacionadas con la mudanza

gastos de salud de mi hijo
```

Puede ser útil:

```text
Embeddings
+
pgvector
```

solo cuando exista necesidad real.

---

# 33. Use Case 22 — Natural Language Filter Builder

Priority:

```text
P2
```

Risk:

```text
LOW
```

Usuario:

```text
Mostrame gastos mayores a 50.000 en comida durante agosto.
```

AI transforma a:

```ts
{
  type: "EXPENSE",
  category: "Food",
  amountMin: "50000",
  dateFrom: "...",
  dateTo: "..."
}
```

El backend valida los filtros antes de ejecutar query.

---

# 34. Use Case 23 — Voice-to-Expense Preparation

Priority:

```text
P3
```

Risk:

```text
MEDIUM
```

Usuario dicta:

```text
Gasté 25 mil en supermercado con la tarjeta Visa.
```

AI puede preparar:

```text
Expense
Amount: 25.000
Category: Supermarket
Account: Visa
```

Pero debe mostrar preview:

```text
[Confirmar]
```

antes de crear la transacción.

---

# 35. Use Case 24 — Natural Language Expense Creation

Priority:

```text
P2
```

Risk:

```text
MEDIUM
```

Ejemplo:

```text
Registrá 15.000 de Uber en Mercado Pago.
```

Output estructurado:

```ts
{
  action: "CREATE_EXPENSE",
  amount: "15000",
  accountCandidate: "...",
  categoryCandidate: "...",
  description: "Uber"
}
```

Nunca ejecutar inmediatamente.

---

# 36. Expense Creation Confirmation

Flujo obligatorio:

```text
Natural language
↓
AI parses
↓
Application validates
↓
UI preview
↓
User confirms
↓
CreateExpense
```

---

# 37. Use Case 25 — Natural Language Income Creation

Priority:

```text
P2
```

Risk:

```text
MEDIUM
```

Ejemplo:

```text
Cobré 800.000 de un trabajo freelance.
```

AI prepara el movimiento.

Usuario confirma antes de guardar.

---

# 38. Use Case 26 — Debt Creation Assistant

Priority:

```text
P2
```

Risk:

```text
MEDIUM
```

Usuario:

```text
Compré una notebook de 1.200.000 en 12 cuotas, la primera vence el 15 de septiembre.
```

AI puede extraer:

```ts
{
  name: "Notebook",
  amount: "1200000",
  installmentCount: 12,
  firstDueDate: "...",
  frequency: "MONTHLY"
}
```

---

# 39. Debt Creation Boundary

Después del parsing:

```text
Finance Engine
```

genera las cuotas.

No pedirle al LLM que calcule:

```text
12 installment amounts
```

como source of truth.

---

# 40. Debt Creation Flow

```text
User text
↓
AI extraction
↓
Zod validation
↓
Finance Engine installment preview
↓
User review
↓
Confirm
↓
Create Debt
```

---

# 41. Use Case 27 — Reminder Creation Assistant

Priority:

```text
P2
```

Risk:

```text
MEDIUM
```

Usuario:

```text
Recordame tres días antes de pagar el préstamo.
```

AI puede preparar:

```text
Reminder
Source: Loan
Offset: -3 days
```

Requiere confirmación si la referencia es ambigua.

---

# 42. Use Case 28 — Recurring Rule Creation

Priority:

```text
P2
```

Risk:

```text
MEDIUM
```

Usuario:

```text
Pago Netflix todos los meses el día 10.
```

AI extrae:

```text
description
amount if supplied
frequency
day
category candidate
```

Preview antes de persistir.

---

# 43. Use Case 29 — CSV Column Mapping

Priority:

```text
P1
```

Risk:

```text
LOW
```

Cuando se implemente CSV import.

Ejemplo de columnas:

```text
Fecha Op.

Concepto

Débito

Crédito

Saldo
```

AI puede sugerir:

```text
Fecha Op.
→ occurredAt

Concepto
→ description

Débito
→ expenseAmount

Crédito
→ incomeAmount
```

---

# 44. CSV Mapping Confirmation

Antes del import:

```text
Preview Mapping
```

El usuario confirma.

Nunca persistir cientos de movimientos basándose únicamente en mapping AI no revisado.

---

# 45. Use Case 30 — Imported Merchant Cleanup

Priority:

```text
P1
```

Risk:

```text
LOW
```

Después de importar:

```text
MCDONALDS 00093482 MPAGO
```

puede normalizarse:

```text
McDonald's
```

sin modificar `rawDescription`.

---

# 46. Use Case 31 — Bulk Categorization

Priority:

```text
P2
```

Risk:

```text
MEDIUM
```

Después de importar CSV:

```text
150 uncategorized transactions
```

AI puede sugerir categorías para todas.

UX:

```text
Review Suggestions

✓ Uber → Transport
✓ Netflix → Subscriptions
? ABC123 → Uncategorized
```

Usuario confirma en lote.

---

# 47. Bulk Safety

No realizar:

```text
AI categorizes 500 rows
↓
instant permanent write
```

Preferir:

```text
AI Suggestions
↓
Review
↓
Bulk Accept
```

---

# 48. Use Case 32 — Receipt Information Extraction

Priority:

```text
P3
```

Risk:

```text
MEDIUM
```

Cuando exista soporte de archivos/OCR.

Input:

```text
receipt image / OCR text
```

AI puede extraer:

```text
merchant

date

total amount

possible category
```

---

# 49. Receipt Boundary

La extracción no crea automáticamente una transacción.

Debe existir:

```text
Review Expense
```

antes de persistir.

---

# 50. Use Case 33 — Receipt Item Classification

Priority:

```text
P3
```

Risk:

```text
LOW
```

Puede ayudar a dividir una compra.

Ejemplo:

```text
Supermarket receipt
```

AI:

```text
Food       $40.000

Cleaning   $15.000

Pharmacy   $8.000
```

Antes de crear:

```text
TransactionSplit
```

el usuario revisa.

---

# 51. Use Case 34 — Duplicate Detection Assistance

Priority:

```text
P2
```

Risk:

```text
LOW
```

La detección principal debe usar heurísticas determinísticas:

```text
date

amount

account

external ID

description hash
```

AI puede ayudar en casos ambiguos.

Ejemplo:

```text
"MP*CARREFOUR 123"

"CARREFOUR SA"
```

podrían ser el mismo merchant.

---

# 52. Duplicate Boundary

AI puede decir:

```text
Possible duplicate
```

No eliminar automáticamente.

---

# 53. Use Case 35 — Financial Data Explanation

Priority:

```text
P1
```

Risk:

```text
LOW
```

Usuario puede tocar una métrica:

```text
Disponible estimado
$450.000
```

y preguntar:

```text
¿Cómo se calcula?
```

AI recibe:

```text
Liquid Balance = 1.000.000

Reserved = 100.000

Upcoming Obligations = 450.000
```

y explica:

```text
Tu disponible estimado parte de $1.000.000 en cuentas, descuenta $100.000 reservados y $450.000 de compromisos próximos.
```

---

# 54. Use Case 36 — Dashboard Narrative

Priority:

```text
P2
```

Risk:

```text
LOW
```

Generar un pequeño resumen sobre el dashboard.

Ejemplo:

```text
Tu situación de corto plazo es estable: los compromisos registrados de los próximos 30 días están cubiertos por tu saldo actual.
```

Solo si esa conclusión fue derivada de métricas concretas.

---

# 55. Use Case 37 — Weekly Financial Digest

Priority:

```text
P2
```

Risk:

```text
LOW
```

Resumen:

```text
Esta semana gastaste $120.000.

Tu mayor categoría fue Alimentos.

Pagaste una cuota de $80.000.

La próxima semana vencen $145.000.
```

Las cifras vienen de queries determinísticas.

---

# 56. Use Case 38 — Upcoming Payment Summary

Priority:

```text
P1
```

Risk:

```text
LOW
```

Ejemplo:

```text
Tenés cuatro pagos en los próximos siete días por un total de $310.000.
```

Puede complementar la lista de vencimientos.

---

# 57. Use Case 39 — Overdue Summary

Priority:

```text
P1
```

Risk:

```text
LOW
```

Ejemplo:

```text
Tenés dos cuotas vencidas por un total pendiente de $95.000.
```

Nunca inventar intereses o penalidades no registradas.

---

# 58. Use Case 40 — Goal Progress Explanation

Priority:

```text
P2
```

Risk:

```text
LOW
```

Cuando existan Savings Goals.

Input:

```text
Target
$2.000.000

Saved
$800.000

Target Date
December
```

AI puede explicar:

```text
Completaste el 40% de tu objetivo.
```

El 40% debe venir del finance engine.

---

# 59. Use Case 41 — Goal Contribution Scenario

Priority:

```text
P3
```

Risk:

```text
LOW
```

Usuario:

```text
Si ahorro $100.000 por mes, ¿cuándo llego a mi objetivo?
```

Finance engine calcula fechas.

AI explica el resultado.

---

# 60. Use Case 42 — Expense Reduction Opportunities

Priority:

```text
P3
```

Risk:

```text
MEDIUM
```

AI puede identificar:

```text
subscriptions

frequent delivery

duplicate services

high recurring expenses
```

y decir:

```text
Tus suscripciones representan $85.000 mensuales.
```

Evitar lenguaje prescriptivo como:

```text
Debés cancelar estas tres suscripciones.
```

Preferir:

```text
Estas son las categorías recurrentes con mayor peso.
```

---

# 61. Use Case 43 — Financial Health Narrative

Priority:

```text
P3
```

Risk:

```text
MEDIUM
```

Puede sintetizar:

```text
cashflow

debt trend

savings rate

budget performance
```

pero debe evitar convertir una métrica interna en:

```text
credit score

financial diagnosis
```

sin fundamento.

---

# 62. Use Case 44 — Explain Financial Concepts

Priority:

```text
P2
```

Risk:

```text
LOW
```

Ejemplos:

```text
¿Qué significa disponible estimado?

¿Qué diferencia hay entre saldo y patrimonio?

¿Por qué el pago de tarjeta no aparece como gasto?
```

AI puede explicar conceptos del producto.

---

# 63. Use Case 45 — Product Help Assistant

Priority:

```text
P2
```

Risk:

```text
LOW
```

Responder:

```text
¿Cómo creo una deuda?

¿Cómo registro un pago parcial?

¿Cómo cambio una categoría?

¿Cómo funciona el cashflow?
```

Esto no requiere acceso a datos financieros salvo contexto mínimo.

---

# 64. Use Case 46 — Smart Empty States

Priority:

```text
P3
```

Risk:

```text
LOW
```

Personalizar onboarding según estado.

Ejemplo:

Usuario tiene cuentas y movimientos, pero ninguna deuda.

Podemos mostrar:

```text
Si tenés compras en cuotas o préstamos, podés agregarlos para ver próximos vencimientos.
```

Esto puede hacerse sin LLM inicialmente.

No usar AI donde reglas simples sean suficientes.

---

# 65. Use Case 47 — Smart Notification Copy

Priority:

```text
P3
```

Risk:

```text
LOW
```

Los triggers son determinísticos.

Ejemplo trigger:

```text
PAYMENT_DUE_SOON
```

AI podría redactar copy.

Pero no es necesario para MVP.

Templates determinísticos son probablemente mejores inicialmente.

---

# 66. Use Case 48 — Notification Prioritization

Priority:

```text
P3
```

Risk:

```text
MEDIUM
```

Podría ayudar a ordenar:

```text
overdue

large payment

cashflow shortfall

budget exceeded
```

Pero reglas determinísticas son preferibles para eventos críticos.

AI puede ser una capa complementaria.

---

# 67. Use Case 49 — Account / Category Suggestion During Import

Priority:

```text
P2
```

Risk:

```text
LOW
```

Durante CSV import:

```text
Banco Nación CSV
```

AI puede inferir:

```text
probable account
probable category
```

pero el usuario confirma mapping.

---

# 68. Use Case 50 — Financial Question Decomposition

Priority:

```text
P2
```

Risk:

```text
LOW
```

Ejemplo:

```text
¿Cuánto gasté en vacaciones y cuánto me queda por pagar del viaje?
```

Puede requerir combinar:

```text
Transaction Search

Tags

Debt Query
```

AI puede planificar qué read-only tools llamar.

---

# 69. Multi-Tool Read Flow

```text
Question
↓
Tool Planner
↓
getTransactions(...)
↓
getOutstandingDebt(...)
↓
Combine deterministic results
↓
Generate answer
```

No modificar estado.

---

# 70. Use Case 51 — Compare Periods

Priority:

```text
P1
```

Risk:

```text
LOW
```

Usuario:

```text
Comparame julio con agosto.
```

Finance engine produce:

```text
income difference

expense difference

category differences

debt payment difference
```

AI genera explicación.

---

# 71. Use Case 52 — Explain Category Changes

Priority:

```text
P2
```

Risk:

```text
LOW
```

Ejemplo:

```text
¿Por qué aumentaron mis gastos este mes?
```

Deterministic analysis:

```text
Food +50k
Transport +20k
Health +100k
```

AI:

```text
El principal aumento provino de Salud, seguido por Alimentos.
```

---

# 72. Use Case 53 — Explain Account Balance Change

Priority:

```text
P2
```

Risk:

```text
LOW
```

Usuario:

```text
¿Por qué bajó tanto mi cuenta bancaria?
```

El sistema obtiene movimientos relevantes.

AI resume:

```text
La mayor parte de la caída se explica por el alquiler, un pago de deuda y dos gastos grandes.
```

---

# 73. Use Case 54 — Explain Debt Change

Priority:

```text
P2
```

Risk:

```text
LOW
```

Usuario:

```text
¿Por qué todavía debo tanto si pagué este mes?
```

Finance engine proporciona:

```text
opening debt

payments

remaining installments

interest/fees if any
```

AI explica.

---

# 74. Use Case 55 — Explain Cashflow Risk

Priority:

```text
P1
```

Risk:

```text
LOW
```

Ejemplo:

```text
¿Por qué aparece riesgo el 25?
```

Datos:

```text
Balance 300k

Rent -200k

Loan -150k

Salary on 31st +1m
```

AI explica:

```text
El riesgo aparece porque el alquiler y la cuota vencen antes del ingreso programado del día 31.
```

---

# 75. Use Case 56 — Suggest Missing Financial Information

Priority:

```text
P3
```

Risk:

```text
LOW
```

Ejemplo:

El usuario usa cashflow pero no registró ingresos futuros.

Sistema puede sugerir:

```text
Agregar tu próximo ingreso puede hacer que la proyección sea más útil.
```

Reglas simples deberían cubrir primero estos casos.

---

# 76. Use Case 57 — Data Quality Assistance

Priority:

```text
P2
```

Risk:

```text
LOW
```

Detectar:

```text
unusual merchant spelling

many uncategorized transactions

possible duplicate merchants

missing categories
```

AI puede sugerir limpieza.

---

# 77. Use Case 58 — Category Consolidation Suggestions

Priority:

```text
P3
```

Risk:

```text
LOW
```

Ejemplo:

Usuario tiene:

```text
Supermercado

Supermercados

Compras supermercado
```

AI puede sugerir:

```text
Estas categorías parecen similares.
¿Querés revisarlas?
```

No fusionar automáticamente.

---

# 78. Use Case 59 — Merchant Consolidation

Priority:

```text
P2
```

Risk:

```text
LOW
```

Ejemplo:

```text
UBER

UBER TRIP

UBER *PENDING
```

pueden agruparse conceptualmente como:

```text
Uber
```

Mantener descripción original.

---

# 79. Use Case 60 — Explain Import Errors

Priority:

```text
P2
```

Risk:

```text
LOW
```

Cuando un CSV contiene errores:

```text
37 rows could not be imported
```

AI puede resumir:

```text
La mayoría de los errores provienen de fechas inválidas y montos vacíos.
```

Los errores exactos vienen del parser determinístico.

---

# 80. Use Case 61 — Debt Document Extraction

Priority:

```text
P3
```

Risk:

```text
MEDIUM
```

Si el usuario carga un contrato/resumen:

AI puede extraer candidatos:

```text
principal

installment count

due dates

interest

fees
```

Nunca persistir directamente.

Mostrar review.

---

# 81. Use Case 62 — Credit Card Statement Extraction

Priority:

```text
P3
```

Risk:

```text
MEDIUM
```

Desde PDF/resumen:

```text
statement period

due date

total

minimum payment

purchases
```

El flujo requiere:

```text
extract
↓
validate
↓
preview
↓
user confirmation
```

---

# 82. Use Case 63 — Statement Purchase Matching

Priority:

```text
P3
```

Risk:

```text
MEDIUM
```

AI puede ayudar a vincular:

```text
existing manual transaction
```

con:

```text
imported card statement row
```

para evitar duplicados.

No debe hacer merge irreversible automáticamente.

---

# 83. Use Case 64 — Financial Scenario Assistant

Priority:

```text
P3
```

Risk:

```text
MEDIUM
```

Preguntas:

```text
¿Qué pasa si gasto $200.000 este fin de semana?

¿Qué pasa si adelanto dos cuotas?

¿Qué pasa si mi sueldo llega una semana tarde?
```

El motor de escenarios calcula.

AI explica.

---

# 84. Scenario Boundary

Todo escenario es:

```text
ephemeral
```

hasta que el usuario decide convertir una acción simulada en operación real.

---

# 85. Use Case 65 — Debt Payoff Comparison

Priority:

```text
P3
```

Risk:

```text
MEDIUM
```

Cuando existan préstamos avanzados:

```text
pay minimum

pay extra

pay early
```

El motor calcula escenarios.

AI puede comparar resultados.

---

# 86. No AI Financial Calculation

Para escenarios de deuda:

```text
Finance Engine calculates.

AI narrates.
```

Nunca:

```text
LLM calculates amortization schedule
```

como verdad.

---

# 87. Use Case 66 — Personalized Financial Digest

Priority:

```text
P2
```

Risk:

```text
LOW
```

Una vista como:

```text
Tu semana
```

podría contener:

```text
spending summary

upcoming payments

budget warnings

cashflow status
```

y un pequeño resumen generado.

---

# 88. Use Case 67 — Explain Net Worth

Priority:

```text
P2
```

Risk:

```text
LOW
```

Ejemplo:

```text
Tu patrimonio aumentó principalmente porque redujiste deuda y aumentó el saldo de ahorro.
```

La causa debe derivarse de datos calculados.

---

# 89. Use Case 68 — Multi-Currency Explanation

Priority:

```text
P3
```

Risk:

```text
LOW
```

AI puede explicar:

```text
Tenés saldos en ARS y USD, por eso no mostramos un único total sin aplicar una tasa de conversión.
```

No inventar FX.

---

# 90. Use Case 69 — Financial Terms Explanation

Priority:

```text
P2
```

Risk:

```text
LOW
```

Ejemplos:

```text
¿Qué es patrimonio neto?

¿Qué significa capital pendiente?

¿Qué diferencia hay entre gasto y flujo de caja?

¿Qué es una cuota parcialmente pagada?
```

---

# 91. Use Case 70 — Onboarding Assistant

Priority:

```text
P3
```

Risk:

```text
LOW
```

Puede ayudar a orientar:

```text
Tengo una cuenta bancaria, efectivo y una tarjeta. ¿Cómo empiezo?
```

AI puede explicar qué entidades crear.

No necesita crear nada sin confirmación.

---

# 92. Use Case Matrix

Resumen:

```text
Capability                         Priority   Risk

Transaction Categorization        P0         LOW
Merchant Normalization            P0         LOW
Spending Insights                 P0         LOW

Subscription Detection            P1         LOW
Recurring Detection               P1         LOW
Monthly Summary                   P1         LOW
Budget Explanation                P1         LOW
Cashflow Explanation              P1         LOW
Debt Summary                      P1         LOW
CSV Mapping                       P1         LOW
Upcoming Payment Summary          P1         LOW

Financial Assistant               P2         LOW
Natural Language Filters          P2         LOW
NL Expense Preparation            P2         MEDIUM
Debt Creation Assistant           P2         MEDIUM
Bulk Categorization               P2         MEDIUM
Goal Explanation                  P2         LOW

Semantic Search                   P3         LOW
Receipt Extraction                P3         MEDIUM
Statement Extraction              P3         MEDIUM
Scenario Assistant                P3         MEDIUM
Advanced Debt Scenarios           P3         MEDIUM
```

---

# 93. Recommended First AI Release

Primera release:

```text
AI Release 1
```

debe contener únicamente:

```text
Transaction Categorization

Merchant Normalization
```

Opcionalmente:

```text
Simple Spending Insight
```

---

# 94. Recommended Second AI Release

```text
AI Release 2
```

Agregar:

```text
Monthly Summary

Subscription Detection

Cashflow Explanation

Debt Summary
```

---

# 95. Recommended Third AI Release

```text
AI Release 3
```

Agregar:

```text
Read-Only Financial Assistant

Natural Language Filters

CSV Mapping

Bulk Categorization
```

---

# 96. Advanced AI Release

Después:

```text
Document Extraction

Semantic Search

Financial Scenarios

Natural Language Financial Actions
```

---

# 97. When AI Should Not Be Used

No usar AI para:

```text
account balance

installment calculations

payment allocations

currency arithmetic

budget arithmetic

debt remaining

net worth

due date determination

overdue determination

transfer posting

financial transaction integrity
```

---

# 98. Deterministic Before AI

Antes de crear una capability AI preguntar:

```text
Can this be solved reliably with rules or SQL?
```

Si la respuesta es sí:

```text
use deterministic logic first
```

AI debe aportar valor adicional, no reemplazar lógica simple.

---

# 99. AI Action Levels

Definir tres niveles:

```text
LEVEL 1
READ / EXPLAIN

LEVEL 2
SUGGEST

LEVEL 3
PREPARE ACTION
```

No implementar inicialmente:

```text
LEVEL 4
AUTONOMOUS FINANCIAL WRITE
```

---

# 100. Level 1

Ejemplos:

```text
Monthly Summary

Cashflow Explanation

Debt Explanation

Financial Q&A
```

Sin modificación de datos.

---

# 101. Level 2

Ejemplos:

```text
Category Suggestion

Merchant Suggestion

Recurring Expense Suggestion
```

El usuario decide.

---

# 102. Level 3

Ejemplos:

```text
Prepare Expense

Prepare Income

Prepare Debt

Prepare Reminder
```

La IA genera estructura.

El usuario confirma.

---

# 103. No Autonomous Writes

El producto no debe permitir inicialmente:

```text
AI automatically creates transactions

AI automatically pays debt

AI automatically transfers money

AI automatically modifies budgets
```

---

# 104. Context Principle

Cada capability recibe el contexto mínimo.

Categorization:

```text
description
merchant
available categories
```

No:

```text
entire financial history
```

---

# 105. Explainability

Cuando una sugerencia AI tenga impacto visible, la UI debería poder indicar:

```text
Sugerencia IA
```

y permitir:

```text
accept

reject

edit
```

---

# 106. Feedback

Registrar, cuando sea útil:

```text
suggestion

accepted

rejected

corrected
```

para medir valor de la capability.

---

# 107. Core AI Product Metrics

Medir:

```text
Suggestion Acceptance Rate

AI Feature Usage

Invalid Output Rate

Failure Rate

Latency

Cost per Capability

User Corrections
```

---

# 108. Categorization Success Metric

Una buena métrica inicial:

```text
accepted suggestions
/
total categorization suggestions
```

---

# 109. AI Financial Assistant Success Metric

Medir:

```text
questions successfully answered from trusted tools
```

y:

```text
fallback / unable-to-answer rate
```

---

# 110. Use Case Acceptance Template

Toda nueva capability AI debería documentar:

```text
Problem

User Value

Priority

Risk

Input

Output

Financial Source of Truth

AI Role

Validation

User Confirmation

Fallback

Privacy

Tests

Metrics
```

---

# 111. Final Principle

La IA debe hacer que la aplicación sea:

```text
easier to use

easier to understand

faster to organize
```

sin hacer que sea:

```text
less predictable

less secure

less financially correct
```

---

# 112. Initial Implementation Recommendation

Implementar en este orden:

```text
1. Transaction Categorization

2. Merchant Normalization

3. Spending Insights

4. Monthly Summary

5. Subscription Detection

6. Cashflow Explanation

7. Debt Summary

8. Read-Only Financial Assistant
```

Después evaluar casos de escritura asistida.

---

# 113. Final Boundary

Siempre mantener:

```text
AI interprets language.

Finance Engine interprets money.

Application Services perform actions.

User confirms meaningful financial changes.
```
