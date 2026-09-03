// Security Requirements: "CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS
// when stable." A pragmatic baseline CSP for a Next.js App Router site with no nonce
// infrastructure — 'unsafe-inline' on script-src is required for Next.js's inline hydration data
// without a nonce-based setup; tightening this to nonces is a follow-up, not a regression versus
// today (no CSP exists at all currently).
export function buildSecurityHeaders(input: { isHttps: boolean; dev?: boolean }): Record<string, string> {
  // Next.js dev mode (react-refresh / HMR / the error overlay) evaluates code with `eval` and
  // talks to the dev server over a websocket — both are blocked by the production CSP. Loosen
  // exactly those two directives when `dev` is set; production keeps the strict policy.
  const scriptSrc = input.dev ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self' 'unsafe-inline'";
  const connectSrc = input.dev ? "connect-src 'self' ws: wss:" : "connect-src 'self'";
  const headers: Record<string, string> = {
    "Content-Security-Policy": [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      connectSrc,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "X-Frame-Options": "DENY",
  };

  // HSTS only over an actual HTTPS connection ("when stable" — never advertise it over plain HTTP,
  // which HSTS itself can't retroactively upgrade past the first request anyway).
  if (input.isHttps) {
    headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload";
  }

  return headers;
}
