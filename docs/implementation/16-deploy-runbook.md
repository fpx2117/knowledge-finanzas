# Deploy runbook

WP-DEPLOY. El código de deploy (CI, Dockerfile, `railway.toml`, health checks, hardening) ya está
en el repo. Este documento es **la lista exacta de pasos que ejecuta una persona** — provisioning,
secrets y DNS no se pueden automatizar desde acá.

## Qué ya está hecho (código)

| Artefacto | Qué hace |
|---|---|
| `.github/workflows/ci.yml` | En cada push/PR: `lint` → `typecheck` → chequeo de drift de migraciones (`db:generate` no debe producir diff) → `db:migrate` contra un Postgres 16 fresco → `pnpm test` (unit + integración, 177 archivos) → `build` → `test:e2e` (11 specs, `next start` contra el build). `dependency-review-action` en PRs. Ningún proveedor externo real — `AI_ENABLED`/`BILLING_ENABLED`/`NOTIFICATIONS_ENABLED` quedan en `false`. |
| `Dockerfile` | Multi-stage. `deps` (instala con lockfile congelado, sólo package.json de cada workspace para cachear) → `build` (`next build` con `NEXT_OUTPUT_STANDALONE=true`, env vars placeholder que Railway sobreescribe en runtime) → `runtime` (`node:20-slim`, usuario no-root `nextjs`, sólo `.next/standalone` + `.next/static`, sin devDependencies ni `.env`). Arranca `node apps/web/server.js` en `:3000`. |
| `railway.toml` | Builder = Dockerfile. `healthcheckPath = /api/health/live`, timeout 30s, restart ON_FAILURE (máx 3). **No corre migraciones automáticamente** (Railway puede levantar varias réplicas — una sola debe migrar por deploy). |
| `.dockerignore` | Excluye `.env*`, `node_modules`, `.next`, `tests`, `docs`, `*.md` del contexto de build. |
| `apps/web/src/instrumentation.ts` | Al arrancar el proceso (no en build), corre `assertProductionHardening(env)` — ver abajo. |
| `apps/web/src/app/api/health/{live,,deep}/route.ts` | `live` = liveness pura (nunca toca la DB). `/` = readiness (chequea la DB, 503 si cae). `deep` = diagnóstico protegido con `INTERNAL_HEALTH_TOKEN` (reporta qué capabilities están configuradas, nunca sus valores). |

## Variables de entorno

### Requeridas (el proceso no arranca sin ellas)

| Var | Valor en producción |
|---|---|
| `DATABASE_URL` | El connection string de Postgres de Railway. **No** puede apuntar a `localhost` (lo rechaza `assertProductionHardening`). |
| `BETTER_AUTH_SECRET` | Secreto aleatorio **≥ 32 chars**. Generar: `openssl rand -base64 48`. No puede ser el placeholder de `.env.example`. |
| `BETTER_AUTH_URL` | La URL pública **`https://`** de la app (ej. `https://app.knowfinanzas.com`). Debe ser HTTPS en producción. |
| `INTERNAL_HEALTH_TOKEN` | Secreto aleatorio para `/api/health/deep`. Requerido en producción. Generar: `openssl rand -hex 32`. |
| `NODE_ENV` | `production` (Railway lo setea; el Dockerfile también). |

`RAILWAY_ENVIRONMENT_NAME` lo inyecta Railway automáticamente — cuando vale `"production"`, se
activan los chequeos de hardening. No lo setees a mano.

### Opcionales — cada capability queda apagada hasta configurarla completa

- **IA** (`AI_ENABLED=true`): `OPENROUTER_API_KEY`, `AI_MODEL_FAST`/`_BALANCED`/`_QUALITY`/`_REASONING`, `OPENROUTER_APP_NAME`, `OPENROUTER_APP_URL`. `AI_CATEGORIZATION_ENABLED` aparte.
- **Billing / Mercado Pago** (`BILLING_ENABLED=true`): `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`, `MERCADOPAGO_PRO_MONTHLY_PLAN_ID`. Para permitir altas nuevas: `BILLING_NEW_SUBSCRIPTIONS_ENABLED=true`.
- **Notificaciones** (`NOTIFICATIONS_ENABLED=true` + al menos un canal): email → `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_WEBHOOK_SECRET`, `EMAIL_NOTIFICATIONS_ENABLED=true`. WhatsApp → `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`, los `TWILIO_TEMPLATE_*_SID`, `WHATSAPP_NOTIFICATIONS_ENABLED=true`.
- **Storage S3** (backups/adjuntos): `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`.
- `REDIS_URL`, `ANALYTICS_INTERNAL_EMAIL_DOMAINS`.

El catálogo comercial (`TRIAL_*`, `PRO_*`) tiene defaults en `packages/config`; sólo setealos si
querés cambiarlos.

## Primer deploy (paso a paso — lo hacés vos)

1. **CI verde en `main`.** No deployar un commit cuyo `ci.yml` no pasó.
2. **Provisionar en Railway:**
   - Crear el proyecto, agregar un plugin **PostgreSQL**.
   - Crear el servicio **web** desde este repo (Railway detecta el `Dockerfile` vía `railway.toml`).
3. **Cargar las variables de entorno** del servicio web (las requeridas + las capabilities que
   vayas a activar). `DATABASE_URL` referenciá la del plugin de Postgres (`${{Postgres.DATABASE_URL}}`).
4. **Correr las migraciones una vez, contra la DB de producción, antes del primer arranque:**
   ```
   DATABASE_URL="<url prod>" pnpm db:migrate
   ```
   Desde tu máquina o un one-off job de Railway. **Nunca** dejes que el contenedor web migre en el
   `startCommand` (varias réplicas migrarían en paralelo).
5. **(Opcional) Seed de taxonomía de categorías** si querés el set canónico disponible:
   `DATABASE_URL="<url prod>" pnpm db:seed-taxonomy`.
6. **Deploy.** Railway buildea el Dockerfile y arranca `node apps/web/server.js`.
7. **Verificar:**
   - `GET https://<tu-dominio>/api/health/live` → `{"status":"ok"}`
   - `GET https://<tu-dominio>/api/health` → `{"status":"ok","database":"ok"}`
   - `GET https://<tu-dominio>/api/health/deep` con `Authorization: Bearer <INTERNAL_HEALTH_TOKEN>` → reporte de capabilities
   - Registrarse, crear una cuenta, registrar un gasto — el flujo del journey E2E, a mano.
8. **DNS:** apuntá tu dominio al servicio de Railway y poné ese mismo valor en `BETTER_AUTH_URL`.

## Cada deploy siguiente

1. Merge a `main` → CI verde.
2. Si el diff **incluye una migración nueva** (`packages/db/drizzle/NNNN_*.sql`):
   `DATABASE_URL="<url prod>" pnpm db:migrate` **antes** de promover el nuevo build.
   Las migraciones de este repo son additive-first; si alguna fuera destructiva, coordinar downtime.
3. Promover el deploy en Railway.
4. Smoke test: los 3 health checks + un journey a mano.
5. Post-deploy: correr `pnpm finance:audit` contra producción (`DATABASE_URL` prod) — debe dar
   `findings: []` (gate G1). Si no, rollback.

## Webhooks (cuando actives billing/notificaciones)

Configurar en cada proveedor la URL pública del handler correspondiente:

| Proveedor | URL | Secreto |
|---|---|---|
| Mercado Pago | `https://<dominio>/api/webhooks/mercadopago` | `MERCADOPAGO_WEBHOOK_SECRET` |
| Resend | `https://<dominio>/api/webhooks/resend` | `RESEND_WEBHOOK_SECRET` |
| Twilio | `https://<dominio>/api/webhooks/twilio` | firma validada con `TWILIO_AUTH_TOKEN` |

Los tres handlers verifican firma y son idempotentes (`billing_webhook_events` / equivalente). Una
firma inválida loguea `webhook_invalid_signature` (ver `15-observability.md`).

## Observabilidad post-deploy

Configurar en el agregador de logs de Railway (o el que uses) las reglas de alerta de
`docs/implementation/15-observability.md` §"Reglas de alerta recomendadas". Mínimo indispensable:
`action.unexpected_error` (cualquiera → page) y `security.ownership_lookup_failed` por `userId`
(> 10 en 5 min → page).

## Follow-ups de deploy (no bloquean el primer deploy)

- Servicio **worker** aparte (su propio `railway.toml`) cuando existan jobs de recurrentes /
  recordatorios / reconciliación programada.
- Cron que corra `runFinanceAudit` + `recovery:validate` y emita el resultado como evento de log.
- Backups automáticos de Postgres a S3 (`pnpm db:backup`) + prueba de restore periódica.
- Staging environment en Railway (mismo Dockerfile, `RAILWAY_ENVIRONMENT_NAME != "production"` →
  hardening no aplica, podés usar credenciales de sandbox).
