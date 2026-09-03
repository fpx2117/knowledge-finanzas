import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import path from "node:path";
import { configDefaults, defineConfig } from "vitest/config";

const rootEnvFile = path.resolve(__dirname, ".env");
if (existsSync(rootEnvFile)) {
  loadEnvFile(rootEnvFile);
}

export default defineConfig({
  resolve: {
    alias: [{ find: /^@\/(.*)$/, replacement: path.resolve(__dirname, "apps/web/src/$1") }],
  },
  test: {
    include: ["tests/**/*.test.ts"],
    // See vitest.unit.config.ts — tests for feature slices removed in the greenfield rebuild.
    exclude: [...configDefaults.exclude, "tests/unit/pending-rebuild/**"],
    environment: "node",
    fileParallelism: false,
    maxWorkers: 1,
    minWorkers: 1,
    globalSetup: ["./tests/support/postgres-global-setup.ts"],
    hookTimeout: 30_000,
    testTimeout: 30_000,
  },
});
