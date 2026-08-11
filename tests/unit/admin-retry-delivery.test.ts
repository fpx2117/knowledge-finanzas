import { describe, expect, it, vi } from "vitest";
import { createRetryDelivery } from "@know-finanzas/notifications";

function fakeRepository(delivery: { id: string; notificationId: string; channel: "EMAIL" | "WHATSAPP" | "IN_APP" | "REALTIME"; status: string } | undefined, notification: { id: string; userId: string; type: string; metadata: unknown; subjectType: string; subjectId: string | null } | undefined) {
  return {
    findDeliveryById: vi.fn(async () => delivery),
    findNotificationById: vi.fn(async () => notification),
  };
}

const notification = { id: "n1", userId: "user-1", type: "DEBT_OVERDUE" as const, metadata: { debtName: "x" }, subjectType: "DEBT" as const, subjectId: "debt-1" };

describe("createRetryDelivery", () => {
  it("throws NOTIFICATION_NOT_FOUND for an unknown delivery", async () => {
    const repository = fakeRepository(undefined, undefined);
    const retry = createRetryDelivery({ repository, resolveEmailRecipient: vi.fn(), resolveWhatsAppRecipient: vi.fn(), resolveActionUrl: vi.fn() });
    await expect(retry("missing")).rejects.toThrow("NOTIFICATION_NOT_FOUND");
  });

  it("rejects retrying a delivery that isn't currently FAILED", async () => {
    const repository = fakeRepository({ id: "d1", notificationId: "n1", channel: "EMAIL", status: "SENT" }, notification);
    const retry = createRetryDelivery({ repository, resolveEmailRecipient: vi.fn(), resolveWhatsAppRecipient: vi.fn(), resolveActionUrl: vi.fn() });
    await expect(retry("d1")).rejects.toThrow("NOTIFICATION_DELIVERY_NOT_RETRYABLE");
  });

  it("rejects retrying an IN_APP/REALTIME delivery (nothing to send)", async () => {
    const repository = fakeRepository({ id: "d1", notificationId: "n1", channel: "IN_APP", status: "FAILED" }, notification);
    const retry = createRetryDelivery({ repository, resolveEmailRecipient: vi.fn(), resolveWhatsAppRecipient: vi.fn(), resolveActionUrl: vi.fn() });
    await expect(retry("d1")).rejects.toThrow("NOTIFICATION_DELIVERY_NOT_RETRYABLE");
  });

  it("resolves the email recipient and re-sends via sendEmailDelivery for a FAILED EMAIL delivery", async () => {
    const repository = fakeRepository({ id: "d1", notificationId: "n1", channel: "EMAIL", status: "FAILED" }, notification);
    const sendEmailDelivery = vi.fn(async () => ({ sent: true as const }));
    const retry = createRetryDelivery({
      repository,
      resolveEmailRecipient: vi.fn(async () => "user@example.test"),
      resolveWhatsAppRecipient: vi.fn(),
      resolveActionUrl: vi.fn(() => "https://app.test/debts/debt-1"),
      sendEmailDelivery,
    });

    const result = await retry("d1");

    expect(result).toEqual({ sent: true });
    expect(sendEmailDelivery).toHaveBeenCalledWith({ deliveryId: "d1", to: "user@example.test", type: "DEBT_OVERDUE", metadata: { debtName: "x" }, actionUrl: "https://app.test/debts/debt-1" });
  });

  it("throws NOTIFICATION_INVALID_RECIPIENT when the recipient cannot be resolved (e.g. WhatsApp opt-out revoked since original send)", async () => {
    const repository = fakeRepository({ id: "d1", notificationId: "n1", channel: "WHATSAPP", status: "FAILED" }, notification);
    const retry = createRetryDelivery({ repository, resolveEmailRecipient: vi.fn(), resolveWhatsAppRecipient: vi.fn(async () => null), resolveActionUrl: vi.fn(), sendWhatsAppDelivery: vi.fn() });

    await expect(retry("d1")).rejects.toThrow("NOTIFICATION_INVALID_RECIPIENT");
  });

  it("never creates a new notification — only ever touches the one delivery id it was given", async () => {
    const repository = fakeRepository({ id: "d1", notificationId: "n1", channel: "EMAIL", status: "FAILED" }, notification);
    const sendEmailDelivery = vi.fn(async () => ({ sent: true as const }));
    const retry = createRetryDelivery({ repository, resolveEmailRecipient: vi.fn(async () => "user@example.test"), resolveWhatsAppRecipient: vi.fn(), resolveActionUrl: vi.fn(() => null), sendEmailDelivery });

    await retry("d1");

    expect(repository.findDeliveryById).toHaveBeenCalledWith("d1");
    expect(sendEmailDelivery.mock.calls[0][0].deliveryId).toBe("d1");
  });
});
