import { notFound } from "next/navigation";

import { createNotificationDeliveryRepository, db } from "@know-finanzas/db";
import { hasPermission, isApplicationError } from "@know-finanzas/shared";
import { requireAdminUser } from "@/lib/auth/require-admin-user";
import { getAdminCommercialUserSummary } from "@/lib/admin/get-admin-commercial-user-summary.instance";
import { AdminActionDialog } from "@/features/admin/shared/admin-action-dialog";
import { adminAdjustCreditsAction } from "@/features/admin/ai/actions/adjust-credits";
import { adminCancelSubscriptionAction } from "@/features/admin/billing/actions/cancel-subscription";
import { adminRequestRefundAction } from "@/features/admin/billing/actions/request-refund";
import { adminRetryDeliveryAction } from "@/features/admin/notifications/actions/retry-delivery";
import { adminGrantPromotionalAccessAction, adminRevokeGrantAction } from "@/features/admin/promotions/actions/manage-grant";

const deliveries = createNotificationDeliveryRepository(db);

export default async function AdminUserSummaryPage({ params }: { params: Promise<{ userId: string }> }) {
  const admin = await requireAdminUser("commercial.users.read");
  const { userId } = await params;

  let summary;
  try {
    summary = await getAdminCommercialUserSummary(userId);
  } catch (error) {
    if (isApplicationError(error) && error.code === "ADMIN_TARGET_USER_NOT_FOUND") notFound();
    throw error;
  }

  const deliveryHistory = await deliveries.listForUser(userId, 20);
  const canManageBilling = hasPermission(admin.role, "billing.manage");
  const canRefund = hasPermission(admin.role, "billing.refund.execute");
  const canAdjustAI = hasPermission(admin.role, "ai.adjust");
  const canManagePromotions = hasPermission(admin.role, "promotions.manage");
  const canManageNotifications = hasPermission(admin.role, "notifications.manage");

  return (
    <section>
      <p className="card-label">Resumen comercial</p>
      <h2>{summary.user.name}</h2>
      <p className="card-helper">{summary.user.email} · Cuenta creada el {formatDate(summary.user.createdAt)}</p>

      <div className="admin-summary-grid" style={{ marginTop: 24 }}>
        <article className="detail-card">
          <p className="card-label">Acceso efectivo</p>
          <p className="detail-value">{summary.access.resolvedState}</p>
          <p className="card-helper">Origen: {ACCESS_SOURCE_LABEL[summary.access.source]}</p>
        </article>

        <article className="detail-card">
          <p className="card-label">Prueba gratuita</p>
          {summary.trial ? (
            <p className="metric-value">{summary.trial.endsAt ? formatDate(summary.trial.endsAt) : "Sin fecha"}</p>
          ) : (
            <p className="metric-value">Sin datos</p>
          )}
        </article>

        <article className="detail-card">
          <p className="card-label">Suscripción</p>
          {summary.subscription ? (
            <>
              <p className="metric-value">{summary.subscription.status}</p>
              {summary.subscription.currentPeriodEnd && <p className="card-helper">Vence el {formatDate(summary.subscription.currentPeriodEnd)}</p>}
              {canManageBilling && ["ACTIVE", "PAST_DUE"].includes(summary.subscription.status) && (
                <AdminActionDialog
                  triggerLabel="Cancelar suscripción"
                  confirmLabel="Confirmar cancelación"
                  description="Cancela la suscripción de inmediato usando el mismo servicio que el flujo del usuario. Requiere un motivo."
                  action={adminCancelSubscriptionAction}
                  hiddenFields={{ subscriptionId: summary.subscription.id, targetUserId: userId }}
                  withReason
                  danger
                />
              )}
            </>
          ) : (
            <p className="metric-value">Sin suscripción</p>
          )}
        </article>

        <article className="detail-card">
          <p className="card-label">Promoción activa</p>
          {summary.promotion ? (
            <>
              <p className="metric-value">Hasta {formatDate(summary.promotion.endsAt)}</p>
              <p className="card-helper">Origen: {summary.promotion.source}</p>
              {canManagePromotions && (
                <AdminActionDialog
                  triggerLabel="Revocar acceso promocional"
                  confirmLabel="Confirmar revocación"
                  description="Revoca el acceso Pro promocional de este usuario de inmediato. Requiere un motivo."
                  action={adminRevokeGrantAction}
                  hiddenFields={{ grantId: summary.promotion.grantId, targetUserId: userId }}
                  withReason
                  danger
                />
              )}
            </>
          ) : (
            <>
              <p className="metric-value">Ninguna</p>
              {canManagePromotions && (
                <AdminActionDialog
                  triggerLabel="Otorgar Pro promocional"
                  confirmLabel="Otorgar acceso"
                  description="Crea un acceso Pro promocional manual (promotional_access_grants), nunca una suscripción falsa. Requiere un motivo."
                  action={adminGrantPromotionalAccessAction}
                  hiddenFields={{ targetUserId: userId }}
                  withReason
                  extraFields={(
                    <div className="field-group">
                      <label htmlFor="grant-duration">Duración (días)</label>
                      <input id="grant-duration" name="durationDays" type="number" min={1} defaultValue={30} required />
                    </div>
                  )}
                />
              )}
            </>
          )}
        </article>

        <article className="detail-card">
          <p className="card-label">Créditos de IA disponibles</p>
          <ul>
            {Object.entries(summary.aiCreditBalances).map(([pool, balance]) => (
              <li key={pool}>{pool}: {balance}</li>
            ))}
          </ul>
          {canAdjustAI && (
            <AdminActionDialog
              triggerLabel="Ajustar créditos"
              confirmLabel="Aplicar ajuste"
              description="Todo ajuste crea una entrada en el ledger (nunca modifica el saldo directamente). Requiere un motivo."
              action={adminAdjustCreditsAction}
              hiddenFields={{ targetUserId: userId }}
              withReason
              extraFields={(
                <>
                  <div className="field-group">
                    <label htmlFor="adjust-pool">Pool</label>
                    <select id="adjust-pool" name="pool" defaultValue="PLAN_ALLOWANCE">
                      <option value="TRIAL_ALLOWANCE">TRIAL_ALLOWANCE</option>
                      <option value="PLAN_ALLOWANCE">PLAN_ALLOWANCE</option>
                      <option value="PURCHASED">PURCHASED</option>
                    </select>
                  </div>
                  <div className="field-group">
                    <label htmlFor="adjust-direction">Dirección</label>
                    <select id="adjust-direction" name="direction" defaultValue="CREDIT">
                      <option value="CREDIT">Agregar</option>
                      <option value="DEBIT">Quitar</option>
                    </select>
                  </div>
                  <div className="field-group">
                    <label htmlFor="adjust-amount">Cantidad</label>
                    <input id="adjust-amount" name="amount" type="number" min={1} step={1} required />
                  </div>
                </>
              )}
            />
          )}
        </article>

        <article className="detail-card">
          <p className="card-label">WhatsApp (últimos 30 días)</p>
          <p className="metric-value">{summary.whatsappMessagesLast30Days} mensajes</p>
        </article>

        <article className="detail-card">
          <p className="card-label">Último pago</p>
          {summary.latestPayment ? (
            <>
              <p className="metric-value">{summary.latestPayment.status} — {summary.latestPayment.grossAmount} {summary.latestPayment.currencyCode}</p>
              <p className="card-helper">{formatDate(summary.latestPayment.paidAt ?? summary.latestPayment.createdAt)}</p>
              {canRefund && summary.latestPayment.status === "APPROVED" && !summary.latestRefund && (
                <AdminActionDialog
                  triggerLabel="Solicitar reembolso"
                  confirmLabel="Confirmar reembolso"
                  description="Llama a RequestRefund (nunca habla con Mercado Pago directamente). Requiere motivo y categoría."
                  action={adminRequestRefundAction}
                  hiddenFields={{ paymentId: summary.latestPayment.id, targetUserId: userId }}
                  withReason
                  extraFields={(
                    <div className="field-group">
                      <label htmlFor="refund-reason-code">Categoría</label>
                      <select id="refund-reason-code" name="reasonCode" defaultValue="DUPLICATE_CHARGE">
                        <option value="DUPLICATE_CHARGE">Cargo duplicado</option>
                        <option value="SERVICE_FAILURE">Falla de servicio</option>
                        <option value="FULL_SUBSCRIPTION_REVERSAL">Reversión completa</option>
                      </select>
                    </div>
                  )}
                />
              )}
            </>
          ) : (
            <p className="metric-value">Sin pagos</p>
          )}
        </article>

        <article className="detail-card">
          <p className="card-label">Estado de reembolso</p>
          {summary.latestRefund ? (
            <p className="metric-value">{summary.latestRefund.status} — {summary.latestRefund.amount}</p>
          ) : (
            <p className="metric-value">Sin reembolsos</p>
          )}
        </article>
      </div>

      <section className="detail-card" style={{ marginTop: 24 }}>
        <p className="card-label">¿Por qué tiene este acceso?</p>
        <div className="admin-breakdown-list">
          <div><span>Suscripción paga efectiva</span><strong>{summary.access.paidSubscriptionEffective ? "Sí" : "No"}</strong></div>
          <div><span>Promoción efectiva</span><strong>{summary.access.promotionEffective ? "Sí" : "No"}</strong></div>
          <div><span>Prueba activa</span><strong>{summary.access.trialActive ? "Sí" : "No"}</strong></div>
          <div><span>Estado resuelto</span><strong>{summary.access.resolvedState}</strong></div>
          <div><span>Fuente</span><strong>{summary.access.source}</strong></div>
        </div>
      </section>

      <section className="detail-card" style={{ marginTop: 24 }}>
        <p className="card-label">Notificaciones — historial de entregas</p>
        <table className="admin-table" style={{ marginTop: 12 }}>
          <thead><tr><th>Fecha</th><th>Tipo</th><th>Canal</th><th>Estado</th><th>Error</th><th /></tr></thead>
          <tbody>
            {deliveryHistory.length === 0 && <tr><td colSpan={6}>Sin entregas.</td></tr>}
            {deliveryHistory.map((delivery) => (
              <tr key={delivery.id}>
                <td>{formatDate(delivery.createdAt)}</td>
                <td>{delivery.notificationType}</td>
                <td>{delivery.channel}</td>
                <td>{delivery.status}</td>
                <td>{delivery.lastErrorCode ?? "—"}</td>
                <td>
                  {canManageNotifications && delivery.status === "FAILED" && (delivery.channel === "EMAIL" || delivery.channel === "WHATSAPP") && (
                    <AdminActionDialog
                      triggerLabel="Reintentar envío"
                      confirmLabel="Reintentar"
                      description="Reintenta esta entrega puntual — nunca crea una notificación nueva."
                      action={adminRetryDeliveryAction}
                      hiddenFields={{ deliveryId: delivery.id, targetUserId: userId }}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  );
}

const ACCESS_SOURCE_LABEL: Record<string, string> = {
  PAID_SUBSCRIPTION: "Suscripción paga",
  PROMOTION: "Promoción",
  TRIAL: "Prueba gratuita",
  NONE: "Sin acceso",
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric" }).format(value);
}
