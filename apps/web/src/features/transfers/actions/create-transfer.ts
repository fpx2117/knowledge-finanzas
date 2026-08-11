"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { db } from "@know-finanzas/db";
import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { createTransferSchema } from "../schemas/transfer-schemas";
import { createTransferService } from "../services/transfer-service";
import { productAccessGate } from "@/lib/billing/product-access-gate.instance";
const service = createTransferService({ database: db, gate: productAccessGate });
export async function createTransferAction(formData: FormData) {
  try { const user = await requireCurrentUser(); const input = createTransferSchema.parse({ fromAccountId: formData.get("fromAccountId"), toAccountId: formData.get("toAccountId"), amount: formData.get("amount"), occurredAt: `${String(formData.get("occurredAt"))}T12:00:00Z`, notes: formData.get("notes") || undefined }); await service.createTransfer(user, input); revalidatePath("/accounts"); revalidatePath("/transactions"); revalidatePath("/dashboard"); } catch (error) { return { ok: false as const, error: mapErrorToUi(error) }; }
  redirect("/transactions");
}
