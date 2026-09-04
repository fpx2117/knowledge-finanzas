"use server";

import { redirect } from "next/navigation";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { emitFinancialEvent } from "@/lib/events/emit-financial-event";
import { createTransferService } from "../services/transfer-service";
import { createTransferSchema, voidTransferSchema } from "../schemas/transfer-schemas";

const service = createTransferService();

export type TransferActionState = { ok: true } | { ok: false; error: ReturnType<typeof mapErrorToUi> };

export async function createTransferAction(
  _previous: TransferActionState | null,
  formData: FormData,
): Promise<TransferActionState> {
  try {
    const user = await requireCurrentUser();
    const input = createTransferSchema.parse({
      fromAccountId: formData.get("fromAccountId"),
      toAccountId: formData.get("toAccountId"),
      amount: formData.get("amount"),
      occurredAt: `${String(formData.get("occurredAt"))}T12:00:00Z`,
      notes: formData.get("notes") || undefined,
      commandId: formData.get("commandId") || undefined,
    });
    await service.createTransfer(user, input);
    emitFinancialEvent({ type: "transfer.created" });
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
  redirect("/transactions");
}

export async function voidTransferAction(
  _previous: TransferActionState | null,
  formData: FormData,
): Promise<TransferActionState> {
  let transferId: string | null = null;
  try {
    const user = await requireCurrentUser();
    ({ transferId } = voidTransferSchema.parse({ transferId: formData.get("transferId") }));
    await service.voidTransfer(user.id, transferId);
    emitFinancialEvent({ type: "transfer.voided", entityPaths: [`/transfers/${transferId}`] });
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
  redirect("/transactions");
}
