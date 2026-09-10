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
  // Optional: real AI cost in USD from ai_generation_events (sum of provider-reported cost). When
  // provided, it — not `aiCreditsConsumed × assumedAiCostPerCredit` — drives totalVariableCosts.
  actualAiCostTotal?: string | null;
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

export type FreeEconomicsInputs = {
  // Distinct users currently on the permanent FREE tier (no paid subscription / active promotion /
  // active trial).
  freeUserCount: number;
  freeToTrialCount: number;
  freeToProCount: number;
  // AI credits consumed against FREE monthly grants — from ai_credit_entries CONSUMPTION rows in
  // the PLAN_ALLOWANCE pool attributable to grants whose reference_id starts with "free:".
  freeAiCreditsConsumed: number;
};

export type FreeEconomics = {
  freeUserCount: number;
  freeToTrialCount: number;
  freeToProCount: number;
  freeToTrialRate: string | null;
  freeAiCostAssumed: string;
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
  // Real AI cost from ai_generation_events (sum of the provider's reported USD), when available —
  // same assumed/actual distinction the gateway fee already uses. Null when there is no real feed.
  actualAiCostTotal: string | null;
  whatsappCostAssumed: string;
  infrastructureAllocation: string;
  otherCosts: string;
  // Uses the real AI cost when `actualAiCostTotal` is present, otherwise the assumed figure.
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
  free?: FreeEconomics;
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
  const actualAiCost = input.actualAiCostTotal !== undefined && input.actualAiCostTotal !== null
    ? toDecimal(input.actualAiCostTotal)
    : null;
  const whatsappCostAssumed = toDecimal(config.assumedWhatsappCostPerMessage).times(input.whatsappMessagesSent);
  const infrastructureAllocation = toDecimal(config.infrastructureAllocationPerProUser).times(proSubscriberCount);
  const otherCosts = toDecimal(config.otherCostPerProUser).times(proSubscriberCount);
  const aiCostForTotal = actualAiCost ?? aiCostAssumed;
  const totalVariableCosts = aiCostForTotal.plus(whatsappCostAssumed).plus(infrastructureAllocation).plus(otherCosts);

  return {
    aiCostAssumed: roundMoney(aiCostAssumed),
    actualAiCostTotal: actualAiCost ? roundMoney(actualAiCost) : null,
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

// FREE tier: imputed AI cost (real consumed credits × the assumed per-credit cost) plus the
// FREE→TRIAL and FREE→PRO funnel counts. FREE costs are NOT folded into `calculateCosts` — those
// are Pro-subscriber-keyed — this is a separate, explicitly-labeled figure (Domain Rule: costs and
// revenue concepts stay distinct).
export function calculateFreeEconomics(config: PricingConfig, input: FreeEconomicsInputs): FreeEconomics {
  const freeAiCostAssumed = toDecimal(config.assumedAiCostPerCredit).times(input.freeAiCreditsConsumed);
  const freeToTrialRate = input.freeUserCount > 0
    ? new Decimal(input.freeToTrialCount).dividedBy(input.freeUserCount).toFixed(4)
    : null;

  return {
    freeUserCount: input.freeUserCount,
    freeToTrialCount: input.freeToTrialCount,
    freeToProCount: input.freeToProCount,
    freeToTrialRate,
    freeAiCostAssumed: roundMoney(freeAiCostAssumed),
  };
}

export function buildUnitEconomicsSnapshot(config: PricingConfig, input: {
  revenue: RevenueInputs;
  usage: UsageCostInputs;
  trial: TrialEconomicsInputs;
  free?: FreeEconomicsInputs;
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
    ...(input.free ? { free: calculateFreeEconomics(config, input.free) } : {}),
  };
}
