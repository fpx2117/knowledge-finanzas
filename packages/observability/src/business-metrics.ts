import Decimal from "decimal.js";
import type { PricingConfig } from "@know-finanzas/config";

// TASK-046: pure unit-economics calculations over already-aggregated real usage counts (never
// queries a database itself — that's `apps/web`'s job, keeping this package DB-free like every
// other module in it). Every function here is exact-decimal arithmetic (decimal.js, matching the
// same library packages/finance's Money already uses internally) — floating point has no place in
// anything that produces a dollar figure, even a planning one.
//
// Domain Rule: "listed price, net payment revenue, contribution margin and net profit are
// different concepts" — this module keeps them as separate, independently-labeled fields on
// `UnitEconomicsSnapshot`, never collapsed into one number by implementation shortcut.

export type RevenueInputs = {
  proMonthlyPrice: string;
  proSubscriberCount: number;
  // The *actual* gateway fee, when a real provider-reported figure is available — distinguishable
  // from the assumed rate in `PricingConfig` (Domain Rule). Absent by default, since no real
  // per-payment fee feed exists anywhere in this codebase today.
  actualGatewayFeeTotal?: string;
};

export type UsageCostInputs = {
  // Real, already-tracked usage — from ai_credit_entries (CONSUMPTION rows) and
  // notification_deliveries (WHATSAPP channel, SENT/DELIVERED status) respectively.
  aiCreditsConsumed: number;
  whatsappMessagesSent: number;
};

export type TrialEconomicsInputs = {
  trialStartCount: number;
  trialToProConversionCount: number;
  retainedProUserCount: number;
  expiredTrialUserCount: number;
  // Real usage consumed specifically during the trial period (a subset of UsageCostInputs, scoped
  // to TRIAL_ALLOWANCE pool grants/consumption) — used to compute trial cost independently of Pro
  // usage cost.
  trialAiCreditsConsumed: number;
  trialWhatsappMessagesSent: number;
};

export type RevenueBreakdown = {
  currencyCode: string;
  proSubscriberCount: number;
  grossSubscriptionRevenue: string;
  assumedGatewayFeeTotal: string;
  actualGatewayFeeTotal: string | null;
  netPaymentRevenue: string;
};

export type CostBreakdown = {
  aiCostAssumed: string;
  whatsappCostAssumed: string;
  infrastructureAllocation: string;
  otherCosts: string;
  totalVariableCosts: string;
};

export type ContributionBreakdown = {
  contributionMargin: string;
  contributionMarginPerProUser: string | null;
};

export type TrialEconomics = {
  trialStartCount: number;
  trialToProConversionCount: number;
  retainedProUserCount: number;
  expiredTrialUserCount: number;
  conversionRate: string | null;
  trialCostAssumed: string;
};

export type UnitEconomicsSnapshot = {
  pricingConfigVersion: string;
  revenue: RevenueBreakdown;
  costs: CostBreakdown;
  contribution: ContributionBreakdown;
  trial: TrialEconomics;
};

function toDecimal(value: string): Decimal {
  return new Decimal(value);
}

function roundMoney(value: Decimal): string {
  return value.toFixed(2);
}

export function calculateRevenue(config: PricingConfig, input: RevenueInputs): RevenueBreakdown {
  const gross = toDecimal(input.proMonthlyPrice).times(input.proSubscriberCount);
  const assumedGatewayFeeTotal = gross.times(toDecimal(config.assumedGatewayFeeRate));
  const gatewayFeeToSubtract = input.actualGatewayFeeTotal !== undefined ? toDecimal(input.actualGatewayFeeTotal) : assumedGatewayFeeTotal;
  const netPaymentRevenue = gross.minus(gatewayFeeToSubtract);

  return {
    currencyCode: config.currencyCode,
    proSubscriberCount: input.proSubscriberCount,
    grossSubscriptionRevenue: roundMoney(gross),
    assumedGatewayFeeTotal: roundMoney(assumedGatewayFeeTotal),
    actualGatewayFeeTotal: input.actualGatewayFeeTotal !== undefined ? roundMoney(toDecimal(input.actualGatewayFeeTotal)) : null,
    netPaymentRevenue: roundMoney(netPaymentRevenue),
  };
}

// AI/WhatsApp costs here are ASSUMED (usage × configured assumed unit cost), never a real provider
// invoice — Domain Rule: "provider cost is not a user-facing credit price," and no real per-call
// billing feed exists in this codebase to compute an "actual" figure from.
export function calculateCosts(config: PricingConfig, input: UsageCostInputs, proSubscriberCount: number): CostBreakdown {
  const aiCostAssumed = toDecimal(config.assumedAiCostPerCredit).times(input.aiCreditsConsumed);
  const whatsappCostAssumed = toDecimal(config.assumedWhatsappCostPerMessage).times(input.whatsappMessagesSent);
  const infrastructureAllocation = toDecimal(config.infrastructureAllocationPerProUser).times(proSubscriberCount);
  const otherCosts = toDecimal(config.otherCostPerProUser).times(proSubscriberCount);
  const totalVariableCosts = aiCostAssumed.plus(whatsappCostAssumed).plus(infrastructureAllocation).plus(otherCosts);

  return {
    aiCostAssumed: roundMoney(aiCostAssumed),
    whatsappCostAssumed: roundMoney(whatsappCostAssumed),
    infrastructureAllocation: roundMoney(infrastructureAllocation),
    otherCosts: roundMoney(otherCosts),
    totalVariableCosts: roundMoney(totalVariableCosts),
  };
}

export function calculateContribution(revenue: RevenueBreakdown, costs: CostBreakdown): ContributionBreakdown {
  const contributionMargin = toDecimal(revenue.netPaymentRevenue).minus(toDecimal(costs.totalVariableCosts));
  const contributionMarginPerProUser = revenue.proSubscriberCount > 0
    ? roundMoney(contributionMargin.dividedBy(revenue.proSubscriberCount))
    : null;

  return {
    contributionMargin: roundMoney(contributionMargin),
    contributionMarginPerProUser,
  };
}

export function calculateTrialEconomics(config: PricingConfig, input: TrialEconomicsInputs): TrialEconomics {
  const trialAiCost = toDecimal(config.assumedAiCostPerCredit).times(input.trialAiCreditsConsumed);
  const trialWhatsappCost = toDecimal(config.assumedWhatsappCostPerMessage).times(input.trialWhatsappMessagesSent);
  const trialCostAssumed = trialAiCost.plus(trialWhatsappCost);
  const conversionRate = input.trialStartCount > 0
    ? new Decimal(input.trialToProConversionCount).dividedBy(input.trialStartCount).toFixed(4)
    : null;

  return {
    trialStartCount: input.trialStartCount,
    trialToProConversionCount: input.trialToProConversionCount,
    retainedProUserCount: input.retainedProUserCount,
    expiredTrialUserCount: input.expiredTrialUserCount,
    conversionRate,
    trialCostAssumed: roundMoney(trialCostAssumed),
  };
}

export function buildUnitEconomicsSnapshot(config: PricingConfig, input: {
  revenue: RevenueInputs;
  usage: UsageCostInputs;
  trial: TrialEconomicsInputs;
}): UnitEconomicsSnapshot {
  const revenue = calculateRevenue(config, input.revenue);
  const costs = calculateCosts(config, input.usage, input.revenue.proSubscriberCount);
  const contribution = calculateContribution(revenue, costs);
  const trial = calculateTrialEconomics(config, input.trial);

  return {
    pricingConfigVersion: config.version,
    revenue,
    costs,
    contribution,
    trial,
  };
}
