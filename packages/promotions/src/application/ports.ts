// Out-of-bounded-context ports, mirroring the pattern already used by
// packages/billing/src/subscriptions/ports.ts (GrantProPeriodCreditsPort) — packages/promotions
// never writes to ai_credit_entries or the notifications tables directly. Each port fires once
// per Promotion Usage Period (bounded to <=30 days), never once for the whole grant, so a
// long-running promotion's allowance is always finite per period.

export type PromotionAiCreditGrantInput = {
  userId: string;
  grantId: string;
  periodId: string;
  amount: number;
  periodStart: Date;
  periodEnd: Date;
};

export type AiCreditGrantPort = (input: PromotionAiCreditGrantInput) => Promise<void>;

export const noopAiCreditGrant: AiCreditGrantPort = async () => {};

export type PromotionNotificationAllowanceInput = {
  userId: string;
  grantId: string;
  periodId: string;
  whatsappMessagesPerPeriod: number;
  periodStart: Date;
  periodEnd: Date;
};

export type NotificationAllowancePort = (input: PromotionNotificationAllowanceInput) => Promise<void>;

export const noopNotificationAllowance: NotificationAllowancePort = async () => {};
