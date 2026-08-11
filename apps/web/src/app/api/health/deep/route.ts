import { NextResponse } from "next/server";

import { checkDatabaseConnection } from "@know-finanzas/db";
import { env } from "@know-finanzas/config";

// Protected deep diagnostic endpoint (docs/18-production-readiness.md §41): reports which optional
// capabilities are configured, never their secret values. Requires INTERNAL_HEALTH_TOKEN as a
// bearer token — required in production (packages/config), optional in development. Never
// consults an external provider (Mercado Pago, OpenRouter, Resend, Twilio) directly — only
// whether local configuration for that capability is present, matching the Domain Rule that
// external outages must never fake or block on unrelated health signals.
export async function GET(request: Request) {
  if (env.INTERNAL_HEALTH_TOKEN) {
    const authorization = request.headers.get("authorization");
    if (authorization !== `Bearer ${env.INTERNAL_HEALTH_TOKEN}`) {
      return NextResponse.json({ status: "unauthorized" }, { status: 401 });
    }
  } else if (env.NODE_ENV === "production") {
    // Belt-and-suspenders: packages/config already requires INTERNAL_HEALTH_TOKEN to exist in
    // production, but never serve this endpoint openly if that guarantee were ever bypassed.
    return NextResponse.json({ status: "unauthorized" }, { status: 401 });
  }

  let database: "ok" | "unavailable" = "ok";
  try {
    await checkDatabaseConnection();
  } catch {
    database = "unavailable";
  }

  return NextResponse.json({
    status: database === "ok" ? "ok" : "degraded",
    database,
    capabilities: {
      ai: env.AI_ENABLED,
      aiCategorization: env.AI_CATEGORIZATION_ENABLED,
      billing: env.BILLING_ENABLED,
      billingNewSubscriptions: env.BILLING_NEW_SUBSCRIPTIONS_ENABLED,
      notifications: env.NOTIFICATIONS_ENABLED,
      emailNotifications: env.EMAIL_NOTIFICATIONS_ENABLED,
      whatsappNotifications: env.WHATSAPP_NOTIFICATIONS_ENABLED,
    },
  });
}
