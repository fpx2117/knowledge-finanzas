import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, CalendarIcon } from "lucide-react";

import { todayInTimezone } from "@know-finanzas/finance";
import { isApplicationError } from "@know-finanzas/shared";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatusChip, type ChipTone } from "@/components/shared/status-chip";
import { ProgressBar } from "@/components/shared/progress-bar";
import { MoneyAmount } from "@/components/financial/money-amount";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { formatLongDate, relativeDueLabel } from "@/lib/format";
import { createGoalService, type GoalDetail } from "@/features/goals/services/goal-service";
import { GoalActions } from "@/features/goals/components/goal-actions";
import { GOAL_CATEGORY_META } from "@/features/goals/goal-meta";

const service = createGoalService();

const STATUS_META: Record<GoalDetail["status"], { label: string; tone: ChipTone }> = {
  ACTIVE: { label: "En curso", tone: "info" },
  COMPLETED: { label: "Cumplida", tone: "positive" },
  ARCHIVED: { label: "Archivada", tone: "neutral" },
};

export default async function GoalDetailPage({ params }: { params: Promise<{ goalId: string }> }) {
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

  const meta = GOAL_CATEGORY_META[goal.category];
  const Icon = meta.icon;
  const status = STATUS_META[goal.status];

  return (
    <div className="flex flex-col gap-8">
      <Link href="/goals" className="inline-flex items-center gap-1.5 text-small font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" /> Volver a metas
      </Link>

      <PageHeader
        title={goal.name}
        description={meta.label}
        actions={<GoalActions goalId={goal.id} currencyCode={goal.currencyCode} remainingAmount={goal.remainingAmount} currentAmount={goal.currentAmount} status={goal.status} />}
      />

      <SectionCard title="Progreso">
        <div className="flex items-center gap-3">
          <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-subtle text-brand">
            <Icon className="size-5" />
          </span>
          <div className="flex flex-1 flex-col gap-0.5">
            <span className="flex items-baseline gap-2">
              <MoneyAmount amount={goal.currentAmount} currency={goal.currencyCode} className="text-metric font-medium" />
              <span className="text-small text-muted-foreground">
                de <MoneyAmount amount={goal.targetAmount} currency={goal.currencyCode} variant="compact" />
              </span>
            </span>
            <span className="text-small text-muted-foreground">
              {goal.percent}% completado
              {goal.status === "ACTIVE" ? (
                <>
                  {" "}· te falta <MoneyAmount amount={goal.remainingAmount} currency={goal.currencyCode} variant="compact" />
                </>
              ) : null}
            </span>
          </div>
          <StatusChip tone={status.tone}>{status.label}</StatusChip>
        </div>
        <ProgressBar
          value={goal.progress * 100}
          state={goal.status === "COMPLETED" ? "normal" : goal.overdue ? "warning" : "normal"}
          aria-label={`${goal.percent}% completado`}
          className="h-2.5"
        />
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SectionCard title="Detalles">
          <dl className="flex flex-col gap-3 text-small">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Categoría</dt>
              <dd className="font-medium text-foreground">{meta.label}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Moneda</dt>
              <dd className="font-medium text-foreground">{goal.currencyCode}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Fecha objetivo</dt>
              <dd className="flex items-center gap-1.5 font-medium text-foreground">
                {goal.targetDate ? (
                  <>
                    <CalendarIcon className="size-3.5 text-muted-foreground" />
                    {formatLongDate(goal.targetDate)}
                    <span className={goal.overdue ? "text-caption font-normal text-[var(--negative)]" : "text-caption font-normal text-muted-foreground"}>
                      ({relativeDueLabel(goal.targetDate, today)})
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Sin fecha</span>
                )}
              </dd>
            </div>
            {goal.completedAt ? (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Cumplida el</dt>
                <dd className="font-medium text-foreground">{formatLongDate(goal.completedAt)}</dd>
              </div>
            ) : null}
          </dl>
        </SectionCard>

        {goal.notes ? (
          <SectionCard title="Notas">
            <p className="whitespace-pre-wrap text-small text-foreground-secondary">{goal.notes}</p>
          </SectionCard>
        ) : null}
      </div>
    </div>
  );
}
