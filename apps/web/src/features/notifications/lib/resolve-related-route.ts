import type { NotificationSubjectType } from "@know-finanzas/notifications";

// Only ever resolves to a known internal route built from a typed subjectType + our own uuid —
// never a provider-supplied or otherwise arbitrary URL (domain rule in TASK-047/048 specs).
export function resolveRelatedRoute(subjectType: NotificationSubjectType, subjectId: string | null): string | null {
  switch (subjectType) {
    case "DEBT":
      return subjectId ? `/debts/${subjectId}` : null;
    case "TRANSACTION":
      return subjectId ? `/transactions/${subjectId}` : null;
    case "BUDGET":
      return subjectId ? `/budgets/${subjectId}` : null;
    case "SCHEDULED_TRANSACTION":
      return "/planning?tab=scheduled";
    case "SUBSCRIPTION":
      return "/settings/billing";
    case "NONE":
    default:
      return null;
  }
}
