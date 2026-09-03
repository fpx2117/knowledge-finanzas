import { createAuditLogRepository, db } from "@know-finanzas/db";
import { requireAdminUser } from "@/lib/auth/require-admin-user";
import { AdminDataTable, type AdminDataTableColumn } from "@/features/admin/shared/admin-data-table";
import { FilterBar } from "@/components/shared/filter-bar";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const auditLog = createAuditLogRepository(db);

type AuditEntry = Awaited<ReturnType<typeof auditLog.search>>[number];

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<{ actorUserId?: string; targetUserId?: string; entityType?: string }> }) {
  await requireAdminUser("commercial.audit.read");
  const filters = await searchParams;

  const entries = await auditLog.search({
    actorUserId: filters.actorUserId?.trim() || undefined,
    targetUserId: filters.targetUserId?.trim() || undefined,
    entityType: filters.entityType?.trim() || undefined,
  });

  const columns: AdminDataTableColumn<AuditEntry>[] = [
    { key: "createdAt", header: "Fecha", render: (entry) => formatDateTime(entry.createdAt) },
    { key: "actorUserId", header: "Actor", render: (entry) => entry.actorUserId },
    { key: "action", header: "Acción", render: (entry) => entry.action },
    { key: "entityType", header: "Entidad", render: (entry) => `${entry.entityType}${entry.entityId ? ` (${entry.entityId})` : ""}` },
    { key: "targetUserId", header: "Usuario objetivo", render: (entry) => entry.targetUserId ?? "—" },
    { key: "reason", header: "Motivo", render: (entry) => entry.reason ?? "—" },
  ];

  return (
    <section>
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Auditoría</p>
      <h2>Historial de acciones administrativas</h2>
      <form className="mt-4">
        <FilterBar
          filters={<>
            <FormField id="audit-actor" label="Actor (ID)" className="w-full sm:w-40">
              <Input name="actorUserId" defaultValue={filters.actorUserId ?? ""} />
            </FormField>
            <FormField id="audit-target" label="Usuario objetivo (ID)" className="w-full sm:w-40">
              <Input name="targetUserId" defaultValue={filters.targetUserId ?? ""} />
            </FormField>
            <FormField id="audit-entity" label="Tipo de entidad" className="w-full sm:w-40">
              <Input name="entityType" defaultValue={filters.entityType ?? ""} />
            </FormField>
            <Button type="submit" variant="outline">Filtrar</Button>
          </>}
        />
      </form>

      <div className="mt-6">
        <AdminDataTable caption="Historial de acciones administrativas" columns={columns} rows={entries} emptyMessage="Sin entradas." />
      </div>
    </section>
  );
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(value);
}
