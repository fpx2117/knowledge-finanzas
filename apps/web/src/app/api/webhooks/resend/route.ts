import { NextResponse, type NextRequest } from "next/server";

import { createNotificationDeliveryRepository, createNotificationPreferenceRepository, createNotificationRepository, db } from "@know-finanzas/db";
import { createProcessResendWebhook } from "@know-finanzas/notifications";
import { env } from "@know-finanzas/config";
import { logger } from "@/lib/observability/logger.instance";

const preferences = createNotificationPreferenceRepository(db);

// No user session here: Resend calls this endpoint server-to-server, authenticated only by the
// svix-* headers verified inside createProcessResendWebhook.
const processor = createProcessResendWebhook({
  deliveries: createNotificationDeliveryRepository(db),
  notifications: createNotificationRepository(db),
  suppressEmail: (userId) => preferences.upsertForUser({ userId, notificationType: null, channel: "EMAIL", enabled: false }),
  webhookSecret: env.RESEND_WEBHOOK_SECRET ?? "",
});

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  let event: { type?: string; data?: { email_id?: string } } | null = null;
  try {
    event = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    event = null;
  }

  if (!event?.type || !event.data?.email_id) return NextResponse.json({ ok: true }, { status: 200 });

  let result: Awaited<ReturnType<typeof processor>>;
  try {
    result = await processor({
      event: { type: event.type, data: { email_id: event.data.email_id } },
      rawBody,
      svixId: request.headers.get("svix-id"),
      svixTimestamp: request.headers.get("svix-timestamp"),
      svixSignature: request.headers.get("svix-signature"),
    });
  } catch (error) {
    logger.error("webhook_processing_unexpected_error", { provider: "resend", errorMessage: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }

  if (result === "invalid_signature") {
    logger.warn("webhook_invalid_signature", { provider: "resend", eventType: event.type });
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
