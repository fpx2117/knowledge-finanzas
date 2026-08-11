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
};

export default nextConfig;
