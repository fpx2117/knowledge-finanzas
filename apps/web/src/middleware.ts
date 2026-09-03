import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

import { buildSecurityHeaders, createBoundedInMemoryRateLimiter, REQUEST_ID_HEADER, resolveRequestId } from "@know-finanzas/observability";

// Public routes reachable without a session. Everything else (including /onboarding and
// /elegir-acceso, which need a session to resolve *which* onboarding step to show) requires one.
const PUBLIC_PATHS = new Set(["/", "/login", "/signup", "/pricing"]);
const AUTH_ENTRY_PATHS = new Set(["/login", "/signup"]);

// Presence-only check (no DB round trip) — safe/fast for middleware, matches better-auth's
// documented Next.js pattern. The authoritative check stays server-side via requireCurrentUser()
// (auth.api.getSession), which every protected page already calls.
function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/api/")) return true;
  return false;
}

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

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

  if (!isWebhookPath) {
    const pathname = request.nextUrl.pathname;
    const hasSession = Boolean(getSessionCookie(request));

    if (!hasSession && !isPublicPath(pathname) && !isAdminPath(pathname)) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackURL", pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }

    if (hasSession && AUTH_ENTRY_PATHS.has(pathname)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
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

  const securityHeaders = buildSecurityHeaders({
    isHttps: request.nextUrl.protocol === "https:",
    dev: process.env.NODE_ENV !== "production",
  });
  for (const [name, value] of Object.entries(securityHeaders)) {
    response.headers.set(name, value);
  }

  return response;
}

// Excludes Next.js internals and files served straight from /public (anything with a file
// extension, e.g. /brand/logo.png) — nothing there needs a request ID or benefits from
// re-computing security headers, and routing static assets through the auth check would
// redirect them to /login and break <Image> loading them.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)"],
};
