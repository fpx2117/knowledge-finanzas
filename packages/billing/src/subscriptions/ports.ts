export type ProPeriodGrantInput = {
  userId: string;
  subscriptionId: string;
  billingPeriodId: string;
  periodStart: Date;
  periodEnd: Date;
};

// These ports are intentionally out of this bounded context: AI credits and WhatsApp
// allowances belong to their own phases (AI, notifications). Billing only guarantees it calls
// them exactly once per newly-confirmed billing period, never on repeated webhook deliveries.
export type GrantProPeriodCreditsPort = (input: ProPeriodGrantInput) => Promise<void>;
export type StartProWhatsAppAllowancePort = (input: ProPeriodGrantInput) => Promise<void>;

export const noopGrantProPeriodCredits: GrantProPeriodCreditsPort = async () => {};
export const noopStartProWhatsAppAllowance: StartProWhatsAppAllowancePort = async () => {};
