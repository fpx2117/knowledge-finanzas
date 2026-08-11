import { z } from "zod";
import type { AnalyticsEventDefinition } from "./types";

const aiCapabilityExecutedProperties = z.object({
  capability: z.string().max(64),
  status: z.enum(["SUCCESS", "FAILED"]),
  costCredits: z.number().int().nonnegative().nullable(),
}).strict();

const aiCreditsExhaustedProperties = z.object({
  pool: z.enum(["TRIAL_ALLOWANCE", "PLAN_ALLOWANCE", "PURCHASED"]),
}).strict();

export const aiEvents: AnalyticsEventDefinition[] = [
  { name: "ai_capability_executed", schema: aiCapabilityExecutedProperties, critical: true, version: 1 },
  { name: "ai_credits_exhausted", schema: aiCreditsExhaustedProperties, critical: true, version: 1 },
];
