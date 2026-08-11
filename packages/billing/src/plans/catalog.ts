import type { BillingProviderCode } from "../domain/billing-types";

export const PRO_MONTHLY_PLAN_CODE = "PRO_MONTHLY" as const;

export type PlanSeed = {
  code: string;
  name: string;
  price: string;
  currencyCode: string;
  provider: BillingProviderCode;
  providerPlanId: string | null;
  active: boolean;
};

export function buildProMonthlyPlanSeed(env: { price: string; currencyCode: string; providerPlanId?: string | null }): PlanSeed {
  return {
    code: PRO_MONTHLY_PLAN_CODE,
    name: "Pro Mensual",
    price: env.price,
    currencyCode: env.currencyCode,
    provider: "MERCADO_PAGO",
    providerPlanId: env.providerPlanId ?? null,
    active: true,
  };
}
