# KAI Interaction Engine — Implementation Backlog

> Source spec: el prompt **"KAI INTERACTION ENGINE — KnowFinanzas"** (27 secciones).
> Estado del motor: `packages/kai/` + `apps/web/src/features/kai/`.
> Memoria: `memory/kai-interaction-engine.md`, `memory/kai-never-expose-resolution-mechanism.md`.

El principio rector (spec §27): **ampliar el catálogo determinístico antes de aumentar las
llamadas a IA.** El KPI es `KAI_LOCAL_RESOLUTION_RATE` ≥ 80% → 90% (spec §25).

---

## Ya implementado (PR 1.0–1.9, en `main`)

| Área | Qué | Spec |
|---|---|---|
| Pipeline | `resolveKaiInteraction`: intent handler → estático → LLM fallback (último recurso, tras budget guard). Auditoría de `resolutionSource` en `kai_interactions`. | §2, §3, §24 |
| Resolver | `normalizeText`, `resolveDateRange` (este mes / ayer / semana / mes pasado), `resolveIntent` (alias "frase más larga gana" + keyword/regex), `parseWriteIntent` (montos AR, slang). | §15 |
| Intents lectura | ~18: gastos/ingresos/ahorro/resultado del mes, saldo, saldos por cuenta, disponible, categoría, top categorías (bar chart), mayor gasto, ayer, vencimientos (tabla), suscripciones (tabla), costo suscripciones, presupuesto, meta, insights. | §1, §14 |
| Intents escritura | `CREATE_EXPENSE` / `CREATE_INCOME` (cuenta auto, toast con Deshacer), `ALLOCATE_TO_GOAL`, `VOID_TRANSACTION`, `PAY_OBLIGATION`, `CREATE_TRANSFER`, `EDIT_TRANSACTION_CATEGORY` (metadata solamente — el monto nunca se edita, se anula y se rehace), `CREATE_GOAL`, `CREATE_BUDGET` (categoría inferida/resuelta por nombre; si falta el monto, KAI lo pregunta y espera la respuesta antes de confirmar). Todos vía `KAI_CONFIRMATION`. | §11, §12 |
| Estático | Registro Nivel 0: saludos, ayuda, navegación, FAQ, "¿qué es esta pantalla?" por contexto. | §3, §10 |
| Respuestas | `KAI_METRIC`, `KAI_CHART` (barras), `KAI_TABLE`, `KAI_CONFIRMATION`, `KAI_INSIGHT`, `KAI_NAVIGATION`, `KAI_ACTION`, `KAI_TEXT`, `KAI_ERROR`. | §12 |
| Follow-ups | `KAI_FOLLOWUPS` por intent → chips clicables tras cada respuesta. | §16 |
| Frontend | `KaiFloatingAssistant` (estados visuales, quick actions 2×2, animaciones de "pensando"/reveal/barras), `KaiResponseCard`, `KaiAvatar` (mascot 3D por estado), tokens `--kai-*`. | §5, §6 |
| Proactivo | `buildProactiveCandidates` (10 reglas: presupuesto excedido/cerca del límite, vencimiento ≤7d, suscripción por vencer/cambio de precio, gasto grande atípico, insights por severidad, category-spike +20% MoM, cierre de mes ≥2 categorías, hito de meta 25/50/75/100%, racha de ahorro +10% MoM) + `selectProactive` (cola de prioridad P0–P5, cap 3/día + cooldown 90min, quiet hours 23–8, snooze/mute por tipo). Persistido en `kai_notifications` (no `localStorage`). `KaiAlertCard` pixel-fiel a los mockups. | §7, §8, §9 |
| Monetización | Puntos KAI (determinístico 1 / LLM 5). FREE 150/mes, TRIAL/PRO ilimitado. Tabla `kai_interactions.weight`. LLM desacoplado del pool de créditos IA. | §19 |
| Guardas | Budget guard USD por usuario/día + global/mes. Rate limiter (in-memory). | §19 |

---

## Backlog

Prioridad: **P0** = próximo, **P1** = pronto, **P2** = después.

---

### Fase A — Proactivo completo  *(✅ CERRADA 2026-09-11 — el WP-KAI-EVENT-TRIGGERS que queda "parcial" es una mejora incremental, no bloquea seguir a la Fase C)*

| WP | Contenido | Spec | Estado |
|---|---|---|---|
| **WP-KAI-PROACTIVE-QUEUE** | Priority queue P0–P5 real (P0 crítico nunca se sofoca). | §8 | ✅ DONE — `selectProactive`. |
| **WP-KAI-PROACTIVE-PERSIST** | Tabla `kai_notifications` (`userId, kind, dedupKey, priority, shownAt, dismissedAt, actionTakenAt, expiresAt, payload`). | §8 | ✅ DONE. |
| **WP-KAI-FREQ-CAP** | Máx 3/día, cooldown 90min, snooze ("recordarme mañana"), mute por tipo, **quiet hours** (23–8 hora local, P0 exento). | §9 | ✅ DONE (quiet hours agregado 2026-09-11: `hourInTimezone` + `KaiFrequencyCap.quietHours`, tests en `kai-proactive.test.ts`). |
| **WP-KAI-PROACTIVE-RULES** | 10 reglas (presupuesto, vencimientos, suscripciones + cambio de precio, gasto atípico, insights, category-spike, cierre de mes, hito de meta, racha de ahorro). | §4, §7 | ✅ DONE — `buildProactiveCandidates`. |
| **WP-KAI-PROACTIVE-CACHE** | Throttle de `getKaiProactiveMessageAction` (90s in-memory por usuario) + invalidación explícita vía evento del cliente tras una mutación. | §20 | ✅ DONE. |
| **WP-KAI-EVENT-TRIGGERS** | Evento `kai:refresh-proactive` disparado tras cada mutación financiera relevante en el propio cliente (no solo Quick Add): editar/anular movimiento, aportar/retirar/editar meta, registrar pago de obligación. Sigue siendo *misma pestaña* — no hay push entre pestañas/dispositivos (eso es WP-KAI-PROACTIVE-DELIVERY). | §21, §22 | ⚠️ PARCIAL (ampliado 2026-09-11 a `transaction-actions.tsx`, `goal-actions.tsx`, `goal-form.tsx`, `debt-actions.tsx`). Falta: transferencias, presupuestos, importaciones, categorías — y el mecanismo sigue siendo por-componente, no un bus central. |
| **WP-KAI-PROACTIVE-DELIVERY** | Push entre pestañas/dispositivos: endpoint propio `/api/kai/proactive/stream` (SSE, mismo patrón que `/api/notifications/stream` — poll de Postgres por conexión, sin pub/sub) reutilizando la acción throttleada; el cliente lo escucha además del evento same-tab. | §7 | ✅ DONE (2026-09-11). Poll por conexión (~15s), no push instantáneo cross-proceso — suficiente dado que no hay infra de pub/sub. |

---

### Fase B — Motor de reglas / insights  *(✅ CERRADA 2026-09-11)*

| WP | Contenido | Spec | Estado |
|---|---|---|---|
| **WP-KAI-INSIGHTS-WIRE** | Conectar los `DETECTORS` existentes (`features/insights/detectors.ts`) + `packages/finance/insights/*` (materiality, priority, reconcile) al motor proactivo de KAI, en vez de duplicar reglas. | §4 | ✅ DONE — `kai-ports.instance.ts`'s `getInsightsForProactive`/`getTopInsight` ya leían de `insightService.getQueue`. |
| **WP-KAI-DETECTORS-6** | Los 6 detectores de insight que faltaban: `INS-SPEND-DELTA`, `INS-SPEND-PACE`, `INS-OBL-DUE`, `INS-REC-AMOUNT`, `INS-REC-DETECT`, `INS-ANOMALY-AMOUNT`. | §4, §12-insights-spike | ✅ DONE. Todos reusan lecturas que ya existían (deltas del propio `report.expenseByCategory`, `obligationReadModel`, `subscriptionRepository` con `priceHistory`, `recurringDetectionService.listSuggestions`, `activityQueries.listRecentActivity`) — cero queries nuevas. Materialidad/prioridad/cooldown por familia ya estaban definidos en `packages/finance/insights/*` desde antes; solo faltaban los detectores. Ojo: `INS-REC-DETECT` lee las sugerencias que el último scan (manual o cron) ya encontró — no vuelve a correr el detector de 400 días en cada refresh de insights, sería demasiado caro. 8 tests de integración en `tests/integration/insight-engine.test.ts` (2 nuevos, exercising INS-OBL-DUE e INS-REC-AMOUNT contra Postgres real). |
| **WP-KAI-INSIGHTS-CRON** | Cron nocturno que genera insights por usuario. | §21 | ✅ DONE — `/api/cron/insights` ya existía de una pasada anterior. |

---

### Fase C — Catálogo determinístico  *(WP-KAI-WRITE-ACTIONS-2 cerrado 2026-09-11; quedan WP-KAI-CALCULATORS y WP-KAI-FORM, ambos cosméticos/UX, no bloquean seguir a la Fase B)*

> Auditoría 2026-09-11: esta tabla decía "no existe" para varias cosas que ya se habían hecho
> en pasadas anteriores (temporal, taxonomía, comercio, comparación) — quedó desactualizada,
> no la Fase C en sí. Corregido abajo para no repetir el mismo problema.

| WP | Contenido | Spec | Estado |
|---|---|---|---|
| **WP-KAI-INTENTS-TEMPORAL** | Rangos: esta quincena, este trimestre, este año, últimos N meses/semanas, "en {mes}". | §15 | ✅ DONE — `resolveDateRange` ya los cubre. |
| **WP-KAI-INTENTS-CATEGORY-TAXONOMY** | "¿cuánto gasté en {grupo}?" (Comida, Transporte…) resolviendo por nodo de taxonomía, no solo por categoría propia del usuario. | §1, §6 | ✅ DONE — `resolve-category-query.ts` (`flattenTaxonomy` + sinónimos). |
| **WP-KAI-INTENTS-MERCHANT** | "¿cuánto gasté en {comercio}?" con cantidad de movimientos. | §1 | ✅ DONE — `getMerchantExpenses` (con `count`). |
| **WP-KAI-INTENTS-COMPARISON** | `KAI_COMPARISON` emitido y renderizado. "¿gasté más que el mes pasado?". | §12 | ✅ DONE — `GET_EXPENSE_COMPARISON` + renderer en `kai-response-card.tsx`. |
| **WP-KAI-CALCULATORS** | `calculateExpenseTrend`, `calculateHistoricalAverage`, `calculateProjectedMonthEnd`, `calculateSpendingVariation`, `calculateInstallmentCommitment`, `calculateUpcomingCommitments` como funciones nombradas y testeadas en `packages/finance`/`packages/kai`. | §3 | ❌ PENDIENTE — la capacidad existe (run-rate en `GET_SPENDING_PROJECTION`, variación en `GET_EXPENSE_COMPARISON`) pero inline en el handler, no como calculadora reusable/testeable por separado. Cosmético/testabilidad, no bloquea nada. |
| **WP-KAI-WRITE-ACTIONS-2** | Por chat: aporte a meta, anular movimiento, pagar una cuota/obligación, transferencia, editar movimiento, **crear presupuesto o meta**. | §11 | ✅ DONE (2026-09-11) — aporte a meta, anular, pagar cuota, transferencia, editar categoría, **crear meta** (`CREATE_GOAL`: "creá una meta de $X para {nombre}", categoría inferida por keyword, si falta el monto KAI lo pregunta y espera la respuesta) y **crear presupuesto** (`CREATE_BUDGET`: "creá un presupuesto de $X para {categoría}", igual mecánica). El monto de un movimiento sigue sin ser editable por chat — es una decisión de diseño del propio ledger, no una limitación de KAI. |
| **WP-KAI-FORM** | Tipo `KAI_FORM` (definido, nunca producido) + mini-formularios inline en la card. | §12 | ❌ PENDIENTE. |

---

### Fase D — Resolver de lenguaje natural  *(P2)*

| WP | Contenido | Spec |
|---|---|---|
| **WP-KAI-RESOLVER-CONTEXT** | Follow-up conversacional real: "¿y el mes pasado?" toma el intent anterior y le cambia el rango (hoy manda una frase canned). Guardar `lastIntent` + params. | §15 |
| **WP-KAI-RESOLVER-FUZZY** | Tolerancia a typos, command parser estructurado (paso 7 de §15), normalización de números escritos ("mil quinientos"). | §15 |
| **WP-KAI-RESOLVER-TUNING** | Loggear cada `UNRESOLVED` con el texto → reporte "intents faltantes" → ajustar aliases/umbral con datos reales. | §25 |

---

### Fase E — Capa LLM  *(P2 — recién cuando el catálogo esté maduro)*

| WP | Contenido | Spec |
|---|---|---|
| **WP-KAI-LLM-COMPLEX** | `assistant.query.complex` (peso 10) para preguntas de razonamiento real; el resolver decide simple vs complejo. | §17 |
| **WP-KAI-LLM-MIN-CONTEXT** | Builder de `minimumRequiredContext` por tipo de pregunta (hoy manda el snapshot entero). "¿por qué subieron mis gastos?" → solo `currentExpenses / previousExpenses / categoryVariations / largestChanges`. | §18 |
| **WP-KAI-LLM-EXPLAIN** | Enganchar la capability `insight-explanation` existente → botón "Explicame el detalle" en cards e insights. | §17 |
| **WP-KAI-LLM-STREAMING** | Respuesta en streaming en el panel (hoy espera la respuesta completa). | §6 processing |

---

### Fase F — Cache, KPI, infra  *(P2, transversal)*

| WP | Contenido | Spec | Estado |
|---|---|---|---|
| **WP-KAI-CACHE** | Cache de respuestas determinísticas por clave; invalidar en eventos financieros. | §20 | ✅ DONE (2026-09-11) — `kai-response-cache.ts`: memoiza los ports de lectura de `buildKaiPorts` por `(userId, método, args)`, TTL 20s, en memoria por proceso. **Deliberadamente no cachea** los ports que alimentan una confirmación de escritura (`getObligationsForPayment`, `findTransactionToVoid`, `getAccountsForTransfer`, `getCategoriesForEdit`, `getGoalsForAllocation`) — ahí una lectura vieja sería un bug, no solo UX. Invalidación exacta e inmediata desde las 8 escrituras propias de KAI (`kai-create-actions.ts`); una mutación desde el resto de la app (Quick Add, /budgets, otra pestaña) queda acotada por el TTL de 20s en vez de enganchar los ~40 call-sites de `emitFinancialEvent` — mismo trade-off que ya aceptó `WP-KAI-PROACTIVE-CACHE` (90s) por la misma razón. 5 tests unitarios nuevos (`kai-response-cache.test.ts`). |
| **WP-KAI-QUERY-REGISTRY** | Formalizar el registro de queries (`intent → { params, query, calculator, template, state, actions, cacheKey }`) como en §14. | §14 | ❌ PENDIENTE (cosmético — hoy son handlers sueltos por intent, funcionan igual). |
| **WP-KAI-KPI-DASHBOARD** | Superficie (admin o script) para `KAI_LOCAL_RESOLUTION_RATE`, intents más frecuentes, costo promedio por usuario, uso real de OpenRouter. | §24, §25 | ✅ DONE vía script (`pnpm kai:report`) — el propio WP dice "admin o script". Una superficie *admin web* no existe (no hay ninguna página `/admin` en la app todavía — sería el primer consumidor de `requireAdminUser`/`admin_roles`, ya construidos pero sin UI); si Diego la quiere, es una decisión aparte, no una extensión chica de KAI. |
| **WP-KAI-BUDGET-GUARD-FULL** | Completar `KaiAIBudgetService`: `maxTokensPerResponse`, `dailyUserLimit`, `monthlyUserLimit` (además del USD ya hecho). Registro `requestId / model / tokens / estimatedCost / reasonForLLM`. | §19 | ✅ DONE (2026-09-11) — `requestId`/`model`/`tokens`/`estimatedCost` ya vivían en `ai_generation_events` (telemetría genérica de toda la IA, KAI incluida). Faltaba **`reasonForLLM`**: el orchestrator ya calculaba el motivo (`unresolved`/`low-confidence`/`handler-error`) pero `kai-llm-fallback.instance.ts` lo descartaba. Ahora se persiste en `kai_interactions.reason_for_llm` (migración 0055) y `pnpm kai:report` lo desglosa. `maxTokensPerResponse`/`dailyUserLimit`/`monthlyUserLimit` por usuario individual quedan fuera — el guard ya cubre el caso real (USD por usuario/día + global/mes); un tercer límite en tokens sería redundante sin un caso de uso concreto que lo pida. |
| **WP-KAI-RATE-LIMIT-DISTRIBUTED** | Rate limiter Redis (hoy in-memory, por proceso). | §19 | ❌ PENDIENTE — sin Redis en la infra todavía, no hay nada para conectar. |

---

### Fase G — Response types + UX  *(P2)*

| WP | Contenido | Spec |
|---|---|---|
| **WP-KAI-CHART-TYPES** | Líneas, donut, sparkline (solo barras hoy). Reusar componentes de `features/reports`. | §12 |
| **WP-KAI-FEEDBACK-PERSIST** | 👍👎 en respuestas → persistir en `kai_interactions` (`feedback`), usar para tuning. Hoy es solo UI. | §12, §25 |
| **WP-KAI-ONBOARDING** | Intro la primera vez que se abre KAI; hacer visible el atajo (`J`). | §6 |
| **WP-KAI-CONVERSATION-PERSIST** | Mantener la conversación al cerrar/reabrir (hoy se pierde — decisión v1, revisar). | — |
| **WP-KAI-A11Y** | `aria-live` en las cards proactivas, manejo de foco, revisar la card + mascot flotante en anchos chicos. | §6 |
| **WP-KAI-ATTACH** | El clip del input es decorativo → cablearlo (adjuntar comprobante → OCR) o sacarlo. | §12 |

---

### Fase H — Limpieza  *(P2)*

| WP | Contenido |
|---|---|
| **WP-KAI-CLEANUP-ASSISTANT** | Plegar `features/assistant/` (solo `assistant-snapshot.ts` se usa) dentro de `features/kai/`. Auditar si `runAssistantChat` / `assistant.query.simple` siguen usándose. |
| **WP-KAI-CLEANUP-ASSETS** | Dedupe de PNGs del mascot (`kai.png` / `kai-alerta.png` / `kai-enojado.png` / `kai-positivo.png` conviven con `kai-alert.png` etc). |
| **WP-KAI-CLEANUP-TOAST** | Reconciliar `components/shared/kai-toast.tsx` (de otra sesión) con los componentes de `features/kai`. |

---

### Testing  *(transversal, con cada WP)*

| WP | Contenido |
|---|---|
| **WP-KAI-E2E** | Playwright: abrir KAI, preguntar → card; crear gasto por chat; card proactiva → descartar; follow-up. |
| **WP-KAI-INTEGRATION** | Paridad de cada handler vs DB real (arrancado en `tests/integration/kai-interactions.test.ts`, necesita `TEST_DATABASE_URL`). |
| **WP-KAI-VISUAL-REGRESSION** | Snapshot de las cards de KAI vs los mockups de `docs/visual/` (falta subir los mockups al repo). |

---

## Orden sugerido

1. **Fase A** completa (proactivo real) — es lo que Diego pidió ver funcionando.
2. **Fase C** (catálogo) en paralelo — sube el KPI, barato.
3. **Fase B** (insights) — reusa lo que ya existe.
4. **Fase F** KPI dashboard — para medir si vamos bien antes de tocar la Fase E.
5. Fases D / E / G / H — iterativo.
