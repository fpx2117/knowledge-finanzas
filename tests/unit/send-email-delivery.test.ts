import { describe, expect, it, vi } from "vitest";
import { createSendEmailDelivery, isRetryableEmailError, NotificationError, type EmailProvider } from "@know-finanzas/notifications";

function fakeDeliveries() {
  const calls: unknown[] = [];
  return { calls, updateStatus: vi.fn(async (id, input) => { calls.push({ id, input }); }) };
}

describe("isRetryableEmailError", () => {
  it("treats an invalid-recipient rejection as non-retryable", () => {
    expect(isRetryableEmailError(new NotificationError("NOTIFICATION_INVALID_RECIPIENT"))).toBe(false);
  });

  it("treats a generic provider error as retryable", () => {
    expect(isRetryableEmailError(new NotificationError("NOTIFICATION_PROVIDER_ERROR"))).toBe(true);
  });

  it("treats an unrecognized/unknown error as retryable by default", () => {
    expect(isRetryableEmailError(new Error("network blip"))).toBe(true);
  });
});

describe("createSendEmailDelivery", () => {
  it("marks the delivery SENT with the provider message id on success", async () => {
    const deliveries = fakeDeliveries();
    const provider: EmailProvider = { sendEmail: vi.fn(async () => ({ providerMessageId: "resend-123" })) };
    const send = createSendEmailDelivery({ provider, deliveries, now: () => new Date("2026-01-15T00:00:00Z") });

    const result = await send({ deliveryId: "delivery-1", to: "user@example.test", type: "DEBT_OVERDUE", metadata: { debtName: "Auto" }, actionUrl: null });

    expect(result).toEqual({ sent: true });
    expect(deliveries.updateStatus).toHaveBeenCalledWith("delivery-1", expect.objectContaining({ status: "SENT", provider: "RESEND", providerMessageId: "resend-123", incrementAttempt: true }));
  });

  it("marks the delivery FAILED and reports retryability on provider error", async () => {
    const deliveries = fakeDeliveries();
    const provider: EmailProvider = { sendEmail: vi.fn(async () => { throw new NotificationError("NOTIFICATION_INVALID_RECIPIENT"); }) };
    const send = createSendEmailDelivery({ provider, deliveries, now: () => new Date("2026-01-15T00:00:00Z") });

    const result = await send({ deliveryId: "delivery-1", to: "bad@invalid", type: "DEBT_OVERDUE", metadata: null, actionUrl: null });

    expect(result).toEqual({ sent: false, retryable: false, errorCode: "NOTIFICATION_INVALID_RECIPIENT" });
    expect(deliveries.updateStatus).toHaveBeenCalledWith("delivery-1", expect.objectContaining({ status: "FAILED", lastErrorCode: "NOTIFICATION_INVALID_RECIPIENT", incrementAttempt: true }));
  });

  it("classifies an unexpected thrown error as a generic, retryable provider error", async () => {
    const deliveries = fakeDeliveries();
    const provider: EmailProvider = { sendEmail: vi.fn(async () => { throw new Error("timeout"); }) };
    const send = createSendEmailDelivery({ provider, deliveries });

    const result = await send({ deliveryId: "delivery-1", to: "user@example.test", type: "DEBT_OVERDUE", metadata: null, actionUrl: null });

    expect(result).toEqual({ sent: false, retryable: true, errorCode: "NOTIFICATION_PROVIDER_ERROR" });
  });
});
