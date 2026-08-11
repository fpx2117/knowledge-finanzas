// Bounded, dependency-free in-memory sliding-window rate limiter — same shape as
// packages/ai/src/rate-limit/in-memory-rate-limiter.ts and
// packages/promotions/src/application/rate-limiter.ts (duplicated rather than imported, matching
// this repo's package-decoupling convention), but bounded on total tracked keys (Implementation
// Notes: "prefer bounded ... fallback behavior"). Built for webhook-abuse limiting, where keys are
// arbitrary source IPs rather than a repo's own bounded set of real user IDs — an unbounded Map
// there is a real memory-growth risk over a long-running process. Redis is optional infrastructure
// (Domain Rule) — this in-memory limiter is the whole implementation for now; a Redis-backed one
// would share this exact `checkRateLimit(key): Promise<boolean>` shape.
export function createBoundedInMemoryRateLimiter(config: { limit: number; windowMs: number; maxTrackedKeys?: number; now?: () => number }) {
  const now = config.now ?? (() => Date.now());
  const maxTrackedKeys = config.maxTrackedKeys ?? 10_000;
  // Map iteration order is insertion order — re-inserting a key on every touch (delete then set)
  // is what makes "oldest entry" == "least recently touched" for the eviction below.
  const hitsByKey = new Map<string, number[]>();

  return async function checkRateLimit(key: string): Promise<boolean> {
    const windowStart = now() - config.windowMs;
    const recentHits = (hitsByKey.get(key) ?? []).filter((timestamp) => timestamp > windowStart);
    hitsByKey.delete(key);

    if (recentHits.length >= config.limit) {
      hitsByKey.set(key, recentHits);
      return false;
    }

    recentHits.push(now());
    hitsByKey.set(key, recentHits);

    while (hitsByKey.size > maxTrackedKeys) {
      const oldestKey = hitsByKey.keys().next().value;
      if (oldestKey === undefined) break;
      hitsByKey.delete(oldestKey);
    }

    return true;
  };
}
