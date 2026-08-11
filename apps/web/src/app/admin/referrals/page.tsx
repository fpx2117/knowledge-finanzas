import { hasPermission } from "@know-finanzas/shared";
import { requireAdminUser } from "@/lib/auth/require-admin-user";
import { referralRepository } from "@/lib/referrals/referral-service.instance";
import { AdminDataTable, type AdminDataTableColumn } from "@/features/admin/shared/admin-data-table";
import { AdminStatusBadge } from "@/features/admin/shared/admin-status-badge";
import { AdminActionDialog } from "@/features/admin/shared/admin-action-dialog";
import { adminInvalidateReferralAction, adminRetryReferralRewardAction } from "@/features/admin/referrals/actions/manage-referral";

type AdminReferralRow = Awaited<ReturnType<typeof referralRepository.listAllAttributionsForAdmin>>[number] & { id: string };

function formatDate(value: Date | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric" }).format(value);
}

function rewardLabel(reward: AdminReferralRow["reward"]): string {
  if (!reward) return "—";
  return reward.type === "AI_CREDITS" ? `${reward.value} créditos IA` : `${reward.value} días Pro`;
}

export default async function AdminReferralsPage() {
  const admin = await requireAdminUser("commercial.users.read");
  const canManage = hasPermission(admin.role, "referrals.invalidate");

  const rows = (await referralRepository.listAllAttributionsForAdmin()).map((row) => ({ ...row, id: row.attribution.id }));

  const columns: AdminDataTableColumn<AdminReferralRow>[] = [
    { key: "referrer", header: "Referente", render: (row) => row.referrerEmail },
    { key: "referred", header: "Referido", render: (row) => row.referredEmail },
    { key: "attributedAt", header: "Atribuido", render: (row) => formatDate(row.attribution.attributedAt) },
    { key: "status", header: "Estado", render: (row) => <AdminStatusBadge status={row.attribution.status} /> },
    { key: "convertedAt", header: "Convertido", render: (row) => formatDate(row.attribution.convertedAt) },
    { key: "reward", header: "Recompensa", render: (row) => rewardLabel(row.reward) },
    { key: "rewardStatus", header: "Estado recompensa", render: (row) => (row.reward ? <AdminStatusBadge status={row.reward.status} /> : "—") },
    {
      key: "actions",
      header: "",
      render: (row) => {
        if (!canManage) return null;
        return (
          <div className="header-actions">
            {row.attribution.status !== "INVALIDATED" && (
              <AdminActionDialog
                triggerLabel="Invalidar"
                confirmLabel="Invalidar referido"
                description="Marca esta atribución como inválida (fraude/abuso). No revierte recompensas ya otorgadas."
                action={adminInvalidateReferralAction}
                hiddenFields={{ attributionId: row.attribution.id }}
                withReason
                danger
              />
            )}
            {row.reward?.status === "FAILED" && (
              <AdminActionDialog
                triggerLabel="Reintentar recompensa"
                confirmLabel="Reintentar"
                description="Vuelve a intentar otorgar esta recompensa. Idempotente — nunca otorga dos veces."
                action={adminRetryReferralRewardAction}
                hiddenFields={{ rewardId: row.reward.id }}
              />
            )}
          </div>
        );
      },
    },
  ];

  return (
    <section>
      <p className="card-label">Referidos</p>
      <h2>Atribuciones y recompensas</h2>

      <div style={{ marginTop: 16 }}>
        <AdminDataTable columns={columns} rows={rows} emptyMessage="Sin referidos todavía." />
      </div>
    </section>
  );
}
