<div align="center">

<img src="apps/web/public/brand/kai/kai-neutral.png" alt="KAI" width="132" />

# KnowFinanzas

**Control financiero personal, pensado para Argentina.**
Multi-moneda, dólar blue, presupuestos, metas, deudas en cuotas — y **KAI**, un asistente que responde con *tus* datos, al instante.

<p>
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-15-000000?logo=next.js&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white" />
  <img alt="Drizzle ORM" src="https://img.shields.io/badge/Drizzle-Postgres-C5F74F?logo=drizzle&logoColor=black" />
  <img alt="pnpm workspaces" src="https://img.shields.io/badge/pnpm-workspaces-F69220?logo=pnpm&logoColor=white" />
  <img alt="Tests" src="https://img.shields.io/badge/tests-vitest%20%2B%20playwright-6E9F18?logo=vitest&logoColor=white" />
</p>

</div>

---

## ¿Qué es?

KnowFinanzas es una aplicación web para llevar tus finanzas personales sin fricción: registrás un movimiento en dos toques, la app lo categoriza sola, y todo lo demás —saldos, disponible real, proyecciones, vencimientos— se calcula de forma **determinística y auditable**.

| | |
|---|---|
| 💸 **Captura sin fricción** | `+ Registrar` / tecla `N` / `⌘K` desde cualquier pantalla. Categorización automática, comercios normalizados, detección de duplicados y de suscripciones. |
| 🌎 **Multi-moneda + dólar blue** | Cada monto vive en su moneda (nunca se suman entre sí). Conversión `≈ estimada` a compra/venta del blue en reportes, resumen y `/conversor`. |
| 📊 **Presupuestos, metas y deudas** | Límite mensual por categoría, metas con ritmo requerido, deudas en cuotas con calendario y estado. |
| 🔔 **Insights + notificaciones en vivo** | Motor de reglas (suba de gasto, presupuesto al límite, vencimientos) + badge y toasts por SSE. |
| 🤖 **KAI** | Asistente contextual. La mayoría de las respuestas salen de SQL + cálculos, sin llamar a un LLM. |
| 💳 **Freemium** | FREE / TRIAL / PRO con MercadoPago. Créditos de IA para la categorización; **puntos KAI** para el asistente. |

---

## 🤖 KAI — asistente determinístico primero

KAI es el producto; el LLM es una herramienta que usa **solo cuando hace falta**. Cada interacción atraviesa este pipeline y se registra su origen (`resolutionSource`) para medir cuánto se resuelve sin IA:

```
Usuario  ─►  intent resolver (es-AR)  ─►  ┌─ estático  (ayuda, navegación, FAQ)
                                          ├─ SQL       ("¿cuánto gasté este mes?")
                                          ├─ cálculo   ("¿cuánto tengo disponible?")
                                          ├─ acción    ("registrá $30.000 en YPF" → confirmación)
                                          └─ LLM       (último recurso: "¿por qué no llego a fin de mes?")
                                                       ▲ detrás de un budget guard en USD
```

- **Respuestas estructuradas**, no texto plano del modelo: métricas, **gráfico de barras** por categoría, **tablas** con fechas de vencimiento, tarjetas de confirmación.
- **Puntos KAI** (medidor único): consulta con datos = 1 punto, análisis con IA = 5. FREE `150/mes`, TRIAL/PRO ilimitado.
- Después de cada respuesta, KAI ofrece **preguntas de seguimiento** clicables.
- Animaciones de "pensando", aparición y armado del gráfico — aunque la respuesta sea instantánea.

> [!NOTE]
> KAI vive en el paquete puro `@know-finanzas/kai` (sin IO); `apps/web` lo cablea con los datos reales. Ver `packages/kai/`.

---

## Estructura del monorepo

```
apps/
  web/                 Next.js 15 (App Router) — la aplicación
packages/
  kai/                 motor del asistente: resolver, registry, handlers, orquestador (IO-free)
  finance/             cálculos financieros puros: Money, saldos, presupuestos, proyecciones, cuotas
  db/                  schema Drizzle + migraciones + repositorios + queries (Postgres)
  ai/                  capa de IA: capabilities, créditos, proveedor OpenRouter, telemetría de costo
  billing/             planes, entitlements y límites (FREE / TRIAL / PRO)
  notifications/       intents de notificación, canales (in-app, email, WhatsApp), preferencias
  auth/               Better Auth
  analytics/  audit/  observability/  privacy/  promotions/  referrals/  config/  shared/  validation/
docs/                  ADRs, specs de UI (docs/visual/), roadmap de implementación, pricing
```

---

## Puesta en marcha

**Requisitos:** Node ≥ 20.11, pnpm 10, Docker (para Postgres local).

```bash
# 1. Dependencias
pnpm install

# 2. Postgres local (dev + test en :5433)
docker compose up -d

# 3. Variables de entorno
cp .env.example .env        # ajustá BETTER_AUTH_SECRET; el resto anda por defecto

# 4. Base de datos
pnpm db:migrate
pnpm db:seed-taxonomy       # taxonomía de categorías + comercios

# 5. A correr
pnpm dev
```

La app queda en **http://localhost:3000** · health check en `/api/health/live`.

> [!TIP]
> La IA está **apagada** por defecto (`AI_ENABLED=false`). KAI funciona igual con todo lo determinístico. Para habilitar el fallback LLM y la categorización con IA, configurá `AI_ENABLED=true` + `OPENROUTER_API_KEY` + los `AI_MODEL_*` en `.env`.

---

## Scripts

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo de la web |
| `pnpm build` | Build de producción |
| `pnpm typecheck` | `tsc --noEmit` sobre la web (resuelve los paquetes por código fuente) |
| `pnpm lint` | ESLint (`--max-warnings=0`) |
| `pnpm test` | Toda la suite de Vitest |
| `pnpm test:unit` · `pnpm test:integration` | Unit / integración (integración necesita `TEST_DATABASE_URL`) |
| `pnpm test:e2e` | Playwright |
| `pnpm db:generate` · `pnpm db:migrate` | Generar / aplicar migraciones Drizzle |
| `pnpm db:seed-taxonomy` · `pnpm db:backfill-transactions` | Semillas y backfills |
| `pnpm ai:cost-report` | Reporte de costo real (USD) de las llamadas a IA |
| `pnpm finance:audit` | Auditoría de consistencia financiera |

---

## Testing

- **Unit** (`tests/unit/`) — lógica pura: `@know-finanzas/finance`, `@know-finanzas/kai`, resolvers, mappers. No tocan la DB.
- **Integración** (`tests/integration/`) — servicios y repositorios contra un Postgres de test real (`know_finanzas_test` en `:5433`).
- **E2E** (`tests/e2e/`) — Playwright sobre la app autenticada.

```bash
pnpm test:db:check     # prepara/valida la base de test
pnpm test              # todo
```

---

## Arquitectura, en corto

- **Dominio puro en paquetes.** `finance` y `kai` no importan la DB ni `env`; reciben *ports* que `apps/web` implementa. Se testean en aislamiento.
- **Montos como decimales, por moneda.** `Money` (decimal.js) redondea solo al serializar; nunca se suma entre monedas.
- **Determinístico y auditable.** Saldos, disponible, proyecciones y las respuestas de KAI se calculan igual siempre; la IA solo *explica* o cubre lo que las reglas no llegan.
- **Server Actions + RSC.** Sin API REST propia; cada acción re-autentica y valida con Zod.

Decisiones registradas en `docs/adr/` y `docs/implementation/`.

---

## Deploy

Imagen Docker (`Dockerfile`), configurada para **Railway** (`railway.toml`, servicio `web`, health check `/api/health/live`).

> [!IMPORTANT]
> Las migraciones **no** corren solas en el deploy (puede haber varias réplicas). Ejecutá `pnpm db:migrate` como paso explícito antes de publicar instancias nuevas — ver `docs/implementation/16-deploy-runbook.md`.

---

<div align="center">
<sub>Hecho con foco en es-AR · <a href="docs/">docs/</a> · el mascot es KAI 👋</sub>
</div>
