"use server";

import { redirect } from "next/navigation";

import { PRO_MONTHLY_PLAN_CODE } from "@know-finanzas/billing";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { billingService as service } from "@/lib/billing/billing-service.instance";
import { mapBillingActionErrorToUi } from "../lib/map-billing-error";

export type StartSubscriptionState =
  | { ok: true }
  | { ok: false; error: ReturnType<typeof mapBillingActionErrorToUi> };

// The form has no fields — startSubscriptionAction only needs the useActionState signature.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function startSubscriptionAction(_previousState: StartSubscriptionState | null, _formData: FormData): Promise<StartSubscriptionState> {
  let checkoutUrl: string;

  try {
    const user = await requireCurrentUser();
    const result = await service.startSubscription(user, PRO_MONTHLY_PLAN_CODE);
    checkoutUrl = result.checkoutUrl;
  } catch (error) {
    return { ok: false, error: mapBillingActionErrorToUi(error) };
  }

  redirect(checkoutUrl);
}
