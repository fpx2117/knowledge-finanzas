import Link from "next/link";

import { createBillingPaymentRepository, createBillingWebhookEventRepository, db } from "@know-finanzas/db";
import { createDetectDuplicatePayments } from "@know-finanzas/billing";
import { hasPermission } from "@know-finanzas/shared";
import { requireAdminUser } from "@/lib/auth/require-admin-user";
import { AdminActionDialog } from "@/features/admin/shared/admin-action-dialog";
import { adminRetryWebhookEventAction } from "@/features/admin/billing/actions/retry-webhook-event";
import { AdminDataTable, type AdminDataTableColumn } from "@/features/admin/shared/admin-data-table";
import { Card, CardContent } from "@/components/ui/card";

const payments = createBillingPaymentRepository(db);
const webhookEvents = createBillingWebhookEventRepository(db);
const detectDuplicatePayments = createDetectDuplicatePayments({ payments });

type DuplicateCase = Awaited<ReturnType<typeof detectDuplicatePayments>>[number] & { id: string };
type FailedWebhook = Awaited<ReturnType<typeof webhookEvents.listFailed>>[number];

export default async function AdminBillingPage() {
  const admin = await requireAdminUser("commercial.users.read");
  const canReplayWebhooks = hasPermission(admin.role, "billing.webhook.replay");

  const [duplicateCasesRaw, failedWebhooks] = await Promise.all([
    detectDuplicatePayments(),
    webhookEvents.listFailed(50),
  ]);
  const duplicateCases: DuplicateCase[] = duplicateCasesRaw.map((item) => ({ ...item, id: `${item.subscriptionId}:${item.billingPeriodId}` }));

  const duplicateColumns: AdminDataTableColumn<DuplicateCase>[] = [
    { key: "subscriptionId", header: "Suscripción", render: (row) => row.subscriptionId },
    { key: "billingPeriodId", header: "Período", render: (row) => row.billingPeriodId },
    { key: "paymentIds", header: "Pagos", render: (row) => row.paymentIds.join(", ") },
  ];

  const webhookColumns: AdminDataTableColumn<FailedWebhook>[] = [
    { key: "receivedAt", header: "Recibido", render: (event) => formatDateTime(event.receivedAt) },
    { key: "eventType", header: "Tipo", render: (event) => event.eventType },
    { key: "externalResourceId", header: "Recurso", render: (event) => event.externalResourceId ?? "—" },
    { key: "errorCode", header: "Error", render: (event) => event.errorCode ?? "—" },
    {
      key: "actions",
      header: "",
      render: (event) => canReplayWebhooks ? (
        <AdminActionDialog
          triggerLabel="Reintentar procesamiento"
          confirmLabel="Reintentar"
          description="Solo SUPER_ADMIN. Vuelve a pedir el estado al proveedor y lo replica de forma idempotente — nunca duplica pagos, períodos ni reembolsos."
          action={adminRetryWebhookEventAction}
          hiddenFields={{ eventId: event.id }}
        />
      ) : null,
    },
  ];

  return (
    <section>
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Billing</p>
      <h2>Diagnóstico de pagos y webhooks</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Las acciones sobre una suscripción o pago puntual (cancelar, reembolsar, ajustar créditos) viven en el
        resumen comercial de cada usuario. Esta vista es solo para excepciones de alcance global — ver también{" "}
        <Link href="/admin/billing/reconciliation">la cola de reconciliación</Link>.
      </p>

      <Card className="mt-6">
        <CardContent>
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cargos duplicados (sin auto-reembolso)</p>
          {duplicateCases.length === 0 ? (
            <p className="metric-value">Ninguno detectado.</p>
          ) : (
            <div className="mt-3">
              <AdminDataTable caption="Cargos duplicados sin auto-reembolso" columns={duplicateColumns} rows={duplicateCases} emptyMessage="Ninguno detectado." />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent>
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Webhooks fallidos</p>
          {failedWebhooks.length === 0 ? (
            <p className="metric-value">Ninguno.</p>
          ) : (
            <div className="mt-3">
              <AdminDataTable caption="Webhooks fallidos" columns={webhookColumns} rows={failedWebhooks} emptyMessage="Ninguno." />
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(value);
}
