import Link from "next/link";
import { ArrowRightIcon, MinusIcon, SparklesIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { HeaderActions } from "@/components/shared/header-actions";
import { SectionCard } from "@/components/shared/section-card";
import { EmptyState } from "@/components/shared/empty-state";
import { TabBar } from "@/components/shared/tab-bar";
import { ProgressBar } from "@/components/shared/progress-bar";
import { StatusChip, type ChipTone } from "@/components/shared/status-chip";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { cn } from "@/lib/utils";
import { createInsightService, type AnalyticalCard, type HealthBand, type InsightTab } from "@/features/insights/services/insight-service";

const service = createInsightService();

const TABS: Array<{ key: InsightTab; label: string; ready: boolean }> = [
  { key: "resumen", label: "Resumen", ready: true },
  { key: "gastos", label: "Gastos", ready: false },
  { key: "ingresos", label: "Ingresos", ready: false },
  { key: "ahorro", label: "Ahorro", ready: false },
  { key: "deudas", label: "Deudas", ready: false },
  { key: "habitos", label: "Hábitos", ready: false },
];

const BAND_META: Record<HealthBand, { label: string; tone: ChipTone; ring: string }> = {
  solida: { label: "Sólida", tone: "positive", ring: "var(--success-vivid)" },
  estable: { label: "Estable", tone: "info", ring: "var(--chart-1)" },
  ajustada: { label: "Ajustada", tone: "warning", ring: "var(--warning-vivid)" },
  riesgo: { label: "En riesgo", tone: "negative", ring: "var(--negative-vivid)" },
};

function periodLabel(period: string): string {
  const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const [year, month] = period.split("-").map(Number);
  return `${months[(month ?? 1) - 1]} de ${year}`;
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.max(0, Math.min(100, score)) / 100) * circumference;
  return (
    <div className="relative size-32 shrink-0">
      <svg viewBox="0 0 128 128" className="size-32 -rotate-90" role="img" aria-label={`Puntaje de salud financiera: ${score} de 100`}>
        <circle cx="64" cy="64" r={radius} fill="none" stroke="var(--secondary)" strokeWidth="10" />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-metric-xl font-medium tabular-nums text-foreground">{score}</span>
        <span className="text-caption text-muted-foreground">de 100</span>
      </div>
    </div>
  );
}

const TREND_ICON = { up: TrendingUpIcon, down: TrendingDownIcon, flat: MinusIcon };

function InterpretiveCard({ card }: { card: AnalyticalCard }) {
  const Icon = card.trend ? TREND_ICON[card.trend] : SparklesIcon;
  return (
    <div className="relative flex flex-col gap-1.5 overflow-hidden rounded-xl border border-brand-border bg-brand-subtle p-4">
      <div aria-hidden className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-primary/10 blur-2xl" />
      <div className="flex items-center gap-2">
        <Icon aria-hidden className="size-4 text-brand" />
        <h3 className="text-small font-medium text-foreground">{card.title}</h3>
      </div>
      <p className="text-small text-foreground-secondary">{card.body}</p>
    </div>
  );
}

function NotReady({ label }: { label: string }) {
  return (
    <EmptyState
      icon={<SparklesIcon />}
      title={`Insights de ${label.toLowerCase()} en preparación`}
      description="Esta lectura llega en una próxima iteración. El Resumen ya cubre tu salud financiera, el análisis del gasto y una recomendación accionable."
    />
  );
}

export default async function InsightsPage({ searchParams }: { searchParams: Promise<{ period?: string; tab?: string }> }) {
  const { period: periodParam, tab: tabParam } = await searchParams;
  const user = await requireCurrentUser();
  const data = await service.getInsights({ userId: user.id, timezone: user.timezone, baseCurrency: user.baseCurrency, period: periodParam });

  const activeTab = (TABS.find((tab) => tab.key === tabParam)?.key ?? "resumen") as InsightTab;
  const { health, analytical, personalized, recommendation } = data;
  const band = BAND_META[health.band];

  const periodQuery = periodParam ? `&period=${periodParam}` : "";
  const tabs = TABS.map((tab) => ({
    key: tab.key,
    label: tab.label,
    href: tab.key === "resumen" ? `/insights${periodParam ? `?period=${periodParam}` : ""}` : `/insights?tab=${tab.key}${periodQuery}`,
  }));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Insights"
        description={`Patrones y recomendaciones — ${periodLabel(data.period)}.`}
        actions={<HeaderActions />}
      />

      <TabBar tabs={tabs} active={activeTab} />

      {activeTab !== "resumen" ? (
        <NotReady label={TABS.find((tab) => tab.key === activeTab)?.label ?? "esta sección"} />
      ) : (
        <>
          <SectionCard title="Salud financiera" info="Un puntaje calculado con tus datos reales: tasa de ahorro, colchón de emergencia, tendencia de los últimos meses y cumplimiento de presupuestos.">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <ScoreRing score={health.score} color={band.ring} />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <StatusChip tone={band.tone} className="w-fit">{band.label}</StatusChip>
                <p className="text-body-lg font-medium text-foreground">{health.headline}</p>
                <ul className="flex flex-col gap-1 text-small text-muted-foreground">
                  {health.reasons.map((reason) => (
                    <li key={reason} className="flex gap-1.5">
                      <span aria-hidden className="text-muted-foreground">·</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-3 border-t border-border pt-4 sm:grid-cols-2">
              {health.components.map((component) => (
                <div key={component.key} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-small font-medium text-foreground">{component.label}</dt>
                    <dd className="text-caption tabular-nums text-muted-foreground">{Math.round(component.score * 100)}/100</dd>
                  </div>
                  <ProgressBar
                    value={component.score * 100}
                    state={component.score >= 0.6 ? "normal" : component.score >= 0.35 ? "warning" : "exceeded"}
                    aria-label={`${component.label}: ${Math.round(component.score * 100)} de 100`}
                  />
                  <p className="text-caption text-muted-foreground">{component.detail}</p>
                </div>
              ))}
            </dl>
          </SectionCard>

          <section aria-label="Análisis" className="flex flex-col gap-3">
            <h2 className="text-h3 text-foreground">Qué dicen tus números</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {analytical.map((card) => (
                <InterpretiveCard key={card.title} card={card} />
              ))}
            </div>
          </section>

          <section aria-label="Insights personalizados" className="flex flex-col gap-3">
            <h2 className="text-h3 text-foreground">Para tener en cuenta</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {personalized.map((card) => (
                <InterpretiveCard key={card.title} card={card} />
              ))}
            </div>
          </section>

          <div className={cn("relative overflow-hidden rounded-xl border border-brand-border bg-brand-subtle p-5")}>
            <div aria-hidden className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-primary/10 blur-3xl" />
            <div className="flex items-center gap-2">
              <SparklesIcon aria-hidden className="size-4 text-brand" />
              <h3 className="text-body font-medium text-foreground">Recomendación principal</h3>
            </div>
            <p className="mt-2 max-w-2xl text-small text-foreground-secondary">{recommendation.text}</p>
            <Link
              href={recommendation.ctaHref}
              className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-small font-medium text-white transition-[background-color,scale] hover:bg-brand-hover active:scale-[0.97]"
            >
              {recommendation.ctaLabel}
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
