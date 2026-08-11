// Security Requirements: "CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS
// when stable." A pragmatic baseline CSP for a Next.js App Router site with no nonce
// infrastructure — 'unsafe-inline' on script-src is required for Next.js's inline hydration data
// without a nonce-based setup; tightening this to nonces is a follow-up, not a regression versus
// today (no CSP exists at all currently).
export function buildSecurityHeaders(input: { isHttps: boolean }): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
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
