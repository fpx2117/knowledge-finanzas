import Link from "next/link";
import { TargetIcon } from "lucide-react";

import { Money, todayInTimezone } from "@know-finanzas/finance";

import { PageHeader } from "@/components/shared/page-header";
import { HeaderActions } from "@/components/shared/header-actions";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { InsightCard } from "@/components/shared/insight-card";
import { ProgressBar } from "@/components/shared/progress-bar";
import { StatusChip } from "@/components/shared/status-chip";
import { DonutChart, type DonutSegment } from "@/components/charts/donut-chart";
import { MoneyAmount } from "@/components/financial/money-amount";
import { Button } from "@/components/ui/button";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { formatLongDate, relativeDueLabel } from "@/lib/format";
import { createGoalService, type GoalDetail } from "@/features/goals/services/goal-service";
import { GOAL_CATEGORY_META } from "@/features/goals/goal-meta";

const service = createGoalService();

function GoalRow({ goal, today }: { goal: GoalDetail; today: string }) {
  const meta = GOAL_CATEGORY_META[goal.category];
  const Icon = meta.icon;
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
            <span className="text-caption text-muted-foreground">{meta.label}</span>
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

export default async function GoalsPage() {
  const user = await requireCurrentUser();
  const today = todayInTimezone(new Date(), user.timezone);
  const goals = await service.listGoals(user, today);

  const active = goals.filter((goal) => goal.status === "ACTIVE");
  const completed = goals.filter((goal) => goal.status === "COMPLETED");

  if (goals.filter((goal) => goal.status !== "ARCHIVED").length === 0) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader
          title="Metas"
          description="Convertí tus intenciones de ahorro en progreso medible."
          actions={
            <>
              <HeaderActions showPeriod={false} />
              <Button render={<Link href="/goals/new">Nueva meta</Link>} />
            </>
          }
        />
        <EmptyState
          icon={<TargetIcon />}
          title="Todavía no tenés metas"
          description="Definí un objetivo de ahorro —un viaje, un fondo de emergencia, una compra— y seguí cuánto te falta."
          action={<Button render={<Link href="/goals/new">Crear mi primera meta</Link>} />}
        />
      </div>
    );
  }

  const baseCurrency = user.baseCurrency;
  const inBase = (goal: GoalDetail) => goal.currencyCode === baseCurrency;
  const totalSaved = active
    .filter(inBase)
    .reduce((sum, goal) => sum.add(Money.fromString(goal.currentAmount, baseCurrency)), Money.zero(baseCurrency))
    .toString();
  const totalTarget = active
    .filter(inBase)
    .reduce((sum, goal) => sum.add(Money.fromString(goal.targetAmount, baseCurrency)), Money.zero(baseCurrency))
    .toString();

  const closest = [...active]
    .filter((goal) => goal.targetDate)
    .sort((a, b) => (a.targetDate ?? "").localeCompare(b.targetDate ?? ""))[0];

  const byCategory = new Map<string, number>();
  for (const goal of active.filter(inBase)) {
    byCategory.set(goal.category, (byCategory.get(goal.category) ?? 0) + Number(goal.currentAmount));
  }
  const donutSegments: DonutSegment[] = [...byCategory.entries()]
    .map(([category, value]) => ({
      label: GOAL_CATEGORY_META[category as GoalDetail["category"]].label,
      value,
      color: GOAL_CATEGORY_META[category as GoalDetail["category"]].color,
    }))
    .filter((segment) => segment.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Metas"
        description="Convertí tus intenciones de ahorro en progreso medible."
        actions={
          <>
            <HeaderActions showPeriod={false} />
            <Button render={<Link href="/goals/new">Nueva meta</Link>} />
          </>
        }
      />

      <section aria-label="Resumen de metas" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Ahorrado en metas" icon={TargetIcon} tone="positive" value={totalSaved} currency={baseCurrency} hint={`de ${new Intl.NumberFormat("es-AR").format(Number(totalTarget))} objetivo`} />
        <StatCard label="Metas activas">
          <span className="flex flex-col gap-0.5">
            <span className="text-metric font-medium text-foreground">{active.length}</span>
            <span className="text-small font-normal text-muted-foreground">{completed.length} ya cumplidas</span>
          </span>
        </StatCard>
        <StatCard label="Meta más próxima">
          {closest ? (
            <span className="flex flex-col gap-0.5">
              <span className="truncate text-body-lg font-medium text-foreground">{closest.name}</span>
              <span className="text-small font-normal text-muted-foreground">
                {closest.targetDate ? relativeDueLabel(closest.targetDate, today) : "Sin fecha"} · {closest.percent}%
              </span>
            </span>
          ) : (
            <span className="text-small text-muted-foreground">Ninguna meta activa tiene fecha objetivo.</span>
          )}
        </StatCard>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        <SectionCard title="Tus metas" contentClassName="gap-0">
          {active.length > 0 ? (
            <ul className="flex flex-col divide-y divide-border">
              {active.map((goal) => (
                <GoalRow key={goal.id} goal={goal} today={today} />
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-small text-muted-foreground">No tenés metas activas.</p>
          )}
        </SectionCard>

        <div className="flex flex-col gap-4">
          <SectionCard title="Distribución del ahorro">
            {donutSegments.length > 0 ? (
              <DonutChart segments={donutSegments} centerLabel="Ahorrado" centerValue={`${baseCurrency} ${new Intl.NumberFormat("es-AR").format(Number(totalSaved))}`} />
            ) : (
              <p className="py-6 text-center text-small text-muted-foreground">Registrá aportes para ver la distribución.</p>
            )}
          </SectionCard>
          {closest ? (
            <InsightCard title="Sugerencia">
              <p>
                Para llegar a <strong className="text-foreground">{closest.name}</strong>
                {closest.targetDate && closest.daysLeft && closest.daysLeft > 0 ? (
                  <>
                    {" "}necesitás apartar{" "}
                    <strong className="text-foreground">
                      <MoneyAmount
                        amount={String(Math.ceil(Number(closest.remainingAmount) / Math.max(1, Math.ceil(closest.daysLeft / 30))))}
                        currency={closest.currencyCode}
                        variant="compact"
                      />
                    </strong>{" "}
                    por mes.
                  </>
                ) : (
                  <> te falta <MoneyAmount amount={closest.remainingAmount} currency={closest.currencyCode} variant="compact" />.</>
                )}
              </p>
            </InsightCard>
          ) : null}
        </div>
      </div>

      {completed.length > 0 ? (
        <SectionCard title="Metas cumplidas">
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
        </SectionCard>
      ) : null}
    </div>
  );
}
