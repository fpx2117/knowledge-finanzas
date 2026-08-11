import { NextResponse, type NextRequest } from "next/server";

import { buildSecurityHeaders, createBoundedInMemoryRateLimiter, REQUEST_ID_HEADER, resolveRequestId } from "@know-finanzas/observability";

// TASK-040: runs for every request. Two responsibilities, both cross-cutting and neither belonging
// to any single route:
// 1. Security headers (CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy,
//    X-Frame-Options, and HSTS over HTTPS) on every response.
// 2. A request ID: trusted from an incoming x-request-id if it looks like a UUID, otherwise
//    generated fresh — propagated both to the response (so a client/proxy can correlate) and to
//    the request headers reaching the Server Component/Route Handler/Server Action downstream
//    (readable there via next/headers' headers().get("x-request-id")).
//
// Webhook-abuse rate limiting (mercadopago/resend/twilio) lives here too — signature verification
// alone doesn't stop a flood of requests from ever reaching the provider-specific verification
// work, and this is the one place already touching every request before routing.
const WEBHOOK_PATH_PREFIX = "/api/webhooks/";
const checkWebhookRateLimit = createBoundedInMemoryRateLimiter({ limit: 60, windowMs: 60_000 });

function resolveClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown";
}

export async function middleware(request: NextRequest) {
  const isWebhookPath = request.nextUrl.pathname.startsWith(WEBHOOK_PATH_PREFIX);

  if (isWebhookPath) {
    const key = `${resolveClientIp(request)}:${request.nextUrl.pathname}`;
    const allowed = await checkWebhookRateLimit(key);
    if (!allowed) {
      return NextResponse.json({ status: "rate_limited" }, { status: 429 });
    }
  }

  // Webhook routes never get their x-request-id header touched: Mercado Pago's own x-request-id
  // header is a security-critical input to its webhook signature verification (it's baked
  // directly into the HMAC manifest — see packages/billing/src/webhooks/verify-signature.ts).
  // It is not guaranteed to be UUID-shaped, so resolveRequestId's UUID check would silently
  // replace a non-UUID provider ID with a freshly generated one, breaking signature verification
  // in production in a way that would be very hard to diagnose.
  const response = isWebhookPath ? NextResponse.next() : (() => {
    const requestId = resolveRequestId(request.headers.get(REQUEST_ID_HEADER));
    const forwardedHeaders = new Headers(request.headers);
    forwardedHeaders.set(REQUEST_ID_HEADER, requestId);

    const next = NextResponse.next({ request: { headers: forwardedHeaders } });
    next.headers.set(REQUEST_ID_HEADER, requestId);
    return next;
  })();

  const securityHeaders = buildSecurityHeaders({ isHttps: request.nextUrl.protocol === "https:" });
  for (const [name, value] of Object.entries(securityHeaders)) {
    response.headers.set(name, value);
  }

  return response;
}

// Excludes static assets and Next.js internals — nothing there needs a request ID or benefits from
// re-computing security headers Next.js/the platform already handles for them.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
