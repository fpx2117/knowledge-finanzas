"use server";

import { redirect } from "next/navigation";

import { accountRepository } from "@know-finanzas/db";

import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { emitFinancialEvent } from "@/lib/events/emit-financial-event";
import { createAccountService } from "../services/account-service";
import { createAccountSchema } from "../schemas/account-schemas";
import { createCategoryProvisioningService } from "@/features/categories/services/category-provisioning-service";

const service = createAccountService({ accounts: accountRepository });
const categoryProvisioning = createCategoryProvisioningService();

export type AccountActionState = { ok: true } | { ok: false; error: ReturnType<typeof mapErrorToUi> };

export async function createAccountAction(
  _previousState: AccountActionState | null,
  formData: FormData,
): Promise<AccountActionState> {
  try {
    const user = await requireCurrentUser();
    const input = createAccountSchema.parse({
      name: formData.get("name"),
      type: formData.get("type"),
      currencyCode: formData.get("currencyCode"),
      openingBalance: formData.get("openingBalance"),
      openingDate: formData.get("openingDate"),
    });
    await service.createAccount(user.id, input);
    // Day one: give the user the starter category set so income/expense capture
    // and budgets work immediately. For a user who already has categories this is
    // a no-op, but we still link their existing free-text categories to the
    // canonical taxonomy so analytics can resolve them.
    const provisioned = await categoryProvisioning.provisionDefaultCategories(user.id).catch(() => ({ skipped: true }));
    if (provisioned.skipped) {
      await categoryProvisioning.backfillCategoryMap(user.id).catch(() => undefined);
    }
    emitFinancialEvent({ type: "account.created" });
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
  redirect("/accounts");
}
