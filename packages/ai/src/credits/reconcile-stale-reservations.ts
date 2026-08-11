import type { AICreditRepositoryPort } from "./credit-service";

// A PENDING reservation whose TTL has elapsed without a commit/release (crash, timeout, process
// kill mid-execution) would otherwise hold credits forever, since getAvailableBalances subtracts
// all PENDING holds regardless of age. Run periodically (cron/job) to release those holds.
export function createReconcileStaleReservations(repo: Pick<AICreditRepositoryPort, "listStalePending" | "markExpired">, now: () => Date = () => new Date()) {
  return async function reconcileStaleReservations() {
    const stale = await repo.listStalePending(now());
    if (stale.length === 0) return { expiredCount: 0 };

    const expired = await repo.markExpired(stale.map((reservation) => reservation.id));
    return { expiredCount: expired.length };
  };
}
