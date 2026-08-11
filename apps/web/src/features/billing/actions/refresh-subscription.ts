"use server";

import { revalidatePath } from "next/cache";

import { createBillingSubscriptionRepository, db } from "@know-finanzas/db";
import { createMercadoPagoBillingProvider, createRefreshSubscriptionFromProvider } from "@know-finanzas/billing";
import { env } from "@know-finanzas/config";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { subscriptionSynchronizer } from "@/lib/billing/subscription-synchronizer.instance";
import { mapBillingActionErrorToUi } from "../lib/map-billing-error";

const refreshSubscriptionFromProvider = createRefreshSubscriptionFromProvider({
  subscriptions: createBillingSubscriptionRepository(db),
  provider: createMercadoPagoBillingProvider({ accessToken: env.MERCADOPAGO_ACCESS_TOKEN ?? "" }),
  synchronizer: subscriptionSynchronizer,
});

export type RefreshSubscriptionState =
  | { ok: true }
  | { ok: false; error: ReturnType<typeof mapBillingActionErrorToUi> };

export async function refreshSubscriptionAction(_previousState: RefreshSubscriptionState | null, formData: FormData): Promise<RefreshSubscriptionState> {
  const subscriptionId = String(formData.get("subscriptionId") ?? "");

  try {
    const user = await requireCurrentUser();
    await refreshSubscriptionFromProvider({ userId: user.id, subscriptionId });
  } catch (error) {
    return { ok: false, error: mapBillingActionErrorToUi(error) };
  }

  revalidatePath("/settings/billing");
  return { ok: true };
}
