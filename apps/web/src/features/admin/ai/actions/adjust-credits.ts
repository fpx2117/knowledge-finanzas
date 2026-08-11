"use server";

import { revalidatePath } from "next/cache";

import { requireReason } from "@know-finanzas/audit";
import { requireAdminUser } from "@/lib/auth/require-admin-user";
import { adminAdjustCredits } from "@/lib/admin/admin-adjust-credits.instance";
import { recordAuditEntry } from "@/lib/admin/record-audit-entry.instance";
import { mapAdminActionError } from "../../lib/map-admin-error";
import type { AdminActionState } from "../../shared/admin-action-dialog";

const POOLS = new Set(["TRIAL_ALLOWANCE", "PLAN_ALLOWANCE", "PURCHASED"]);

// Domain Rule: "AI Adjustment = Ledger Entry" — never a direct balance mutation; the
// negative-balance guard lives inside adminAdjustCredits' own repository call.
export async function adminAdjustCreditsAction(_previousState: AdminActionState | null, formData: FormData): Promise<AdminActionState> {
  const targetUserId = String(formData.get("targetUserId") ?? "");
  const pool = String(formData.get("pool") ?? "");
  const direction = String(formData.get("direction") ?? "");
  const amount = Number(formData.get("amount") ?? 0);

  try {
    const admin = await requireAdminUser("ai.adjust");
    const reason = requireReason(String(formData.get("reason") ?? ""));

    if (!POOLS.has(pool)) return { ok: false, error: { code: "INVALID_INPUT", message: "Seleccioná un pool válido." } };
    if (direction !== "CREDIT" && direction !== "DEBIT") return { ok: false, error: { code: "INVALID_INPUT", message: "Seleccioná una dirección válida." } };
    if (!Number.isInteger(amount) || amount <= 0) return { ok: false, error: { code: "INVALID_INPUT", message: "Ingresá una cantidad entera mayor a cero." } };

    const result = await adminAdjustCredits({
      userId: targetUserId,
      pool: pool as "TRIAL_ALLOWANCE" | "PLAN_ALLOWANCE" | "PURCHASED",
      amount,
      direction,
      reason,
      adminUserId: admin.id,
    });

    await recordAuditEntry({
      actorUserId: admin.id,
      action: "ADMIN_ADJUST_AI_CREDITS",
      entityType: "ai_credit_entry",
      entityId: result.ok ? result.entryId : null,
      targetUserId,
      beforeSnapshot: { pool, direction, amount },
      afterSnapshot: result,
      reason,
    });

    if (!result.ok) {
      return { ok: false, error: { code: "AI_CREDITS_EXHAUSTED", message: `Este ajuste dejaría el saldo negativo (disponible: ${result.available}).` } };
    }
  } catch (error) {
    return { ok: false, error: mapAdminActionError(error) };
  }

  revalidatePath(`/admin/users/${targetUserId}`);
  return { ok: true };
}
