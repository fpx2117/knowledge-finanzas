"use server";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { emitFinancialEvent } from "@/lib/events/emit-financial-event";
import { classificationRuleService } from "../services/classification-rule-service.instance";
import type { RulePreview } from "../services/classification-rule-service";
import {
  createClassificationRuleSchema,
  previewClassificationRuleSchema,
} from "../schemas/classification-rule-schemas";

export type RuleFormState =
  | { ok: true; applied: number }
  | { ok: false; error: ReturnType<typeof mapErrorToUi> };

export type RulePreviewState =
  | { ok: true; preview: RulePreview }
  | { ok: false; error: ReturnType<typeof mapErrorToUi> };

// spec 11 §6.8 — simulate before saving.
export async function previewClassificationRuleAction(
  _previous: RulePreviewState | null,
  formData: FormData,
): Promise<RulePreviewState> {
  try {
    const user = await requireCurrentUser();
    const input = previewClassificationRuleSchema.parse({
      matcher: formData.get("matcher"),
      mode: formData.get("mode"),
      pattern: formData.get("pattern"),
      categoryId: formData.get("categoryId"),
      window: formData.get("window") ?? undefined,
    });
    const preview = await classificationRuleService.previewRule(user.id, input, { window: input.window });
    return { ok: true, preview };
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
}

export async function createClassificationRuleAction(
  _previous: RuleFormState | null,
  formData: FormData,
): Promise<RuleFormState> {
  try {
    const user = await requireCurrentUser();
    const parsed = createClassificationRuleSchema.parse({
      matcher: formData.get("matcher"),
      mode: formData.get("mode"),
      pattern: formData.get("pattern"),
      categoryId: formData.get("categoryId"),
      retroactive: formData.get("retroactive") ?? undefined,
    });
    const { retroactive, ...input } = parsed;
    const { applied } = await classificationRuleService.createRule(user.id, input, { retroactive });
    emitFinancialEvent({ type: "personal_rule.changed" });
    if (applied > 0) emitFinancialEvent({ type: "transaction.updated" });
    return { ok: true, applied };
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
}

export async function deleteClassificationRuleAction(ruleId: string): Promise<{ ok: boolean }> {
  try {
    const user = await requireCurrentUser();
    await classificationRuleService.deleteRule(user.id, ruleId);
    emitFinancialEvent({ type: "personal_rule.changed" });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
