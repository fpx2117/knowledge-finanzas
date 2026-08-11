"use server";

import { revalidatePath } from "next/cache";

import { requireReason } from "@know-finanzas/audit";
import { createUserRepository, db } from "@know-finanzas/db";
import { requireAdminUser } from "@/lib/auth/require-admin-user";
import { invalidateReferral, referralRepository, retryReferralReward } from "@/lib/referrals/referral-service.instance";
import { recordAuditEntry } from "@/lib/admin/record-audit-entry.instance";
import { notifyReferralRewardGranted } from "@/lib/notifications/notify-referral-reward-granted";
import { mapAdminActionError } from "../../lib/map-admin-error";
import type { AdminActionState } from "../../shared/admin-action-dialog";

const users = createUserRepository(db);

// referrals.invalidate is currently the only referrals-write permission (ADMIN/SUPER_ADMIN only,
// SUPPORT excluded — Security Requirement: "SUPPORT cannot invalidate/retry rewards"); it gates
// both write actions on this surface.
export async function adminInvalidateReferralAction(_previousState: AdminActionState | null, formData: FormData): Promise<AdminActionState> {
  const attributionId = String(formData.get("attributionId") ?? "");

  try {
    const admin = await requireAdminUser("referrals.invalidate");
    const reason = requireReason(String(formData.get("reason") ?? ""));

    const invalidated = await invalidateReferral({ attributionId, actor: { userId: admin.id, isAdmin: true }, reason });

    await recordAuditEntry({
      actorUserId: admin.id,
      action: "ADMIN_INVALIDATE_REFERRAL",
      entityType: "referral_attribution",
      entityId: attributionId,
      targetUserId: invalidated.referredUserId,
      beforeSnapshot: null,
      afterSnapshot: invalidated,
      reason,
    });
  } catch (error) {
    return { ok: false, error: mapAdminActionError(error) };
  }

  revalidatePath("/admin/referrals");
  return { ok: true };
}

// Idempotent — retryReferralReward (packages/referrals) only re-attempts a currently FAILED
// reward and returns an already-GRANTED one unchanged (task's Property/Invariant: "retry of an
// already-granted reward never grants a second reward").
export async function adminRetryReferralRewardAction(_previousState: AdminActionState | null, formData: FormData): Promise<AdminActionState> {
  const rewardId = String(formData.get("rewardId") ?? "");

  try {
    const admin = await requireAdminUser("referrals.invalidate");

    const before = await referralRepository.findRewardById(rewardId);
    const retried = await retryReferralReward({ rewardId, actor: { userId: admin.id, isAdmin: true } });

    await recordAuditEntry({
      actorUserId: admin.id,
      action: "ADMIN_RETRY_REFERRAL_REWARD",
      entityType: "referral_reward",
      entityId: rewardId,
      targetUserId: retried.beneficiaryUserId,
      beforeSnapshot: before ?? null,
      afterSnapshot: retried,
      reason: `retry outcome: ${retried.status}`,
    });

    if (retried.status === "GRANTED") {
      const timezone = await users.findTimezoneById(retried.beneficiaryUserId);
      await notifyReferralRewardGranted({
        beneficiaryUserId: retried.beneficiaryUserId,
        beneficiaryTimezone: timezone ?? "UTC",
        reward: { id: retried.id, type: retried.type, value: retried.value },
      });
    } else {
      return { ok: false, error: { code: "REFERRAL_REWARD_RETRY_FAILED", message: "El reintento falló nuevamente. El motivo quedó registrado para revisión." } };
    }
  } catch (error) {
    return { ok: false, error: mapAdminActionError(error) };
  }

  revalidatePath("/admin/referrals");
  return { ok: true };
}
