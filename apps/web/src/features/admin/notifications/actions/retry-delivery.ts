"use server";

import { revalidatePath } from "next/cache";

import { createNotificationDeliveryRepository, db } from "@know-finanzas/db";
import { requireAdminUser } from "@/lib/auth/require-admin-user";
import { retryDelivery } from "@/lib/admin/retry-delivery.instance";
import { recordAuditEntry } from "@/lib/admin/record-audit-entry.instance";
import { mapAdminActionError } from "../../lib/map-admin-error";
import type { AdminActionState } from "../../shared/admin-action-dialog";

const deliveries = createNotificationDeliveryRepository(db);

// Retries an existing, already-planned delivery only (Scope: "never a new logical
// notification") — no admin path exists anywhere to create a fresh notification/delivery row.
export async function adminRetryDeliveryAction(_previousState: AdminActionState | null, formData: FormData): Promise<AdminActionState> {
  const deliveryId = String(formData.get("deliveryId") ?? "");
  const targetUserId = String(formData.get("targetUserId") ?? "");

  try {
    const admin = await requireAdminUser("notifications.manage");
    const before = await deliveries.findById(deliveryId);
    const result = await retryDelivery(deliveryId);
    const after = await deliveries.findById(deliveryId);

    await recordAuditEntry({
      actorUserId: admin.id,
      action: "ADMIN_RETRY_DELIVERY",
      entityType: "notification_delivery",
      entityId: deliveryId,
      targetUserId,
      beforeSnapshot: before ?? null,
      afterSnapshot: after ?? null,
    });

    if (!result.sent) {
      return { ok: false, error: { code: result.errorCode, message: "El reintento de envío falló." } };
    }
  } catch (error) {
    return { ok: false, error: mapAdminActionError(error) };
  }

  revalidatePath(`/admin/users/${targetUserId}`);
  return { ok: true };
}
