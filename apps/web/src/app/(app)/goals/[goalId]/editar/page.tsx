import { notFound } from "next/navigation";

import { todayInTimezone } from "@know-finanzas/finance";
import { isApplicationError } from "@know-finanzas/shared";

import { FormPage } from "@/components/shared/form-page";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { GoalForm } from "@/features/goals/components/goal-form";
import { createGoalService, type GoalDetail } from "@/features/goals/services/goal-service";

const service = createGoalService();

export default async function EditGoalPage({ params }: { params: Promise<{ goalId: string }> }) {
  const { goalId } = await params;
  const user = await requireCurrentUser();
  const today = todayInTimezone(new Date(), user.timezone);

  let goal: GoalDetail;
  try {
    goal = await service.getGoalDetail(user, goalId, today);
  } catch (error) {
    if (isApplicationError(error) && error.code === "GOAL_NOT_FOUND") notFound();
    throw error;
  }

  if (goal.status !== "ACTIVE") notFound();

  return (
    <FormPage backHref={`/goals/${goal.id}`} backLabel="Volver a la meta" eyebrow="Editar meta" title={`Editar «${goal.name}»`}>
      <GoalForm
        baseCurrency={user.baseCurrency}
        goal={{
          id: goal.id,
          name: goal.name,
          category: goal.category,
          currencyCode: goal.currencyCode,
          targetAmount: goal.targetAmount,
          targetDate: goal.targetDate,
          notes: goal.notes,
        }}
      />
    </FormPage>
  );
}
