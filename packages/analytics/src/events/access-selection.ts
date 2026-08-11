import { z } from "zod";
import type { AnalyticsEventDefinition } from "./types";

const accessSelectionViewedProperties = z.object({}).strict();

const trialSelectedProperties = z.object({}).strict();

const proSelectedProperties = z.object({}).strict();

const promotionCodeEnteredProperties = z.object({}).strict();

// access_activated fires once, right after any of the three paths (Trial/Pro/Promo) resolves a
// non-NO_ACCESS state — the single funnel-completion signal for /elegir-acceso, distinct from
// product_access_changed (which tracks every future access transition, not just this first one).
const accessActivatedProperties = z.object({
  source: z.enum(["TRIAL", "PAID_SUBSCRIPTION", "PROMOTION"]),
}).strict();

export const accessSelectionEvents: AnalyticsEventDefinition[] = [
  { name: "access_selection_viewed", schema: accessSelectionViewedProperties, critical: false, version: 1 },
  { name: "trial_selected", schema: trialSelectedProperties, critical: false, version: 1 },
  { name: "pro_selected", schema: proSelectedProperties, critical: false, version: 1 },
  { name: "promotion_code_entered", schema: promotionCodeEnteredProperties, critical: false, version: 1 },
  { name: "access_activated", schema: accessActivatedProperties, critical: true, version: 1 },
];
