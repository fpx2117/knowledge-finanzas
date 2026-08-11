import { hasPermission } from "@know-finanzas/shared";
import { requireAdminUser } from "@/lib/auth/require-admin-user";
import { getReconciliationQueue } from "@/lib/admin/get-reconciliation-queue.instance";
import { AdminActionDialog } from "@/features/admin/shared/admin-action-dialog";
import { reconcileSubscriptionAction } from "@/features/admin/billing/actions/reconcile-subscription";
import { adminReconcileRefundsAction } from "@/features/admin/billing/actions/reconcile-refund";
import { adminRetryWebhookEventAction } from "@/features/admin/billing/actions/retry-webhook-event";

// Individual reconciliation actions only — no "Reconcile Everything" button (Scope).
export default async function AdminBillingReconciliationPage() {
  const admin = await requireAdminUser("commercial.users.read");
  const canManageBilling = hasPermission(admin.role, "billing.manage");
  const canReplayWebhooks = hasPermission(admin.role, "billing.webhook.replay");

  const queue = await getReconciliationQueue();

  return (
    <section>
      <p className="card-label">Reconciliación</p>
      <h2>Cola de excepciones</h2>

      <section className="detail-card" style={{ marginTop: 24 }}>
        <p className="card-label">Suscripciones PENDING sin confirmar (&gt;24h)</p>
        {queue.stalePendingSubscriptions.length === 0 ? <p className="metric-value">Ninguna.</p> : (
          <table className="admin-table" style={{ marginTop: 12 }}>
            <thead><tr><th>ID</th><th>Usuario</th><th>Creada</th><th /></tr></thead>
            <tbody>
              {queue.stalePendingSubscriptions.map((subscription) => (
                <tr key={subscription.id}>
                  <td>{subscription.id}</td>
                  <td>{subscription.userId}</td>
                  <td>{formatDate(subscription.createdAt)}</td>
                  <td>
                    {canManageBilling && (
                      <AdminActionDialog
                        triggerLabel="Reconciliar ahora"
                        confirmLabel="Reconciliar"
                        description="Consulta el estado real en Mercado Pago y lo aplica — nunca elegís el resultado manualmente."
                        action={reconcileSubscriptionAction}
                        hiddenFields={{ subscriptionId: subscription.id }}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="detail-card" style={{ marginTop: 24 }}>
        <p className="card-label">Suscripciones PAST_DUE</p>
        {queue.pastDueSubscriptions.length === 0 ? <p className="metric-value">Ninguna.</p> : (
          <table className="admin-table" style={{ marginTop: 12 }}>
            <thead><tr><th>ID</th><th>Usuario</th><th>Fin de período</th><th /></tr></thead>
            <tbody>
              {queue.pastDueSubscriptions.map((subscription) => (
                <tr key={subscription.id}>
                  <td>{subscription.id}</td>
                  <td>{subscription.userId}</td>
                  <td>{subscription.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : "—"}</td>
                  <td>
                    {canManageBilling && (
                      <AdminActionDialog
                        triggerLabel="Reconciliar ahora"
                        confirmLabel="Reconciliar"
                        description="Consulta el estado real en Mercado Pago y lo aplica — nunca elegís el resultado manualmente."
                        action={reconcileSubscriptionAction}
                        hiddenFields={{ subscriptionId: subscription.id }}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="detail-card" style={{ marginTop: 24 }}>
        <p className="card-label">Webhooks fallidos</p>
        {queue.failedWebhooks.length === 0 ? <p className="metric-value">Ninguno.</p> : (
          <table className="admin-table" style={{ marginTop: 12 }}>
            <thead><tr><th>Recibido</th><th>Tipo</th><th>Error</th><th /></tr></thead>
            <tbody>
              {queue.failedWebhooks.map((event) => (
                <tr key={event.id}>
                  <td>{formatDate(event.receivedAt)}</td>
                  <td>{event.eventType}</td>
                  <td>{event.errorCode ?? "—"}</td>
                  <td>
                    {canReplayWebhooks && (
                      <AdminActionDialog
                        triggerLabel="Reintentar"
                        confirmLabel="Reintentar"
                        description="Solo SUPER_ADMIN. Idempotente — nunca duplica pagos, períodos ni reembolsos."
                        action={adminRetryWebhookEventAction}
                        hiddenFields={{ eventId: event.id }}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="detail-card" style={{ marginTop: 24 }}>
        <p className="card-label">Reembolsos pendientes</p>
        {queue.pendingRefunds.length === 0 ? <p className="metric-value">Ninguno.</p> : (
          <>
            <table className="admin-table" style={{ marginTop: 12 }}>
              <thead><tr><th>ID</th><th>Pago</th><th>Monto</th><th>Solicitado</th></tr></thead>
              <tbody>
                {queue.pendingRefunds.map((refund) => (
                  <tr key={refund.id}>
                    <td>{refund.id}</td>
                    <td>{refund.paymentId}</td>
                    <td>{refund.amount} {refund.currencyCode}</td>
                    <td>{formatDate(refund.requestedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {canManageBilling && (
              <div style={{ marginTop: 12 }}>
                <AdminActionDialog
                  triggerLabel="Reconciliar todos los reembolsos pendientes"
                  confirmLabel="Reconciliar"
                  description="Vuelve a consultar el estado real de cada reembolso PENDING en Mercado Pago — nunca marca éxito sin confirmación del proveedor."
                  action={adminReconcileRefundsAction}
                />
              </div>
            )}
          </>
        )}
      </section>
    </section>
  );
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric" }).format(value);
}
