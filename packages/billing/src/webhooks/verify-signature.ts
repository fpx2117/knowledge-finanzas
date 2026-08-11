import { createHmac, timingSafeEqual } from "node:crypto";

export type MercadoPagoSignatureInput = {
  xSignatureHeader: string | null;
  xRequestIdHeader: string | null;
  dataId: string | null;
  secret: string;
};

// Mercado Pago's documented manifest format: "id:{data.id};request-id:{x-request-id};ts:{ts};",
// HMAC-SHA256 (hex) of that manifest using the webhook secret, compared against the "v1" part
// of the "x-signature" header (format: "ts=<ms>,v1=<hex>").
export function buildMercadoPagoSignatureManifest(input: { dataId: string; requestId: string; ts: string }): string {
  return `id:${input.dataId.toLowerCase()};request-id:${input.requestId};ts:${input.ts};`;
}

export function verifyMercadoPagoSignature(input: MercadoPagoSignatureInput): boolean {
  if (!input.xSignatureHeader || !input.xRequestIdHeader || !input.dataId || !input.secret) return false;

  const { ts, v1 } = parseSignatureHeader(input.xSignatureHeader);
  if (!ts || !v1 || !/^[0-9a-f]+$/i.test(v1)) return false;

  const manifest = buildMercadoPagoSignatureManifest({ dataId: input.dataId, requestId: input.xRequestIdHeader, ts });
  const expected = createHmac("sha256", input.secret).update(manifest).digest("hex");

  return timingSafeEqualHex(expected, v1);
}

function parseSignatureHeader(header: string): { ts?: string; v1?: string } {
  const result: { ts?: string; v1?: string } = {};
  for (const part of header.split(",")) {
    const [key, value] = part.split("=");
    const trimmedKey = key?.trim();
    const trimmedValue = value?.trim();
    if (trimmedKey === "ts") result.ts = trimmedValue;
    if (trimmedKey === "v1") result.v1 = trimmedValue;
  }
  return result;
}

function timingSafeEqualHex(expectedHex: string, actualHex: string): boolean {
  const expected = Buffer.from(expectedHex, "hex");
  const actual = Buffer.from(actualHex, "hex");
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
