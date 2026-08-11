import Link from "next/link";

import { hasPermission } from "@know-finanzas/shared";
import { requireAdminUser } from "@/lib/auth/require-admin-user";
import { promotionService } from "@/lib/admin/promotion-service.instance";
import { CreatePromotionCodeForm } from "@/features/admin/promotions/components/create-promotion-code-form";

export default async function AdminPromotionsPage() {
  const admin = await requireAdminUser("commercial.users.read");
  const canManage = hasPermission(admin.role, "promotions.manage");
  const codes = await promotionService.listPromotions();

  return (
    <section>
      <p className="card-label">Promociones</p>
      <h2>Códigos promocionales</h2>

      <table className="admin-table" style={{ marginTop: 16 }}>
        <thead><tr><th>Código</th><th>Nombre</th><th>Estado</th><th>Duración</th><th>Redenciones</th><th /></tr></thead>
        <tbody>
          {codes.length === 0 && <tr><td colSpan={6}>Sin códigos.</td></tr>}
          {codes.map((code) => (
            <tr key={code.id}>
              <td>{code.normalizedCode}</td>
              <td>{code.name}</td>
              <td>{code.status}</td>
              <td>{code.durationValue} días</td>
              <td>{code.redemptionCount}{code.maxRedemptions !== null ? ` / ${code.maxRedemptions}` : ""}</td>
              <td><Link href={`/admin/promotions/${code.id}`}>Gestionar</Link></td>
            </tr>
          ))}
        </tbody>
      </table>

      {canManage && <CreatePromotionCodeForm />}
    </section>
  );
}
