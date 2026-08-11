"use server";

import { revalidatePath } from "next/cache";

import { createBillingWebhookEventRepository, db } from "@know-finanzas/db";
import { requireAdminUser } from "@/lib/auth/require-admin-user";
import { retryWebhookEvent } from "@/lib/billing/retry-webhook-event.instance";
import { recordAuditEntry } from "@/lib/admin/record-audit-entry.instance";
import { mapAdminActionError } from "../../lib/map-admin-error";
import type { AdminActionState } from "../../shared/admin-action-dialog";

const events = createBillingWebhookEventRepository(db);

// SUPER_ADMIN-only (Security Requirement). Idempotent: retryWebhookEvent itself only replays a
// currently-FAILED event and never re-applies an already-processed one — see its own
// documentation in packages/billing/src/webhooks/retry-webhook-event.ts.
export async function adminRetryWebhookEventAction(_previousState: AdminActionState | null, formData: FormData): Promise<AdminActionState> {
  const eventId = String(formData.get("eventId") ?? "");

  try {
    const admin = await requireAdminUser("billing.webhook.replay");
    const before = await events.findById(eventId);
    const result = await retryWebhookEvent(eventId);
    const after = await events.findById(eventId);

    await recordAuditEntry({
      actorUserId: admin.id,
      action: "ADMIN_RETRY_WEBHOOK_EVENT",
      entityType: "billing_webhook_event",
      entityId: eventId,
      beforeSnapshot: before ?? null,
      afterSnapshot: after ?? null,
      reason: `retry outcome: ${result.outcome}`,
    });

    if (result.outcome === "failed") {
      return { ok: false, error: { code: result.errorCode, message: "El reintento falló nuevamente. Revisá el estado del proveedor." } };
    }
    if (result.outcome === "not_found" || result.outcome === "not_failed" || result.outcome === "unrecognized_event_type") {
      return { ok: false, error: { code: result.outcome.toUpperCase(), message: "Este evento no puede reintentarse en su estado actual." } };
    }
  } catch (error) {
    return { ok: false, error: mapAdminActionError(error) };
  }

  revalidatePath("/admin/billing/reconciliation");
  return { ok: true };
}
