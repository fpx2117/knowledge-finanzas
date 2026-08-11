import { ApplicationError } from "@know-finanzas/shared";

// Domain Rule (TASK-059): manual Pro grant, grant extension, grant revocation, AI adjustment,
// refund, and referral invalidation all require an explicit reason, enforced at the
// application-service layer — never only by a required form field. Owning services for those
// actions (packages/promotions, packages/billing, future AI/referral tasks) call this at the
// start of the mutation, before touching any table.
export function requireReason(reason: string | null | undefined): string {
  const trimmed = reason?.trim();
  if (!trimmed) throw new ApplicationError("ADMIN_REASON_REQUIRED");
  return trimmed;
}
