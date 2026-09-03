import Link from "next/link";
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { HeaderActions } from "@/components/shared/header-actions";
import { SectionCard } from "@/components/shared/section-card";
import { InsightCard } from "@/components/shared/insight-card";
import { EmptyState } from "@/components/shared/empty-state";
import { MoneyAmount } from "@/components/financial/money-amount";
import { CalendarGrid, CalendarEventRow, EVENT_META } from "@/components/calendar/calendar-grid";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { formatLongDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  createCalendarService,
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
  searchParams: Promise<{ period?: string; day?: string; filter?: string }>;
}) {
  const { period: periodParam, day: dayParam, filter: filterParam } = await searchParams;
  const user = await requireCurrentUser();

  const month = await service.getMonth({
    userId: user.id,
    timezone: user.timezone,
    baseCurrency: user.baseCurrency,
    period: periodParam,
  });

  const { period, today, currencyCode, summary } = month;
  const activeFilter = FILTERS.some((f) => f.key === filterParam) ? filterParam! : "todos";
  const selectedDay = dayParam && /^\d{4}-\d{2}-\d{2}$/.test(dayParam) && dayParam.startsWith(period) ? dayParam : null;

  const visibleEvents =
    activeFilter === "todos" ? month.events : month.events.filter((event) => event.kind === (activeFilter as CalendarEventKind));

  const buildHref = (next: { period?: string; day?: string | null; filter?: string }) => {
    const params = new URLSearchParams();
    const nextPeriod = next.period ?? period;
    if (nextPeriod) params.set("period", nextPeriod);
    const nextFilter = next.filter ?? activeFilter;
    if (nextFilter && nextFilter !== "todos") params.set("filter", nextFilter);
    const nextDay = next.day === undefined ? selectedDay : next.day;
    if (nextDay) params.set("day", nextDay);
    const qs = params.toString();
    return qs ? `/calendar?${qs}` : "/calendar";
  };

  const dayEvents = selectedDay ? visibleEvents.filter((event) => event.date === selectedDay) : [];
  const upcoming = visibleEvents.filter((event) => event.date >= today).slice(0, 6);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Calendario"
        description="Tus finanzas en el tiempo: ingresos, gastos, cuotas y movimientos previstos."
        actions={<HeaderActions showPeriod={false} />}
      />

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

          <InsightCard title="Balance proyectado">
            <p>
              Contando cuotas y movimientos previstos, el mes cierra en{" "}
              <strong className="text-foreground">
                <MoneyAmount amount={month.summary.projectedNet} currency={currencyCode} variant="compact" sign="always" />
              </strong>
              {Number(summary.obligationsDue) > 0 ? (
                <>
                  {" "}· quedan <MoneyAmount amount={summary.obligationsDue} currency={currencyCode} variant="compact" /> en cuotas por pagar
                </>
              ) : null}
              .
            </p>
          </InsightCard>

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
    </div>
  );
}
