import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { createProcessTwilioWebhook } from "@know-finanzas/notifications";

const authToken = "test-twilio-auth-token";
const url = "https://app.know-finanzas.test/api/webhooks/twilio";

function sign(params: Record<string, string>) {
  const signedContent = Object.keys(params).sort().reduce((acc, key) => acc + key + params[key], url);
  return createHmac("sha1", authToken).update(signedContent, "utf8").digest("base64");
}

function fakeDeliveries(seed: Array<{ id: string; providerMessageId: string; status: string }>) {
  const records = seed.map((r) => ({ ...r }));
  return {
    records,
    findByProviderMessageId: vi.fn(async (id: string) => records.find((r) => r.providerMessageId === id)),
    updateStatus: vi.fn(async (id: string, input: { status: string }) => { const r = records.find((x) => x.id === id); if (r) r.status = input.status; }),
  };
}

describe("createProcessTwilioWebhook", () => {
  it("rejects a request with an invalid (spoofed) signature", async () => {
    const deliveries = fakeDeliveries([]);
    const process = createProcessTwilioWebhook({ deliveries, authToken });

    const params = { MessageSid: "SM1", MessageStatus: "delivered" };
    const result = await process({ url, params, signatureHeader: "deadbeef" });

    expect(result).toBe("invalid_signature");
    expect(deliveries.findByProviderMessageId).not.toHaveBeenCalled();
  });

  it("returns delivery_not_found for an unknown MessageSid", async () => {
    const deliveries = fakeDeliveries([]);
    const process = createProcessTwilioWebhook({ deliveries, authToken });

    const params = { MessageSid: "SM-unknown", MessageStatus: "delivered" };
    const result = await process({ url, params, signatureHeader: sign(params) });

    expect(result).toBe("delivery_not_found");
  });

  it("marks a delivery DELIVERED on a delivered callback", async () => {
    const deliveries = fakeDeliveries([{ id: "d1", providerMessageId: "SM1", status: "SENT" }]);
    const process = createProcessTwilioWebhook({ deliveries, authToken, now: () => new Date("2026-01-15T00:00:00Z") });

    const params = { MessageSid: "SM1", MessageStatus: "delivered" };
    const result = await process({ url, params, signatureHeader: sign(params) });

    expect(result).toBe("processed");
    expect(deliveries.records[0].status).toBe("DELIVERED");
  });

  it("marks a delivery FAILED with the provider error code on an undelivered callback", async () => {
    const deliveries = fakeDeliveries([{ id: "d1", providerMessageId: "SM1", status: "SENT" }]);
    const process = createProcessTwilioWebhook({ deliveries, authToken });

    const params = { MessageSid: "SM1", MessageStatus: "undelivered", ErrorCode: "63016" };
    const result = await process({ url, params, signatureHeader: sign(params) });

    expect(result).toBe("processed");
    expect(deliveries.records[0].status).toBe("FAILED");
    expect(deliveries.updateStatus).toHaveBeenCalledWith("d1", expect.objectContaining({ status: "FAILED", lastErrorCode: "63016" }));
  });

  it("marks a delivery FAILED on a failed callback", async () => {
    const deliveries = fakeDeliveries([{ id: "d1", providerMessageId: "SM1", status: "SENT" }]);
    const process = createProcessTwilioWebhook({ deliveries, authToken });

    const params = { MessageSid: "SM1", MessageStatus: "failed" };
    const result = await process({ url, params, signatureHeader: sign(params) });

    expect(result).toBe("processed");
    expect(deliveries.records[0].status).toBe("FAILED");
  });

  it("ignores intermediate statuses (queued/sending/sent) as no-ops", async () => {
    const deliveries = fakeDeliveries([{ id: "d1", providerMessageId: "SM1", status: "SENT" }]);
    const process = createProcessTwilioWebhook({ deliveries, authToken });

    const params = { MessageSid: "SM1", MessageStatus: "sending" };
    const result = await process({ url, params, signatureHeader: sign(params) });

    expect(result).toBe("unrecognized_status");
    expect(deliveries.records[0].status).toBe("SENT");
  });

  it("is idempotent under redelivery of the same delivered callback", async () => {
    const deliveries = fakeDeliveries([{ id: "d1", providerMessageId: "SM1", status: "SENT" }]);
    const process = createProcessTwilioWebhook({ deliveries, authToken });
    const params = { MessageSid: "SM1", MessageStatus: "delivered" };

    await process({ url, params, signatureHeader: sign(params) });
    const secondResult = await process({ url, params, signatureHeader: sign(params) });

    expect(secondResult).toBe("processed");
    expect(deliveries.records[0].status).toBe("DELIVERED");
  });
});
