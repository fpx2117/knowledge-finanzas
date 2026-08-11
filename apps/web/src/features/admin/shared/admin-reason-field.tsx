// Domain Rule (TASK-059/060): sensitive admin actions require an explicit reason, enforced at the
// application-service layer (packages/audit's requireReason) — this field is the UI half of
// that, never the only check.
export function AdminReasonField({ id = "admin-reason", required = true }: { id?: string; required?: boolean }) {
  return (
    <div className="field-group">
      <label htmlFor={id}>Motivo{required ? "" : " (opcional)"}</label>
      <textarea id={id} name="reason" required={required} maxLength={500} rows={3} />
    </div>
  );
}
