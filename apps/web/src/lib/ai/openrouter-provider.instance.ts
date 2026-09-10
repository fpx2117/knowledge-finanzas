import { createOpenRouterProvider, createTelemetryProvider } from "@know-finanzas/ai";
import { env } from "@know-finanzas/config";

import { generationTelemetryRecorder } from "./generation-telemetry.instance";

// Real, production-wired AIProvider. Kept in its own module (never imported by anything that
// must stay test-safe) for the same reason as the other *.instance.ts files: it eagerly reads
// env, which vitest.unit.config.ts does not load.
const baseProvider = createOpenRouterProvider({
  apiKey: env.OPENROUTER_API_KEY ?? "",
  appName: env.OPENROUTER_APP_NAME,
  appUrl: env.OPENROUTER_APP_URL,
  models: {
    fast: env.AI_MODEL_FAST,
    balanced: env.AI_MODEL_BALANCED,
    quality: env.AI_MODEL_QUALITY,
    reasoning: env.AI_MODEL_REASONING,
  },
});

// Every generateStructured call writes an ai_generation_events row (real token usage + provider
// USD cost). Best-effort: a telemetry failure never affects the AI result.
export const aiProvider = createTelemetryProvider(baseProvider, generationTelemetryRecorder);
