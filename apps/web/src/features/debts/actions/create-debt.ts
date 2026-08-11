"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { createDebtService } from "../services/debt-service";
import { db } from "@know-finanzas/db";
import { productAccessGate } from "@/lib/billing/product-access-gate.instance";
const service = createDebtService(db, productAccessGate);
export async function createDebtAction(formData: FormData) { try { const user = await requireCurrentUser(); const preview = JSON.parse(String(formData.get("installments"))) as Array<{ installmentNumber: number; dueDate: string; amount: string }>; const installments = preview.map((item) => ({ installmentNumber: item.installmentNumber, dueDate: item.dueDate, principalAmount: item.amount, interestAmount: "0", feeAmount: "0", totalAmount: item.amount })); await service.createDebt(user.id, { name: String(formData.get("name")), type: "OTHER", currencyCode: "ARS", originalAmount: String(formData.get("originalAmount")), startDate: String(formData.get("startDate")), interestType: "NO_INTEREST", installments }); revalidatePath("/debts"); } catch (error) { return { ok: false as const, error: mapErrorToUi(error) }; } redirect("/debts"); }
