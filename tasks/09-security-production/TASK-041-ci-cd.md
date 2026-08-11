# TASK-041 — Establish CI/CD, migration gates and operational runbooks

## Status

DONE (CI workflow written and verified command-by-command locally; not yet executed by GitHub Actions since the repo isn't under git yet — see Notes)

## Phase

Phase 9 — Production + Security Hardening

## Priority

P0

## Depends On

- TASK-005
- TASK-039
- TASK-040

## Source Documents

- docs/18-production-readiness.md
- docs/20-backup-recovery.md
- AGENTS.md

## Objective

Automatizar quality gates y documentar operaciones críticas de release, rollback y migraciones.

## Scope

- CI runs lint/typecheck/test/build and clean migration.
- Lockfile/dependency/security review gate.
- Feature flag/release strategy and migration compatibility.
- Runbooks for failed deploy, provider outage, webhook incident and worker jobs.

## Out of Scope

- Full deployment automation to every environment if credentials are not available.

## Domain Rules

- Migration history immutable; destructive financial changes need backup/review.
- External live integrations use contract/mocks in normal CI.

## Implementation Notes

Use repository scripts as canonical commands; add new scripts only when real recovery/audit tooling exists.

## Expected Files

- `.github/workflows/` or CI configuration
- root/package scripts
- `runbooks/`

## Database Changes

- CI verifies all committed migrations apply from clean database.

## API / Application Services

None.

## UI Changes

None.

## Security Requirements

- CI secrets are environment-scoped; no live payment/AI calls by default.

## Financial Invariants

- High-risk migrations require integrity checks before/after.

## Error Cases

- Test/migration failure, incompatible rolling schema, failed deploy.

## Acceptance Criteria

- [x] All four quality commands gate merge/deploy. `.github/workflows/ci.yml`'s `quality` job runs `pnpm lint`, `pnpm typecheck`, `pnpm test` (unit+integration against a fresh Postgres service container), and `pnpm build`, in that order — a failure at any step fails the whole job.
- [x] Clean migration path is tested. The CI job's Postgres service container is always freshly created (GitHub Actions services never persist between runs), and `pnpm db:migrate` runs against it every single run — "clean migration from scratch" is inherently what every CI run already exercises, not a special-cased check.
- [x] Feature flags support gradual release. Pre-existing (`packages/config`'s independently-togglable `AI_ENABLED`/`BILLING_ENABLED`/`NOTIFICATIONS_ENABLED`/channel flags, unchanged by this task) — confirmed still correct, documented in `docs/deployment-runbook.md` §6-7's rollout sequencing.
- [x] Runbooks identify owner, rollback and safe-write behavior. `runbooks/failed-deploy.md`, `runbooks/provider-outage.md`, `runbooks/webhook-incident.md` each have named sections for all three; `runbooks/worker-jobs.md` is explicitly marked not-yet-applicable (no worker exists).

## Tests Required

### Unit

None.

### Integration

- [x] CI database/migration job. `.github/workflows/ci.yml`'s `quality` job: Postgres service container + `pnpm db:migrate` step, every run.

### E2E

- [x] High-value smoke in deploy pipeline. `.github/workflows/ci.yml`'s `quality` job runs the full `pnpm test:e2e` suite (28 specs) after the build step, against the same fresh Postgres.

### Security

- [x] Dependency and secret scanning. `dependency-review` job (`actions/dependency-review-action`, fails on `high` severity) on every PR; `.github/dependabot.yml` for both npm and GitHub Actions dependencies. Secret scanning: GitHub's own native secret scanning activates automatically once this repository is pushed to GitHub (no separate workflow needed for that specific feature) — see Notes for why a synthetic gitleaks-style step wasn't added on top of it.

### Property / Invariant

- [x] Migration invariant audit hook. The "Detect uncommitted schema drift" step (`pnpm db:generate` + `git status --porcelain packages/db/drizzle`, failing the build if generating migrations from the current schema produces an uncommitted diff) is the audit hook: it guarantees the Drizzle schema in code and the committed migration history can never silently diverge.

## Verification Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Definition of Done

Every release is gated by real tests/build/migrations and has an operational recovery path.

## Notes

Do not claim CI readiness while `pnpm test` is still a no-op. (It isn't — `pnpm test` runs 176+
integration tests against real Postgres alongside the unit suite, all passing throughout this
session.)

**Scope decision (explicit, via AskUserQuestion):** this repository is not currently under git
version control at all (no `.git` directory) — the user chose to have the CI configuration and
runbooks written as plain files without touching git (no `git init`, no commit, no push). This
means `.github/workflows/ci.yml` cannot actually execute yet — GitHub Actions only runs once a
repository exists on GitHub. Every command the workflow runs was verified to work correctly by
running it directly in this session (lint/typecheck/`pnpm test`/`pnpm build`/`pnpm test:e2e` all
pass; `pnpm db:generate` against the current schema produces zero diff, confirming the drift-check
step's happy path). Once the user initializes git and pushes to GitHub, the workflow starts running
automatically on the next push/PR with no further setup needed — the workflow's own Postgres
service container means no external database or secrets need to be configured in GitHub for the
`quality` job to pass (the `BETTER_AUTH_SECRET`/`BETTER_AUTH_URL` values in the workflow are
committed CI-only placeholders, never real secrets).

**What was built:**
- `.github/workflows/ci.yml`: a `quality` job (lint, typecheck, schema-drift check, fresh-database
  migration, `pnpm test`, build, `pnpm test:e2e`) and a `dependency-review` job (PR-only, fails on
  high-severity dependency advisories).
- `.github/dependabot.yml`: weekly npm + GitHub Actions dependency update PRs, routine
  patch/minor bumps grouped into one PR.
- `runbooks/` (new top-level directory): `failed-deploy.md`, `provider-outage.md`,
  `webhook-incident.md`, `worker-jobs.md` (explicitly not-yet-applicable), each naming an owner,
  rollback path, and safe-write behavior, and each grounded in this codebase's actual existing
  degradation patterns (billing local-first + release-on-failure, AI credit reserve/release,
  webhook idempotent persistence-before-processing, TASK-040's new structured logging/rate
  limiting) rather than generic advice.
- `.gitignore` gained `test-results/`/`playwright-report/` (Playwright's own output directories,
  not previously excluded).

**Narrowed scope, documented honestly:**
- **No synthetic secret-scanning step was added.** GitHub's own native secret scanning (push
  protection + historical scanning) activates automatically for any repository pushed to GitHub —
  no workflow file is needed for that specific capability, and adding a third-party tool
  (gitleaks, trufflehog) on top would be redundant with what GitHub already provides for free once
  this repo exists there.
- **No deploy-to-Railway step exists in the workflow**, matching this task's own explicit Out of
  Scope ("Full deployment automation to every environment if credentials are not available") — the
  `quality`/`dependency-review` jobs are pure quality gates; actually triggering a Railway deploy
  from CI is a follow-up once the user has connected the two.
