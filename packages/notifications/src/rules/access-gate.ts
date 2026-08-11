import type { NotificationCategory } from "../domain/types";

// Categories that represent "premium financial" signals — stop generating once product access
// has expired (docs/09-notifications-alerts.md, TASK-049 domain rule). BILLING/SECURITY/ACCOUNT
// notifications are operational and must keep firing regardless of financial access state (a
// payment-failed or security notification is exactly what an expired user still needs to see).
const ACCESS_GATED_CATEGORIES: ReadonlySet<NotificationCategory> = new Set(["FINANCIAL", "PRODUCT"]);

// Takes a plain boolean rather than importing @know-finanzas/billing's ProductAccessState —
// packages/notifications stays decoupled from billing; the caller (apps/web) resolves access and
// passes the result in.
export function isRuleEligibleForAccess(category: NotificationCategory, hasActivePremiumAccess: boolean): boolean {
  if (!ACCESS_GATED_CATEGORIES.has(category)) return true;
  return hasActivePremiumAccess;
}
