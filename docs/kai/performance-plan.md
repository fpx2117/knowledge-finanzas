# KAI — Plan de performance y concurrencia

> Complementa `docs/kai/implementation-backlog.md` (Fase F). Foco: que KAI aguante
> **muchos usuarios consultando al mismo tiempo** sin caídas, pérdida de conexión ni
> degradación de latencia.
> Estado del motor: `packages/kai/` + `apps/web/src/features/kai/`.

---

## 1. Modelo de concurrencia actual

### Pool de conexiones — OK

`packages/db/src/client.ts` + `application-client.ts`:

- Un **único pool `postgres-js`** por proceso, pinneado a `globalThis` (sobrevive al HMR).
- `max: 10` (prod) / `5` (dev), `idle_timeout: 20s`, `max_lifetime: 30 min`, `prepare: false`.
- `postgres-js` **encola** las queries cuando el pool está lleno — no tira error ni "pierde
  conexión". El modo de falla bajo carga es **latencia**, no caída.
- El único error tipo *"demasiados clientes"* aparece si `nº instancias × max` supera el
  `max_connections` de Postgres (100 por defecto).

### Costo por mensaje de KAI — el problema

Un solo `sendKaiMessageAction`:

| Paso | Queries | Notas |
|---|---|---|
| `requireCurrentUser()` | 1 | sin cache de request |
| `getKaiAccess()` (gate de entrada) | ~4 | `getAccessState` = 3 (`Promise.all`) + `consumedPointsForUser` = 1 |
| resolver intent | 0 | en memoria |
| handler → ports | 1–5 | según el intent; `getSpendable` solo dispara **5** (`getDashboardSummary`) |
| `kaiInteractionRepository.record()` | 1 INSERT | **en el camino crítico** (se `await` antes de responder) |
| `getKaiAccess()` (re-lectura post-INSERT) | ~4 | **repite** el trabajo del gate de entrada |
| si va al LLM: `buildAssistantSnapshot` | +5 | **vuelve a llamar** `getDashboardSummary` |

→ **~11 queries para una pregunta simple**, **~16 si toca el LLM**, de las cuales ~8 son
redundantes (dos `getKaiAccess`, `getDashboardSummary` duplicado).

Con `max: 10` y ~5 queries en `Promise.all` por request, **2 requests concurrentes de KAI
saturan el pool** → el resto encola.

### Otros riesgos

- **No hay rate-limit por request en KAI.** El path determinístico no pasa por ningún
  limitador; el path LLM solo tiene el budget guard USD + medidor de puntos (mensual). Un PRO
  en loop, o un cliente con bug, puede martillar el server action sin tope.
- **No hay cache de respuestas determinísticas.** El spec §20 define un `resolutionSource:
  "CACHE"` pero no está cableado. Cada *"¿cuánto gasté este mes?"* re-ejecuta el SQL.
- `getMerchantExpenses` / `getRecentExpenses` traen **hasta 500 filas** y filtran en JS.
- `resolutionStats` / `countByIntent` hacen `count(*)` de tabla completa (solo filtro por
  `created_at`) — OK hoy, no escala a millones de filas (no es hot-path por usuario).

### Índices — OK

`kai_interactions`: `(user_id, created_at)`, `(created_at)`, `(resolution_source, created_at)`.
El query caliente `consumedPointsForUser(userId, rangoMes)` usa el primero. Los handlers
reusan queries del dashboard/reportes ya indexadas.

---

## 2. Objetivo

| Métrica | Hoy (estimado) | Meta |
|---|---|---|
| Queries por mensaje (determinístico) | ~11 | ≤ 4 |
| Queries por mensaje (LLM) | ~16 | ≤ 7 |
| p95 latencia respuesta determinística | ? (medir) | < 300 ms |
| Requests KAI concurrentes antes de encolar | ~2 | ≥ 10 en 1 instancia |
| Caída / "demasiados clientes" bajo carga | posible con N instancias | 0 |

---

## 3. Work packages

Prioridad: **P0** = ahora, **P1** = pronto, **P2** = después.

### WP-KAI-PERF-1 · Memoización por request  — P0, ~2 h, riesgo bajo

Envolver en `React.cache()` (dedupe automático dentro de un mismo request de RSC/action):

- `requireCurrentUser` / `getCurrentUser`
- `productAccessGate.getAccessState(userId)`
- `getKaiAccess(userId, timezone)` — y **no volver a llamarlo** tras `record()`: calcular
  el nuevo `remaining` restándole `audit.weight` al valor ya leído (evita el 2º viaje).
- `dashboardService.getDashboardSummary({ userId, ... })` — así `getSpendable` (port) y
  `buildAssistantSnapshot` (LLM) comparten el resultado.

**Aceptación:** un `sendKaiMessageAction` de un intent tipo `GET_AVAILABLE_MONEY` hace
≤ 6 queries (medido con un `postgres` log o un contador en `client.ts` bajo `NODE_ENV=test`).

---

### WP-KAI-PERF-2 · Cache de respuestas determinísticas  — P0, ~1 día, riesgo medio
*(reemplaza / concreta `WP-KAI-CACHE` de la Fase F)*

- `packages/kai`: cada handler declara un `cacheKey(params, range, userId)` o `null` (las
  escrituras y `GET_INSIGHTS` no cachean).
- `apps/web`: capa de cache con TTL corto (**60 s** para datos de plata, configurable por
  intent) sobre `resolveKaiInteraction`. Backend: primero un `Map` LRU en proceso (rápido de
  hacer), luego Redis cuando haya (ver WP-KAI-PERF-5).
- Invalidación por evento: enganchar en `emitFinancialEvent()` →
  `transaction.created/updated/voided` invalida `monthlySummary:*` y `categoryBreakdown:*`
  del usuario; `budget.updated` → `budgetStatus:*`; `account.updated` → `balance:*`.
- La respuesta cacheada se audita igual pero con `resolutionSource: "CACHE"`, `weight: 0`
  (no consume punto — decisión de producto a confirmar).

**Aceptación:** dos preguntas idénticas del mismo usuario en < 60 s → la 2ª hace 0 queries de
datos (solo el INSERT de auditoría, o ni eso si va fire-and-forget). Registrar un gasto →
la siguiente pregunta de gastos del mes recalcula.

---

### WP-KAI-PERF-3 · Auditoría fuera del camino crítico  — P1, ~3 h, riesgo bajo

- `kaiInteractionRepository.record()` en **fire-and-forget** (`void record(...).catch(log)`),
  no `await`. La respuesta al usuario no espera el INSERT.
- El `remaining` que se devuelve se calcula en memoria (`accessPrevio.remaining - weight`),
  no releyendo la DB.
- Si el INSERT falla, ya se loguea (está hecho) — a lo sumo se pierde 1 punto de conteo, no
  se rompe la respuesta.

**Aceptación:** matar la tabla `kai_interactions` (rename temporal) → KAI sigue respondiendo,
solo aparece el `console.error`.

---

### WP-KAI-PERF-4 · Rate-limit por request en KAI  — P1, ~4 h, riesgo bajo

- `createInMemoryRateLimiter({ limit: 15, windowMs: 60_000 })` por `userId` al inicio de
  `sendKaiMessageAction` (mismo patrón que `execute-ai-capability.instance.ts`).
- Límite más agresivo para el path LLM (p.ej. 5/min) — chequear después de resolver el
  intent, antes de `runFallback`.
- Respuesta: `KAI_ERROR` con copy tipo *"Dame un segundo, estás yendo muy rápido"* —
  no 500.

**Aceptación:** 20 requests en 10 s del mismo usuario → los primeros ~15 responden, el resto
recibe el error de rate-limit; ningún 500, ningún pico de conexiones.

---

### WP-KAI-PERF-5 · Filtros a SQL (merchant / recientes)  — P1, ~4 h, riesgo bajo

En `activityQueries` (o un query nuevo `kaiQueries`):

- `getMerchantExpenses`: `WHERE (merchant ILIKE $q OR description ILIKE $q) AND type='EXPENSE'
  AND occurredAt BETWEEN ... GROUP BY currency_code` con `SUM` + `COUNT`. Sin traer filas.
- `getRecentExpenses`: `WHERE type='EXPENSE' ... ORDER BY occurredAt DESC LIMIT 10`
  (hoy trae 100 y filtra).
- Índice a evaluar: `transactions (user_id, type, occurred_at)` parcial `WHERE status='POSTED'`
  si el `EXPLAIN` lo pide.

**Aceptación:** `EXPLAIN ANALYZE` de "¿cuánto gasté en Starbucks este mes?" → `Index Scan`,
0 filas materializadas de más.

---

### WP-KAI-PERF-6 · Pool y despliegue  — P0 (config) / P1 (infra), riesgo bajo

- Subir `max` a **20–25** por instancia (10 es muy conservador para prod con carga real) y
  fijar `connect_timeout: 10`, `idle_timeout: 30`.
- **Regla dura:** `nº instancias × max + migraciones/cron + headroom ≤ Postgres max_connections`.
  Documentar en el README de infra. Con Supabase/Neon el `max_connections` real puede ser
  bajo (15–60 según plan) → **pgbouncer / connection pooler en modo transaction** adelante,
  y la app apunta al pooler (por eso `prepare: false` ya está bien).
- Health check: exponer `checkDatabaseConnection()` (ya existe) en un endpoint `/healthz` y
  alertar si el pool está saturado (postgres-js expone métricas de la queue).

**Aceptación:** prueba de carga (k6 / autocannon) — 50 usuarios virtuales haciendo preguntas
a KAI durante 2 min → sin errores, p95 < 800 ms, conexiones Postgres estables.

---

### WP-KAI-PERF-7 · Cache del proactivo  — P1, ~3 h
*(ya está en la Fase A como `WP-KAI-PROACTIVE-CACHE`; se referencia acá porque pega en el
mismo problema)*

`getKaiProactiveMessageAction` corre en **cada navegación** (~5 queries). Cachear 5–15 min
por usuario, invalidar en eventos financieros.

---

### WP-KAI-PERF-8 · Observabilidad de carga  — P2, ~1 día

- Contador de queries por request (wrapper en `client.ts`, activo con un flag).
- Métricas: p50/p95/p99 de `latencyMs` (ya se audita) por `resolutionSource`, tamaño de la
  queue del pool, hit-rate del cache de WP-KAI-PERF-2.
- Sumar al `WP-KAI-KPI-DASHBOARD` de la Fase F.

---

## 4. Orden sugerido

1. **WP-KAI-PERF-6 (config)** — subir `max`, documentar el presupuesto de conexiones. 30 min, quita el techo inmediato.
2. **WP-KAI-PERF-1** — memoización. Baja ~40% de las queries sin cambiar comportamiento.
3. **WP-KAI-PERF-3** — auditoría fire-and-forget. Quita 1 round-trip del p95.
4. **WP-KAI-PERF-4** — rate-limit. Blinda contra el peor caso (loop / abuso).
5. **WP-KAI-PERF-2** — cache determinístico. El mayor salto de capacidad; hacerlo con el
   `Map` LRU primero, Redis después.
6. **WP-KAI-PERF-5** — filtros a SQL. Independiente, cuando toque.
7. **WP-KAI-PERF-6 (infra)** + **WP-KAI-PERF-8** — pgbouncer + prueba de carga + métricas,
   antes de un lanzamiento con tráfico real.
8. **WP-KAI-PERF-7** — junto con la Fase A del proactivo.

## 5. Fuera de alcance de este plan

- Reescribir handlers o el resolver (no es el cuello de botella).
- Reducir llamadas al LLM → eso es la **Fase C** del backlog (ampliar el catálogo
  determinístico); baja costo, no es un problema de concurrencia de DB.
- Sharding / réplicas de lectura → recién si tras WP-1..6 el `EXPLAIN` sigue mostrando
  presión en Postgres.
