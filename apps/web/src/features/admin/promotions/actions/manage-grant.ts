"use server";

import { revalidatePath } from "next/cache";

import { requireReason } from "@know-finanzas/audit";
import { requireAdminUser } from "@/lib/auth/require-admin-user";
import { grantPromotionalProAccess, promotionService } from "@/lib/admin/promotion-service.instance";
import { recordAuditEntry } from "@/lib/admin/record-audit-entry.instance";
import { mapAdminActionError } from "../../lib/map-admin-error";
import type { AdminActionState } from "../../shared/admin-action-dialog";

// Domain Rule: "Manual Pro = Promotional Grant" — always a promotional_access_grants row via
// @know-finanzas/promotions, never a fake billing subscription.
export async function adminGrantPromotionalAccessAction(_previousState: AdminActionState | null, formData: FormData): Promise<AdminActionState> {
  const targetUserId = String(formData.get("targetUserId") ?? "");
  const durationDays = Number(formData.get("durationDays") ?? 0);

  try {
    const admin = await requireAdminUser("promotions.manage");
    const reason = requireReason(String(formData.get("reason") ?? ""));

    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const result = await grantPromotionalProAccess({ userId: targetUserId, source: "ADMIN_OVERRIDE", startsAt, endsAt });

    await recordAuditEntry({
      actorUserId: admin.id,
      action: "ADMIN_GRANT_PROMOTIONAL_ACCESS",
      entityType: "promotional_access_grant",
      entityId: "grant" in result ? result.grant.id : null,
      targetUserId,
      beforeSnapshot: null,
      afterSnapshot: result,
      reason,
    });

    if ("alreadyActive" in result) {
      return { ok: false, error: { code: "PROMOTION_ALREADY_ACTIVE", message: "Este usuario ya tiene un acceso promocional activo." } };
    }
  } catch (error) {
    return { ok: false, error: mapAdminActionError(error) };
  }

  revalidatePath(`/admin/users/${targetUserId}`);
  return { ok: true };
}

export async function adminExtendGrantAction(_previousState: AdminActionState | null, formData: FormData): Promise<AdminActionState> {
  const grantId = String(formData.get("grantId") ?? "");
  const targetUserId = String(formData.get("targetUserId") ?? "");
  const newEndsAt = String(formData.get("newEndsAt") ?? "");

  try {
    const admin = await requireAdminUser("promotions.manage");
    const reason = requireReason(String(formData.get("reason") ?? ""));

    const extended = await promotionService.extendGrant(grantId, { endsAt: new Date(newEndsAt) });

    await recordAuditEntry({
      actorUserId: admin.id,
      action: "ADMIN_EXTEND_PROMOTIONAL_GRANT",
      entityType: "promotional_access_grant",
      entityId: grantId,
      targetUserId,
      beforeSnapshot: null,
      afterSnapshot: extended,
      reason,
    });
  } catch (error) {
    return { ok: false, error: mapAdminActionError(error) };
  }

  revalidatePath(`/admin/users/${targetUserId}`);
  return { ok: true };
}

export async function adminRevokeGrantAction(_previousState: AdminActionState | null, formData: FormData): Promise<AdminActionState> {
  const grantId = String(formData.get("grantId") ?? "");
  const targetUserId = String(formData.get("targetUserId") ?? "");

  try {
    const admin = await requireAdminUser("promotions.manage");
    const reason = requireReason(String(formData.get("reason") ?? ""));

    const revoked = await promotionService.revokeGrant(grantId, { revokedBy: admin.id, revocationReason: reason });

    await recordAuditEntry({
      actorUserId: admin.id,
      action: "ADMIN_REVOKE_PROMOTIONAL_GRANT",
      entityType: "promotional_access_grant",
      entityId: grantId,
      targetUserId,
      beforeSnapshot: null,
      afterSnapshot: revoked,
      reason,
    });
  } catch (error) {
    return { ok: false, error: mapAdminActionError(error) };
  }

  revalidatePath(`/admin/users/${targetUserId}`);
  return { ok: true };
}
