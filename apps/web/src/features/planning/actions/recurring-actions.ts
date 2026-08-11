"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@know-finanzas/db";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { createRecurringTransactionService } from "../services/recurring-transaction-service";
import { productAccessGate } from "@/lib/billing/product-access-gate.instance";
const service = createRecurringTransactionService(db, () => new Date(), productAccessGate);
export async function pauseRecurringAction(formData: FormData) { return transition(formData, "pause"); }
export async function resumeRecurringAction(formData: FormData) { return transition(formData, "resume"); }
export async function cancelRecurringAction(formData: FormData) { return transition(formData, "cancel"); }
async function transition(formData: FormData, action: "pause" | "resume" | "cancel") { try { const user = await requireCurrentUser(); const id = z.string().uuid().parse(formData.get("recurringId")); await service[action](user.id, id); revalidatePath("/planning"); revalidatePath("/dashboard"); return { ok: true as const }; } catch (error) { return { ok: false as const, error: mapErrorToUi(error) }; } }
