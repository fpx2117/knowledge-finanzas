"use server";

import { revalidatePath } from "next/cache";

import { createBillingSubscriptionRepository, db } from "@know-finanzas/db";
import { createCancelSubscription, createMercadoPagoBillingProvider } from "@know-finanzas/billing";
import { requireReason } from "@know-finanzas/audit";
import { env } from "@know-finanzas/config";
import { requireAdminUser } from "@/lib/auth/require-admin-user";
import { subscriptionSynchronizer } from "@/lib/billing/subscription-synchronizer.instance";
import { recordAuditEntry } from "@/lib/admin/record-audit-entry.instance";
import { mapAdminActionError } from "../../lib/map-admin-error";
import type { AdminActionState } from "../../shared/admin-action-dialog";

const subscriptions = createBillingSubscriptionRepository(db);

// Exact same application service as the user-facing flow (docs/21 Domain Rule) — only the
// ownership lookup differs: the user-facing action scopes by session userId
// (`findByIdForUser`), this admin action is pre-authorized by role instead, so it looks the
// subscription up by id alone and feeds it through the identical `cancelWithoutProvider`/
// `recordCancellationReason`/synchronizer wiring.
const cancelSubscription = createCancelSubscription({
  subscriptions: {
    findByIdForUser: async (subscriptionId: string) => subscriptions.findById(subscriptionId),
    cancelWithoutProvider: subscriptions.markFailed,
    recordCancellationReason: subscriptions.recordCancellationReason,
  },
  provider: createMercadoPagoBillingProvider({ accessToken: env.MERCADOPAGO_ACCESS_TOKEN ?? "" }),
  synchronizer: subscriptionSynchronizer,
});

export async function adminCancelSubscriptionAction(_previousState: AdminActionState | null, formData: FormData): Promise<AdminActionState> {
  const subscriptionId = String(formData.get("subscriptionId") ?? "");
  const targetUserId = String(formData.get("targetUserId") ?? "");

  try {
    const admin = await requireAdminUser("billing.manage");
    const reason = requireReason(String(formData.get("reason") ?? ""));

    const before = await subscriptions.findById(subscriptionId);
    await cancelSubscription({ userId: before?.userId ?? "", subscriptionId, reason: { reasonCode: "ADMIN_CANCELLATION", reasonComment: reason } });
    const after = await subscriptions.findById(subscriptionId);

    await recordAuditEntry({
      actorUserId: admin.id,
      action: "ADMIN_CANCEL_SUBSCRIPTION",
      entityType: "billing_subscription",
      entityId: subscriptionId,
      targetUserId: targetUserId || before?.userId || null,
      beforeSnapshot: before ?? null,
      afterSnapshot: after ?? null,
      reason,
    });
  } catch (error) {
    return { ok: false, error: mapAdminActionError(error) };
  }

  revalidatePath("/admin/billing");
  revalidatePath(`/admin/users/${targetUserId}`);
  return { ok: true };
}
