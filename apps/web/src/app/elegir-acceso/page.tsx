import { redirect } from "next/navigation";

import { env } from "@know-finanzas/config";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { analyticsService, isInternalAccount } from "@/lib/analytics/analytics-service.instance";
import { resolveAccessRoute } from "@/lib/onboarding/access-route.instance";
import { AccessSelectionView } from "@/features/access-selection/components/access-selection-view";

// Reachable only at COMPLETED + NO_ACCESS (TASK-064's routing guard) — any other state redirects
// to wherever that user actually belongs, so a direct URL visit can't be used to bypass onboarding
// or re-enter access selection after access is already active.
export default async function AccessSelectionPage() {
  const user = await requireCurrentUser();
  const gate = await resolveAccessRoute(user.id);

  if (gate.destination === "ONBOARDING") redirect("/onboarding");
  if (gate.destination === "FINANCIAL_ONBOARDING") redirect("/onboarding/financial-onboarding");
  if (gate.destination === "CONTINUE") redirect("/app");

  try {
    await analyticsService("access_selection_viewed", {}, { userId: user.id, internal: isInternalAccount(user.email) });
  } catch {
    // never blocks the screen
  }

  const catalog = {
    trial: { durationDays: env.TRIAL_DURATION_DAYS, aiCreditsTotal: env.TRIAL_AI_CREDITS_TOTAL, whatsappTotal: env.TRIAL_WHATSAPP_TOTAL },
    pro: { price: env.PRO_MONTHLY_PRICE, currencyCode: env.PRO_MONTHLY_CURRENCY, aiCreditsPerPeriod: env.PRO_AI_CREDITS_PER_PERIOD, whatsappPerPeriod: env.PRO_WHATSAPP_PER_PERIOD },
  };

  return <AccessSelectionView catalog={catalog} />;
}
