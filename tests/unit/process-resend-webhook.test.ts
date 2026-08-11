import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { createProcessResendWebhook } from "@know-finanzas/notifications";

const secretBase64 = Buffer.from("test-resend-secret-bytes").toString("base64");
const secret = `whsec_${secretBase64}`;

function sign(svixId: string, svixTimestamp: string, rawBody: string) {
  const digest = createHmac("sha256", Buffer.from(secretBase64, "base64")).update(`${svixId}.${svixTimestamp}.${rawBody}`).digest("base64");
  return `v1,${digest}`;
}

function buildEvent(type: string, emailId: string) {
  const svixId = "msg_1";
  const svixTimestamp = String(Math.floor(Date.now() / 1000));
  const rawBody = JSON.stringify({ type, data: { email_id: emailId } });
  return { event: { type, data: { email_id: emailId } }, rawBody, svixId, svixTimestamp, svixSignature: sign(svixId, svixTimestamp, rawBody) };
}

function fakeDeliveries(seed: Array<{ id: string; notificationId: string; providerMessageId: string; status: string }>) {
  const records = seed.map((r) => ({ ...r }));
  return {
    records,
    findByProviderMessageId: vi.fn(async (id: string) => records.find((r) => r.providerMessageId === id)),
    updateStatus: vi.fn(async (id: string, input: { status: string }) => { const r = records.find((x) => x.id === id); if (r) r.status = input.status; }),
  };
}

function fakeNotifications(seed: Array<{ id: string; userId: string }>) {
  return { findById: vi.fn(async (id: string) => seed.find((n) => n.id === id)) };
}

describe("createProcessResendWebhook", () => {
  it("rejects a request with an invalid signature", async () => {
    const deliveries = fakeDeliveries([]);
    const process = createProcessResendWebhook({ deliveries, notifications: fakeNotifications([]), suppressEmail: vi.fn(), webhookSecret: secret });

    const result = await process({ event: { type: "email.delivered", data: { email_id: "abc" } }, rawBody: "{}", svixId: "1", svixTimestamp: "1", svixSignature: "v1,deadbeef" });

    expect(result).toBe("invalid_signature");
    expect(deliveries.findByProviderMessageId).not.toHaveBeenCalled();
  });

  it("returns delivery_not_found for an unknown email_id", async () => {
    const deliveries = fakeDeliveries([]);
    const process = createProcessResendWebhook({ deliveries, notifications: fakeNotifications([]), suppressEmail: vi.fn(), webhookSecret: secret });
    const built = buildEvent("email.delivered", "unknown-id");

    const result = await process(built);

    expect(result).toBe("delivery_not_found");
  });

  it("marks a delivery DELIVERED and does not suppress email", async () => {
    const deliveries = fakeDeliveries([{ id: "d1", notificationId: "n1", providerMessageId: "resend-1", status: "SENT" }]);
    const suppressEmail = vi.fn();
    const process = createProcessResendWebhook({ deliveries, notifications: fakeNotifications([{ id: "n1", userId: "user-1" }]), suppressEmail, webhookSecret: secret });

    const result = await process(buildEvent("email.delivered", "resend-1"));

    expect(result).toBe("processed");
    expect(deliveries.records[0].status).toBe("DELIVERED");
    expect(suppressEmail).not.toHaveBeenCalled();
  });

  it("marks a delivery FAILED and suppresses future email for that user on a hard bounce", async () => {
    const deliveries = fakeDeliveries([{ id: "d1", notificationId: "n1", providerMessageId: "resend-1", status: "SENT" }]);
    const suppressEmail = vi.fn();
    const process = createProcessResendWebhook({ deliveries, notifications: fakeNotifications([{ id: "n1", userId: "user-1" }]), suppressEmail, webhookSecret: secret });

    const result = await process(buildEvent("email.bounced", "resend-1"));

    expect(result).toBe("processed");
    expect(deliveries.records[0].status).toBe("FAILED");
    expect(suppressEmail).toHaveBeenCalledWith("user-1");
  });

  it("suppresses email on a spam complaint too", async () => {
    const deliveries = fakeDeliveries([{ id: "d1", notificationId: "n1", providerMessageId: "resend-1", status: "SENT" }]);
    const suppressEmail = vi.fn();
    const process = createProcessResendWebhook({ deliveries, notifications: fakeNotifications([{ id: "n1", userId: "user-1" }]), suppressEmail, webhookSecret: secret });

    await process(buildEvent("email.complained", "resend-1"));

    expect(suppressEmail).toHaveBeenCalledWith("user-1");
  });

  it("ignores an unrecognized event type without error", async () => {
    const deliveries = fakeDeliveries([{ id: "d1", notificationId: "n1", providerMessageId: "resend-1", status: "SENT" }]);
    const process = createProcessResendWebhook({ deliveries, notifications: fakeNotifications([{ id: "n1", userId: "user-1" }]), suppressEmail: vi.fn(), webhookSecret: secret });

    const result = await process(buildEvent("email.opened", "resend-1"));

    expect(result).toBe("unrecognized_event");
    expect(deliveries.records[0].status).toBe("SENT");
  });

  it("is idempotent under redelivery of the same bounce event", async () => {
    const deliveries = fakeDeliveries([{ id: "d1", notificationId: "n1", providerMessageId: "resend-1", status: "SENT" }]);
    const suppressEmail = vi.fn();
    const process = createProcessResendWebhook({ deliveries, notifications: fakeNotifications([{ id: "n1", userId: "user-1" }]), suppressEmail, webhookSecret: secret });

    await process(buildEvent("email.bounced", "resend-1"));
    await process(buildEvent("email.bounced", "resend-1"));

    expect(deliveries.records[0].status).toBe("FAILED");
    expect(suppressEmail).toHaveBeenCalledTimes(2); // each call is independently idempotent (upsert), so redelivery is safe
  });
});
