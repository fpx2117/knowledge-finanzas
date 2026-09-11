"use client";

import { ArrowRightIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";

import type { KaiAction, KaiResponse, KaiVisualState } from "@know-finanzas/kai";

import { cn } from "@/lib/utils";
import { formatMoney, type KaiChartData, type KaiTableData } from "@know-finanzas/kai";
import { DonutChart } from "@/components/charts/donut-chart";

const CHART_COLORS = ["var(--chart-1)", "var(--chart-5)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--border-strong)"];

const ACCENT: Record<KaiVisualState, { dot: string; chip: string; fill: string }> = {
  NEUTRAL: { dot: "bg-[var(--color-kai-neutral)]", chip: "text-[var(--color-kai-neutral)]", fill: "bg-[var(--color-kai-neutral)] text-white" },
  ANALYTICAL: { dot: "bg-[var(--color-kai-analytical)]", chip: "text-[var(--color-kai-analytical)]", fill: "bg-[var(--color-kai-analytical)] text-white" },
  ALERT: { dot: "bg-[var(--color-kai-alert)]", chip: "text-[var(--color-kai-alert)]", fill: "bg-[var(--color-kai-alert)] text-white" },
  POSITIVE: { dot: "bg-[var(--color-kai-positive)]", chip: "text-[var(--color-kai-positive)]", fill: "bg-[var(--color-kai-positive)] text-white" },
};

type MetricValue = { label: string; amount: string; currencyCode: string; hint?: string };

export function KaiResponseCard({
  response,
  onAction,
}: {
  response: KaiResponse;
  onAction: (action: KaiAction) => void;
}) {
  const accent = ACCENT[response.state];
  const values = (response.data as { values?: MetricValue[] } | undefined)?.values ?? [];
  const chart = response.type === "KAI_CHART" ? (response.data as KaiChartData | undefined)?.chart : undefined;
  const table = response.type === "KAI_TABLE" ? (response.data as KaiTableData | undefined)?.table : undefined;
  const comparison =
    response.type === "KAI_COMPARISON"
      ? (response.data as
          | { current: string; previous: string; currencyCode: string; variationPercent: number; direction: "up" | "down" | "flat" }
          | undefined)
      : undefined;

  return (
    <div className="flex max-w-[92%] flex-col gap-2 self-start rounded-2xl border border-border bg-card px-3.5 py-3 text-small shadow-[var(--shadow-sm)]">
      {response.title ? (
        <div className="flex items-center gap-2">
          <span className={cn("size-1.5 rounded-full", accent.dot)} aria-hidden />
          <span className="text-caption font-semibold uppercase tracking-wide text-muted-foreground">{response.title}</span>
        </div>
      ) : null}

      <p className="whitespace-pre-wrap text-foreground-secondary">{response.body}</p>

      {values.length > 0 ? (
        <ul className="mt-0.5 flex flex-col gap-1 rounded-lg bg-secondary/60 p-2">
          {values.slice(0, 6).map((value, index) => (
            <li key={index} className="flex items-baseline justify-between gap-3">
              <span className="truncate text-caption text-muted-foreground">{value.label}</span>
              <span className="shrink-0 text-small font-medium tabular-nums text-foreground">
                {formatMoney(value.amount, value.currencyCode)}
                {value.hint ? <span className="ml-1 text-caption font-normal text-muted-foreground">· {value.hint}</span> : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {chart && chart.segments.length > 0 && chart.kind === "bar" ? (
        <div className="mt-1 flex flex-col gap-2 rounded-lg border border-border bg-card p-2.5">
          {chart.segments.map((s, i) => {
            const pct = Number(chart.total) > 0 ? Math.round((s.value / Number(chart.total)) * 100) : 0;
            return (
              <div key={i} className="flex items-center gap-2 text-caption">
                <span className="size-2 shrink-0 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} aria-hidden />
                <span className="w-24 shrink-0 truncate text-foreground-secondary">{s.label}</span>
                <span className="w-20 shrink-0 text-right font-medium tabular-nums text-foreground">{s.display}</span>
                <span className="w-8 shrink-0 text-right tabular-nums text-muted-foreground">{pct}%</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                  <span
                    className="kai-bar block h-full rounded-full"
                    style={{
                      width: `${Math.max(3, pct)}%`,
                      background: CHART_COLORS[i % CHART_COLORS.length],
                      animationDelay: `${i * 70}ms`,
                    }}
                  />
                </span>
              </div>
            );
          })}
        </div>
      ) : chart && chart.segments.length > 0 ? (
        <div className="mt-1 rounded-lg bg-secondary/40 p-2.5">
          <DonutChart
            segments={chart.segments.map((s, i) => ({
              label: s.label,
              value: s.value,
              color: CHART_COLORS[i % CHART_COLORS.length],
              display: s.display,
            }))}
            centerLabel="Total"
            centerValue={formatMoney(chart.total, chart.currencyCode)}
          />
        </div>
      ) : null}

      {comparison ? (
        <div className="mt-1 flex items-stretch gap-2 rounded-lg border border-border bg-card p-2.5">
          <div className="flex flex-1 flex-col">
            <span className="text-caption text-muted-foreground">Ahora</span>
            <span className="text-small font-semibold tabular-nums text-foreground">
              {formatMoney(comparison.current, comparison.currencyCode)}
            </span>
          </div>
          <div className="flex flex-1 flex-col border-l border-border pl-2">
            <span className="text-caption text-muted-foreground">Antes</span>
            <span className="text-small font-medium tabular-nums text-foreground-secondary">
              {formatMoney(comparison.previous, comparison.currencyCode)}
            </span>
          </div>
          <div
            className={cn(
              "flex items-center gap-1 self-center rounded-full px-2 py-0.5 text-caption font-semibold tabular-nums",
              comparison.direction === "up"
                ? "bg-warning-soft text-[var(--warning)]"
                : comparison.direction === "down"
                  ? "bg-success-soft text-[var(--success)]"
                  : "bg-secondary text-muted-foreground",
            )}
          >
            {comparison.direction === "up" ? (
              <TrendingUpIcon className="size-3.5" />
            ) : comparison.direction === "down" ? (
              <TrendingDownIcon className="size-3.5" />
            ) : null}
            {comparison.direction === "flat" ? "≈" : `${comparison.variationPercent > 0 ? "+" : ""}${comparison.variationPercent}%`}
          </div>
        </div>
      ) : null}

      {table && table.rows.length > 0 ? (
        <div className="mt-1 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-caption">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
                {table.columns.map((col, i) => (
                  <th key={i} className={cn("px-2.5 py-1.5 font-medium", i === table.columns.length - 1 && "text-right")}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, ri) => {
                const tone = table.rowTone?.[ri];
                return (
                  <tr key={ri} className="border-b border-border last:border-0">
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className={cn(
                          "px-2.5 py-1.5",
                          ci === 0 && tone === "overdue" && "font-medium text-[var(--color-kai-alert)]",
                          ci === 0 && tone === "due-soon" && "font-medium text-foreground",
                          ci === row.length - 1 && "whitespace-nowrap text-right tabular-nums",
                          ci !== 0 && ci !== row.length - 1 && "text-foreground-secondary",
                        )}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {response.actions && response.actions.length > 0 ? (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {response.actions.map((action, index) => {
            const primary =
              action.kind === "confirm-create" ||
              action.kind === "confirm-goal-allocation" ||
              action.kind === "confirm-void";
            return (
              <button
                key={index}
                type="button"
                onClick={() => onAction(action)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-caption font-medium transition-colors",
                  primary
                    ? cn(accent.fill, "hover:brightness-110")
                    : cn("border border-border hover:bg-secondary", accent.chip),
                )}
              >
                {action.label}
                {action.kind === "navigate" ? <ArrowRightIcon className="size-3" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
