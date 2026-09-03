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
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Código promocional</p>
      <h2>{code.normalizedCode}</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{code.name} · Estado: {code.status}</p>

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]" style={{ marginTop: 24 }}>
        <article className="rounded-lg border border-border bg-card p-6"><p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Duración</p><p className="text-2xl tracking-tight">{code.durationValue} días</p></article>
        <article className="rounded-lg border border-border bg-card p-6"><p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Redenciones</p><p className="text-2xl tracking-tight">{code.redemptionCount}{code.maxRedemptions !== null ? ` / ${code.maxRedemptions}` : " (ilimitado)"}</p></article>
        <article className="rounded-lg border border-border bg-card p-6"><p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Máximo por usuario</p><p className="text-2xl tracking-tight">{code.maxRedemptionsPerUser}</p></article>
        <article className="rounded-lg border border-border bg-card p-6"><p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Créditos IA / WhatsApp por período</p><p className="text-2xl tracking-tight">{code.aiCreditsPerPeriod} / {code.whatsappMessagesPerPeriod}</p></article>
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
