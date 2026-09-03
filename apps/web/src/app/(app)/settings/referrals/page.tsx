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
      <div className="mb-7 flex gap-2 text-sm text-muted-foreground"><span>Configuración</span><span aria-hidden="true">/</span><span>Referidos</span></div>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Invitá y ganá</p>
          <h1>Referidos</h1>
          <p className="mt-4 max-w-[490px] text-body-lg leading-relaxed text-muted-foreground">
            Compartí tu enlace. Cuando alguien se registra con él y activa Pro, recibís {rewardLabel(summary.rewardPolicy.nonPaidType, summary.rewardPolicy.nonPaidValue)}
            {" "}(o {rewardLabel(summary.rewardPolicy.paidType, summary.rewardPolicy.paidValue)} si ya sos Pro).
          </p>
        </div>
      </header>

      <ReferralLinkCard shareUrl={shareUrl} />

      <div className="metric-grid" style={{ marginTop: 16 }}>
        <article className="rounded-lg border border-border bg-card p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Registros</p>
          <p className="metric-value">{summary.totalSignups}</p>
        </article>
        <article className="rounded-lg border border-border bg-card p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Convertidos a Pro</p>
          <p className="metric-value">{summary.totalConverted}</p>
        </article>
        <article className="rounded-lg border border-border bg-card p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recompensas recibidas</p>
          <p className="metric-value">{summary.totalRewardsGranted}</p>
        </article>
      </div>

      <div style={{ marginTop: 16 }}>
        <ReferralInvitationsList invitations={summary.invitations} />
      </div>
    </>
  );
}
