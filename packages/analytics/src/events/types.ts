import type { ZodTypeAny } from "zod";
import type { AnalyticsEventName } from "../domain/types";

// One entry per AnalyticsEventName — `registry.ts` enforces this is exhaustive at compile time.
// `critical: true` means the event participates in server-authoritative funnels/KPIs and
// therefore requires a caller-supplied, stable `eventId` for exactly-once counting (docs' server
// event set: signup, subscription activated, payment approved, promotion redeemed, refund
// completed, AI credit consumed, plus this task's own additions — activation, referral
// attribution/conversion). Non-critical events (client-ish view/interaction signals) don't
// require one; a duplicate is harmless noise, not a double-counted business fact.
export type AnalyticsEventDefinition = {
  name: AnalyticsEventName;
  schema: ZodTypeAny;
  critical: boolean;
  version: number;
};
