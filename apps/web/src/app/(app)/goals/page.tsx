import Link from "next/link";
import { TargetIcon } from "lucide-react";

import { Money, todayInTimezone } from "@know-finanzas/finance";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { InsightCard } from "@/components/shared/insight-card";
import { TabBar } from "@/components/shared/tab-bar";
import { DonutChart, type DonutSegment } from "@/components/charts/donut-chart";
import { MoneyAmount } from "@/components/financial/money-amount";
import { Button } from "@/components/ui/button";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { formatLongDate, relativeDueLabel } from "@/lib/format";
import { createGoalService, type GoalDetail } from "@/features/goals/services/goal-service";
import { GOAL_CATEGORY_META } from "@/features/goals/goal-meta";
import { GoalRow } from "@/features/goals/components/goal-row";

const service = createGoalService();

const TABS = [
  { key: "todas", label: "Todas", href: "/goals" },
  { key: "activas", label: "Activas", href: "/goals?status=activas" },
  { key: "completadas", label: "Completadas", href: "/goals?status=completadas" },
] as const;

// spec 07 §9.1 — orden P0: primero las que requieren atención, después fecha objetivo ascendente
// (las sin fecha al final), después nombre. "Requiere atención" = vencida o el ritmo pide más.
function needsAttention(goal: GoalDetail): boolean {
  return goal.overdue || goal.pace.status === "NEEDS_MORE" || goal.pace.status === "DATE_PASSED";
}

function compareGoals(a: GoalDetail, b: GoalDetail): number {
  const attention = Number(needsAttention(b)) - Number(needsAttention(a));
  if (attention !== 0) return attention;
  const dateDiff = (a.targetDate ?? "9999-99").localeCompare(b.targetDate ?? "9999-99");
  if (dateDiff !== 0) return dateDiff;
  return a.name.localeCompare(b.name);
}

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeTab = TABS.some((tab) => tab.key === status) ? status! : "todas";

  const user = await requireCurrentUser();
  const today = todayInTimezone(new Date(), user.timezone);
  const goals = await service.listGoals(user, today);

  const active = goals.filter((goal) => goal.status === "ACTIVE").sort(compareGoals);
  const completed = goals
    .filter((goal) => goal.status === "COMPLETED")
    .sort((a, b) => (b.completedAt?.toISOString() ?? "").localeCompare(a.completedAt?.toISOString() ?? ""));

  const header = (
    <PageHeader
      title="Metas"
      description="Convertí tus objetivos en un plan de ahorro medible."
      actions={<Button render={<Link href="/goals/new">Nueva meta</Link>} />}
    />
  );

  if (goals.filter((goal) => goal.status !== "ARCHIVED").length === 0) {
    return (
      <div className="flex flex-col gap-8">
        {header}
        <EmptyState
          icon={<TargetIcon />}
          title="Todavía no tenés metas"
          description="Definí un objetivo de ahorro —un viaje, un fondo de emergencia, una compra— y seguí cuánto te falta."
          action={<Button render={<Link href="/goals/new">Crear mi primera meta</Link>} />}
        />
      </div>
    );
  }

  // §8.3 resumen superior — nunca fusiona monedas ni inventa un total convertido (§0.2 / §33.1).
  const activeCurrencies = [...new Set(active.map((goal) => goal.currencyCode))].sort();
  const savedByCurrency = activeCurrencies.map((code) => ({
    code,
    amount: active
      .filter((goal) => goal.currencyCode === code)
      .reduce((sum, goal) => sum.add(Money.fromString(goal.currentAmount, code)), Money.zero(code))
      .toString(),
  }));
  const singleCurrency = activeCurrencies.length === 1 ? activeCurrencies[0] : null;
  const totalTarget = singleCurrency
    ? active
        .reduce((sum, goal) => sum.add(Money.fromString(goal.targetAmount, singleCurrency)), Money.zero(singleCurrency))
        .toString()
    : null;

  const closest = active.filter((goal) => goal.targetDate)[0];

  const byCategory = new Map<string, number>();
  if (singleCurrency) {
    for (const goal of active) {
      byCategory.set(goal.category, (byCategory.get(goal.category) ?? 0) + Number(goal.currentAmount));
    }
  }
  const donutSegments: DonutSegment[] = [...byCategory.entries()]
    .map(([category, value]) => ({
      label: GOAL_CATEGORY_META[category as GoalDetail["category"]].label,
      value,
      color: GOAL_CATEGORY_META[category as GoalDetail["category"]].color,
    }))
    .filter((segment) => segment.value > 0)
    .sort((a, b) => b.value - a.value);

  const listGoals = activeTab === "completadas" ? completed : active;

  return (
    <div className="flex flex-col gap-8">
      {header}

      <TabBar tabs={TABS.map((tab) => ({ ...tab }))} active={activeTab} />

      <section aria-label="Resumen de metas" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Metas activas">
          <span className="flex flex-col gap-0.5">
            <span className="text-metric font-medium text-foreground">{active.length}</span>
            <span className="text-small font-normal text-muted-foreground">{completed.length} ya cumplidas</span>
          </span>
        </StatCard>

        <StatCard label="Ahorrado en metas" icon={TargetIcon} tone={savedByCurrency.length === 1 ? "positive" : undefined}>
          {savedByCurrency.length === 0 ? (
            <span className="text-metric font-medium text-foreground">—</span>
          ) : savedByCurrency.length === 1 ? (
            <MoneyAmount
              amount={savedByCurrency[0].amount}
              currency={savedByCurrency[0].code}
              className="text-metric font-medium text-foreground"
            />
          ) : (
            <ul className="flex flex-col gap-1 pt-0.5">
              {savedByCurrency.map((entry) => (
                <li key={entry.code} className="flex items-baseline justify-between gap-3 text-small">
                  <span className="text-muted-foreground">{entry.code}</span>
                  <MoneyAmount amount={entry.amount} currency={entry.code} variant="compact" className="font-medium text-foreground" />
                </li>
              ))}
            </ul>
          )}
        </StatCard>

        <StatCard label="Objetivo total">
          {totalTarget && singleCurrency ? (
            <MoneyAmount amount={totalTarget} currency={singleCurrency} className="text-metric font-medium text-foreground" />
          ) : (
            <span className="text-small text-muted-foreground">
              Tus metas activas usan varias monedas; no se suma un total.
            </span>
          )}
        </StatCard>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        <SectionCard
          title={activeTab === "completadas" ? "Metas cumplidas" : "Metas activas"}
          contentClassName="gap-0"
        >
          {listGoals.length > 0 ? (
            <ul className="flex flex-col divide-y divide-border">
              {listGoals.map((goal) => (
                <GoalRow key={goal.id} goal={goal} today={today} />
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-small text-muted-foreground">
              {activeTab === "completadas" ? "Todavía no completaste ninguna meta." : "No tenés metas activas."}
            </p>
          )}
        </SectionCard>

        <div className="flex flex-col gap-4">
          {donutSegments.length > 0 && singleCurrency ? (
            <SectionCard title="Distribución del ahorro">
              <DonutChart
                segments={donutSegments}
                centerLabel="Ahorrado"
                centerValue={`${singleCurrency} ${new Intl.NumberFormat("es-AR").format(Number(savedByCurrency[0].amount))}`}
              />
            </SectionCard>
          ) : null}

          {closest ? (
            <InsightCard title="Sugerencia">
              <p>
                Para llegar a <strong className="text-foreground">{closest.name}</strong>
                {closest.targetDate ? <> ({relativeDueLabel(closest.targetDate, today)})</> : null}
                {closest.pace.requiredBeforeDate ? (
                  <>
                    {" "}necesitás aportar{" "}
                    <strong className="text-foreground">
                      <MoneyAmount amount={closest.pace.requiredBeforeDate} currency={closest.currencyCode} variant="compact" />
                    </strong>{" "}
                    antes de la fecha.
                  </>
                ) : closest.pace.requiredMonthly ? (
                  <>
                    {" "}necesitás apartar aprox.{" "}
                    <strong className="text-foreground">
                      <MoneyAmount amount={closest.pace.requiredMonthly} currency={closest.currencyCode} variant="compact" />
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

      {activeTab === "todas" && completed.length > 0 ? (
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
