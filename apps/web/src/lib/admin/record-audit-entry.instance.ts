import { createAuditLogRepository, db } from "@know-finanzas/db";
import { createRecordAuditEntry } from "@know-finanzas/audit";

export const recordAuditEntry = createRecordAuditEntry({ repository: createAuditLogRepository(db) });
