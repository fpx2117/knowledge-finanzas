import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import path from "node:path";
import type { NextConfig } from "next";

const rootEnvFile = path.resolve(__dirname, "../../.env");
if (existsSync(rootEnvFile)) {
  loadEnvFile(rootEnvFile);
}

const nextConfig: NextConfig = {
  // A self-contained server bundle (docs/18-production-readiness.md §170-172: minimal runtime
  // image, no devDependencies at runtime) — the Dockerfile's runtime stage only copies
  // .next/standalone + .next/static + public, never node_modules. Opt-in via env var (set only by
  // the Dockerfile's build stage) rather than always-on: producing the standalone output requires
  // creating symlinks, which needs elevated privileges/Developer Mode on Windows and would break
  // every local `pnpm build` on a normal Windows dev machine otherwise.
  output: process.env.NEXT_OUTPUT_STANDALONE === "true" ? "standalone" : undefined,
  transpilePackages: [
    "@know-finanzas/auth",
    "@know-finanzas/config",
    "@know-finanzas/db",
    "@know-finanzas/finance",
    "@know-finanzas/shared",
    "@know-finanzas/validation",
  ],
  // ADR-IMPL-001: canonical routes moved to the English paths spec 14 §8 uses. Permanent
  // redirects cover old links/bookmarks/browser history during the transition; retire once
  // hit counts on these drop to zero (WP-ROUTES-RENAME observability note).
  async redirects() {
    return [
      { source: "/dashboard", destination: "/app", permanent: true },
      { source: "/debts", destination: "/obligations", permanent: true },
      { source: "/debts/new", destination: "/obligations/new", permanent: true },
      { source: "/debts/suscripciones", destination: "/obligations/subscriptions", permanent: true },
      { source: "/debts/:debtId", destination: "/obligations/:debtId", permanent: true },
      { source: "/transfers", destination: "/transactions/transfers", permanent: true },
      { source: "/transfers/new", destination: "/transactions/transfers/new", permanent: true },
      { source: "/transfers/:transferId", destination: "/transactions/transfers/:transferId", permanent: true },
      { source: "/transactions/pendientes", destination: "/transactions/pending", permanent: true },
      { source: "/transactions/recurrentes", destination: "/transactions/recurring", permanent: true },
      { source: "/transactions/importaciones", destination: "/settings/imports", permanent: true },
      { source: "/transactions/duplicados", destination: "/transactions/pending", permanent: true },
      { source: "/settings/billing", destination: "/settings/plan", permanent: true },
      { source: "/planning/scheduled/new", destination: "/transactions/scheduled/new", permanent: true },
      { source: "/planning", destination: "/transactions/scheduled", permanent: true },
      { source: "/goals/:goalId/editar", destination: "/goals/:goalId/edit", permanent: true },
    ];
  },
};

export default nextConfig;
