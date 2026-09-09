import Link from "next/link";
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { EmptyState } from "@/components/shared/empty-state";
import { MoneyAmount } from "@/components/financial/money-amount";
import { CalendarGrid, CalendarEventRow, EVENT_META, LAYER_META } from "@/components/calendar/calendar-grid";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { formatLongDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { QuickAddButton } from "@/features/capture/components/quick-add-button";
import {
  createCalendarService,
  type CalendarEvent,
  type CalendarEventKind,
} from "@/features/calendar/services/calendar-service";

const service = createCalendarService();

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const FILTERS: Array<{ key: string; label: string }> = [
  { key: "todos", label: "Todos" },
  { key: "income", label: "Ingresos" },
  { key: "expense", label: "Gastos" },
  { key: "obligation", label: "Obligaciones" },
  { key: "transfer", label: "Transferencias" },
];

function monthLabel(period: string): string {
  const [year, month] = period.split("-").map(Number);
  return `${MONTHS_ES[(month ?? 1) - 1]} ${year}`;
}

function shiftPeriod(period: string, delta: number): string {
  const [year, month] = period.split("-").map(Number);
  const base = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${base.getUTCFullYear()}-${String(base.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; day?: string; filter?: string; view?: string; currency?: string }>;
}) {
  const { period: periodParam, day: dayParam, filter: filterParam, view: viewParam, currency: currencyParam } = await searchParams;
  const user = await requireCurrentUser();

  const month = await service.getMonth({
    userId: user.id,
    timezone: user.timezone,
    baseCurrency: user.baseCurrency,
    currency: currencyParam,
    period: periodParam,
  });

  const { period, today, currencyCode, summary } = month;
  const view = viewParam === "agenda" ? "agenda" : "month";
  const currentPeriod = today.slice(0, 7);
  const layerLegend = ["CONFIRMED", "COMMITTED", "SCHEDULED", "OVERDUE"] as const;
  const activeFilter = FILTERS.some((f) => f.key === filterParam) ? filterParam! : "todos";
  const selectedDay = dayParam && /^\d{4}-\d{2}-\d{2}$/.test(dayParam) && dayParam.startsWith(period) ? dayParam : null;

  const visibleEvents =
    activeFilter === "todos" ? month.events : month.events.filter((event) => event.kind === (activeFilter as CalendarEventKind));

  const buildHref = (next: { period?: string; day?: string | null; filter?: string; view?: string; currency?: string | null }) => {
    const params = new URLSearchParams();
    const nextView = next.view ?? view;
    if (nextView !== "month") params.set("view", nextView);
    const nextPeriod = next.period ?? period;
    if (nextPeriod && nextPeriod !== currentPeriod) params.set("period", nextPeriod);
    const nextFilter = next.filter ?? activeFilter;
    if (nextFilter && nextFilter !== "todos") params.set("filter", nextFilter);
    const nextDay = next.day === undefined ? selectedDay : next.day;
    if (nextDay) params.set("day", nextDay);
    const nextCurrency = next.currency === undefined ? (currencyCode !== user.baseCurrency ? currencyCode : null) : next.currency;
    if (nextCurrency) params.set("currency", nextCurrency);
    const qs = params.toString();
    return qs ? `/calendar?${qs}` : "/calendar";
  };

  const dayEvents = selectedDay ? visibleEvents.filter((event) => event.date === selectedDay) : [];
  const upcoming = visibleEvents.filter((event) => event.date >= today).slice(0, 6);

  // spec 06 §6.1 — Mes | Agenda + Hoy en el header.
  const viewSwitch = (
    <div className="inline-flex rounded-lg border border-border bg-card p-0.5" role="group" aria-label="Vista del calendario">
      {(["month", "agenda"] as const).map((v) => (
        <Link
          key={v}
          href={buildHref({ view: v, day: null })}
          aria-current={view === v ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-1 text-small font-medium transition-colors",
            view === v ? "bg-brand-subtle text-brand" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {v === "month" ? "Mes" : "Agenda"}
        </Link>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Calendario"
        description="Tus finanzas en el tiempo: ingresos, gastos, cuotas y movimientos previstos."
        actions={
          <>
            {viewSwitch}
            {period !== currentPeriod ? (
              <Link
                href={buildHref({ period: currentPeriod, day: null })}
                className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-3 text-small font-medium text-foreground transition-colors hover:bg-secondary"
              >
                Hoy
              </Link>
            ) : null}
            <QuickAddButton>Agregar</QuickAddButton>
          </>
        }
      />

      {/* §6.4 / §0.1 — leyenda de estados temporales, detectable sin color */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-muted-foreground">
        {layerLegend.map((layer) => (
          <span key={layer} className="inline-flex items-center gap-1">
            <span aria-hidden className="font-medium text-foreground">{LAYER_META[layer].glyph}</span>
            {LAYER_META[layer].label}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={buildHref({ filter: f.key })}
            aria-current={f.key === activeFilter ? "true" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-small font-medium transition-[color,background-color,border-color,scale] active:scale-[0.97]",
              f.key === activeFilter
                ? "border-brand-border bg-brand-subtle text-brand"
                : "border-border bg-card text-foreground-secondary hover:bg-secondary",
            )}
          >
            {f.key !== "todos" ? (
              <span aria-hidden className={cn("size-2 rounded-full", EVENT_META[f.key as CalendarEventKind].dot)} />
            ) : null}
            {f.label}
          </Link>
        ))}
      </div>

      {view === "agenda" ? (
        <AgendaView events={visibleEvents} today={today} currencyCode={currencyCode} monthLabelText={monthLabel(period)} shiftHref={(d) => buildHref({ period: shiftPeriod(period, d), day: null })} />
      ) : (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-h3 text-foreground">{monthLabel(period)}</h2>
            <div className="flex items-center gap-1">
              <Link
                href={buildHref({ period: shiftPeriod(period, -1), day: null })}
                aria-label="Mes anterior"
                className="relative inline-flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-[color,background-color,scale] hover:bg-secondary hover:text-foreground active:scale-[0.96] after:absolute after:-inset-1 after:content-['']"
              >
                <ChevronLeftIcon className="size-4" />
              </Link>
              <Link
                href={buildHref({ period: shiftPeriod(period, 1), day: null })}
                aria-label="Mes siguiente"
                className="relative inline-flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-[color,background-color,scale] hover:bg-secondary hover:text-foreground active:scale-[0.96] after:absolute after:-inset-1 after:content-['']"
              >
                <ChevronRightIcon className="size-4" />
              </Link>
            </div>
          </div>

          {month.events.length === 0 ? (
            <EmptyState
              icon={<CalendarDaysIcon />}
              title="No hay movimientos este mes"
              description="Cuando cargues transacciones, cuotas o movimientos programados los vas a ver acá, ordenados por fecha."
            />
          ) : (
            <CalendarGrid
              period={period}
              today={today}
              selectedDay={selectedDay}
              events={visibleEvents}
              dayHref={(day) => buildHref({ day: day === selectedDay ? null : day })}
            />
          )}
        </div>

        <div className="flex flex-col gap-4">
          {month.presentCurrencies.length > 1 ? (
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Moneda del resumen">
              <span className="mr-1 text-caption text-muted-foreground">Resumen en:</span>
              {month.presentCurrencies.map((code) => (
                <a
                  key={code}
                  href={buildHref({ currency: code === user.baseCurrency ? null : code, day: undefined })}
                  aria-current={code === currencyCode ? "true" : undefined}
                  className={
                    code === currencyCode
                      ? "rounded-full border border-brand-border bg-brand-subtle px-3 py-1 text-caption font-medium text-brand"
                      : "rounded-full border border-border px-3 py-1 text-caption font-medium text-foreground-secondary hover:bg-secondary"
                  }
                >
                  {code}
                </a>
              ))}
            </div>
          ) : null}

          <SectionCard title="Resumen del mes">
            <dl className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <dt className="text-small text-muted-foreground">Ingresos</dt>
                <dd>
                  <MoneyAmount amount={summary.income} currency={currencyCode} variant="compact" tone="positive" className="text-small font-medium" />
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-small text-muted-foreground">Gastos</dt>
                <dd>
                  <MoneyAmount amount={`-${summary.expense}`} currency={currencyCode} variant="compact" className="text-small font-medium" />
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <dt className="text-small font-medium text-foreground">Neto del mes</dt>
                <dd>
                  <MoneyAmount amount={summary.net} currency={currencyCode} variant="compact" sign="always" tone="auto" className="text-small font-semibold" />
                </dd>
              </div>
            </dl>
          </SectionCard>

          <SectionCard title="Por estado temporal" eyebrow={currencyCode}>
            <dl className="flex flex-col gap-2.5 text-small">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">{LAYER_META.CONFIRMED.glyph} Confirmado (neto)</dt>
                <dd><MoneyAmount amount={summary.layers.confirmedNet} currency={currencyCode} variant="compact" sign="always" tone="auto" className="font-medium" /></dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">{LAYER_META.COMMITTED.glyph} Comprometido</dt>
                <dd><MoneyAmount amount={`-${summary.layers.committed}`} currency={currencyCode} variant="compact" className="font-medium" /></dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">{LAYER_META.SCHEDULED.glyph} Programado (neto)</dt>
                <dd><MoneyAmount amount={`-${summary.layers.scheduled}`} currency={currencyCode} variant="compact" sign="always" tone="auto" className="font-medium" /></dd>
              </div>
              {Number(summary.layers.overdue) > 0 ? (
                <div className="flex items-center justify-between">
                  <dt className="text-[var(--warning)]">{LAYER_META.OVERDUE.glyph} Vencido</dt>
                  <dd><MoneyAmount amount={`-${summary.layers.overdue}`} currency={currencyCode} variant="compact" className="font-medium text-[var(--warning)]" /></dd>
                </div>
              ) : null}
              <div className="flex items-center justify-between border-t border-border pt-2.5">
                <dt className="font-medium text-foreground">Saldo proyectado del mes</dt>
                <dd><MoneyAmount amount={summary.projectedNet} currency={currencyCode} variant="compact" sign="always" tone="auto" className="font-semibold" /></dd>
              </div>
            </dl>
            <p className="mt-2 text-caption text-muted-foreground">
              Es una proyección, no un saldo real: el saldo real siempre sale del ledger.
            </p>
          </SectionCard>

          {month.excludedCurrencies.length > 0 ? (
            <p className="text-caption text-muted-foreground">
              Este resumen es sólo en {currencyCode}. También hay eventos en {month.excludedCurrencies.join(", ")} — visibles en la
              grilla, sin sumarse (§10).
            </p>
          ) : null}

          <SectionCard title={selectedDay ? `Eventos del ${formatLongDate(selectedDay)}` : "Próximos eventos"}>
            {(selectedDay ? dayEvents : upcoming).length > 0 ? (
              <ul className="flex flex-col divide-y divide-border">
                {(selectedDay ? dayEvents : upcoming).map((event) => (
                  <li key={event.id}>
                    <CalendarEventRow event={event} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-small text-muted-foreground">
                {selectedDay ? "No hay eventos este día." : "No hay eventos próximos este mes."}
              </p>
            )}
          </SectionCard>
        </div>
      </div>
      )}
    </div>
  );
}

// spec 06 §7 — Vista Agenda: eventos en orden cronológico, agrupados por día, con un cierre por
// día (Entradas programadas / Salidas comprometidas / Cambio proyectado). Nunca llamar "saldo
// real" a un agregado futuro.
function dayHeading(date: string, today: string): string {
  const label = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short" }).format(new Date(`${date}T00:00:00`));
  if (date === today) return `Hoy · ${label}`;
  const diff = Math.round((new Date(`${date}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()) / 86_400_000);
  if (diff === 1) return `Mañana · ${label}`;
  if (diff > 1 && diff < 7) {
    const weekday = new Intl.DateTimeFormat("es-AR", { weekday: "long" }).format(new Date(`${date}T00:00:00`));
    return `${weekday} · ${label}`;
  }
  return label;
}

function AgendaView({
  events,
  today,
  currencyCode,
  monthLabelText,
  shiftHref,
}: {
  events: CalendarEvent[];
  today: string;
  currencyCode: string;
  monthLabelText: string;
  shiftHref: (delta: number) => string;
}) {
  const byDay = new Map<string, CalendarEvent[]>();
  for (const event of [...events].sort((a, b) => a.date.localeCompare(b.date))) {
    const list = byDay.get(event.date) ?? [];
    list.push(event);
    byDay.set(event.date, list);
  }
  const days = [...byDay.keys()];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-h3 capitalize text-foreground">{monthLabelText}</h2>
        <div className="flex items-center gap-1">
          <Link href={shiftHref(-1)} aria-label="Mes anterior" className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground">
            <ChevronLeftIcon className="size-4" />
          </Link>
          <Link href={shiftHref(1)} aria-label="Mes siguiente" className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground">
            <ChevronRightIcon className="size-4" />
          </Link>
        </div>
      </div>

      {days.length === 0 ? (
        <EmptyState icon={<CalendarDaysIcon />} title="No hay eventos este mes" description="Cuando cargues movimientos, cuotas o eventos programados los vas a ver acá en orden de fecha." />
      ) : (
        <ol className="flex flex-col gap-4">
          {days.map((date) => {
            const dayEvents = byDay.get(date)!;
            const income = dayEvents.filter((e) => e.kind === "income").reduce((s, e) => s + Number(e.amount), 0);
            const outflow = dayEvents.filter((e) => e.kind === "expense" || e.kind === "obligation").reduce((s, e) => s + Number(e.amount), 0);
            const net = income - outflow;
            return (
              <li key={date}>
                <SectionCard title={dayHeading(date, today)} contentClassName="gap-0">
                  <ul className="flex flex-col divide-y divide-border">
                    {dayEvents.map((event) => (
                      <li key={event.id}>
                        <CalendarEventRow event={event} />
                      </li>
                    ))}
                  </ul>
                  {income > 0 || outflow > 0 ? (
                    <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t border-border pt-3 text-caption">
                      <div className="flex items-baseline gap-1.5">
                        <dt className="text-muted-foreground">Entradas programadas</dt>
                        <dd><MoneyAmount amount={String(income)} currency={currencyCode} variant="compact" sign="always" tone="positive" className="font-medium" /></dd>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <dt className="text-muted-foreground">Salidas comprometidas</dt>
                        <dd><MoneyAmount amount={`-${outflow}`} currency={currencyCode} variant="compact" className="font-medium" /></dd>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <dt className="text-muted-foreground">Cambio proyectado</dt>
                        <dd><MoneyAmount amount={String(net)} currency={currencyCode} variant="compact" sign="always" tone="auto" className="font-medium" /></dd>
                      </div>
                    </dl>
                  ) : null}
                </SectionCard>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
