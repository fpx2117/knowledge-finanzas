"use server";

import { revalidatePath } from "next/cache";

import { createBillingPaymentRepository, createBillingRefundRepository, db } from "@know-finanzas/db";
import { createMercadoPagoBillingProvider, createRequestRefund, type RefundReasonCode } from "@know-finanzas/billing";
import { requireReason } from "@know-finanzas/audit";
import { env } from "@know-finanzas/config";
import { requireAdminUser } from "@/lib/auth/require-admin-user";
import { recordAuditEntry } from "@/lib/admin/record-audit-entry.instance";
import { mapAdminActionError } from "../../lib/map-admin-error";
import type { AdminActionState } from "../../shared/admin-action-dialog";

const payments = createBillingPaymentRepository(db);
const refunds = createBillingRefundRepository(db);

// The exact same TASK-058 application service the domain layer already exposes — this action
// never talks to Mercado Pago directly (Domain Rule: "Refund = Billing Application Service").
const requestRefund = createRequestRefund({
  payments,
  refunds,
  provider: createMercadoPagoBillingProvider({ accessToken: env.MERCADOPAGO_ACCESS_TOKEN ?? "" }),
});

export async function adminRequestRefundAction(_previousState: AdminActionState | null, formData: FormData): Promise<AdminActionState> {
  const paymentId = String(formData.get("paymentId") ?? "");
  const targetUserId = String(formData.get("targetUserId") ?? "");
  const reasonCode = String(formData.get("reasonCode") ?? "") as RefundReasonCode;

  try {
    const admin = await requireAdminUser("billing.refund.execute");
    const reason = requireReason(String(formData.get("reason") ?? ""));

    const result = await requestRefund({
      actor: { userId: admin.id, isAdmin: true },
      paymentId,
      reason: reasonCode,
      // One idempotency key per admin click — a resubmit (double click, network retry) reuses
      // this key only if the form is resubmitted with the same generated value, which React's
      // key regeneration on remount already prevents in practice; the repository's own unique
      // constraint on this key is the real backstop either way.
      requestIdempotencyKey: `admin:${admin.id}:${paymentId}:${Date.now()}`,
    });

    await recordAuditEntry({
      actorUserId: admin.id,
      action: "ADMIN_REQUEST_REFUND",
      entityType: "billing_refund",
      entityId: result.refund.id,
      targetUserId: targetUserId || null,
      beforeSnapshot: { paymentId, status: "APPROVED" },
      afterSnapshot: { refundId: result.refund.id, status: result.refund.status },
      reason,
    });

    if (result.refund.status === "FAILED") {
      return { ok: false, error: { code: "BILLING_REFUND_FAILED", message: `El reembolso falló: ${result.refund.failureReason ?? "motivo desconocido"}.` } };
    }
  } catch (error) {
    return { ok: false, error: mapAdminActionError(error) };
  }

  revalidatePath("/admin/billing");
  revalidatePath(`/admin/users/${targetUserId}`);
  return { ok: true };
}
