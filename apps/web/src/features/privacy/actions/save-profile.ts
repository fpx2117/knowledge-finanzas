"use server";

import { revalidatePath } from "next/cache";

import type { SaveStatisticalProfileInput } from "@know-finanzas/privacy";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { saveStatisticalProfile } from "@/lib/privacy/statistical-profile.instance";
import { mapPrivacyActionErrorToUi } from "../lib/map-privacy-error";

export type SaveStatisticalProfileState = { ok: true } | { ok: false; error: ReturnType<typeof mapPrivacyActionErrorToUi> };

function fieldOrNull(formData: FormData, name: string): string | null {
  const raw = formData.get(name);
  const value = typeof raw === "string" ? raw.trim() : "";
  return value === "" ? null : value;
}

// The form always submits the complete profile (every select defaults to an empty "no answer"
// option) — every submit is a full overwrite, never a partial patch, so there's no ambiguity
// between "leave unchanged" and "clear this field" (Scope: the whole profile is always optional).
export async function saveStatisticalProfileAction(_previousState: SaveStatisticalProfileState | null, formData: FormData): Promise<SaveStatisticalProfileState> {
  try {
    const user = await requireCurrentUser();
    // Zod re-validates every field server-side inside saveStatisticalProfile — this cast just
    // widens raw FormData strings to the input type; an invalid value is rejected there, not here.
    const input: SaveStatisticalProfileInput = {
      ageRange: fieldOrNull(formData, "ageRange"),
      employmentStatus: fieldOrNull(formData, "employmentStatus"),
      incomeRange: fieldOrNull(formData, "incomeRange"),
      householdSizeRange: fieldOrNull(formData, "householdSizeRange"),
      regionCode: fieldOrNull(formData, "regionCode"),
    } as SaveStatisticalProfileInput;
    await saveStatisticalProfile(user.id, input);
  } catch (error) {
    return { ok: false, error: mapPrivacyActionErrorToUi(error) };
  }

  revalidatePath("/settings/privacy");
  return { ok: true };
}
