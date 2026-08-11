import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyTwilioWebhookSignature } from "@know-finanzas/notifications";

const authToken = "test-twilio-auth-token";
const url = "https://app.know-finanzas.test/api/webhooks/twilio";

function sign(params: Record<string, string>, token = authToken) {
  const signedContent = Object.keys(params).sort().reduce((acc, key) => acc + key + params[key], url);
  return createHmac("sha1", token).update(signedContent, "utf8").digest("base64");
}

describe("verifyTwilioWebhookSignature", () => {
  it("accepts a correctly signed payload", () => {
    const params = { MessageSid: "SM123", MessageStatus: "delivered" };
    expect(verifyTwilioWebhookSignature({ url, params, signatureHeader: sign(params), authToken })).toBe(true);
  });

  it("rejects a tampered parameter", () => {
    const params = { MessageSid: "SM123", MessageStatus: "delivered" };
    const signature = sign(params);
    const tampered = { MessageSid: "SM123", MessageStatus: "failed" };
    expect(verifyTwilioWebhookSignature({ url, params: tampered, signatureHeader: signature, authToken })).toBe(false);
  });

  it("rejects a signature produced with the wrong auth token", () => {
    const params = { MessageSid: "SM123", MessageStatus: "delivered" };
    const signature = sign(params, "wrong-token");
    expect(verifyTwilioWebhookSignature({ url, params, signatureHeader: signature, authToken })).toBe(false);
  });

  it("rejects a signature computed against a different URL", () => {
    const params = { MessageSid: "SM123", MessageStatus: "delivered" };
    const signedContent = Object.keys(params).sort().reduce((acc, key) => acc + key + params[key], "https://evil.test/webhooks/twilio");
    const signature = createHmac("sha1", authToken).update(signedContent, "utf8").digest("base64");
    expect(verifyTwilioWebhookSignature({ url, params, signatureHeader: signature, authToken })).toBe(false);
  });

  it("rejects when the signature header or auth token is missing", () => {
    const params = { MessageSid: "SM123", MessageStatus: "delivered" };
    expect(verifyTwilioWebhookSignature({ url, params, signatureHeader: null, authToken })).toBe(false);
    expect(verifyTwilioWebhookSignature({ url, params, signatureHeader: sign(params), authToken: "" })).toBe(false);
  });

  it("rejects a malformed (non-base64) signature header without throwing", () => {
    const params = { MessageSid: "SM123", MessageStatus: "delivered" };
    expect(() => verifyTwilioWebhookSignature({ url, params, signatureHeader: "%%%not-base64%%%", authToken })).not.toThrow();
    expect(verifyTwilioWebhookSignature({ url, params, signatureHeader: "%%%not-base64%%%", authToken })).toBe(false);
  });
});
