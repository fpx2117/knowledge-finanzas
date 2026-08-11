import { z } from "zod";
import type { AnalyticsEventDefinition } from "./types";

const referralAttributedProperties = z.object({
  referralAttributionId: z.string().uuid(),
}).strict();

const referralConvertedProperties = z.object({
  referralAttributionId: z.string().uuid(),
}).strict();

export const referralsEvents: AnalyticsEventDefinition[] = [
  { name: "referral_attributed", schema: referralAttributedProperties, critical: true, version: 1 },
  { name: "referral_converted", schema: referralConvertedProperties, critical: true, version: 1 },
];
