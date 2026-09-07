import { isApplicationError } from "@know-finanzas/shared";
import { SECURITY_EVENT, isOwnershipLookupError } from "@know-finanzas/observability";

import { logger } from "./logger.instance";

// WP-OBSERVABILITY (gate G7): every financial mutation runs its `catch` through here. It turns a
// thrown error into one structured log line — and, when the error is an ownership-scoped lookup
// failure for a user-supplied ID, into a security signal the aggregator can rate-alert on (a
// single one is noise; a burst from one user is IDOR probing). It never changes the error: the
// caller re-throws or maps it exactly as before.
//
// Only operation/entity IDs and error codes are logged — never descriptions, amounts, or notes
// (the shared redactor is a backstop, but call sites must not pass them in the first place).
export function reportActionError(action: string, userId: string | null, error: unknown): void {
  if (isApplicationError(error)) {
    if (isOwnershipLookupError(error.code)) {
      logger.warn(SECURITY_EVENT.ownershipLookupFailed, { action, code: error.code, userId, field: error.field ?? null });
      return;
    }
    // An expected domain error (validation, archived resource, business rule) — info, not a page.
    logger.info("action.rejected", { action, code: error.code, userId });
    return;
  }

  // Anything that isn't an ApplicationError escaped the domain layer unclassified — this is the
  // "critical error" an aggregator alerts on immediately.
  logger.error(SECURITY_EVENT.actionUnexpectedError, {
    action,
    userId,
    errorName: error instanceof Error ? error.name : typeof error,
    errorMessage: error instanceof Error ? error.message : String(error),
  });
}
