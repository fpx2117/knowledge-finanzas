import { redactSnapshot } from "./redact-snapshot";

export type AuditEntryInput = {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  targetUserId?: string | null;
  beforeSnapshot?: unknown;
  afterSnapshot?: unknown;
  reason?: string | null;
};

export type AuditEntryRecord = {
  id: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  targetUserId: string | null;
  beforeSnapshot: unknown;
  afterSnapshot: unknown;
  reason: string | null;
  createdAt: Date;
};

export type AuditLogRepository = {
  // Append-only by contract: this repository never exposes an update/delete method for
  // audit_log rows (Domain Rule: "never editable from the UI").
  record(input: {
    actorUserId: string;
    action: string;
    entityType: string;
    entityId: string | null;
    targetUserId: string | null;
    beforeSnapshot: unknown;
    afterSnapshot: unknown;
    reason: string | null;
  }): Promise<AuditEntryRecord>;
};

// The single entry point every sensitive admin write calls after (or as part of) its own
// transaction — redacts secret-shaped keys out of both snapshots before they ever reach storage.
export function createRecordAuditEntry(dependencies: { repository: AuditLogRepository }) {
  return async function recordAuditEntry(input: AuditEntryInput): Promise<AuditEntryRecord> {
    return dependencies.repository.record({
      actorUserId: input.actorUserId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      targetUserId: input.targetUserId ?? null,
      beforeSnapshot: redactSnapshot(input.beforeSnapshot ?? null),
      afterSnapshot: redactSnapshot(input.afterSnapshot ?? null),
      reason: input.reason ?? null,
    });
  };
}
