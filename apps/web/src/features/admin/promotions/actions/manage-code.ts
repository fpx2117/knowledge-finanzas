"use server";

import { revalidatePath } from "next/cache";

import { requireAdminUser } from "@/lib/auth/require-admin-user";
import { promotionService } from "@/lib/admin/promotion-service.instance";
import { recordAuditEntry } from "@/lib/admin/record-audit-entry.instance";
import { mapAdminActionError } from "../../lib/map-admin-error";
import type { AdminActionState } from "../../shared/admin-action-dialog";

export async function adminCreatePromotionCodeAction(_previousState: AdminActionState | null, formData: FormData): Promise<AdminActionState> {
  try {
    const admin = await requireAdminUser("promotions.manage");
    const code = String(formData.get("code") ?? "");
    const name = String(formData.get("name") ?? "");
    const durationValue = Number(formData.get("durationValue") ?? 0);
    const maxRedemptionsRaw = String(formData.get("maxRedemptions") ?? "").trim();
    const aiCreditsPerPeriod = Number(formData.get("aiCreditsPerPeriod") ?? 0);
    const whatsappMessagesPerPeriod = Number(formData.get("whatsappMessagesPerPeriod") ?? 0);

    const created = await promotionService.createCode({
      code,
      name,
      durationValue,
      maxRedemptions: maxRedemptionsRaw ? Number(maxRedemptionsRaw) : null,
      aiCreditsPerPeriod,
      whatsappMessagesPerPeriod,
      createdBy: admin.id,
    });

    await recordAuditEntry({
      actorUserId: admin.id,
      action: "ADMIN_CREATE_PROMOTION_CODE",
      entityType: "promotion_code",
      entityId: created.id,
      beforeSnapshot: null,
      afterSnapshot: created,
    });
  } catch (error) {
    return { ok: false, error: mapAdminActionError(error) };
  }

  revalidatePath("/admin/promotions");
  return { ok: true };
}

async function transitionCodeAction(codeId: string, adminUserId: string, transition: (id: string) => Promise<unknown>, action: string) {
  const before = await promotionService.getPromotion(codeId);
  const after = await transition(codeId);
  await recordAuditEntry({ actorUserId: adminUserId, action, entityType: "promotion_code", entityId: codeId, beforeSnapshot: before, afterSnapshot: after });
}

export async function adminActivatePromotionCodeAction(_previousState: AdminActionState | null, formData: FormData): Promise<AdminActionState> {
  const codeId = String(formData.get("codeId") ?? "");
  try {
    const admin = await requireAdminUser("promotions.manage");
    await transitionCodeAction(codeId, admin.id, promotionService.activateCode, "ADMIN_ACTIVATE_PROMOTION_CODE");
  } catch (error) {
    return { ok: false, error: mapAdminActionError(error) };
  }
  revalidatePath("/admin/promotions");
  return { ok: true };
}

export async function adminPausePromotionCodeAction(_previousState: AdminActionState | null, formData: FormData): Promise<AdminActionState> {
  const codeId = String(formData.get("codeId") ?? "");
  try {
    const admin = await requireAdminUser("promotions.manage");
    await transitionCodeAction(codeId, admin.id, promotionService.pauseCode, "ADMIN_PAUSE_PROMOTION_CODE");
  } catch (error) {
    return { ok: false, error: mapAdminActionError(error) };
  }
  revalidatePath("/admin/promotions");
  return { ok: true };
}

export async function adminRevokePromotionCodeAction(_previousState: AdminActionState | null, formData: FormData): Promise<AdminActionState> {
  const codeId = String(formData.get("codeId") ?? "");
  try {
    const admin = await requireAdminUser("promotions.manage");
    await transitionCodeAction(codeId, admin.id, promotionService.revokeCode, "ADMIN_REVOKE_PROMOTION_CODE");
  } catch (error) {
    return { ok: false, error: mapAdminActionError(error) };
  }
  revalidatePath("/admin/promotions");
  return { ok: true };
}
