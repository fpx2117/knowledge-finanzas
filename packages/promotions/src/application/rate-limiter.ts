// Small, dependency-free in-memory rate limiter (same shape as
// packages/ai/src/rate-limit/in-memory-rate-limiter.ts) — duplicated rather than imported to keep
// packages/promotions decoupled from packages/ai, matching how packages/ai itself duplicates
// packages/billing's ProPeriodGrantInput shape rather than importing it.
export function createInMemoryRateLimiter(config: { limit: number; windowMs: number; now?: () => number }) {
  const now = config.now ?? (() => Date.now());
  const hitsByKey = new Map<string, number[]>();

  return async function checkRateLimit(key: string): Promise<boolean> {
    const windowStart = now() - config.windowMs;
    const recentHits = (hitsByKey.get(key) ?? []).filter((timestamp) => timestamp > windowStart);
    if (recentHits.length >= config.limit) {
      hitsByKey.set(key, recentHits);
      return false;
    }
    recentHits.push(now());
    hitsByKey.set(key, recentHits);
    return true;
  };
}
