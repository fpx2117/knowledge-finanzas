import { z } from "zod";
import type { AnalyticsEventDefinition } from "./types";

// checkout_started is a client-side intent signal, never treated as a conversion (Domain Rule:
// "Checkout Started != Paid Conversion") — subscription_activated, sourced from real billing
// state, is the only event that ever counts toward Pro conversion.
const checkoutStartedProperties = z.object({
  planCode: z.string().max(64),
}).strict();

const subscriptionActivatedProperties = z.object({
  planCode: z.string().max(64).nullable(),
}).strict();

const trialExpiredProperties = z.object({}).strict();

const subscriptionCancelledProperties = z.object({
  reasonCode: z.string().max(64).nullable(),
}).strict();

const subscriptionExpiredProperties = z.object({}).strict();

const userReactivatedProperties = z.object({}).strict();

const productAccessChangedProperties = z.object({
  from: z.enum(["NO_ACCESS", "FREE", "TRIAL", "PRO", "EXPIRED_READ_ONLY"]),
  to: z.enum(["NO_ACCESS", "FREE", "TRIAL", "PRO", "EXPIRED_READ_ONLY"]),
  source: z.enum(["PAID_SUBSCRIPTION", "PROMOTION", "TRIAL", "NONE"]),
  reason: z.string().max(64),
}).strict();

// Promotions/discounts are billing-adjacent (Pro-access-granting mechanisms), and Expected Files
// lists no dedicated events/promotions.ts — grouped here rather than inventing a 7th file.
const promotionRedeemedProperties = z.object({
  promotionCodeId: z.string().uuid(),
}).strict();

// Reserved/inert (task's Scope: "reserved, inert until discounts exist") — schema defined now so
// the registry stays exhaustive over AnalyticsEventName, but no code path emits this yet
// (docs/10.5-discounts-and-coupons.md is explicitly deferred per tasks/MASTER_PLAN.md).
const discountAppliedProperties = z.object({
  discountCode: z.string().max(64),
}).strict();

export const billingEvents: AnalyticsEventDefinition[] = [
  { name: "checkout_started", schema: checkoutStartedProperties, critical: false, version: 1 },
  { name: "subscription_activated", schema: subscriptionActivatedProperties, critical: true, version: 1 },
  { name: "trial_expired", schema: trialExpiredProperties, critical: true, version: 1 },
  { name: "subscription_cancelled", schema: subscriptionCancelledProperties, critical: true, version: 1 },
  { name: "subscription_expired", schema: subscriptionExpiredProperties, critical: true, version: 1 },
  { name: "user_reactivated", schema: userReactivatedProperties, critical: true, version: 1 },
  { name: "product_access_changed", schema: productAccessChangedProperties, critical: false, version: 2 },
  { name: "promotion_redeemed", schema: promotionRedeemedProperties, critical: true, version: 1 },
  { name: "discount_applied", schema: discountAppliedProperties, critical: true, version: 1 },
];
