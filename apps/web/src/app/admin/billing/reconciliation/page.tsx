import { hasPermission } from "@know-finanzas/shared";
import { requireAdminUser } from "@/lib/auth/require-admin-user";
import { getReconciliationQueue } from "@/lib/admin/get-reconciliation-queue.instance";
import { AdminActionDialog } from "@/features/admin/shared/admin-action-dialog";
import { AdminDataTable } from "@/features/admin/shared/admin-data-table";
import { reconcileSubscriptionAction } from "@/features/admin/billing/actions/reconcile-subscription";
import { adminReconcileRefundsAction } from "@/features/admin/billing/actions/reconcile-refund";
import { adminRetryWebhookEventAction } from "@/features/admin/billing/actions/retry-webhook-event";
import { MoneyAmount } from "@/components/financial/money-amount";

// Individual reconciliation actions only — no "Reconcile Everything" button (Scope).
export default async function AdminBillingReconciliationPage() {
  const admin = await requireAdminUser("commercial.users.read");
  const canManageBilling = hasPermission(admin.role, "billing.manage");
  const canReplayWebhooks = hasPermission(admin.role, "billing.webhook.replay");

  const queue = await getReconciliationQueue();

  return (
    <section>
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reconciliación</p>
      <h2>Cola de excepciones</h2>

      <section className="rounded-lg border border-border bg-card p-6" style={{ marginTop: 24 }}>
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Suscripciones PENDING sin confirmar (&gt;24h)</p>
        {queue.stalePendingSubscriptions.length === 0 ? <p className="metric-value">Ninguna.</p> : (
          <AdminDataTable
            caption="Suscripciones PENDING sin confirmar hace más de 24 horas"
            emptyMessage="Ninguna."
            rows={queue.stalePendingSubscriptions}
            columns={[
              { key: "id", header: "ID", render: (subscription) => subscription.id },
              { key: "userId", header: "Usuario", render: (subscription) => subscription.userId },
              { key: "createdAt", header: "Creada", render: (subscription) => formatDate(subscription.createdAt) },
              {
                key: "actions",
                header: "Acciones",
                render: (subscription) =>
                  canManageBilling && (
                    <AdminActionDialog
                      triggerLabel="Reconciliar ahora"
                      confirmLabel="Reconciliar"
                      description="Consulta el estado real en Mercado Pago y lo aplica — nunca elegís el resultado manualmente."
                      action={reconcileSubscriptionAction}
                      hiddenFields={{ subscriptionId: subscription.id }}
                    />
                  ),
              },
            ]}
          />
        )}
      </section>

      <section className="rounded-lg border border-border bg-card p-6" style={{ marginTop: 24 }}>
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Suscripciones PAST_DUE</p>
        {queue.pastDueSubscriptions.length === 0 ? <p className="metric-value">Ninguna.</p> : (
          <AdminDataTable
            caption="Suscripciones PAST_DUE"
            emptyMessage="Ninguna."
            rows={queue.pastDueSubscriptions}
            columns={[
              { key: "id", header: "ID", render: (subscription) => subscription.id },
              { key: "userId", header: "Usuario", render: (subscription) => subscription.userId },
              {
                key: "currentPeriodEnd",
                header: "Fin de período",
                render: (subscription) => (subscription.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : "—"),
              },
              {
                key: "actions",
                header: "Acciones",
                render: (subscription) =>
                  canManageBilling && (
                    <AdminActionDialog
                      triggerLabel="Reconciliar ahora"
                      confirmLabel="Reconciliar"
                      description="Consulta el estado real en Mercado Pago y lo aplica — nunca elegís el resultado manualmente."
                      action={reconcileSubscriptionAction}
                      hiddenFields={{ subscriptionId: subscription.id }}
                    />
                  ),
              },
            ]}
          />
        )}
      </section>

      <section className="rounded-lg border border-border bg-card p-6" style={{ marginTop: 24 }}>
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Webhooks fallidos</p>
        {queue.failedWebhooks.length === 0 ? <p className="metric-value">Ninguno.</p> : (
          <AdminDataTable
            caption="Webhooks fallidos"
            emptyMessage="Ninguno."
            rows={queue.failedWebhooks}
            columns={[
              { key: "receivedAt", header: "Recibido", render: (event) => formatDate(event.receivedAt) },
              { key: "eventType", header: "Tipo", render: (event) => event.eventType },
              { key: "errorCode", header: "Error", render: (event) => event.errorCode ?? "—" },
              {
                key: "actions",
                header: "Acciones",
                render: (event) =>
                  canReplayWebhooks && (
                    <AdminActionDialog
                      triggerLabel="Reintentar"
                      confirmLabel="Reintentar"
                      description="Solo SUPER_ADMIN. Idempotente — nunca duplica pagos, períodos ni reembolsos."
                      action={adminRetryWebhookEventAction}
                      hiddenFields={{ eventId: event.id }}
                    />
                  ),
              },
            ]}
          />
        )}
      </section>

      <section className="rounded-lg border border-border bg-card p-6" style={{ marginTop: 24 }}>
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reembolsos pendientes</p>
        {queue.pendingRefunds.length === 0 ? <p className="metric-value">Ninguno.</p> : (
          <>
            <AdminDataTable
              caption="Reembolsos pendientes"
              emptyMessage="Ninguno."
              rows={queue.pendingRefunds}
              columns={[
                { key: "id", header: "ID", render: (refund) => refund.id },
                { key: "paymentId", header: "Pago", render: (refund) => refund.paymentId },
                 { key: "amount", header: "Monto", render: (refund) => <MoneyAmount amount={refund.amount} currency={refund.currencyCode} /> },
                { key: "requestedAt", header: "Solicitado", render: (refund) => formatDate(refund.requestedAt) },
              ]}
            />
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
