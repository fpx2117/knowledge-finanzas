import { createAuditLogRepository, db } from "@know-finanzas/db";
import { requireAdminUser } from "@/lib/auth/require-admin-user";

const auditLog = createAuditLogRepository(db);

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<{ actorUserId?: string; targetUserId?: string; entityType?: string }> }) {
  await requireAdminUser("commercial.audit.read");
  const filters = await searchParams;

  const entries = await auditLog.search({
    actorUserId: filters.actorUserId?.trim() || undefined,
    targetUserId: filters.targetUserId?.trim() || undefined,
    entityType: filters.entityType?.trim() || undefined,
  });

  return (
    <section>
      <p className="card-label">Auditoría</p>
      <h2>Historial de acciones administrativas</h2>
      <form className="admin-search-form" style={{ marginTop: 16, flexWrap: "wrap" }}>
        <div className="field-group">
          <label htmlFor="audit-actor">Actor (ID)</label>
          <input id="audit-actor" name="actorUserId" type="text" defaultValue={filters.actorUserId ?? ""} />
        </div>
        <div className="field-group">
          <label htmlFor="audit-target">Usuario objetivo (ID)</label>
          <input id="audit-target" name="targetUserId" type="text" defaultValue={filters.targetUserId ?? ""} />
        </div>
        <div className="field-group">
          <label htmlFor="audit-entity">Tipo de entidad</label>
          <input id="audit-entity" name="entityType" type="text" defaultValue={filters.entityType ?? ""} />
        </div>
        <button className="secondary-button" type="submit">Filtrar</button>
      </form>

      <table className="admin-table" style={{ marginTop: 24 }}>
        <thead>
          <tr><th>Fecha</th><th>Actor</th><th>Acción</th><th>Entidad</th><th>Usuario objetivo</th><th>Motivo</th></tr>
        </thead>
        <tbody>
          {entries.length === 0 && <tr><td colSpan={6}>Sin entradas.</td></tr>}
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td>{formatDateTime(entry.createdAt)}</td>
              <td>{entry.actorUserId}</td>
              <td>{entry.action}</td>
              <td>{entry.entityType}{entry.entityId ? ` (${entry.entityId})` : ""}</td>
              <td>{entry.targetUserId ?? "—"}</td>
              <td>{entry.reason ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(value);
}
