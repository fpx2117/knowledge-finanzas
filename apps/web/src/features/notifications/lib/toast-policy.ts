import type { NotificationPriority } from "@know-finanzas/notifications";

// Toast policy (TASK-048 scope): only interrupts for HIGH/CRITICAL priority, and only while the
// tab is actually the one the user is looking at — every notification is always visible in the
// notification center regardless of this decision, so getting it wrong never hides anything, it
// only over/under-interrupts.
export function shouldToastNotification(priority: NotificationPriority, documentVisibilityState: DocumentVisibilityState): boolean {
  if (documentVisibilityState !== "visible") return false;
  return priority === "HIGH" || priority === "CRITICAL";
}
