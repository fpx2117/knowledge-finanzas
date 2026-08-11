import Link from "next/link";

import { createBillingPaymentRepository, createBillingWebhookEventRepository, db } from "@know-finanzas/db";
import { createDetectDuplicatePayments } from "@know-finanzas/billing";
import { hasPermission } from "@know-finanzas/shared";
import { requireAdminUser } from "@/lib/auth/require-admin-user";
import { AdminActionDialog } from "@/features/admin/shared/admin-action-dialog";
import { adminRetryWebhookEventAction } from "@/features/admin/billing/actions/retry-webhook-event";

const payments = createBillingPaymentRepository(db);
const webhookEvents = createBillingWebhookEventRepository(db);
const detectDuplicatePayments = createDetectDuplicatePayments({ payments });

export default async function AdminBillingPage() {
  const admin = await requireAdminUser("commercial.users.read");
  const canReplayWebhooks = hasPermission(admin.role, "billing.webhook.replay");

  const [duplicateCases, failedWebhooks] = await Promise.all([
    detectDuplicatePayments(),
    webhookEvents.listFailed(50),
  ]);

  return (
    <section>
      <p className="card-label">Billing</p>
      <h2>Diagnóstico de pagos y webhooks</h2>
      <p className="card-helper">
        Las acciones sobre una suscripción o pago puntual (cancelar, reembolsar, ajustar créditos) viven en el
        resumen comercial de cada usuario. Esta vista es solo para excepciones de alcance global — ver también{" "}
        <Link href="/admin/billing/reconciliation">la cola de reconciliación</Link>.
      </p>

      <section className="detail-card" style={{ marginTop: 24 }}>
        <p className="card-label">Cargos duplicados (sin auto-reembolso)</p>
        {duplicateCases.length === 0 ? (
          <p className="metric-value">Ninguno detectado.</p>
        ) : (
          <table className="admin-table" style={{ marginTop: 12 }}>
            <thead><tr><th>Suscripción</th><th>Período</th><th>Pagos</th></tr></thead>
            <tbody>
              {duplicateCases.map((duplicateCase) => (
                <tr key={`${duplicateCase.subscriptionId}:${duplicateCase.billingPeriodId}`}>
                  <td>{duplicateCase.subscriptionId}</td>
                  <td>{duplicateCase.billingPeriodId}</td>
                  <td>{duplicateCase.paymentIds.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="detail-card" style={{ marginTop: 24 }}>
        <p className="card-label">Webhooks fallidos</p>
        {failedWebhooks.length === 0 ? (
          <p className="metric-value">Ninguno.</p>
        ) : (
          <table className="admin-table" style={{ marginTop: 12 }}>
            <thead><tr><th>Recibido</th><th>Tipo</th><th>Recurso</th><th>Error</th><th /></tr></thead>
            <tbody>
              {failedWebhooks.map((event) => (
                <tr key={event.id}>
                  <td>{formatDateTime(event.receivedAt)}</td>
                  <td>{event.eventType}</td>
                  <td>{event.externalResourceId ?? "—"}</td>
                  <td>{event.errorCode ?? "—"}</td>
                  <td>
                    {canReplayWebhooks && (
                      <AdminActionDialog
                        triggerLabel="Reintentar procesamiento"
                        confirmLabel="Reintentar"
                        description="Solo SUPER_ADMIN. Vuelve a pedir el estado al proveedor y lo replica de forma idempotente — nunca duplica pagos, períodos ni reembolsos."
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
    </section>
  );
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(value);
}
