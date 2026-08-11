import { describe, expect, it } from "vitest";
import { resolveWhatsAppTemplate, WHATSAPP_V1_TYPES, type WhatsAppTemplateConfig } from "@know-finanzas/notifications";

describe("resolveWhatsAppTemplate", () => {
  const config: WhatsAppTemplateConfig = {
    DEBT_DUE_SOON: "HX_debt_due_soon",
    DEBT_OVERDUE: "HX_debt_overdue",
    SCHEDULED_TRANSACTION_DUE: "HX_scheduled_txn",
    CASHFLOW_NEGATIVE: "HX_cashflow_negative",
    MONTHLY_FINANCIAL_SUMMARY: "HX_monthly_summary",
  };

  it("resolves a configured type with its content SID and variables", () => {
    const result = resolveWhatsAppTemplate({
      type: "DEBT_DUE_SOON",
      metadata: { debtName: "Tarjeta Visa", dueDate: "2026-08-15" },
      config,
    });
    expect(result).toEqual({ contentSid: "HX_debt_due_soon", variables: { "1": "Tarjeta Visa", "2": "2026-08-15" } });
  });

  it("falls back to defaults when metadata fields are missing", () => {
    const result = resolveWhatsAppTemplate({ type: "DEBT_OVERDUE", metadata: null, config });
    expect(result).toEqual({ contentSid: "HX_debt_overdue", variables: { "1": "Tu deuda", "2": "" } });
  });

  it("builds a single-variable payload for SCHEDULED_TRANSACTION_DUE", () => {
    const result = resolveWhatsAppTemplate({
      type: "SCHEDULED_TRANSACTION_DUE",
      metadata: { description: "Alquiler" },
      config,
    });
    expect(result).toEqual({ contentSid: "HX_scheduled_txn", variables: { "1": "Alquiler" } });
  });

  it("builds an empty variables object for MONTHLY_FINANCIAL_SUMMARY", () => {
    const result = resolveWhatsAppTemplate({ type: "MONTHLY_FINANCIAL_SUMMARY", metadata: null, config });
    expect(result).toEqual({ contentSid: "HX_monthly_summary", variables: {} });
  });

  it("returns null when the type has no configured content SID", () => {
    const result = resolveWhatsAppTemplate({ type: "DEBT_DUE_SOON", metadata: null, config: {} });
    expect(result).toBeNull();
  });

  it("returns null for a type outside the V1 scope even when config has stray keys", () => {
    const result = resolveWhatsAppTemplate({ type: "BUDGET_EXCEEDED" as never, metadata: null, config: config as WhatsAppTemplateConfig });
    expect(result).toBeNull();
  });

  it("WHATSAPP_V1_TYPES matches exactly the types this registry knows how to render", () => {
    expect(WHATSAPP_V1_TYPES).toEqual([
      "DEBT_DUE_SOON",
      "DEBT_OVERDUE",
      "SCHEDULED_TRANSACTION_DUE",
      "CASHFLOW_NEGATIVE",
      "MONTHLY_FINANCIAL_SUMMARY",
    ]);
  });
});
