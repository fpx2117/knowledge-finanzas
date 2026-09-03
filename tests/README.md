# Testing Strategy

## Projects

- `unit`: deterministic tests without database, filesystem, network or external providers.
- `integration`: repository/application boundary tests with an isolated PostgreSQL database configured by `TEST_DATABASE_URL`.

## Database

Integration tests require `NODE_ENV=test` and `TEST_DATABASE_URL`. The database name must contain `test`, migrations are applied before the suite and tables are truncated before each test. If PostgreSQL is unavailable, the suite fails instead of silently skipping.

Prepare/check the isolated database before running integration or E2E tests with `pnpm test:db:check`. The repository's local Docker PostgreSQL exposes port 5433; create a database named `know_finanzas_test` before running the command if it does not exist. E2E runs also require `NODE_ENV=test`, for example: `$env:NODE_ENV="test"; $env:TEST_DATABASE_URL="postgresql://.../know_finanzas_test"; pnpm test:e2e`.

## External Providers

Normal test runs use `tests/support/provider-mocks.ts`. Mercado Pago and OpenRouter must never be called from unit or integration tests. Provider contract tests against a sandbox are a separate explicit workflow.

## E2E

The critical browser flow will use Playwright in a later task, against a disposable web server and test database:

`register -> create account with opening balance -> income -> expense -> dashboard balance`

E2E credentials and database URLs must come from test-only environment variables.

The financial E2E suite also covers multi-currency separation: ARS and USD opening balances must render as separate dashboard totals and must never be summed without FX conversion.
