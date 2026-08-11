"use server";

import { redirect } from "next/navigation";

import { PRO_MONTHLY_PLAN_CODE } from "@know-finanzas/billing";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { billingService } from "@/lib/billing/billing-service.instance";
import { analyticsService, isInternalAccount } from "@/lib/analytics/analytics-service.instance";
import { mapBillingActionErrorToUi } from "@/features/billing/lib/map-billing-error";

export type StartProCheckoutActionState =
  | { ok: true }
  | { ok: false; error: ReturnType<typeof mapBillingActionErrorToUi> };

// Never creates a trial (Domain Rule: "Checkout Started != Pro") — this only starts the provider
// checkout via the exact same StartProSubscription used by /settings/billing. Access only
// resolves to PRO once the provider confirms, handled entirely by the existing webhook/synchronizer
// pipeline (TASK-032/033), not here.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function startProCheckoutAction(_previousState: StartProCheckoutActionState | null, _formData: FormData): Promise<StartProCheckoutActionState> {
  let checkoutUrl: string;

  try {
    const user = await requireCurrentUser();
    const internal = isInternalAccount(user.email);
    await analyticsService("pro_selected", {}, { userId: user.id, internal });

    const result = await billingService.startSubscription(user, PRO_MONTHLY_PLAN_CODE);
    checkoutUrl = result.checkoutUrl;

    // Reuses the existing generic checkout_started event (a client-intent signal, never treated
    // as a conversion) rather than adding a duplicate pro_checkout_started event for the same
    // concept.
    await analyticsService("checkout_started", { planCode: PRO_MONTHLY_PLAN_CODE }, { userId: user.id, internal });
  } catch (error) {
    return { ok: false, error: mapBillingActionErrorToUi(error) };
  }

  redirect(checkoutUrl);
}
