# Runbook: Failed Deploy

**Owner:** whoever holds the Railway project credentials (see `runbooks/README.md`).

## Detection

- Railway shows the new deployment as unhealthy (fails its `/api/health/live` healthcheck —
  `railway.toml`) and Railway keeps serving the previous deployment automatically.
- Manual signal: `GET /api/health` returns `503`, or `GET /api/health/deep` (with the
  `INTERNAL_HEALTH_TOKEN` bearer token) shows `"database": "unavailable"`.
- Startup crash signal: deploy logs show `Production configuration is unsafe` (from
  `assertProductionHardening`, `apps/web/src/instrumentation.ts`) — this means an environment
  variable is missing/wrong, not a code bug. Read the listed problems directly; they name the exact
  variable.

## Immediate actions

1. Do **not** re-run the failing deploy repeatedly hoping it self-resolves — read the deploy logs
   first. The three most common causes, in order of likelihood:
   - A missing/incorrect production env var (`assertProductionHardening`'s error message names it
     exactly — see `docs/deployment-runbook.md` §2 for the required list).
   - A migration that hasn't been applied yet against the target database (see §3 below).
   - An actual code regression that passed CI (see §4 below).
2. Because Railway keeps the previous healthy deployment live while a new one is unhealthy, there
   is normally no user-facing outage during this investigation — confirm this is actually the case
   (`/api/health/live` against the production URL) before treating this as urgent-severity.

## Rollback

- Railway deployments are immutable (`docs/deployment-runbook.md` §10) — redeploy the last known-
  good image/commit from Railway's deployment history. This is the entire rollback mechanism; there
  is no separate "revert" step for application code.
- **A migration that already ran is not automatically undone by rolling back the app code.** If the
  new deploy's migration is incompatible with the previous code version, do not roll the app back
  without first confirming the previous code version can run against the *post-migration* schema
  (this is exactly what the expand/migrate/contract discipline in `docs/deployment-runbook.md` §5
  exists to guarantee — a migration that isn't backward-compatible with the previous release should
  never have shipped in the same deploy).

## Safe-write behavior

- While a deployment is unhealthy and Railway is still serving the previous version, financial
  writes continue exactly as before — nothing about a failed *new* deploy touches data written
  through the *currently live* one.
- Never manually run `ALTER TABLE` or hand-edit rows against production to "fix" a failed deploy
  (Domain Rule, `docs/18-production-readiness.md` §19: "No Manual Production Schema Changes") — fix
  forward with a new committed migration, or roll back the deploy.

## Postmortem

Record: what the actual root cause was (env var / migration / code), whether CI should have caught
it (if so, that's a CI gap to fix — see `.github/workflows/ci.yml`), and how long the previous
deployment continued serving traffic during the incident.
