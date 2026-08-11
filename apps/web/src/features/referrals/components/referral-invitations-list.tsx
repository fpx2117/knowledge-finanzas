import type { ReferralSummaryInvitation } from "../queries/get-referral-summary";

// Ordinal only ("Invitación N") — never the referred user's name/email (Security Requirement:
// "never exposes the referred user's email or financial data").
const STATUS_LABEL: Record<ReferralSummaryInvitation["status"], string> = {
  REGISTERED: "Registrada",
  CONVERTED_REWARD_PENDING: "Pro activado — recompensa en camino",
  CONVERTED_REWARDED: "Pro activado — recompensa recibida",
  INVALIDATED: "No válida",
};

export function ReferralInvitationsList({ invitations }: { invitations: ReferralSummaryInvitation[] }) {
  if (invitations.length === 0) {
    return (
      <section className="detail-card" role="status">
        <p className="card-label">Invitaciones</p>
        <p className="card-helper">Todavía no invitaste a nadie. Compartí tu enlace para empezar.</p>
      </section>
    );
  }

  return (
    <section className="detail-card">
      <p className="card-label">Invitaciones</p>
      <div className="transaction-list">
        {invitations.map((invitation) => (
          <div className="transaction-row" key={invitation.id}>
            <div><strong>Invitación {invitation.sequence}</strong></div>
            <span>{STATUS_LABEL[invitation.status]}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
