import type { NotificationSubjectType } from "@know-finanzas/notifications";

// Only ever resolves to a known internal route built from a typed subjectType + our own uuid —
// never a provider-supplied or otherwise arbitrary URL (domain rule in TASK-047/048 specs).
// Paths follow the canonical route map (ADR-IMPL-001): obligations, transactions/scheduled, settings/plan.
export function resolveRelatedRoute(subjectType: NotificationSubjectType, subjectId: string | null): string | null {
  switch (subjectType) {
    case "DEBT":
      return subjectId ? `/obligations/${subjectId}` : null;
    case "TRANSACTION":
      return subjectId ? `/transactions/${subjectId}` : null;
    case "BUDGET":
      return subjectId ? `/budgets/${subjectId}` : null;
    case "SCHEDULED_TRANSACTION":
      return "/transactions/scheduled";
    case "SUBSCRIPTION":
      return "/settings/plan";
    case "NONE":
    default:
      return null;
  }
}
