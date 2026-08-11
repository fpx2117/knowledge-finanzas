import type { NotificationType } from "../../domain/types";

// V1 event scope only (docs/09-notifications-alerts.md) — every other NotificationType has no
// WhatsApp template at all, by design: "Only configured templates/SIDs are used" means absent is
// the safe default, not an error.
export const WHATSAPP_V1_TYPES = ["DEBT_DUE_SOON", "DEBT_OVERDUE", "SCHEDULED_TRANSACTION_DUE", "CASHFLOW_NEGATIVE", "MONTHLY_FINANCIAL_SUMMARY"] as const satisfies readonly NotificationType[];

// Content SIDs are Twilio-approved WhatsApp template IDs created in their console — never
// arbitrary/dynamic content, and never provided by this app at runtime. The caller supplies the
// configured map (from env), keeping this package decoupled from @know-finanzas/config.
export type WhatsAppTemplateConfig = Partial<Record<NotificationType, string>>;
export type WhatsAppTemplateVariables = Record<string, string>;

function str(metadata: Record<string, unknown> | null, key: string, fallback: string): string {
  const value = metadata?.[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : fallback;
}

// Twilio content templates use numbered placeholders ({{1}}, {{2}}, ...) matching the approved
// template's own variable order — this must stay in lockstep with however each Content SID was
// actually authored in the Twilio console.
function buildVariables(type: NotificationType, metadata: Record<string, unknown> | null): WhatsAppTemplateVariables {
  switch (type) {
    case "DEBT_DUE_SOON":
    case "DEBT_OVERDUE":
      return { "1": str(metadata, "debtName", "Tu deuda"), "2": str(metadata, "dueDate", "") };
    case "SCHEDULED_TRANSACTION_DUE":
      return { "1": str(metadata, "description", "Tu movimiento programado") };
    case "CASHFLOW_NEGATIVE":
      return { "1": str(metadata, "date", "") };
    default:
      return {};
  }
}

export function resolveWhatsAppTemplate(input: { type: NotificationType; metadata: Record<string, unknown> | null; config: WhatsAppTemplateConfig }): { contentSid: string; variables: WhatsAppTemplateVariables } | null {
  const contentSid = input.config[input.type];
  if (!contentSid) return null;
  return { contentSid, variables: buildVariables(input.type, input.metadata) };
}
