"use server";

import { revalidatePath } from "next/cache";

import { accountRepository } from "@know-finanzas/db";
import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { archiveAccountSchema } from "../schemas/account-schemas";
import { createAccountService } from "../services/account-service";

const service = createAccountService({ accounts: accountRepository });

export async function archiveAccountAction(formData: FormData) {
  try {
    const user = await requireCurrentUser();
    const input = archiveAccountSchema.parse({ accountId: formData.get("accountId") });
    await service.archiveAccount(user.id, input.accountId);
    revalidatePath("/accounts");
    revalidatePath(`/accounts/${input.accountId}`);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: mapErrorToUi(error) };
  }
}
