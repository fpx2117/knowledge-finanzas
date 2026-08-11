import { describe, expect, it, vi } from "vitest";
import { createSendWhatsAppDelivery, isRetryableWhatsAppError, NotificationError, type WhatsAppProvider, type WhatsAppTemplateConfig } from "@know-finanzas/notifications";

function fakeDeliveries() {
  return { updateStatus: vi.fn(async () => undefined) };
}

const templateConfig: WhatsAppTemplateConfig = { DEBT_DUE_SOON: "HX_debt_due_soon" };

describe("isRetryableWhatsAppError", () => {
  it("treats an invalid-recipient rejection as non-retryable", () => {
    expect(isRetryableWhatsAppError(new NotificationError("NOTIFICATION_INVALID_RECIPIENT"))).toBe(false);
  });

  it("treats a missing-template configuration as non-retryable", () => {
    expect(isRetryableWhatsAppError(new NotificationError("WHATSAPP_TEMPLATE_NOT_CONFIGURED"))).toBe(false);
  });

  it("treats a generic provider error as retryable", () => {
    expect(isRetryableWhatsAppError(new NotificationError("WHATSAPP_PROVIDER_ERROR"))).toBe(true);
  });

  it("treats an unrecognized/unknown error as retryable by default", () => {
    expect(isRetryableWhatsAppError(new Error("network blip"))).toBe(true);
  });
});

describe("createSendWhatsAppDelivery", () => {
  it("marks the delivery SENT with the provider message id on success", async () => {
    const deliveries = fakeDeliveries();
    const provider: WhatsAppProvider = { sendTemplateMessage: vi.fn(async () => ({ providerMessageId: "twilio-SM123" })) };
    const send = createSendWhatsAppDelivery({ provider, deliveries, templateConfig, now: () => new Date("2026-01-15T00:00:00Z") });

    const result = await send({ deliveryId: "delivery-1", to: "+5491122334455", type: "DEBT_DUE_SOON", metadata: { debtName: "Auto" } });

    expect(result).toEqual({ sent: true });
    expect(provider.sendTemplateMessage).toHaveBeenCalledWith({ to: "+5491122334455", contentSid: "HX_debt_due_soon", variables: { "1": "Auto", "2": "" } });
    expect(deliveries.updateStatus).toHaveBeenCalledWith("delivery-1", expect.objectContaining({ status: "SENT", provider: "TWILIO", providerMessageId: "twilio-SM123", incrementAttempt: true }));
  });

  it("fails fast with WHATSAPP_TEMPLATE_NOT_CONFIGURED when the type has no content SID, without calling the provider", async () => {
    const deliveries = fakeDeliveries();
    const provider: WhatsAppProvider = { sendTemplateMessage: vi.fn(async () => ({ providerMessageId: "unused" })) };
    const send = createSendWhatsAppDelivery({ provider, deliveries, templateConfig, now: () => new Date("2026-01-15T00:00:00Z") });

    const result = await send({ deliveryId: "delivery-1", to: "+5491122334455", type: "CASHFLOW_NEGATIVE", metadata: null });

    expect(result).toEqual({ sent: false, retryable: false, errorCode: "WHATSAPP_TEMPLATE_NOT_CONFIGURED" });
    expect(provider.sendTemplateMessage).not.toHaveBeenCalled();
    expect(deliveries.updateStatus).toHaveBeenCalledWith("delivery-1", expect.objectContaining({ status: "FAILED", lastErrorCode: "WHATSAPP_TEMPLATE_NOT_CONFIGURED", incrementAttempt: true }));
  });

  it("marks the delivery FAILED and reports retryability on provider error", async () => {
    const deliveries = fakeDeliveries();
    const provider: WhatsAppProvider = { sendTemplateMessage: vi.fn(async () => { throw new NotificationError("NOTIFICATION_INVALID_RECIPIENT"); }) };
    const send = createSendWhatsAppDelivery({ provider, deliveries, templateConfig, now: () => new Date("2026-01-15T00:00:00Z") });

    const result = await send({ deliveryId: "delivery-1", to: "not-a-phone", type: "DEBT_DUE_SOON", metadata: null });

    expect(result).toEqual({ sent: false, retryable: false, errorCode: "NOTIFICATION_INVALID_RECIPIENT" });
  });

  it("classifies an unexpected thrown error as a generic, retryable provider error", async () => {
    const deliveries = fakeDeliveries();
    const provider: WhatsAppProvider = { sendTemplateMessage: vi.fn(async () => { throw new Error("timeout"); }) };
    const send = createSendWhatsAppDelivery({ provider, deliveries, templateConfig });

    const result = await send({ deliveryId: "delivery-1", to: "+5491122334455", type: "DEBT_DUE_SOON", metadata: null });

    expect(result).toEqual({ sent: false, retryable: true, errorCode: "WHATSAPP_PROVIDER_ERROR" });
  });
});
