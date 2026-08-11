import { createPromotionRepository, db } from "@know-finanzas/db";
import { createInMemoryRateLimiter, createRedeemPromotionCode } from "@know-finanzas/promotions";

// V1 defaults, no env var yet (no existing precedent for a per-feature rate-limit config surface
// — packages/ai's rate limiter is configured the same way, inline at the wiring site).
const USER_LIMIT = 5;
const IP_LIMIT = 20;
const WINDOW_MS = 10 * 60 * 1000;

const checkUserRateLimit = createInMemoryRateLimiter({ limit: USER_LIMIT, windowMs: WINDOW_MS });
const checkIpRateLimit = createInMemoryRateLimiter({ limit: IP_LIMIT, windowMs: WINDOW_MS });

export const redeemPromotionCode = createRedeemPromotionCode({
  repository: createPromotionRepository(db),
  checkRateLimit: (key) => (key.startsWith("ip:") ? checkIpRateLimit(key) : checkUserRateLimit(key)),
});
