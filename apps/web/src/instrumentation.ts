// Runs once when the server process actually starts (Next.js instrumentation hook) — never during
// `next build`, unlike top-level module code in a route file's dependency graph. This is
// deliberately the only place assertProductionHardening runs (TASK-039): asserting it at
// packages/config's module-import time would fail every local/CI build, since `next build` always
// sets NODE_ENV=production internally regardless of the real deploy target.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { env, assertProductionHardening } = await import("@know-finanzas/config");
    assertProductionHardening(env);
  }
}
