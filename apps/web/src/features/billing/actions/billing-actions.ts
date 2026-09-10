"use server";

import { unstable_rethrow } from "next/navigation";
import { isBillingError, type BillingErrorCode } from "@know-finanzas/billing";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { billingService } from "../services/billing-service.instance";
import { startTrial } from "@/lib/billing/start-trial.instance";
import { cancelSubscription } from "@/lib/billing/cancel-subscription.instance";

const BILLING_MESSAGES: Partial<Record<BillingErrorCode, string>> = {
  BILLING_DISABLED: "Los pagos no están disponibles en este momento. Probá más tarde.",
  BILLING_PROVIDER_ERROR: "No pudimos iniciar el pago. Intentá de nuevo en unos minutos.",
  BILLING_PLAN_NOT_FOUND: "Ese plan ya no está disponible.",
  BILLING_PLAN_INACTIVE: "Ese plan ya no está disponible.",
  BILLING_SUBSCRIPTION_ALREADY_ACTIVE: "Ya tenés una suscripción activa.",
  BILLING_SUBSCRIPTION_PENDING: "Ya tenés un pago en proceso. Revisá tu correo o esperá unos minutos.",
  BILLING_SUBSCRIPTION_NOT_FOUND: "No encontramos esta suscripción.",
  BILLING_SUBSCRIPTION_ALREADY_CANCELLED: "Esta suscripción ya estaba cancelada.",
  BILLING_TRIAL_NOT_ELIGIBLE: "Ya usaste tu prueba gratis. Podés pasarte a Pro cuando quieras.",
};

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } };

function toError(error: unknown): { code: string; message: string } {
  if (isBillingError(error)) {
    return { code: error.code, message: BILLING_MESSAGES[error.code] ?? "No pudimos completar la operación." };
  }
  return { code: "INTERNAL_ERROR", message: "No pudimos completar la operación. Intentá nuevamente." };
}

/** Starts a Mercado Pago checkout for the PRO plan. Returns the checkout URL to redirect to. */
export async function startSubscriptionAction(): Promise<ActionResult<{ checkoutUrl: string }>> {
  const user = await requireCurrentUser();
  try {
    const { checkoutUrl } = await billingService.startSubscription({ id: user.id, email: user.email });
    return { ok: true, data: { checkoutUrl } };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: toError(error) };
  }
}

/** Starts the 14-day PRO trial (explicit user choice). */
export async function startTrialAction(): Promise<ActionResult<{ trialEndsAt: string }>> {
  const user = await requireCurrentUser();
  try {
    const result = await startTrial({ userId: user.id });
    return { ok: true, data: { trialEndsAt: result.trialEndsAt.toISOString() } };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: toError(error) };
  }
}

/** Cancels the user's subscription immediately (Mercado Pago has no period-end cancellation). */
export async function cancelSubscriptionAction(input: { subscriptionId: string; reasonComment?: string }): Promise<ActionResult<{ status: string }>> {
  const user = await requireCurrentUser();
  try {
    const result = await cancelSubscription({
      userId: user.id,
      subscriptionId: input.subscriptionId,
      reason: input.reasonComment ? { reasonCode: null, reasonComment: input.reasonComment.slice(0, 500) } : undefined,
    });
    return { ok: true, data: { status: result.subscription.status } };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: toError(error) };
  }
}
