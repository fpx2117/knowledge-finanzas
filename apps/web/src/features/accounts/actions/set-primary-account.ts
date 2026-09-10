"use server";

import { accountRepository } from "@know-finanzas/db";

import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { emitFinancialEvent } from "@/lib/events/emit-financial-event";
import { createAccountService } from "../services/account-service";
import { archiveAccountSchema } from "../schemas/account-schemas";

const service = createAccountService({ accounts: accountRepository });

export type SetPrimaryAccountState = { ok: true } | { ok: false; error: ReturnType<typeof mapErrorToUi> };

export async function setPrimaryAccountAction(
  _previousState: SetPrimaryAccountState | null,
  formData: FormData,
): Promise<SetPrimaryAccountState> {
  try {
    const user = await requireCurrentUser();
    const { accountId } = archiveAccountSchema.parse({ accountId: formData.get("accountId") });
    await service.setPrimaryAccount(user.id, accountId);
    emitFinancialEvent({ type: "account.updated", entityPaths: ["/accounts", `/accounts/${accountId}`, "/app"] });
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
  return { ok: true };
}
