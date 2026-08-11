import { env } from "@know-finanzas/config";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { getReferralSummary } from "@/features/referrals/queries/get-referral-summary.instance";
import { ReferralLinkCard } from "@/features/referrals/components/referral-link-card";
import { ReferralInvitationsList } from "@/features/referrals/components/referral-invitations-list";

function rewardLabel(type: "PROMOTIONAL_PRO_DAYS" | "AI_CREDITS", value: number): string {
  return type === "AI_CREDITS" ? `${value} créditos de IA` : `${value} días de Pro`;
}

export default async function ReferralsSettingsPage() {
  const user = await requireCurrentUser();
  const summary = await getReferralSummary(user.id);
  const shareUrl = `${env.BETTER_AUTH_URL}/?ref=${summary.code}`;

  return (
    <>
      <div className="settings-kicker"><span>Configuración</span><span aria-hidden="true">/</span><span>Referidos</span></div>
      <header className="page-header">
        <div>
          <p className="eyebrow">Invitá y ganá</p>
          <h1>Referidos</h1>
          <p className="lede">
            Compartí tu enlace. Cuando alguien se registra con él y activa Pro, recibís {rewardLabel(summary.rewardPolicy.nonPaidType, summary.rewardPolicy.nonPaidValue)}
            {" "}(o {rewardLabel(summary.rewardPolicy.paidType, summary.rewardPolicy.paidValue)} si ya sos Pro).
          </p>
        </div>
      </header>

      <ReferralLinkCard shareUrl={shareUrl} />

      <div className="metric-grid" style={{ marginTop: 16 }}>
        <article className="metric-card">
          <p className="card-label">Registros</p>
          <p className="metric-value">{summary.totalSignups}</p>
        </article>
        <article className="metric-card">
          <p className="card-label">Convertidos a Pro</p>
          <p className="metric-value">{summary.totalConverted}</p>
        </article>
        <article className="metric-card">
          <p className="card-label">Recompensas recibidas</p>
          <p className="metric-value">{summary.totalRewardsGranted}</p>
        </article>
      </div>

      <div style={{ marginTop: 16 }}>
        <ReferralInvitationsList invitations={summary.invitations} />
      </div>
    </>
  );
}
