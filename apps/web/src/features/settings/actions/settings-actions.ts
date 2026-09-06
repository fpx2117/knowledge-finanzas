"use server";

import { z } from "zod";

import { createUserRepository, db, userPreferencesRepository } from "@know-finanzas/db";
import { getCurrencyMetadata } from "@know-finanzas/finance";

import { ApplicationError } from "@know-finanzas/shared";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { emitFinancialEvent } from "@/lib/events/emit-financial-event";

const users = createUserRepository(db);

export type SettingsActionState = { ok: true } | { ok: false; error: ReturnType<typeof mapErrorToUi> };

const TIMEZONES = [
  "America/Argentina/Buenos_Aires",
  "America/Sao_Paulo",
  "America/Santiago",
  "America/Montevideo",
  "America/Bogota",
  "America/Mexico_City",
  "America/New_York",
  "Europe/Madrid",
  "UTC",
] as const;

const profileSchema = z
  .object({
    name: z.string().trim().min(1, "Poné un nombre").max(120),
    country: z.string().trim().max(2).optional(),
    timezone: z.enum(TIMEZONES),
    baseCurrency: z.string().trim().toUpperCase(),
    language: z.enum(["es", "en"]),
  })
  .strict();

export async function updateProfileAction(
  _previous: SettingsActionState | null,
  formData: FormData,
): Promise<SettingsActionState> {
  try {
    const user = await requireCurrentUser();
    const raw = profileSchema.parse({
      name: formData.get("name"),
      country: formData.get("country") || undefined,
      timezone: formData.get("timezone"),
      baseCurrency: formData.get("baseCurrency"),
      language: formData.get("language"),
    });
    let baseCurrency: string;
    try {
      baseCurrency = getCurrencyMetadata(raw.baseCurrency).code;
    } catch (cause) {
      return { ok: false, error: mapErrorToUi(new ApplicationError("INVALID_INPUT", { field: "baseCurrency", cause })) };
    }
    await users.updateBasicProfile(user.id, {
      name: raw.name,
      country: raw.country ?? null,
      timezone: raw.timezone,
      baseCurrency,
      language: raw.language,
    });
    // A timezone/base-currency change affects how every dated/aggregated screen renders.
    emitFinancialEvent({ type: "transaction.updated" });
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
  return { ok: true };
}

const preferencesSchema = z
  .object({
    theme: z.enum(["SYSTEM", "LIGHT", "DARK"]),
    defaultReportPeriod: z.enum(["THIS_MONTH", "LAST_MONTH", "LAST_30_DAYS"]),
    weekStartsOn: z.coerce.number().int().refine((v) => v === 0 || v === 1),
    showCents: z.coerce.boolean(),
    compactLargeNumbers: z.coerce.boolean(),
    rememberLastAccount: z.coerce.boolean(),
    rememberLastCategory: z.coerce.boolean(),
    captureMode: z.enum(["QUICK", "FULL"]),
  })
  .strict();

export async function updatePreferencesAction(
  _previous: SettingsActionState | null,
  formData: FormData,
): Promise<SettingsActionState> {
  try {
    const user = await requireCurrentUser();
    const input = preferencesSchema.parse({
      theme: formData.get("theme"),
      defaultReportPeriod: formData.get("defaultReportPeriod"),
      weekStartsOn: formData.get("weekStartsOn"),
      showCents: formData.get("showCents") === "on",
      compactLargeNumbers: formData.get("compactLargeNumbers") === "on",
      rememberLastAccount: formData.get("rememberLastAccount") === "on",
      rememberLastCategory: formData.get("rememberLastCategory") === "on",
      captureMode: formData.get("captureMode"),
    });
    await userPreferencesRepository.upsert(user.id, input);
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
  return { ok: true };
}

export { TIMEZONES };
