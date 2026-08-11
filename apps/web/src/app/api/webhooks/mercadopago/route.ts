import { NextResponse, type NextRequest } from "next/server";

import { createBillingWebhookEventRepository, db } from "@know-finanzas/db";
import { createMercadoPagoBillingProvider, createMercadoPagoWebhookProcessor, parseWebhookNotification } from "@know-finanzas/billing";
import { env } from "@know-finanzas/config";
import { subscriptionSynchronizer } from "@/lib/billing/subscription-synchronizer.instance";
import { handlePaymentFailure } from "@/lib/billing/handle-payment-failure.instance";
import { logger } from "@/lib/observability/logger.instance";

// No user session here: Mercado Pago calls this endpoint server-to-server, authenticated only
// by the x-signature/x-request-id headers verified inside createMercadoPagoWebhookProcessor.
const processor = createMercadoPagoWebhookProcessor({
  events: createBillingWebhookEventRepository(db),
  provider: createMercadoPagoBillingProvider({ accessToken: env.MERCADOPAGO_ACCESS_TOKEN ?? "" }),
  synchronizer: subscriptionSynchronizer,
  handlePaymentFailure,
  webhookSecret: env.MERCADOPAGO_WEBHOOK_SECRET ?? "",
});

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  let parsedBody: unknown = null;
  try {
    parsedBody = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    parsedBody = null;
  }

  const notification = parseWebhookNotification({
    searchParams: request.nextUrl.searchParams,
    body: parsedBody as { id?: string | number; type?: string; topic?: string; data?: { id?: string } } | null,
  });

  // Nothing coherent to process (e.g. a connectivity test ping) — acknowledge without touching state.
  if (!notification) return NextResponse.json({ ok: true }, { status: 200 });

  let result: Awaited<ReturnType<typeof processor.process>>;
  try {
    result = await processor.process({
      notification,
      rawBody,
      xSignatureHeader: request.headers.get("x-signature"),
      xRequestIdHeader: request.headers.get("x-request-id"),
    });
  } catch (error) {
    logger.error("webhook_processing_unexpected_error", { provider: "mercadopago", errorMessage: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }

  switch (result.outcome) {
    case "invalid_signature":
      // A potential attack signal (someone hitting this endpoint without a valid MP secret) —
      // never logs the raw signature/body, only the outcome and MP's own resource type.
      logger.warn("webhook_invalid_signature", { provider: "mercadopago", notificationType: notification.type });
      return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
    case "failed":
      // Retryable (provider/infrastructure) failures ask Mercado Pago to redeliver later;
      // non-retryable ones are acknowledged so we are not hammered for something that will
      // never succeed — the failure is already recorded on the webhook event row.
      logger.warn("webhook_processing_failed", { provider: "mercadopago", errorCode: result.errorCode, retryable: result.retryable });
      return NextResponse.json({ ok: false, error: result.errorCode }, { status: result.retryable ? 500 : 200 });
    default:
      return NextResponse.json({ ok: true }, { status: 200 });
  }
}
