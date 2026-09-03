import path from "node:path";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [{ find: /^@\/(.*)$/, replacement: path.resolve(__dirname, "apps/web/src/$1") }],
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    // pending-rebuild/: tests for feature slices removed in the greenfield rebuild
    // (admin, billing internals, notifications, onboarding, referrals). Restore alongside
    // the feature. See docs/capture/implementation-backlog.md.
    exclude: [...configDefaults.exclude, "tests/unit/pending-rebuild/**"],
    environment: "node",
  },
});
