// V1 rate-limiting foundation (docs/17-ai-categorization-slice.md §2 "Rate Limiting
// Foundation"): a per-process sliding window keyed by (userId, capability). This is intentionally
// not distributed — correct for a single Next.js server instance, and cheap to swap for a
// Redis-backed implementation later without touching callers, since both satisfy the same
// RateLimitPort shape from execute-capability.ts.
export function createInMemoryRateLimiter(config: { limit: number; windowMs: number; now?: () => number }) {
  const now = config.now ?? (() => Date.now());
  const hitsByKey = new Map<string, number[]>();

  return async function checkRateLimit(input: { userId: string; capability: string }): Promise<boolean> {
    const key = `${input.userId}:${input.capability}`;
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
