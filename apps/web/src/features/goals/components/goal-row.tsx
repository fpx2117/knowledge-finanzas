import Link from "next/link";

import { ProgressBar } from "@/components/shared/progress-bar";
import { StatusChip } from "@/components/shared/status-chip";
import { MoneyAmount } from "@/components/financial/money-amount";
import { relativeDueLabel } from "@/lib/format";
import type { GoalDetail } from "@/features/goals/services/goal-service";
import { GOAL_CATEGORY_META, GOAL_PACE_META } from "@/features/goals/goal-meta";

export function GoalRow({ goal, today }: { goal: GoalDetail; today: string }) {
  const meta = GOAL_CATEGORY_META[goal.category];
  const Icon = meta.icon;
  const pace = GOAL_PACE_META[goal.pace.status];
  return (
    <li className="flex flex-col gap-2 py-3.5 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2.5">
          <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-md bg-brand-subtle text-brand">
            <Icon className="size-4" />
          </span>
          <span className="flex min-w-0 flex-col">
            <Link href={`/goals/${goal.id}`} className="truncate text-small font-medium text-foreground hover:text-brand hover:underline">
              {goal.name}
            </Link>
            <span className="flex items-center gap-1.5 text-caption text-muted-foreground">
              {meta.label}
              {goal.status === "ACTIVE" && pace.showChip ? (
                <StatusChip tone={pace.tone}>{pace.label}</StatusChip>
              ) : null}
            </span>
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-0.5">
          <span className="text-small font-medium tabular-nums text-foreground">{goal.percent}%</span>
          {goal.status === "ACTIVE" && goal.targetDate ? (
            <span className={goal.overdue ? "text-caption text-[var(--negative)]" : "text-caption text-muted-foreground"}>
              {relativeDueLabel(goal.targetDate, today)}
            </span>
          ) : goal.status === "COMPLETED" ? (
            <StatusChip tone="positive">Cumplida</StatusChip>
          ) : null}
        </span>
      </div>
      <ProgressBar
        value={goal.progress * 100}
        state={goal.status === "COMPLETED" ? "normal" : goal.overdue ? "warning" : "normal"}
        aria-label={`${goal.name}: ${goal.percent}% completado`}
      />
      <div className="flex justify-between text-caption text-muted-foreground">
        <MoneyAmount amount={goal.currentAmount} currency={goal.currencyCode} variant="compact" />
        <span>
          de <MoneyAmount amount={goal.targetAmount} currency={goal.currencyCode} variant="compact" />
        </span>
      </div>
    </li>
  );
}
