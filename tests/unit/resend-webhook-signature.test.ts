import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyResendWebhookSignature } from "@know-finanzas/notifications";

const secretBase64 = Buffer.from("test-resend-secret-bytes").toString("base64");
const secret = `whsec_${secretBase64}`;

function sign(svixId: string, svixTimestamp: string, rawBody: string) {
  const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;
  const digest = createHmac("sha256", Buffer.from(secretBase64, "base64")).update(signedContent).digest("base64");
  return `v1,${digest}`;
}

describe("verifyResendWebhookSignature", () => {
  it("accepts a correctly signed payload", () => {
    const svixId = "msg_1";
    const svixTimestamp = String(Math.floor(Date.now() / 1000));
    const rawBody = JSON.stringify({ type: "email.delivered", data: { email_id: "abc" } });

    expect(verifyResendWebhookSignature({ svixId, svixTimestamp, svixSignature: sign(svixId, svixTimestamp, rawBody), rawBody, secret })).toBe(true);
  });

  it("rejects a tampered body", () => {
    const svixId = "msg_1";
    const svixTimestamp = String(Math.floor(Date.now() / 1000));
    const rawBody = JSON.stringify({ type: "email.delivered", data: { email_id: "abc" } });
    const signature = sign(svixId, svixTimestamp, rawBody);

    const tamperedBody = JSON.stringify({ type: "email.delivered", data: { email_id: "different" } });
    expect(verifyResendWebhookSignature({ svixId, svixTimestamp, svixSignature: signature, rawBody: tamperedBody, secret })).toBe(false);
  });

  it("rejects a stale timestamp (replay protection)", () => {
    const svixId = "msg_1";
    const staleTimestamp = String(Math.floor(Date.now() / 1000) - 60 * 60);
    const rawBody = JSON.stringify({ type: "email.delivered", data: { email_id: "abc" } });

    expect(verifyResendWebhookSignature({ svixId, svixTimestamp: staleTimestamp, svixSignature: sign(svixId, staleTimestamp, rawBody), rawBody, secret })).toBe(false);
  });

  it("rejects a signature produced with the wrong secret", () => {
    const svixId = "msg_1";
    const svixTimestamp = String(Math.floor(Date.now() / 1000));
    const rawBody = JSON.stringify({ type: "email.delivered", data: { email_id: "abc" } });
    const wrongSecretDigest = createHmac("sha256", Buffer.from("wrong-secret")).update(`${svixId}.${svixTimestamp}.${rawBody}`).digest("base64");

    expect(verifyResendWebhookSignature({ svixId, svixTimestamp, svixSignature: `v1,${wrongSecretDigest}`, rawBody, secret })).toBe(false);
  });

  it("rejects when required fields are missing", () => {
    expect(verifyResendWebhookSignature({ svixId: null, svixTimestamp: "1", svixSignature: "v1,x", rawBody: "{}", secret })).toBe(false);
    expect(verifyResendWebhookSignature({ svixId: "1", svixTimestamp: null, svixSignature: "v1,x", rawBody: "{}", secret })).toBe(false);
    expect(verifyResendWebhookSignature({ svixId: "1", svixTimestamp: "1", svixSignature: null, rawBody: "{}", secret })).toBe(false);
    expect(verifyResendWebhookSignature({ svixId: "1", svixTimestamp: String(Math.floor(Date.now() / 1000)), svixSignature: "v1,x", rawBody: "{}", secret: "" })).toBe(false);
  });
});
