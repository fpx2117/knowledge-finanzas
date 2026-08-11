"use server";

import { revalidatePath } from "next/cache";

import { reconcileSubscriptions } from "@/lib/billing/reconcile-subscriptions.instance";
import { recordAuditEntry } from "@/lib/admin/record-audit-entry.instance";
import { requireAdminUser } from "@/lib/auth/require-admin-user";
import { mapAdminActionError } from "../../lib/map-admin-error";
import type { AdminActionState } from "../../shared/admin-action-dialog";

// "Reconcile Now" (Domain Rule: never lets the admin manually pick a resulting status — this
// only ever replays the same batch reconciliation TASK-034's cron-style sweep runs, then reports
// back this one subscription's outcome). There is no per-subscription-scoped reconcile function
// (packages/billing's reconciler always evaluates every reconcilable subscription); calling the
// real batch reconciler and reading this subscription's result out of it is what "the exact same
// application service" means here, not a bespoke single-subscription variant.
export async function reconcileSubscriptionAction(_previousState: AdminActionState | null, formData: FormData): Promise<AdminActionState> {
  const subscriptionId = String(formData.get("subscriptionId") ?? "");
  try {
    const admin = await requireAdminUser("billing.manage");
    const before = { subscriptionId };
    const batch = await reconcileSubscriptions();
    const result = batch.results.find((r) => r.subscriptionId === subscriptionId);

    await recordAuditEntry({
      actorUserId: admin.id,
      action: "RECONCILE_SUBSCRIPTION",
      entityType: "billing_subscription",
      entityId: subscriptionId,
      beforeSnapshot: before,
      afterSnapshot: result ?? { note: "not in reconcilable set" },
    });
  } catch (error) {
    return { ok: false, error: mapAdminActionError(error) };
  }

  revalidatePath("/admin/billing");
  revalidatePath("/admin/billing/reconciliation");
  return { ok: true };
}
