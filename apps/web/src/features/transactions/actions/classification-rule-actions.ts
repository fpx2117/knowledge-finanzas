"use server";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { emitFinancialEvent } from "@/lib/events/emit-financial-event";
import { classificationRuleService } from "../services/classification-rule-service.instance";
import { createClassificationRuleSchema } from "../schemas/classification-rule-schemas";

export type RuleFormState = { ok: true } | { ok: false; error: ReturnType<typeof mapErrorToUi> };

export async function createClassificationRuleAction(
  _previous: RuleFormState | null,
  formData: FormData,
): Promise<RuleFormState> {
  try {
    const user = await requireCurrentUser();
    const input = createClassificationRuleSchema.parse({
      matcher: formData.get("matcher"),
      mode: formData.get("mode"),
      pattern: formData.get("pattern"),
      categoryId: formData.get("categoryId"),
    });
    await classificationRuleService.createRule(user.id, input);
    emitFinancialEvent({ type: "personal_rule.changed" });
    return { ok: true };
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
