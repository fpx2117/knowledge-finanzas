# Deployment Runbook (Railway)

Operational runbook for TASK-039. Not a canonical spec document (not part of the Traceability
Matrix) — it describes *how* to run the deployment/migration process that `docs/18-production-
readiness.md` defines the *requirements* for.

## 1. Environments

Keep at least `development` and `production` as fully separate Railway projects/environments,
each with its own Postgres instance and its own secrets — never share a database or
`BETTER_AUTH_SECRET` between them. A `preview`/`staging` environment is recommended when Railway's
workflow supports it, provisioned the same way as production but pointed at its own database.

## 2. Required production secrets

Set these as Railway environment variables (never baked into the image — see `.dockerignore` and
the Dockerfile's build-time-only placeholder values):

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | Railway's provisioned Postgres connection string. Must not resolve to `localhost`/`127.0.0.1` — `packages/config` refuses to start otherwise. |
| `BETTER_AUTH_SECRET` | A real, randomly generated secret (32+ chars). Never the `.env.example` placeholder or the E2E harness's fixed secret — both are explicitly rejected in production. |
| `BETTER_AUTH_URL` | The real `https://` production domain. HTTP is rejected in production. |
| `INTERNAL_HEALTH_TOKEN` | A random token protecting `/api/health/deep`. Required in production. |

Optional capability flags (`AI_ENABLED`, `BILLING_ENABLED`, `NOTIFICATIONS_ENABLED`, etc.) and their
provider credentials stay independent — see `.env.example` for the full list and
`packages/config/src/index.ts` for which credentials each flag requires. Leaving a flag `false`
never requires its provider credentials to be set.

`packages/config` validates all of this at process startup (both at `next build` time with the
build-time placeholders below, and again at runtime with the real values) — a misconfigured
production environment fails fast with a specific error rather than starting in a broken state.

## 3. Building the image

```
docker build -t know-finanzas-web .
```

The Dockerfile's `build` stage sets its own build-time-only placeholder env vars (a fake but
validation-passing `DATABASE_URL`/`BETTER_AUTH_URL`/`BETTER_AUTH_SECRET`/`INTERNAL_HEALTH_TOKEN`)
so `next build` can statically analyze and prerender pages without needing real credentials or a
reachable database during the build. No real secret is ever baked into the image — Railway injects
the real environment variables at container start, and the standalone Next.js server reads them
from `process.env` at that point.

## 4. Release order

For a release that includes a schema change:

```
1. Confirm a recent Postgres backup exists (Railway's automatic backups, or a manual one)
2. Run `pnpm db:migrate` against the production DATABASE_URL — from a one-off Railway shell/job,
   never from every web replica simultaneously (see §5)
3. Deploy the new web image
4. Deploy the worker image, once one exists
5. Smoke test: hit /api/health/live, /api/health, and one real page per capability area
6. Enable any newly-relevant feature flag (e.g. BILLING_NEW_SUBSCRIPTIONS_ENABLED)
```

For a release with no schema change, skip straight to step 3.

## 5. Migration ownership

Only one process should ever run `pnpm db:migrate` for a given release — never let every Railway
web replica attempt it concurrently. Run it as a one-off Railway command (`railway run pnpm
db:migrate` from the CLI, or a one-off Railway "Run Command" against the production service) before
triggering the web deploy, not as part of the container's start command.

Dangerous schema changes (renaming/removing a column that's actively read, changing a column's
type) must use the expand → migrate → contract pattern already established in this repo (see the
"text not pgEnum" + two-migration-file split precedent in prior tasks' notes) rather than a single
destructive migration.

## 6. Rollout with billing

```
1. Deploy the code with BILLING_ENABLED=false (or leave it as already set)
2. Verify the Mercado Pago webhook endpoint is reachable from the public URL
3. Configure the Mercado Pago application with that webhook URL and the real credentials
4. Test against a Mercado Pago test/sandbox account end-to-end
5. Only then set BILLING_ENABLED=true / BILLING_NEW_SUBSCRIPTIONS_ENABLED=true
```

## 7. Rollout with AI

```
1. Deploy the code with AI_ENABLED=false
2. Verify OPENROUTER_API_KEY and the AI_MODEL_* variables are set and valid
3. Run a live smoke test against a non-production account
4. Only then set AI_ENABLED=true / AI_CATEGORIZATION_ENABLED=true
```

## 8. Health endpoints

- `GET /api/health/live` — liveness. No dependencies checked; used as Railway's healthcheck path.
- `GET /api/health` — readiness. Runs a lightweight `select 1` against Postgres; returns 503 if the
  database is unavailable. Never checks Mercado Pago or OpenRouter — an external provider outage
  must never mark the whole web service unhealthy.
- `GET /api/health/deep` — protected diagnostic endpoint. Requires `Authorization: Bearer
  <INTERNAL_HEALTH_TOKEN>`. Reports database status and which optional capabilities are configured
  (booleans only — never secret values).

## 9. Monitoring after release

After every release, check: error rate, latency, DB connection errors, and (once a worker exists)
queue failures. `/api/health/deep` is the fastest way to confirm which capabilities a given
deployment actually has configured.

## 10. Rollback

Railway deployments are immutable — redeploying a previous image/commit is the rollback path. A
migration that was already applied is not automatically reverted by rolling back the app code; if a
migration must be reverted, write and review an explicit down-migration rather than manually
editing the database.
