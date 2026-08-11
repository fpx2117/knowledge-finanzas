import { NextResponse, type NextRequest } from "next/server";

import { createNotificationDeliveryRepository, db } from "@know-finanzas/db";
import { createProcessTwilioWebhook } from "@know-finanzas/notifications";
import { env } from "@know-finanzas/config";
import { logger } from "@/lib/observability/logger.instance";

// No user session here: Twilio calls this endpoint server-to-server, authenticated only by the
// X-Twilio-Signature header verified inside createProcessTwilioWebhook.
const processor = createProcessTwilioWebhook({
  deliveries: createNotificationDeliveryRepository(db),
  authToken: env.TWILIO_AUTH_TOKEN ?? "",
});

// Twilio signs against the exact URL configured in their console — the app's own canonical
// public URL, not whatever Host header a proxy might forward.
const WEBHOOK_URL = `${env.BETTER_AUTH_URL}/api/webhooks/twilio`;

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const params: Record<string, string> = {};
  for (const [key, value] of new URLSearchParams(rawBody)) params[key] = value;

  let result: Awaited<ReturnType<typeof processor>>;
  try {
    result = await processor({
      url: WEBHOOK_URL,
      params,
      signatureHeader: request.headers.get("x-twilio-signature"),
    });
  } catch (error) {
    logger.error("webhook_processing_unexpected_error", { provider: "twilio", errorMessage: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }

  if (result === "invalid_signature") {
    logger.warn("webhook_invalid_signature", { provider: "twilio" });
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
