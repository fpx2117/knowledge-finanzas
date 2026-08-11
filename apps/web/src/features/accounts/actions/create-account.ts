"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { accountRepository } from "@know-finanzas/db";
import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { createAccountService } from "../services/account-service";
import { createAccountSchema } from "../schemas/account-schemas";
import { productAccessGate } from "@/lib/billing/product-access-gate.instance";
import { analyticsService, isInternalAccount } from "@/lib/analytics/analytics-service.instance";

const service = createAccountService({ accounts: accountRepository, gate: productAccessGate });

export type AccountActionState =
  | { ok: true }
  | { ok: false; error: ReturnType<typeof mapErrorToUi> };

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

    const account = await service.createAccount(user.id, input);
    await analyticsService(
      "account_created",
      { accountType: account.type, currencyCode: account.currencyCode },
      { eventId: `account_created:${account.id}`, userId: user.id, internal: isInternalAccount(user.email) },
    );
    revalidatePath("/accounts");
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }

  redirect("/accounts");
}
