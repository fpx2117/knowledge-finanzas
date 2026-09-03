import Link from "next/link";

import { hasPermission } from "@know-finanzas/shared";
import { requireAdminUser } from "@/lib/auth/require-admin-user";
import { promotionService } from "@/lib/admin/promotion-service.instance";
import { CreatePromotionCodeForm } from "@/features/admin/promotions/components/create-promotion-code-form";
import { AdminDataTable, type AdminDataTableColumn } from "@/features/admin/shared/admin-data-table";

type PromotionCode = Awaited<ReturnType<typeof promotionService.listPromotions>>[number];

export default async function AdminPromotionsPage() {
  const admin = await requireAdminUser("commercial.users.read");
  const canManage = hasPermission(admin.role, "promotions.manage");
  const codes = await promotionService.listPromotions();

  const columns: AdminDataTableColumn<PromotionCode>[] = [
    { key: "normalizedCode", header: "Código", render: (code) => code.normalizedCode },
    { key: "name", header: "Nombre", render: (code) => code.name },
    { key: "status", header: "Estado", render: (code) => code.status },
    { key: "durationValue", header: "Duración", render: (code) => `${code.durationValue} días` },
    { key: "redemptionCount", header: "Redenciones", render: (code) => `${code.redemptionCount}${code.maxRedemptions !== null ? ` / ${code.maxRedemptions}` : ""}` },
    { key: "actions", header: "", render: (code) => <Link href={`/admin/promotions/${code.id}`}>Gestionar</Link> },
  ];

  return (
    <section>
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Promociones</p>
      <h2>Códigos promocionales</h2>

      <div className="mt-4">
        <AdminDataTable caption="Códigos promocionales" columns={columns} rows={codes} emptyMessage="Sin códigos." />
      </div>

      {canManage && <CreatePromotionCodeForm />}
    </section>
  );
}
