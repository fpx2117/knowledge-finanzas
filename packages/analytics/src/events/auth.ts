import { z } from "zod";
import type { AnalyticsEventDefinition } from "./types";

const userSignedUpProperties = z.object({}).strict();

const trialStartedProperties = z.object({
  trialEndsAt: z.string().datetime(),
}).strict();

export const authEvents: AnalyticsEventDefinition[] = [
  { name: "user_signed_up", schema: userSignedUpProperties, critical: true, version: 1 },
  { name: "trial_started", schema: trialStartedProperties, critical: true, version: 1 },
];
