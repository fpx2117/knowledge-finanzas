import { createHmac, timingSafeEqual } from "node:crypto";

// Resend signs webhooks the Svix way: signed content is "{svix-id}.{svix-timestamp}.{rawBody}",
// HMAC-SHA256 keyed by the base64 part of the "whsec_..." secret, base64-encoded, compared
// against one of the space-separated "v1,<base64>" values in the svix-signature header.
export type ResendWebhookSignatureInput = {
  svixId: string | null;
  svixTimestamp: string | null;
  svixSignature: string | null;
  rawBody: string;
  secret: string;
};

const MAX_TOLERANCE_SECONDS = 5 * 60;

export function verifyResendWebhookSignature(input: ResendWebhookSignatureInput): boolean {
  if (!input.svixId || !input.svixTimestamp || !input.svixSignature || !input.secret) return false;

  const timestampSeconds = Number(input.svixTimestamp);
  if (!Number.isFinite(timestampSeconds)) return false;
  if (Math.abs(Date.now() / 1000 - timestampSeconds) > MAX_TOLERANCE_SECONDS) return false;

  const secretKey = decodeSecret(input.secret);
  if (!secretKey) return false;

  const signedContent = `${input.svixId}.${input.svixTimestamp}.${input.rawBody}`;
  const expected = createHmac("sha256", secretKey).update(signedContent).digest();

  return input.svixSignature
    .split(" ")
    .map((entry) => entry.split(",")[1])
    .filter((candidate): candidate is string => Boolean(candidate))
    .some((candidate) => timingSafeEqualBase64(expected, candidate));
}

function decodeSecret(secret: string): Buffer | null {
  const withoutPrefix = secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret;
  try {
    return Buffer.from(withoutPrefix, "base64");
  } catch {
    return null;
  }
}

function timingSafeEqualBase64(expected: Buffer, actualBase64: string): boolean {
  let actual: Buffer;
  try {
    actual = Buffer.from(actualBase64, "base64");
  } catch {
    return false;
  }
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
