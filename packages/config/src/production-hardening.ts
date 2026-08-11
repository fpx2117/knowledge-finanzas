// Secrets that ship in this repo's own .env.example/docs as illustrative placeholders or as the
// E2E harness's fixed local secret (playwright.config.ts) — safe in development/test, never
// acceptable in production. Kept as an explicit denylist rather than a heuristic (e.g. "contains
// 'example'") so it can't accidentally flag a legitimate production secret.
const KNOWN_NON_PRODUCTION_SECRETS = new Set([
  "replace-with-a-random-secret-of-at-least-32-characters",
  "e2e-local-secret-12345678901234567890",
]);

// Production-only hardening (TASK-039): catches the specific "forgot to set a real prod value"
// mistakes that a generic Zod shape can't — an HTTP (not HTTPS) auth URL, a DATABASE_URL still
// pointing at localhost, or a secret copy-pasted straight from .env.example/the E2E harness. Kept
// in its own module (no import of `env`/`createEnv`) so it can be unit-tested without needing a
// full, real environment to be set first.
//
// Gated on Railway's own RAILWAY_ENVIRONMENT_NAME, deliberately NOT on NODE_ENV: both `next build`
// and `next start` force NODE_ENV=production internally regardless of the real deploy target, so
// NODE_ENV can't distinguish a real Railway production deploy from the E2E harness's `next start`
// run against local test infrastructure. Railway always injects RAILWAY_ENVIRONMENT_NAME
// automatically; it's never set locally, in CI, or by the E2E harness, so this only ever fires for
// a genuine deployment to the environment actually named "production."
export function assertProductionHardening(input: { RAILWAY_ENVIRONMENT_NAME?: string; BETTER_AUTH_URL: string; BETTER_AUTH_SECRET: string; DATABASE_URL: string; INTERNAL_HEALTH_TOKEN?: string }): void {
  if (input.RAILWAY_ENVIRONMENT_NAME !== "production") return;

  const problems: string[] = [];
  if (!input.BETTER_AUTH_URL.startsWith("https://")) {
    problems.push("BETTER_AUTH_URL must be an https:// URL in production");
  }
  const databaseHost = new URL(input.DATABASE_URL).hostname.toLowerCase();
  if (databaseHost === "localhost" || databaseHost === "127.0.0.1") {
    problems.push("DATABASE_URL must not point at localhost/127.0.0.1 in production");
  }
  if (KNOWN_NON_PRODUCTION_SECRETS.has(input.BETTER_AUTH_SECRET)) {
    problems.push("BETTER_AUTH_SECRET is a known non-production placeholder — generate a real secret");
  }
  if (!input.INTERNAL_HEALTH_TOKEN) {
    problems.push("INTERNAL_HEALTH_TOKEN is required in production so /api/health/deep is never reachable without a secret");
  }

  if (problems.length > 0) {
    throw new Error(`Production configuration is unsafe:\n- ${problems.join("\n- ")}`);
  }
}
