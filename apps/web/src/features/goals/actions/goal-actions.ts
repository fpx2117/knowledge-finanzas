"use server";

import { redirect } from "next/navigation";

import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { emitFinancialEvent } from "@/lib/events/emit-financial-event";
import { createGoalService } from "../services/goal-service";
import {
  archiveGoalSchema,
  contributeGoalSchema,
  createGoalSchema,
  updateGoalSchema,
} from "../schemas/goal-schemas";

const service = createGoalService();

export type GoalActionState = { ok: true } | { ok: false; error: ReturnType<typeof mapErrorToUi> };

function optional(value: FormDataEntryValue | null): string | undefined {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : undefined;
}

export async function createGoalAction(
  _previous: GoalActionState | null,
  formData: FormData,
): Promise<GoalActionState> {
  try {
    const user = await requireCurrentUser();
    const input = createGoalSchema.parse({
      name: formData.get("name"),
      category: formData.get("category"),
      currencyCode: formData.get("currencyCode"),
      targetAmount: formData.get("targetAmount"),
      initialAmount: optional(formData.get("initialAmount")),
      targetDate: optional(formData.get("targetDate")),
      notes: optional(formData.get("notes")),
    });
    await service.createGoal(user, input);
    emitFinancialEvent({ type: "goal.updated" });
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
  redirect("/goals");
}

export async function contributeGoalAction(
  _previous: GoalActionState | null,
  formData: FormData,
): Promise<GoalActionState> {
  try {
    const user = await requireCurrentUser();
    const input = contributeGoalSchema.parse({
      goalId: formData.get("goalId"),
      amount: formData.get("amount"),
    });
    await service.contribute(user, input.goalId, input.amount);
    emitFinancialEvent({ type: "goal.updated", entityPaths: [`/goals/${input.goalId}`] });
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
  return { ok: true };
}

export async function updateGoalAction(
  _previous: GoalActionState | null,
  formData: FormData,
): Promise<GoalActionState> {
  try {
    const user = await requireCurrentUser();
    const input = updateGoalSchema.parse({
      goalId: formData.get("goalId"),
      name: formData.get("name"),
      category: formData.get("category"),
      targetAmount: formData.get("targetAmount"),
      targetDate: optional(formData.get("targetDate")),
      notes: optional(formData.get("notes")),
    });
    await service.updateGoal(user, input);
    emitFinancialEvent({ type: "goal.updated", entityPaths: [`/goals/${input.goalId}`] });
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
  return { ok: true };
}

export async function archiveGoalAction(
  _previous: GoalActionState | null,
  formData: FormData,
): Promise<GoalActionState> {
  try {
    const user = await requireCurrentUser();
    const { goalId } = archiveGoalSchema.parse({ goalId: formData.get("goalId") });
    await service.archiveGoal(user, goalId);
    emitFinancialEvent({ type: "goal.updated" });
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
  redirect("/goals");
}
