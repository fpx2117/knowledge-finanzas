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
    // Tests for feature slices removed in the greenfield rebuild:
    //  - tests/unit/pending-rebuild/** — see vitest.unit.config.ts
    //  - tests/quarantine/** — WP-B8-RECONCILE parked these; they import deleted app-layer code
    //    and can't collect. `pnpm test` is what CI runs, so it must skip them exactly like the
    //    unit/integration configs do (which scope to tests/unit|integration only). See
    //    tests/quarantine/README.md.
    exclude: [...configDefaults.exclude, "tests/unit/pending-rebuild/**", "tests/quarantine/**"],
    environment: "node",
    fileParallelism: false,
    maxWorkers: 1,
    minWorkers: 1,
    globalSetup: ["./tests/support/postgres-global-setup.ts"],
    hookTimeout: 30_000,
    testTimeout: 30_000,
  },
});
