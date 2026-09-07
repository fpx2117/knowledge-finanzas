"use server";

import { redirect } from "next/navigation";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { reportActionError } from "@/lib/observability/observe-action";
import { resolveOccurredAtISO } from "@/lib/date";
import { emitFinancialEvent } from "@/lib/events/emit-financial-event";
import { createTransferService } from "../services/transfer-service";
import { createTransferSchema, voidTransferSchema } from "../schemas/transfer-schemas";

const service = createTransferService();

export type TransferActionState = { ok: true } | { ok: false; error: ReturnType<typeof mapErrorToUi> };

export async function createTransferAction(
  _previous: TransferActionState | null,
  formData: FormData,
): Promise<TransferActionState> {
  let userId: string | null = null;
  try {
    const user = await requireCurrentUser();
    userId = user.id;
    const input = createTransferSchema.parse({
      fromAccountId: formData.get("fromAccountId"),
      toAccountId: formData.get("toAccountId"),
      amount: formData.get("amount"),
      occurredAt: resolveOccurredAtISO(String(formData.get("occurredAt")), user.timezone),
      notes: formData.get("notes") || undefined,
      commandId: formData.get("commandId") || undefined,
    });
    await service.createTransfer(user, input);
    emitFinancialEvent({ type: "transfer.created" });
  } catch (error) {
    reportActionError("transfer.create", userId, error);
    return { ok: false, error: mapErrorToUi(error) };
  }
  redirect("/transactions");
}

export async function voidTransferAction(
  _previous: TransferActionState | null,
  formData: FormData,
): Promise<TransferActionState> {
  let transferId: string | null = null;
  let userId: string | null = null;
  try {
    const user = await requireCurrentUser();
    userId = user.id;
    ({ transferId } = voidTransferSchema.parse({ transferId: formData.get("transferId") }));
    await service.voidTransfer(user.id, transferId);
    emitFinancialEvent({ type: "transfer.voided", entityPaths: [`/transactions/transfers/${transferId}`] });
  } catch (error) {
    reportActionError("transfer.void", userId, error);
    return { ok: false, error: mapErrorToUi(error) };
  }
  redirect("/transactions");
}
