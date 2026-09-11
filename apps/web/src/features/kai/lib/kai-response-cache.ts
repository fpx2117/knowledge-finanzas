import type { KaiDataPorts } from "@know-finanzas/kai";

/**
 * WP-KAI-CACHE (spec §20). A short-lived, per-process, per-user cache in front of the KAI
 * read ports — every KAI message otherwise re-runs the same DB queries the previous one did
 * (two questions about the same month hit `getMonthlySummary` twice).
 *
 * Scope, deliberately: only the *read* ports get cached, never the ones that feed a write
 * confirmation (`getObligationsForPayment`, `findTransactionToVoid`, …) — those must always be
 * fresh, a stale "remaining amount" on a payment confirmation would be a real bug, not a UX
 * nit. Invalidation has two layers:
 *  - KAI's own writes (`kai-create-actions.ts`) call `invalidateKaiCacheForUser` directly —
 *    exact, immediate.
 *  - a mutation from elsewhere in the app (Quick Add, the budgets page, another tab) is bounded
 *    by `DEFAULT_TTL_MS` — the same "accept a short staleness window" trade-off
 *    `kai-proactive-actions.ts` already makes for the proactive check, rather than threading
 *    cache invalidation through every one of the ~40 `emitFinancialEvent` call sites across the
 *    app for a caching layer whose whole point is to save a few seconds of DB load.
 */
const DEFAULT_TTL_MS = 20_000;

type CacheEntry = { value: unknown; expiresAt: number };

const cache = new Map<string, CacheEntry>();

function cacheKey(userId: string, name: string, args: readonly unknown[]): string {
  return `${userId}:${name}:${JSON.stringify(args)}`;
}

async function withKaiCache<T>(key: string, ttlMs: number, compute: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) return hit.value as T;
  const value = await compute();
  cache.set(key, { value, expiresAt: now + ttlMs });
  return value;
}

/** Wraps one async port method so identical calls within the TTL skip the DB entirely. */
function cached<A extends unknown[], R>(userId: string, name: string, fn: (...args: A) => Promise<R>, ttlMs = DEFAULT_TTL_MS): (...args: A) => Promise<R> {
  return (...args: A) => withKaiCache(cacheKey(userId, name, args), ttlMs, () => fn(...args));
}

/** Clears every cached entry for one user — call right after a write KAI itself performed. */
export function invalidateKaiCacheForUser(userId: string): void {
  const prefix = `${userId}:`;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

/**
 * Returns `ports` with its read-heavy, write-safe methods memoised for `userId`. Everything
 * not listed here (the write-confirmation lookups) passes through untouched.
 */
export function withKaiPortsCache(userId: string, ports: KaiDataPorts): KaiDataPorts {
  return {
    ...ports,
    getMonthlySummary: cached(userId, "getMonthlySummary", ports.getMonthlySummary),
    getLiquidBalances: cached(userId, "getLiquidBalances", ports.getLiquidBalances),
    getAccountBalances: cached(userId, "getAccountBalances", ports.getAccountBalances),
    getSpendable: cached(userId, "getSpendable", ports.getSpendable),
    getCategoryExpenses: cached(userId, "getCategoryExpenses", ports.getCategoryExpenses),
    getMerchantExpenses: cached(userId, "getMerchantExpenses", ports.getMerchantExpenses),
    getTopExpenseCategories: cached(userId, "getTopExpenseCategories", ports.getTopExpenseCategories),
    getRecentExpenses: cached(userId, "getRecentExpenses", ports.getRecentExpenses),
    getUpcomingObligations: cached(userId, "getUpcomingObligations", ports.getUpcomingObligations),
    getActiveSubscriptions: cached(userId, "getActiveSubscriptions", ports.getActiveSubscriptions),
    getBudgetStatus: cached(userId, "getBudgetStatus", ports.getBudgetStatus),
    getGoalProgress: cached(userId, "getGoalProgress", ports.getGoalProgress),
    getTopInsight: cached(userId, "getTopInsight", ports.getTopInsight),
  };
}
