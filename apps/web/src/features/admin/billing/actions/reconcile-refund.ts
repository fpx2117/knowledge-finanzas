"use server";

import { revalidatePath } from "next/cache";

import { createBillingPaymentRepository, createBillingRefundRepository, db } from "@know-finanzas/db";
import { createMercadoPagoBillingProvider, createReconcileRefund } from "@know-finanzas/billing";
import { env } from "@know-finanzas/config";
import { requireAdminUser } from "@/lib/auth/require-admin-user";
import { recordAuditEntry } from "@/lib/admin/record-audit-entry.instance";
import { mapAdminActionError } from "../../lib/map-admin-error";
import type { AdminActionState } from "../../shared/admin-action-dialog";

const refunds = createBillingRefundRepository(db);

const reconcileRefund = createReconcileRefund({
  refunds,
  payments: createBillingPaymentRepository(db),
  provider: createMercadoPagoBillingProvider({ accessToken: env.MERCADOPAGO_ACCESS_TOKEN ?? "" }),
});

// Sweeps every PENDING refund (never a single-refund manual status pick — Domain Rule).
export async function adminReconcileRefundsAction(): Promise<AdminActionState> {
  try {
    const admin = await requireAdminUser("billing.manage");
    const result = await reconcileRefund();

    await recordAuditEntry({
      actorUserId: admin.id,
      action: "ADMIN_RECONCILE_REFUNDS",
      entityType: "billing_refund",
      entityId: null,
      beforeSnapshot: null,
      afterSnapshot: result,
    });
  } catch (error) {
    return { ok: false, error: mapAdminActionError(error) };
  }

  revalidatePath("/admin/billing/reconciliation");
  return { ok: true };
}
