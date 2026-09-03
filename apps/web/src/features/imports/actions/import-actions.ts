"use server";

import { revalidatePath } from "next/cache";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { buildImportPreview, type ImportPreview, type ImportResult } from "../services/import-service";
import { importService } from "../services/import-service.instance";

export async function previewImportAction(text: string): Promise<ImportPreview> {
  await requireCurrentUser();
  return buildImportPreview(typeof text === "string" ? text : "");
}

export type CommitImportState =
  | { ok: true; result: ImportResult }
  | { ok: false; error: ReturnType<typeof mapErrorToUi> };

export async function commitImportAction(_previous: CommitImportState | null, formData: FormData): Promise<CommitImportState> {
  try {
    const user = await requireCurrentUser();
    const accountId = String(formData.get("accountId") ?? "");
    const text = String(formData.get("text") ?? "");
    const filename = formData.get("filename");
    const result = await importService.commitImport(user.id, {
      accountId,
      text,
      filename: typeof filename === "string" ? filename : null,
      timezone: user.timezone,
    });
    revalidatePath("/transactions");
    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    revalidatePath("/importar");
    return { ok: true, result };
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
}
