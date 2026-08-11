import { BillingError } from "../errors";

export function assertPlanActive<T extends { active: boolean }>(plan: T | undefined): asserts plan is T {
  if (!plan) throw new BillingError("BILLING_PLAN_NOT_FOUND", { field: "planCode" });
  if (!plan.active) throw new BillingError("BILLING_PLAN_INACTIVE", { field: "planCode" });
}

export function assertNoConflictingSubscription(existingEffectiveSubscription: unknown) {
  if (existingEffectiveSubscription) throw new BillingError("BILLING_SUBSCRIPTION_ALREADY_ACTIVE");
}
