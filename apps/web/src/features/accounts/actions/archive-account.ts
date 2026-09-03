"use server";

import { revalidatePath } from "next/cache";

import { accountRepository } from "@know-finanzas/db";

import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { createAccountService } from "../services/account-service";
import { archiveAccountSchema } from "../schemas/account-schemas";

const service = createAccountService({ accounts: accountRepository });

export type ArchiveAccountState = { ok: true } | { ok: false; error: ReturnType<typeof mapErrorToUi> };

export async function archiveAccountAction(
  _previousState: ArchiveAccountState | null,
  formData: FormData,
): Promise<ArchiveAccountState> {
  try {
    const user = await requireCurrentUser();
    const { accountId } = archiveAccountSchema.parse({ accountId: formData.get("accountId") });
    await service.archiveAccount(user.id, accountId);
    revalidatePath("/accounts");
    revalidatePath(`/accounts/${accountId}`);
    revalidatePath("/dashboard");
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
  return { ok: true };
}
