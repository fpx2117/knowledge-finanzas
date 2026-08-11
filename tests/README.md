# Testing Strategy

## Projects

- `unit`: deterministic tests without database, filesystem, network or external providers.
- `integration`: repository/application boundary tests with an isolated PostgreSQL database configured by `TEST_DATABASE_URL`.

## Database

Integration tests require `NODE_ENV=test` and `TEST_DATABASE_URL`. The database name must contain `test`, migrations are applied before the suite and tables are truncated before each test. If PostgreSQL is unavailable, the suite fails instead of silently skipping.

## External Providers

Normal test runs use `tests/support/provider-mocks.ts`. Mercado Pago and OpenRouter must never be called from unit or integration tests. Provider contract tests against a sandbox are a separate explicit workflow.

## E2E

The critical browser flow will use Playwright in a later task, against a disposable web server and test database:

`register -> create account with opening balance -> income -> expense -> dashboard balance`

E2E credentials and database URLs must come from test-only environment variables.
