import Link from "next/link";
import { TrophyIcon } from "lucide-react";

import { todayInTimezone } from "@know-finanzas/finance";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { EmptyState } from "@/components/shared/empty-state";
import { MoneyAmount } from "@/components/financial/money-amount";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { formatLongDate } from "@/lib/format";
import { createGoalService } from "@/features/goals/services/goal-service";
import { GOAL_CATEGORY_META } from "@/features/goals/goal-meta";

const service = createGoalService();

// WP-ROUTES-SUBVIEWS (spec 07 §8 "Completadas").
export default async function CompletedGoalsPage() {
  const user = await requireCurrentUser();
  const today = todayInTimezone(new Date(), user.timezone);
  const goals = await service.listGoals(user, today);
  const completed = goals.filter((goal) => goal.status === "COMPLETED");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Metas / Completadas" description="Objetivos de ahorro que ya cumpliste." />

      <SectionCard title="Completadas" eyebrow={`${completed.length}`} contentClassName="gap-0">
        {completed.length === 0 ? (
          <EmptyState icon={<TrophyIcon />} title="Todavía no completaste ninguna meta" description="Cuando alcances el monto objetivo de una meta, va a aparecer acá." />
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {completed.map((goal) => {
              const meta = GOAL_CATEGORY_META[goal.category];
              return (
                <li key={goal.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span className="flex min-w-0 flex-col">
                    <Link href={`/goals/${goal.id}`} className="truncate text-small font-medium text-foreground hover:text-brand hover:underline">
                      {goal.name}
                    </Link>
                    <span className="text-caption text-muted-foreground">
                      {meta.label}
                      {goal.completedAt ? ` · ${formatLongDate(goal.completedAt)}` : ""}
                    </span>
                  </span>
                  <MoneyAmount amount={goal.targetAmount} currency={goal.currencyCode} variant="compact" tone="positive" className="text-small font-medium" />
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
