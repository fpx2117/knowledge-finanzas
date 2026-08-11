import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import path from "node:path";
import { defineConfig } from "vitest/config";

const rootEnvFile = path.resolve(__dirname, ".env");
if (existsSync(rootEnvFile)) {
  loadEnvFile(rootEnvFile);
}

export default defineConfig({
  test: {
    include: ["tests/integration/**/*.test.ts"],
    environment: "node",
    fileParallelism: false,
    maxWorkers: 1,
    minWorkers: 1,
    globalSetup: ["./tests/support/postgres-global-setup.ts"],
    setupFiles: ["./tests/support/postgres-test-setup.ts"],
    hookTimeout: 30_000,
    testTimeout: 30_000,
  },
});
