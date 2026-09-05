import Link from "next/link";

import type { CalendarEvent, CalendarEventKind, CalendarLayer } from "@/features/calendar/services/calendar-service";
import { MoneyAmount } from "@/components/financial/money-amount";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export const EVENT_META: Record<CalendarEventKind, { label: string; dot: string; text: string }> = {
  income: { label: "Ingresos", dot: "bg-event-income", text: "text-event-income" },
  expense: { label: "Gastos", dot: "bg-event-expense", text: "text-event-expense" },
  obligation: { label: "Obligaciones", dot: "bg-event-obligation", text: "text-event-obligation" },
  transfer: { label: "Transferencias", dot: "bg-event-transfer", text: "text-event-transfer" },
};

/**
 * spec 06 §0.1 / §6.4 — the temporal-financial state must be detectable *without
 * colour*. Each layer carries a text glyph and a word.
 */
export const LAYER_META: Record<CalendarLayer, { label: string; glyph: string }> = {
  CONFIRMED: { label: "Confirmado", glyph: "✓" },
  COMMITTED: { label: "Comprometido", glyph: "•" },
  SCHEDULED: { label: "Programado", glyph: "↻" },
  ESTIMATED: { label: "Estimado", glyph: "~" },
  OVERDUE: { label: "Vencido", glyph: "!" },
  PAID: { label: "Pagado", glyph: "✓" },
};

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function leadingBlanks(year: number, month: number): number {
  const dow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  return (dow + 6) % 7; // Monday-first
}

export function CalendarGrid({
  period,
  today,
  selectedDay,
  events,
  dayHref,
}: {
  period: string;
  today: string;
  selectedDay: string | null;
  events: CalendarEvent[];
  dayHref: (day: string) => string;
}) {
  const [year, month] = period.split("-").map(Number);
  const total = daysInMonth(year, month);
  const blanks = leadingBlanks(year, month);
  const cellCount = Math.ceil((blanks + total) / 7) * 7;

  const byDay = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const list = byDay.get(event.date) ?? [];
    list.push(event);
    byDay.set(event.date, list);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="grid grid-cols-7 border-b border-border bg-secondary/40">
        {WEEKDAYS.map((day) => (
          <div key={day} className="px-2 py-2 text-center text-caption font-semibold uppercase tracking-wider text-muted-foreground">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: cellCount }, (_, index) => {
          const dayNumber = index - blanks + 1;
          if (dayNumber < 1 || dayNumber > total) {
            return <div key={index} className="min-h-24 border-b border-r border-border bg-secondary/20 last:border-r-0" />;
          }
          const day = `${period}-${String(dayNumber).padStart(2, "0")}`;
          const dayEvents = byDay.get(day) ?? [];
          const isToday = day === today;
          const isSelected = day === selectedDay;
          return (
            <Link
              key={index}
              href={dayHref(day)}
              scroll={false}
              aria-current={isSelected ? "date" : undefined}
              className={cn(
                "flex min-h-24 flex-col gap-1 border-b border-r border-border p-1.5 text-left transition-colors last:border-r-0 hover:bg-brand-subtle/50",
                (index + 1) % 7 === 0 && "border-r-0",
                isSelected && "bg-brand-subtle ring-1 ring-inset ring-brand-border",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-6 items-center justify-center self-start rounded-full text-caption font-medium",
                  isToday ? "bg-brand text-white" : "text-foreground-secondary",
                )}
              >
                {dayNumber}
              </span>
              <span className="flex flex-col gap-0.5">
                {dayEvents.slice(0, 3).map((event) => (
                  <span key={event.id} className="flex items-center gap-1 truncate text-caption text-foreground-secondary">
                    <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", EVENT_META[event.kind].dot, event.projected && "opacity-50")} />
                    <span aria-hidden className="shrink-0 font-medium text-muted-foreground">{LAYER_META[event.layer].glyph}</span>
                    <span className="truncate">{event.title}</span>
                  </span>
                ))}
                {dayEvents.length > 3 ? (
                  <span className="text-caption text-muted-foreground">+{dayEvents.length - 3} más</span>
                ) : null}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function CalendarEventRow({ event }: { event: CalendarEvent }) {
  const meta = EVENT_META[event.kind];
  const body = (
    <>
      <span className="flex min-w-0 items-center gap-2">
        <span aria-hidden className={cn("size-2 shrink-0 rounded-full", meta.dot)} />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-small font-medium text-foreground">{event.title}</span>
          <span className="text-caption text-muted-foreground">
            {meta.label} · <span aria-hidden>{LAYER_META[event.layer].glyph} </span>
            {LAYER_META[event.layer].label}
          </span>
        </span>
      </span>
      <MoneyAmount
        amount={event.kind === "expense" || event.kind === "obligation" ? `-${event.amount}` : event.amount}
        currency={event.currencyCode}
        variant="compact"
        sign={event.kind === "income" ? "always" : "auto"}
        tone={event.kind === "income" ? "positive" : "neutral"}
        className="shrink-0 text-small font-medium"
      />
    </>
  );

  return event.href ? (
    <Link href={event.href} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0 hover:bg-brand-subtle/40">
      {body}
    </Link>
  ) : (
    <div className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">{body}</div>
  );
}
