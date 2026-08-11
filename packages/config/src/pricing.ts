import { z } from "zod";

// TASK-046: pricing/unit-economics *planning assumptions* — deliberately a separate module from
// this package's `env` (index.ts), never imported by finance/domain logic (Domain Rule: "provider
// costs and pricing configuration must not be hardcoded in finance/domain logic; planning
// assumptions such as gateway rate and target costs are not technical invariants"). Every value
// here is an editable business assumption, not a ledger fact.
//
// Versioned (Implementation Notes: "store configuration versions when changing cost assumptions
// so historical reports remain explainable") — bump PRICING_CONFIG_VERSION whenever any default or
// env-sourced assumption changes, so a historical metrics snapshot can record which version of the
// assumptions produced it.
export const PRICING_CONFIG_VERSION = "pricing-config:v1";

const decimalString = z.string().regex(/^\d+(\.\d+)?$/, "must be a non-negative decimal string");
const rateString = z.string().regex(/^0(\.\d+)?|1(\.0+)?$/, "must be a decimal string between 0 and 1");

const guardrailsSchema = z.object({
  // Alert if actual AI cost per PRO user exceeds this — never blocks/mutates anything by itself
  // (Financial Invariant: "business metrics never alter personal account balances or financial
  // transactions"), just a threshold this task's guardrail evaluator compares against.
  aiCostPerProUserMax: decimalString,
  whatsappCostPerProUserMax: decimalString,
  gatewayFeeRateMax: rateString,
  // A per-user contribution floor — actual contribution per PRO user below this breaches.
  contributionMarginPerProUserMin: decimalString,
});

export const pricingConfigSchema = z.object({
  version: z.string().min(1),
  currencyCode: z.string().regex(/^[A-Z]{3}$/),
  proMonthlyPrice: decimalString,
  // "Assumed" — the rate this app's own configuration expects Mercado Pago to charge; kept
  // distinguishable from the *actual* per-payment fee when/if a real provider fee value is ever
  // available (Domain Rule: "distinguish assumed gateway rate from actual provider fee when
  // available" — no such real per-payment fee is captured anywhere in this codebase today, so
  // every gateway-fee figure this task produces is explicitly the assumed one; see
  // business-metrics.ts).
  assumedGatewayFeeRate: rateString,
  // Assumed $ cost per unit of already-real, already-tracked usage (AI credits consumed,
  // WhatsApp messages delivered) — never a real per-call provider invoice, since this codebase
  // captures no such real billing feed today (Domain Rule: "product credits are not provider
  // tokens; provider cost is not a user-facing credit price").
  assumedAiCostPerCredit: decimalString,
  assumedWhatsappCostPerMessage: decimalString,
  // Per-PRO-user monthly cost targets/allocations (planning assumptions, not measured actuals).
  aiCostTargetPerProUser: decimalString,
  whatsappCostTargetPerProUser: decimalString,
  infrastructureAllocationPerProUser: decimalString,
  otherCostPerProUser: decimalString,
  guardrails: guardrailsSchema,
});

export type PricingConfig = z.infer<typeof pricingConfigSchema>;

export function parsePricingConfig(input: unknown): PricingConfig {
  return pricingConfigSchema.parse(input);
}

// Defaults match this task's own documented reference-scenario assumptions exactly (task Notes:
// "PRO price USD 7.99, gateway rate 10%, AI target USD 0.60/PRO, WhatsApp target USD 0.30/PRO,
// infrastructure allocation USD 0.40/PRO and other costs USD 0.15/PRO") — reproducing the
// documented ~USD 574.10 contribution for 100 Pro users at these exact defaults is the acceptance
// criterion `tests/unit/business-metrics.test.ts` proves.
export function loadPricingConfigFromEnv(environment: NodeJS.ProcessEnv = process.env): PricingConfig {
  return parsePricingConfig({
    version: environment.PRICING_CONFIG_VERSION || PRICING_CONFIG_VERSION,
    currencyCode: environment.PRICING_CURRENCY_CODE || "USD",
    proMonthlyPrice: environment.PRO_MONTHLY_PRICE || "7.99",
    assumedGatewayFeeRate: environment.ASSUMED_GATEWAY_FEE_RATE || "0.10",
    assumedAiCostPerCredit: environment.ASSUMED_AI_COST_PER_CREDIT || "0.01",
    assumedWhatsappCostPerMessage: environment.ASSUMED_WHATSAPP_COST_PER_MESSAGE || "0.01",
    aiCostTargetPerProUser: environment.AI_COST_TARGET_PER_PRO_USER || "0.60",
    whatsappCostTargetPerProUser: environment.WHATSAPP_COST_TARGET_PER_PRO_USER || "0.30",
    infrastructureAllocationPerProUser: environment.INFRASTRUCTURE_ALLOCATION_PER_PRO_USER || "0.40",
    otherCostPerProUser: environment.OTHER_COST_PER_PRO_USER || "0.15",
    guardrails: {
      aiCostPerProUserMax: environment.AI_COST_GUARDRAIL_PER_PRO_USER || "1.00",
      whatsappCostPerProUserMax: environment.WHATSAPP_COST_GUARDRAIL_PER_PRO_USER || "0.50",
      gatewayFeeRateMax: environment.GATEWAY_FEE_GUARDRAIL_RATE || "0.15",
      contributionMarginPerProUserMin: environment.CONTRIBUTION_MARGIN_GUARDRAIL_MIN || "3.00",
    },
  });
}
