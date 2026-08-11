"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@know-finanzas/db";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { createDebtPaymentService } from "../services/debt-payment-service";
import { productAccessGate } from "@/lib/billing/product-access-gate.instance";
const service = createDebtPaymentService(db, () => new Date(), productAccessGate);
export async function recordDebtPaymentAction(formData: FormData) { let debtId = ""; try { const user = await requireCurrentUser(); debtId = z.string().uuid().parse(formData.get("debtId")); const input = { debtId, accountId: z.string().uuid().parse(formData.get("accountId")), amount: z.string().parse(formData.get("amount")), strategy: z.enum(["OLDEST_DUE_FIRST", "MANUAL"]).parse(formData.get("strategy") ?? "OLDEST_DUE_FIRST"), allocations: formData.get("allocations") ? JSON.parse(String(formData.get("allocations"))) : undefined, paidAt: formData.get("paidAt") ? `${String(formData.get("paidAt"))}T12:00:00Z` : undefined, notes: String(formData.get("notes") || "") }; await service.recordDebtPayment(user, input); revalidatePath("/debts"); revalidatePath(`/debts/${debtId}`); revalidatePath("/accounts"); revalidatePath("/dashboard"); revalidatePath("/transactions"); } catch (error) { return { ok: false as const, error: mapErrorToUi(error) }; } redirect(`/debts/${debtId}`); }
