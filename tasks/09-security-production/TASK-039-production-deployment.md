# TASK-039 — Harden production configuration and Railway deployment

## Status

DONE (codebase-ready, not actually deployed — see Notes)

## Phase

Phase 9 — Production + Security Hardening

## Priority

P0

## Depends On

- TASK-012
- TASK-026
- TASK-031
- TASK-035
- TASK-037

## Source Documents

- docs/05-mvp-roadmap.md
- docs/10.1-subscription-plans-and-limits.md
- docs/10.2-pricing-unit-economics.md
- docs/18-production-readiness.md
- docs/19-security-privacy.md

## Objective

Desplegar el release en Railway con entornos separados, secretos validados, migraciones seguras y health/readiness.

## Scope

- Railway web/Postgres baseline; worker/Redis only when jobs are active.
- Production env validation, HTTPS/domain/auth cookies, migration ordering.
- Validated commercial configuration and independent AI/usage feature flags.
- Liveness/readiness and protected deep health as appropriate.

## Out of Scope

- Add worker/Redis without real jobs.

## Domain Rules

- PostgreSQL remains canonical; external outages do not fake financial success.

## Implementation Notes

Document deployment/migration runbook; use expand/migrate/contract for risky schema changes.

## Expected Files

- Railway/deployment config
- `packages/config/src/index.ts`
- `apps/web/src/app/api/health/route.ts`
- runbooks.

## Database Changes

Production migrations only from committed Drizzle files, before compatible app rollout.

## API / Application Services

- Health/readiness endpoints.

## UI Changes

None.

## Security Requirements

- Separate dev/preview/prod resources and credentials; no secrets in image/logs.

## Financial Invariants

- Deploy cannot expose mutable balance shortcuts or unreviewed schema.

## Error Cases

- Missing env, DB unavailable, migration incompatibility, optional provider outage.

## Acceptance Criteria

- [x] Web/Postgres production deployment works. Narrowed: the Docker image builds and runs correctly (built, smoke-tested by hand against real Postgres — see Notes), and `railway.toml`/the runbook document exactly how to point it at a real Railway Postgres instance. Actually provisioning a live Railway project/domain is a manual step the user runs themselves, per their explicit scope decision.
- [x] Health does not expose secrets and readiness checks DB lightly. `/api/health` runs `select 1` only; `/api/health/deep` reports capability booleans only (never secret values) and requires a bearer token.
- [x] Production migration runbook is tested. Narrowed: the runbook documents the exact commands/ordering (`docs/deployment-runbook.md` §4-5); `pnpm db:migrate` itself is exercised continuously by this repo's own integration/E2E test setup, but a live Railway migration run wasn't performed (no live Railway project exists — see Notes).
- [x] Optional AI/billing flags can be disabled independently. Pre-existing (`packages/config`'s per-capability `superRefine`), unchanged by this task.
- [x] Pricing, plan limits and cost guardrail configuration are validated per environment and never use development allowances in production. The trial/Pro pricing and allowance env vars (`TRIAL_*`, `PRO_*`) already default to real production values (TASK-032/064) and are validated at startup; new production-only hardening (`assertProductionHardening`) additionally rejects an insecure `BETTER_AUTH_URL`/`DATABASE_URL`/`BETTER_AUTH_SECRET`/missing `INTERNAL_HEALTH_TOKEN` specifically for the environment Railway names "production."

## Tests Required

### Unit

- [x] `assertProductionHardening` validation matrix. `tests/unit/config-production-hardening.test.ts`.

### Integration

- [x] Clean DB migrations and health checks. Pre-existing `tests/integration/*` global setup already runs a clean migration against a real Postgres before every integration run; `/api/health` and `/api/health/deep` were hand-verified against a real Postgres via a Docker smoke test (see Notes).

### E2E

- [x] Production-like smoke. Narrowed: the full 28-test E2E suite already runs the built app via `next start` (the same production server mode used in the Docker image) against real Postgres; a live Railway smoke test wasn't performed (see Notes).

### Security

- [x] HTTPS/auth cookie/secret checks. `assertProductionHardening` enforces HTTPS `BETTER_AUTH_URL`, rejects known placeholder secrets, and requires `INTERNAL_HEALTH_TOKEN`; verified live via a Docker smoke test that an unsafe config crashes the server and fails its healthcheck instead of silently starting.

### Property / Invariant

None.

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

Release can be deployed/restarted with safe configuration and no accidental production resource sharing.

## Notes

Worker deployment is a follow-up only when recurring/reminder/reconciliation jobs require it.

**Scope decision (explicit, via AskUserQuestion):** the assistant does not have Railway credentials
and will not create/push live infrastructure without authorization. The user chose "codebase-ready,
not deployed" — everything deployable from the repo side was built and verified locally
(build/lint/typecheck/unit/integration/E2E all pass, plus a hand-run Docker smoke test against real
Postgres); actually provisioning a Railway project, domain, and secrets, and running the first real
migration/deploy against it, is a manual step for the user to run using `docs/deployment-runbook.md`.

**What was built:**
- `Dockerfile` (multi-stage, non-root, no devDependencies or `.env` in the runtime image) and
  `.dockerignore`. `apps/web/next.config.ts` gained `output: "standalone"`, gated behind a
  `NEXT_OUTPUT_STANDALONE` env var set only by the Dockerfile's build stage — always-on standalone
  output would break every local `pnpm build` on Windows (producing it requires creating symlinks,
  which needs Developer Mode/elevated privileges there).
- `railway.toml` (Dockerfile builder, `/api/health/live` healthcheck, restart policy). Migrations
  are deliberately not run automatically by the container (§178 of the source doc: only one process
  should run migrations per deploy, and Railway can run multiple web replicas) — `pnpm db:migrate`
  is a separate, explicit step documented in the runbook.
- `docs/deployment-runbook.md`: environments, required secrets, build process, release order,
  migration ownership, billing/AI rollout sequencing, health endpoint reference, rollback.
- Three health endpoints: `/api/health/live` (pure liveness, no dependencies), `/api/health`
  (pre-existing — readiness, `select 1`), `/api/health/deep` (new — protected by
  `INTERNAL_HEALTH_TOKEN`, reports which optional capabilities are configured as booleans only,
  never secret values).
- `packages/config`'s `assertProductionHardening`: rejects a non-HTTPS `BETTER_AUTH_URL`, a
  `DATABASE_URL` pointing at localhost/127.0.0.1, a known placeholder `BETTER_AUTH_SECRET`
  (`.env.example`'s or the E2E harness's), or a missing `INTERNAL_HEALTH_TOKEN`. **Gated on
  Railway's own `RAILWAY_ENVIRONMENT_NAME === "production"`, not `NODE_ENV`** — both `next build`
  and `next start` force `NODE_ENV=production` internally regardless of the real deploy target, so
  `NODE_ENV` can't distinguish a genuine Railway production deploy from this repo's own E2E harness
  running `next start` against local test infrastructure (this was discovered and fixed during this
  task: an earlier `NODE_ENV`-gated version broke local `pnpm build` and the entire E2E suite).
  Called once, at real server startup, from `apps/web/src/instrumentation.ts`'s `register()` hook
  (never at module-import time) — Next.js only runs that hook when the server process actually
  starts, never during a build, avoiding the same class of false-positive.
- Fixed a latent, unrelated bug surfaced while testing the Docker build: `/pricing` was statically
  prerendered at build time and queried the database directly, which would either bake in a
  stale/wrong plan price or (as observed) crash the build entirely against an unreachable database.
  Added `export const dynamic = "force-dynamic"` so it renders per-request like every other
  DB-backed page in this app.

**Verified via a hand-run Docker smoke test** (not part of the automated suite, since it needs a
running Docker daemon): built the image, ran it against the real local Postgres with a fully valid
production-shaped config — `/api/health/live` and `/api/health` responded correctly, and
`/api/health/deep` correctly returned 401 without a bearer token and the expected capability report
with one. Ran it again with a deliberately unsafe config (HTTP auth URL, localhost DB, no health
token) — the instrumentation hook threw immediately at startup and every request failed with 500,
which is what would make Railway's healthcheck correctly mark the deploy unhealthy rather than
silently serving traffic with unsafe configuration.
