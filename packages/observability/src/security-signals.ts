/**
 * The application-error codes a service throws when a user asked for a resource by ID and the
 * ownership-scoped lookup came back empty. Individually these are almost always benign — a stale
 * bookmark, a deleted row, a typo. In aggregate, a burst of them from one user is the signature of
 * someone walking IDs looking for another user's data (§8.1 keeps the response identical for
 * "not yours" and "doesn't exist", so the server-side signal is the only place the difference can
 * be observed). Log every one as a security event with a stable name; alert on the *rate*, never
 * the single occurrence — see docs/implementation/15-observability.md.
 *
 * Kept as a plain string set (not typed against `ApplicationErrorCode`) so this leaf infra package
 * stays dependency-free; the list is asserted against the real code union in a test.
 */
export const OWNERSHIP_LOOKUP_ERROR_CODES: ReadonlySet<string> = new Set([
  "ACCOUNT_NOT_FOUND",
  "CATEGORY_NOT_FOUND",
  "TRANSACTION_NOT_FOUND",
  "RULE_NOT_FOUND",
  "RECURRING_SERIES_NOT_FOUND",
  "TRANSFER_ACCOUNT_NOT_FOUND",
  "TRANSFER_NOT_FOUND",
  "BUDGET_NOT_FOUND",
  "BUDGET_CATEGORY_NOT_FOUND",
  "GOAL_NOT_FOUND",
  "FORBIDDEN",
  "ADMIN_TARGET_USER_NOT_FOUND",
]);

export function isOwnershipLookupError(code: string): boolean {
  return OWNERSHIP_LOOKUP_ERROR_CODES.has(code);
}

/** Stable log-event names the aggregator's alert rules key on. */
export const SECURITY_EVENT = {
  /** An ownership-scoped lookup failed for a user-supplied ID (possible IDOR probing in aggregate). */
  ownershipLookupFailed: "security.ownership_lookup_failed",
  /** A financial mutation threw something that was not an expected domain error. */
  actionUnexpectedError: "action.unexpected_error",
} as const;
