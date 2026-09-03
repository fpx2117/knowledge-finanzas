"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
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
    });
    await service.createTransfer(user, input);
    revalidatePath("/transactions");
    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    revalidatePath("/calendar");
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
    revalidatePath("/transactions");
    revalidatePath(`/transfers/${transferId}`);
    revalidatePath("/accounts");
    revalidatePath("/dashboard");
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
  redirect("/transactions");
}
