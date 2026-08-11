import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { buildMercadoPagoSignatureManifest, parseWebhookNotification, verifyMercadoPagoSignature } from "@know-finanzas/billing";

const secret = "test-webhook-secret";

function sign(input: { dataId: string; requestId: string; ts: string }) {
  const manifest = buildMercadoPagoSignatureManifest(input);
  return createHmac("sha256", secret).update(manifest).digest("hex");
}

function header(ts: string, v1: string) {
  return `ts=${ts},v1=${v1}`;
}

describe("mercado pago webhook signature verification", () => {
  it("accepts a correctly signed notification", () => {
    const ts = "1700000000000";
    const requestId = "req-1";
    const dataId = "123456";
    const v1 = sign({ dataId, requestId, ts });

    expect(verifyMercadoPagoSignature({ xSignatureHeader: header(ts, v1), xRequestIdHeader: requestId, dataId, secret })).toBe(true);
  });

  it("lowercases the data id before signing, matching Mercado Pago's manifest convention", () => {
    const ts = "1700000000000";
    const requestId = "req-1";
    const v1 = sign({ dataId: "abc123", requestId, ts });

    expect(verifyMercadoPagoSignature({ xSignatureHeader: header(ts, v1), xRequestIdHeader: requestId, dataId: "ABC123", secret })).toBe(true);
  });

  it("rejects a tampered v1 hash", () => {
    const ts = "1700000000000";
    const requestId = "req-1";
    const dataId = "123456";
    const v1 = sign({ dataId, requestId, ts });
    const tampered = v1.slice(0, -1) + (v1.at(-1) === "0" ? "1" : "0");

    expect(verifyMercadoPagoSignature({ xSignatureHeader: header(ts, tampered), xRequestIdHeader: requestId, dataId, secret })).toBe(false);
  });

  it("rejects when the request-id used to sign differs from the one presented", () => {
    const ts = "1700000000000";
    const dataId = "123456";
    const v1 = sign({ dataId, requestId: "req-original", ts });

    expect(verifyMercadoPagoSignature({ xSignatureHeader: header(ts, v1), xRequestIdHeader: "req-replayed", dataId, secret })).toBe(false);
  });

  it("rejects when the data id used to sign differs from the one presented", () => {
    const ts = "1700000000000";
    const requestId = "req-1";
    const v1 = sign({ dataId: "123456", requestId, ts });

    expect(verifyMercadoPagoSignature({ xSignatureHeader: header(ts, v1), xRequestIdHeader: requestId, dataId: "999999", secret })).toBe(false);
  });

  it("rejects when signed with a different secret", () => {
    const ts = "1700000000000";
    const requestId = "req-1";
    const dataId = "123456";
    const manifest = buildMercadoPagoSignatureManifest({ dataId, requestId, ts });
    const v1 = createHmac("sha256", "wrong-secret").update(manifest).digest("hex");

    expect(verifyMercadoPagoSignature({ xSignatureHeader: header(ts, v1), xRequestIdHeader: requestId, dataId, secret })).toBe(false);
  });

  it("rejects missing headers or data id", () => {
    expect(verifyMercadoPagoSignature({ xSignatureHeader: null, xRequestIdHeader: "req-1", dataId: "1", secret })).toBe(false);
    expect(verifyMercadoPagoSignature({ xSignatureHeader: "ts=1,v1=abc", xRequestIdHeader: null, dataId: "1", secret })).toBe(false);
    expect(verifyMercadoPagoSignature({ xSignatureHeader: "ts=1,v1=abc", xRequestIdHeader: "req-1", dataId: null, secret })).toBe(false);
  });

  it("rejects a malformed x-signature header", () => {
    expect(verifyMercadoPagoSignature({ xSignatureHeader: "not-a-valid-header", xRequestIdHeader: "req-1", dataId: "1", secret })).toBe(false);
    expect(verifyMercadoPagoSignature({ xSignatureHeader: "ts=1700000000000", xRequestIdHeader: "req-1", dataId: "1", secret })).toBe(false);
  });

  it("rejects a non-hex v1 value instead of throwing", () => {
    expect(verifyMercadoPagoSignature({ xSignatureHeader: header("1700000000000", "not-hex!!"), xRequestIdHeader: "req-1", dataId: "1", secret })).toBe(false);
  });
});

describe("mercado pago webhook notification parsing", () => {
  it("reads type and data id from query params, preferring them over the body", () => {
    const notification = parseWebhookNotification({
      searchParams: new URLSearchParams("type=subscription_preapproval&data.id=abc123"),
      body: { id: 999, type: "payment", data: { id: "other" } },
    });
    expect(notification).toEqual({ type: "subscription_preapproval", dataId: "abc123", notificationId: "999" });
  });

  it("falls back to the body when query params are absent", () => {
    const notification = parseWebhookNotification({
      searchParams: new URLSearchParams(),
      body: { id: 42, type: "payment", data: { id: "pay-1" } },
    });
    expect(notification).toEqual({ type: "payment", dataId: "pay-1", notificationId: "42" });
  });

  it("returns null when neither type nor data id can be resolved", () => {
    expect(parseWebhookNotification({ searchParams: new URLSearchParams(), body: null })).toBeNull();
  });
});
