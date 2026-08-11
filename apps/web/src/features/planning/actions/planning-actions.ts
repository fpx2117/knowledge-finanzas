"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@know-finanzas/db";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { createScheduledTransactionService } from "../services/scheduled-transaction-service";
import { productAccessGate } from "@/lib/billing/product-access-gate.instance";
const service = createScheduledTransactionService(db, () => new Date(), productAccessGate);
export async function skipScheduledAction(formData: FormData) { try { const user = await requireCurrentUser(); await service.skip(user.id, z.string().uuid().parse(formData.get("scheduledId"))); revalidatePath("/planning"); return { ok: true as const }; } catch (error) { return { ok: false as const, error: mapErrorToUi(error) }; } }
export async function cancelScheduledAction(formData: FormData) { try { const user = await requireCurrentUser(); await service.cancel(user.id, z.string().uuid().parse(formData.get("scheduledId"))); revalidatePath("/planning"); return { ok: true as const }; } catch (error) { return { ok: false as const, error: mapErrorToUi(error) }; } }
export async function confirmScheduledAction(formData: FormData) { try { const user = await requireCurrentUser(); const id = z.string().uuid().parse(formData.get("scheduledId")); await service.post(user.id, id, { actualAmount: String(formData.get("actualAmount") || ""), actualOccurredAt: new Date(`${String(formData.get("actualDate"))}T12:00:00Z`) }); revalidatePath("/planning"); revalidatePath("/dashboard"); revalidatePath("/accounts"); revalidatePath("/transactions"); return { ok: true as const }; } catch (error) { return { ok: false as const, error: mapErrorToUi(error) }; } }
export async function updateScheduledAction(formData: FormData) { try { const user = await requireCurrentUser(); const id = z.string().uuid().parse(formData.get("scheduledId")); await service.update(user.id, id, { accountId: z.string().uuid().parse(formData.get("accountId")), type: z.enum(["INCOME", "EXPENSE"]).parse(formData.get("type")), expectedAmount: String(formData.get("expectedAmount")), description: String(formData.get("description")), categoryId: null, scheduledDate: String(formData.get("scheduledDate")), notes: null }); revalidatePath("/planning"); return { ok: true as const }; } catch (error) { return { ok: false as const, error: mapErrorToUi(error) }; } }
