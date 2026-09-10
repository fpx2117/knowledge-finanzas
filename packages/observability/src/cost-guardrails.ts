import Decimal from "decimal.js";
import type { PricingConfig } from "@know-finanzas/config";
import type { CostBreakdown, ContributionBreakdown, RevenueBreakdown } from "./business-metrics";

// TASK-046: read-only threshold evaluation over an already-computed UnitEconomicsSnapshot —
// never mutates anything, never blocks a financial write (Financial Invariant: "business metrics
// never alter personal account balances or financial transactions"). A breach here is an
// observability signal for whoever reviews it, not an automatic action (Out of Scope: "automated
// pricing changes... or automatic plan state changes").
export type GuardrailBreach = {
  guardrail: "ai_cost_per_pro_user" | "whatsapp_cost_per_pro_user" | "gateway_fee_rate" | "contribution_margin_per_pro_user";
  threshold: string;
  actual: string;
  message: string;
};

export function evaluateCostGuardrails(config: PricingConfig, input: {
  revenue: RevenueBreakdown;
  costs: CostBreakdown;
  contribution: ContributionBreakdown;
}): GuardrailBreach[] {
  const breaches: GuardrailBreach[] = [];
  const proCount = input.revenue.proSubscriberCount;

  if (proCount > 0) {
    // Prefer the real provider cost when available (same assumed/actual precedence as gateway fee).
    const aiCostPerProUser = new Decimal(input.costs.actualAiCostTotal ?? input.costs.aiCostAssumed).dividedBy(proCount);
    if (aiCostPerProUser.greaterThan(config.guardrails.aiCostPerProUserMax)) {
      breaches.push({
        guardrail: "ai_cost_per_pro_user",
        threshold: config.guardrails.aiCostPerProUserMax,
        actual: aiCostPerProUser.toFixed(2),
        message: `AI cost per PRO user (${aiCostPerProUser.toFixed(2)}) exceeds the configured guardrail (${config.guardrails.aiCostPerProUserMax})`,
      });
    }

    const whatsappCostPerProUser = new Decimal(input.costs.whatsappCostAssumed).dividedBy(proCount);
    if (whatsappCostPerProUser.greaterThan(config.guardrails.whatsappCostPerProUserMax)) {
      breaches.push({
        guardrail: "whatsapp_cost_per_pro_user",
        threshold: config.guardrails.whatsappCostPerProUserMax,
        actual: whatsappCostPerProUser.toFixed(2),
        message: `WhatsApp cost per PRO user (${whatsappCostPerProUser.toFixed(2)}) exceeds the configured guardrail (${config.guardrails.whatsappCostPerProUserMax})`,
      });
    }
  }

  const effectiveGatewayFeeTotal = input.revenue.actualGatewayFeeTotal ?? input.revenue.assumedGatewayFeeTotal;
  const grossRevenue = new Decimal(input.revenue.grossSubscriptionRevenue);
  if (grossRevenue.greaterThan(0)) {
    const effectiveGatewayFeeRate = new Decimal(effectiveGatewayFeeTotal).dividedBy(grossRevenue);
    if (effectiveGatewayFeeRate.greaterThan(config.guardrails.gatewayFeeRateMax)) {
      breaches.push({
        guardrail: "gateway_fee_rate",
        threshold: config.guardrails.gatewayFeeRateMax,
        actual: effectiveGatewayFeeRate.toFixed(4),
        message: `Effective gateway fee rate (${effectiveGatewayFeeRate.toFixed(4)}) exceeds the configured guardrail (${config.guardrails.gatewayFeeRateMax})`,
      });
    }
  }

  if (input.contribution.contributionMarginPerProUser !== null) {
    const contributionPerProUser = new Decimal(input.contribution.contributionMarginPerProUser);
    if (contributionPerProUser.lessThan(config.guardrails.contributionMarginPerProUserMin)) {
      breaches.push({
        guardrail: "contribution_margin_per_pro_user",
        threshold: config.guardrails.contributionMarginPerProUserMin,
        actual: contributionPerProUser.toFixed(2),
        message: `Contribution margin per PRO user (${contributionPerProUser.toFixed(2)}) is below the configured guardrail minimum (${config.guardrails.contributionMarginPerProUserMin})`,
      });
    }
  }

  return breaches;
}
