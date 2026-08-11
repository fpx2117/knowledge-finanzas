import { defineConfig } from "@playwright/test";

const port = 3100;
const baseURL = `http://127.0.0.1:${port}`;
const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error("E2E requires TEST_DATABASE_URL");
}

const databaseName = decodeURIComponent(new URL(testDatabaseUrl).pathname.slice(1)).toLowerCase();
if (!/(^|[-_])test($|[-_])/.test(databaseName)) {
  throw new Error("E2E database name must contain test");
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: `pnpm --filter web exec next start --hostname 127.0.0.1 --port ${port}`,
    url: `${baseURL}/api/health`,
    timeout: 120_000,
    reuseExistingServer: false,
    env: {
      ...process.env,
      DATABASE_URL: testDatabaseUrl,
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? "e2e-local-secret-12345678901234567890",
      BETTER_AUTH_URL: baseURL,
      NODE_ENV: "test",
      AI_ENABLED: "false",
      BILLING_ENABLED: "false",
    },
  },
});
