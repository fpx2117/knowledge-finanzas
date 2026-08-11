"use server";

import { revalidatePath } from "next/cache";

import type { ConsentPurpose } from "@know-finanzas/privacy";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { CURRENT_POLICY_VERSION, updateAnalyticsConsent } from "@/lib/privacy/analytics-consent.instance";
import { mapPrivacyActionErrorToUi } from "../lib/map-privacy-error";

export type UpdateAnalyticsConsentState = { ok: true } | { ok: false; error: ReturnType<typeof mapPrivacyActionErrorToUi> };

async function setConsent(purpose: ConsentPurpose, action: "GRANT" | "WITHDRAW"): Promise<UpdateAnalyticsConsentState> {
  try {
    const user = await requireCurrentUser();
    await updateAnalyticsConsent({ userId: user.id, purpose, action, policyVersion: CURRENT_POLICY_VERSION });
  } catch (error) {
    return { ok: false, error: mapPrivacyActionErrorToUi(error) };
  }

  revalidatePath("/settings/privacy");
  return { ok: true };
}

export async function grantProductAnalyticsConsentAction() {
  return setConsent("PRODUCT_ANALYTICS", "GRANT");
}

export async function withdrawProductAnalyticsConsentAction() {
  return setConsent("PRODUCT_ANALYTICS", "WITHDRAW");
}

export async function grantExternalAggregatedStatisticsConsentAction() {
  return setConsent("EXTERNAL_AGGREGATED_STATISTICS", "GRANT");
}

export async function withdrawExternalAggregatedStatisticsConsentAction() {
  return setConsent("EXTERNAL_AGGREGATED_STATISTICS", "WITHDRAW");
}
