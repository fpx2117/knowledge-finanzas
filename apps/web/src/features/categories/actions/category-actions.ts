"use server";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { emitFinancialEvent } from "@/lib/events/emit-financial-event";
import { createCategoryProvisioningService } from "../services/category-provisioning-service";
import { categoryService } from "../services/category-service.instance";

const service = createCategoryProvisioningService();

export type CategoryActionResult =
  | { ok: true; created: number }
  | { ok: false; error: ReturnType<typeof mapErrorToUi> };

/** Give the current user the starter category set (no-op if they already have any). */
export async function provisionDefaultCategoriesAction(): Promise<CategoryActionResult> {
  try {
    const user = await requireCurrentUser();
    const result = await service.provisionDefaultCategories(user.id);
    if (result.skipped) {
      await service.backfillCategoryMap(user.id).catch(() => undefined);
    }
    emitFinancialEvent({ type: "category.changed" });
    return { ok: true, created: result.created };
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
}

/** Link a returning user's pre-existing free-text categories to the canonical taxonomy. */
export async function backfillCategoryMapAction(): Promise<CategoryActionResult> {
  try {
    const user = await requireCurrentUser();
    const { mapped } = await service.backfillCategoryMap(user.id);
    return { ok: true, created: mapped };
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
}

export type CategoryFormState = { ok: true } | { ok: false; error: ReturnType<typeof mapErrorToUi> };

export async function createCategoryAction(
  _previous: CategoryFormState | null,
  formData: FormData,
): Promise<CategoryFormState> {
  try {
    const user = await requireCurrentUser();
    const name = String(formData.get("name") ?? "").trim();
    const type = formData.get("type") === "INCOME" ? "INCOME" : "EXPENSE";
    const parentId = (formData.get("parentId") as string) || null;
    await categoryService.createCategory(user.id, { name, type, parentId });
    emitFinancialEvent({ type: "category.changed" });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
}

export async function renameCategoryAction(
  _previous: CategoryFormState | null,
  formData: FormData,
): Promise<CategoryFormState> {
  try {
    const user = await requireCurrentUser();
    await categoryService.updateCategory(user.id, {
      categoryId: String(formData.get("categoryId")),
      name: String(formData.get("name") ?? "").trim(),
      parentId: (formData.get("parentId") as string) || null,
    });
    emitFinancialEvent({ type: "category.changed" });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
}

export async function archiveCategoryAction(
  _previous: CategoryFormState | null,
  formData: FormData,
): Promise<CategoryFormState> {
  try {
    const user = await requireCurrentUser();
    await categoryService.archiveCategory(user.id, String(formData.get("categoryId")));
    emitFinancialEvent({ type: "category.changed" });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
}

export async function setCategoryMappingAction(
  _previous: CategoryFormState | null,
  formData: FormData,
): Promise<CategoryFormState> {
  try {
    const user = await requireCurrentUser();
    await categoryService.setCategoryMapping(
      user.id,
      String(formData.get("categoryId")),
      String(formData.get("taxonomyNodeId")),
    );
    emitFinancialEvent({ type: "category.changed" });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
}
