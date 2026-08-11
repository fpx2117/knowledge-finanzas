"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { createTransferService } from "../services/transfer-service";
import { db } from "@know-finanzas/db";
import { z } from "zod";
const service = createTransferService({ database: db });
export async function voidTransferAction(formData: FormData) {
  let transferId: string;
  try { const user = await requireCurrentUser(); transferId = z.string().uuid().parse(formData.get("transferId")); await service.voidTransfer(user.id, transferId); revalidatePath("/transactions"); revalidatePath(`/transfers/${transferId}`); revalidatePath("/accounts"); revalidatePath("/dashboard"); } catch (error) { return { ok: false as const, error: mapErrorToUi(error) }; }
  redirect("/transactions");
}
