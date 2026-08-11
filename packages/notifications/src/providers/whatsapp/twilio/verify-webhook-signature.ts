import { createHmac, timingSafeEqual } from "node:crypto";

// Twilio's documented algorithm: take the full request URL, append each POST parameter's
// key+value (sorted alphabetically by key, no separator), HMAC-SHA1 with the auth token,
// base64-encode, and compare against the X-Twilio-Signature header.
export type TwilioWebhookSignatureInput = {
  url: string;
  params: Record<string, string>;
  signatureHeader: string | null;
  authToken: string;
};

export function verifyTwilioWebhookSignature(input: TwilioWebhookSignatureInput): boolean {
  if (!input.signatureHeader || !input.authToken) return false;

  const signedContent = Object.keys(input.params)
    .sort()
    .reduce((acc, key) => acc + key + input.params[key], input.url);

  const expected = createHmac("sha1", input.authToken).update(signedContent, "utf8").digest();

  let actual: Buffer;
  try {
    actual = Buffer.from(input.signatureHeader, "base64");
  } catch {
    return false;
  }

  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
