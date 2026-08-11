"use server";

import { revalidatePath } from "next/cache";

import { categoryRepository } from "@know-finanzas/db";
import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { createCategorySchema } from "../schemas/category-schemas";
import { createCategoryService } from "../services/category-service";
import { productAccessGate } from "@/lib/billing/product-access-gate.instance";

const service = createCategoryService({ categories: categoryRepository, gate: productAccessGate });

export async function createCategoryAction(_previousState: unknown, formData: FormData) {
  try {
    const user = await requireCurrentUser();
    const input = createCategorySchema.parse({
      name: formData.get("name"),
      type: formData.get("type"),
      parentId: formData.get("parentId") || null,
    });
    await service.createCategory(user.id, input);
    revalidatePath("/settings/categories");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: mapErrorToUi(error) };
  }
}
