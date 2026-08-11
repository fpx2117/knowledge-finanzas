import { notFound } from "next/navigation";

import { isPromotionError } from "@know-finanzas/promotions";
import { hasPermission } from "@know-finanzas/shared";
import { requireAdminUser } from "@/lib/auth/require-admin-user";
import { promotionService } from "@/lib/admin/promotion-service.instance";
import { AdminActionDialog } from "@/features/admin/shared/admin-action-dialog";
import { adminActivatePromotionCodeAction, adminPausePromotionCodeAction, adminRevokePromotionCodeAction } from "@/features/admin/promotions/actions/manage-code";

export default async function AdminPromotionCodePage({ params }: { params: Promise<{ codeId: string }> }) {
  const admin = await requireAdminUser("commercial.users.read");
  const canManage = hasPermission(admin.role, "promotions.manage");
  const { codeId } = await params;

  let code;
  try {
    code = await promotionService.getPromotion(codeId);
  } catch (error) {
    if (isPromotionError(error) && error.code === "PROMOTION_NOT_FOUND") notFound();
    throw error;
  }

  return (
    <section>
      <p className="card-label">Código promocional</p>
      <h2>{code.normalizedCode}</h2>
      <p className="card-helper">{code.name} · Estado: {code.status}</p>

      <div className="admin-summary-grid" style={{ marginTop: 24 }}>
        <article className="detail-card"><p className="card-label">Duración</p><p className="detail-value">{code.durationValue} días</p></article>
        <article className="detail-card"><p className="card-label">Redenciones</p><p className="detail-value">{code.redemptionCount}{code.maxRedemptions !== null ? ` / ${code.maxRedemptions}` : " (ilimitado)"}</p></article>
        <article className="detail-card"><p className="card-label">Máximo por usuario</p><p className="detail-value">{code.maxRedemptionsPerUser}</p></article>
        <article className="detail-card"><p className="card-label">Créditos IA / WhatsApp por período</p><p className="detail-value">{code.aiCreditsPerPeriod} / {code.whatsappMessagesPerPeriod}</p></article>
      </div>

      {canManage && (
        <div className="header-actions" style={{ marginTop: 24 }}>
          {code.status !== "ACTIVE" && (
            <AdminActionDialog triggerLabel="Activar" confirmLabel="Activar código" description="Activa este código para redención." action={adminActivatePromotionCodeAction} hiddenFields={{ codeId }} />
          )}
          {code.status === "ACTIVE" && (
            <AdminActionDialog triggerLabel="Pausar" confirmLabel="Pausar código" description="Pausa temporalmente la redención de este código." action={adminPausePromotionCodeAction} hiddenFields={{ codeId }} />
          )}
          {code.status !== "REVOKED" && (
            <AdminActionDialog triggerLabel="Revocar" confirmLabel="Revocar código" description="Revoca este código de forma permanente. No afecta accesos ya otorgados." action={adminRevokePromotionCodeAction} hiddenFields={{ codeId }} danger />
          )}
        </div>
      )}
    </section>
  );
}
