"use server";

import { redirect } from "next/navigation";

import { accountRepository } from "@know-finanzas/db";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { productAccessGate } from "@/lib/billing/product-access-gate.instance";
import { createAccountService } from "@/features/accounts/services/account-service";
import { createAccountSchema } from "@/features/accounts/schemas/account-schemas";
import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { analyticsService, isInternalAccount } from "@/lib/analytics/analytics-service.instance";

// Delegates entirely to TASK-008's CreateAccount (the exact same service the standalone Accounts
// feature uses, via the same repository/gate) — Domain Rule: "never a parallel
// OnboardingAccountService." The only thing specific to onboarding here is the redirect target.
const service = createAccountService({ accounts: accountRepository, gate: productAccessGate });

export type CreateFirstAccountActionState =
  | { ok: true }
  | { ok: false; error: ReturnType<typeof mapErrorToUi> };

export async function createFirstAccountAction(_previousState: CreateFirstAccountActionState | null, formData: FormData): Promise<CreateFirstAccountActionState> {
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
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }

  redirect("/dashboard");
}
