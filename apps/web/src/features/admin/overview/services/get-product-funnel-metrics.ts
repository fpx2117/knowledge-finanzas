export type ProductFunnelMetrics = {
  signups: number;
  trialStarted: number;
  activated: number;
  checkoutStarted: number;
  // Sourced from the real subscription_activated analytics event, which itself only ever fires
  // from a real billing-state transition (apps/web's subscriptionSynchronizer wrapper) — never
  // from a checkout_started client event (Domain Rule: "Checkout Started != Paid Conversion").
  subscriptionActivated: number;
  aiAdoption: number;
};

export type ProductFunnelMetricsRepository = {
  countDistinctUsersForEvent(eventName: string, since?: Date): Promise<number>;
};

// Core funnel counts only (Scope: "signup → trial started → first financial data → activated →
// engaged → checkout → Pro → retained"), all as simple distinct-user counts over the full event
// history. Cohort/time-windowed KPIs (Week 4 Retention, Paid Churn, Reactivation Rate, Time To
// First Value, AI Cost/Pro, WhatsApp Cost/Pro) are explicitly NOT computed here — see TASK-061's
// task notes for why.
export function createGetProductFunnelMetrics(dependencies: { repository: ProductFunnelMetricsRepository }) {
  return async function getProductFunnelMetrics(): Promise<ProductFunnelMetrics> {
    const [signups, trialStarted, activated, checkoutStarted, subscriptionActivated, aiAdoption] = await Promise.all([
      dependencies.repository.countDistinctUsersForEvent("user_signed_up"),
      dependencies.repository.countDistinctUsersForEvent("trial_started"),
      dependencies.repository.countDistinctUsersForEvent("user_activated"),
      dependencies.repository.countDistinctUsersForEvent("checkout_started"),
      dependencies.repository.countDistinctUsersForEvent("subscription_activated"),
      dependencies.repository.countDistinctUsersForEvent("ai_capability_executed"),
    ]);

    return { signups, trialStarted, activated, checkoutStarted, subscriptionActivated, aiAdoption };
  };
}
