// TRIAL allows TRIAL_WHATSAPP_TOTAL messages for the lifetime of the trial (never resets); PRO
// allows PRO_WHATSAPP_PER_PERIOD per billing period. EXPIRED_READ_ONLY never gets WhatsApp
// (docs/09-notifications-alerts.md domain rule) — the caller is expected to already have
// filtered that out via the same FINANCIAL/PRODUCT access gate every other channel uses, since
// every V1 WhatsApp event type is FINANCIAL category; this function only enforces the numeric cap
// for the two states that do get WhatsApp at all.
export type WhatsAppAllowanceState = "TRIAL" | "PRO";

export function isWithinWhatsAppAllowance(input: { state: WhatsAppAllowanceState; sentCount: number; trialTotal: number; proPerPeriod: number }): boolean {
  const limit = input.state === "TRIAL" ? input.trialTotal : input.proPerPeriod;
  return input.sentCount < limit;
}
